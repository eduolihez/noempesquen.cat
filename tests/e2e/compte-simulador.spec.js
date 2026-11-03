const { spawnSync } = require( 'node:child_process' );
const { ruta } = require( './rutes' );
const MISSIO_JSON = require( '../../plugins/noempesquen-core/missions/ca/llissa-05-actualitzacio.json' );
const { test, expect, RESULTAT } = require( './ajudes' );
const {
	greusAxe,
	senseFullscreen,
	desbloqueja,
	obreMissio,
} = require( './ajudes' );

/**
 * Compte dins del simulador: sense sessió tot és local (i hi ha l'enllaç per
 * crear-ne un); amb sessió, el progrés local i el del servidor es fusionen i
 * es desen en acabar una missió. L'estadística anònima no porta galetes ni
 * nonce. Un sol usuari de prova creat per WP-CLI (no gasta el límit d'altes)
 * i una sola pàgina compartida (sèrie) per conservar la sessió.
 */
test.describe.configure( { mode: 'serial' } );

const ARREL = `${ __dirname }/../..`;
const SUFIX = `${ Date.now() }${ Math.floor( Math.random() * 1000 ) }`;
const EMAIL = `prova-sim+${ SUFIX }@example.com`;
const LOGIN = `prova-sim-${ SUFIX }`;
const CONTRASENYA = `Prova-e2e-${ Math.random().toString( 36 ).slice( 2, 10 ) }`;
const CLAU = 'noempesquen-progres-v2';
const LOCAL = { 'llissa-01-factura': 3 };
const SERVIDOR = { 'remei-01-paquet': 2 };
const PROGRES = /\/noempesquen\/v1\/compte\/progres/;
const escapa = ( text ) => text.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );

/**
 * WP-CLI a wp-env sense passar per cap shell.
 *
 * @param {...string} args Arguments de `wp`.
 * @return {string} Sortida estàndard.
 */
function wp( ...args ) {
	const r = spawnSync(
		process.execPath,
		[
			'-r',
			'./scripts/dns-fix.cjs',
			'./node_modules/@wordpress/env/bin/wp-env',
			'run',
			'cli',
			'wp',
			...args,
		],
		{ cwd: ARREL, encoding: 'utf8', timeout: 120000 }
	);
	return r.stdout || '';
}

/**
 * El port mostra el progrés fusionat als vaixells (local al Pesquer, servidor
 * al Pirata) i el mapa del Pesquer, les estrelles de la missió.
 *
 * @param {import('@playwright/test').Page} p
 */
async function comprovaProgres( p ) {
	await expect(
		p.getByRole( 'button', { name: /Obre el Pesquer:.*3 de 15 estrelles/ } )
	).toBeVisible();
	await expect(
		p.getByRole( 'button', { name: /Obre el Pirata:.*2 de 15 estrelles/ } )
	).toBeVisible();
	await p.getByRole( 'button', { name: /Obre el Pesquer:/ } ).click();
	await expect(
		p.getByRole( 'img', { name: 'Millor resultat: 3 de 3 estrelles' } )
	).toHaveCount( 1 );
	await p.getByRole( 'button', { name: 'Torna al port' } ).click();
	await p.getByRole( 'button', { name: /Obre el Pirata:/ } ).click();
	await expect(
		p.getByRole( 'img', { name: 'Millor resultat: 2 de 3 estrelles' } )
	).toHaveCount( 1 );
	await p.getByRole( 'button', { name: 'Torna al port' } ).click();
	await expect(
		p.getByRole( 'button', { name: /Obre el Pirata:/ } )
	).toBeVisible();
}

const selector = ( p ) => p.getByRole( 'region', { name: 'Tria una missió' } );
const enllacCompte = ( p ) =>
	p.getByRole( 'link', { name: /Crea un compte per guardar/ } );
const parla = ( p ) => p.getByRole( 'region', { name: 'Parla' } );

let context;
let page;
const resultats = [];

test.beforeAll( async ( { browser }, testInfo ) => {
	test.skip(
		testInfo.project.name !== 'escriptori',
		'Només al projecte escriptori'
	);
	if (
		! wp(
			'post',
			'list',
			'--post_type=page',
			'--name=compte',
			'--field=ID'
		).match( /\d+/ )
	) {
		wp(
			'post',
			'create',
			'--post_type=page',
			'--post_name=compte',
			'--post_title=El meu compte',
			'--post_status=publish',
			'--post_content=<!-- wp:noempesquen/compte /-->'
		);
	}
	wp(
		'eval',
		'global $wpdb; foreach ( $wpdb->get_col( "SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE \'_transient_nep_rl_%\'" ) as $o ) { delete_transient( substr( $o, 11 ) ); }'
	);
	wp(
		'user',
		'create',
		LOGIN,
		EMAIL,
		'--role=nep_jugador',
		`--user_pass=${ CONTRASENYA }`,
		'--porcelain'
	);
	context = await browser.newContext( { ...testInfo.project.use } );
	// Com a ajudes.js: l'estadística no arriba al servidor, però es guarda la petició.
	await context.route( RESULTAT, ( route ) => {
		if ( route.request().method() === 'POST' ) {
			resultats.push( route.request() );
		}
		return route.fulfill( { status: 204 } );
	} );
	page = await context.newPage();
} );

test.afterAll( async ( {}, testInfo ) => {
	if ( testInfo.project.name !== 'escriptori' ) {
		return;
	}
	await context?.close();
	const id = wp( 'user', 'get', EMAIL, '--field=ID' ).match( /^\d+$/m );
	if ( id ) {
		wp( 'user', 'delete', id[ 0 ], '--yes' );
	}
} );

test( 'sense compte: el selector funciona igual, amb l’enllaç i sense cap petició de compte', async ( {
	page: anonima,
} ) => {
	const progres = [];
	anonima.on( 'request', ( r ) => {
		if ( PROGRES.test( r.url() ) || r.url().includes( 'rest-nonce' ) ) {
			progres.push( r.url() );
		}
	} );
	await anonima.goto( ruta( 'simulador' ) );
	await expect( selector( anonima ) ).toBeVisible();
	await expect( enllacCompte( anonima ) ).toHaveAttribute(
		'href',
		/\/compte\/$/
	);
	await expect(
		anonima.getByText( 'Progrés desat al teu compte' )
	).toHaveCount( 0 );
	expect( progres ).toEqual( [] );
	expect( await greusAxe( anonima ) ).toEqual( [] );
} );

test( 'amb compte: fusiona el local i el del servidor, i es conserva sense localStorage', async () => {
	await page.goto( ruta( 'compte' ) );
	const bloc = page.locator( '.wp-block-noempesquen-compte' );
	await bloc.getByRole( 'tab', { name: 'Entra' } ).click();
	await page.getByLabel( 'Correu electrònic' ).fill( EMAIL );
	await page.getByLabel( 'Contrasenya' ).fill( CONTRASENYA );
	await bloc.getByRole( 'button', { name: 'Entra', exact: true } ).click();
	await expect(
		bloc.getByRole( 'heading', { name: 'El teu compte' } )
	).toBeVisible();

	// Progrés ja desat al servidor (per l'API, amb el nonce de la sessió).
	const nonce = (
		await (
			await page.request.get(
				'/wp-admin/admin-ajax.php?action=rest-nonce'
			)
		).text()
	).trim();
	const desat = await page.request.put(
		'/wp-json/noempesquen/v1/compte/progres',
		{ headers: { 'X-WP-Nonce': nonce }, data: { progres: SERVIDOR } }
	);
	expect( desat.ok() ).toBe( true );

	// Progrés local amb una altra missió.
	await page.evaluate(
		( [ clau, p ] ) =>
			window.localStorage.setItem( clau, JSON.stringify( p ) ),
		[ CLAU, LOCAL ]
	);
	const puja = page.waitForResponse(
		( r ) => PROGRES.test( r.url() ) && r.request().method() === 'PUT'
	);
	await page.goto( ruta( 'simulador' ) );
	const pujada = await puja;
	expect( pujada.request().postDataJSON() ).toEqual( {
		progres: { ...LOCAL, ...SERVIDOR },
	} );
	await expect(
		page.getByText( 'Progrés desat al teu compte' )
	).toBeVisible();
	await expect( enllacCompte( page ) ).toHaveCount( 0 );
	expect( await greusAxe( page ) ).toEqual( [] );
	await comprovaProgres( page );

	const servidor = await (
		await page.request.get( '/wp-json/noempesquen/v1/compte/progres', {
			headers: { 'X-WP-Nonce': nonce },
		} )
	).json();
	expect( servidor.progres ).toEqual( { ...LOCAL, ...SERVIDOR } );

	// La marca de sessió l'ha posada l'entrada real a /compte/.
	expect(
		await page.evaluate( () =>
			window.localStorage.getItem( 'nep-compte-sessio' )
		)
	).toBe( '1' );
	// Sense el progrés local (la marca es conserva), el progrés torna del servidor.
	await page.evaluate( ( c ) => window.localStorage.removeItem( c ), CLAU );
	await page.reload();
	await comprovaProgres( page );
	expect(
		JSON.parse(
			await page.evaluate(
				( c ) => window.localStorage.getItem( c ),
				CLAU
			)
		)
	).toEqual( { ...LOCAL, ...SERVIDOR } );
} );

test( 'amb compte: l’HTML no porta nonce, l’estadística va sense galetes i el progrés es desa', async () => {
	const nonce = (
		await (
			await page.request.get(
				'/wp-admin/admin-ajax.php?action=rest-nonce'
			)
		).text()
	).trim();
	expect( nonce ).toMatch( /^[a-f0-9]{10}$/ );
	const html = await ( await page.request.get( ruta( 'simulador' ) ) ).text();
	expect( html ).toContain( 'nep-sim' );
	expect( html ).not.toContain( nonce );

	// Opcions reals del fetch de /resultat (la petició interceptada no mostra galetes).
	await page.addInitScript( () => {
		const original = window.fetch;
		window.__nepResultat = [];
		window.fetch = ( url, o = {} ) => {
			if ( String( url ).endsWith( '/resultat' ) ) {
				window.__nepResultat.push( {
					credentials: o.credentials,
					capcaleres: Object.keys( o.headers || {} ).map( ( k ) =>
						k.toLowerCase()
					),
				} );
			}
			return original( url, o );
		};
	} );
	await senseFullscreen( page );
	await page.clock.install();
	const trobada = desbloqueja( page, /Actualitza el navegador/ );
	await page.goto( ruta( 'simulador' ) );
	await obreMissio( page, /Actualitza el navegador/, trobada );
	await page.getByRole( 'button', { name: /Clica o prem/ } ).click();
	await parla( page )
		.getByRole( 'button', { name: 'Salta la presentació' } )
		.click();
	const { text } = MISSIO_JSON.decisio.opcions.find( ( o ) => o.id === 'a' );
	await parla( page )
		.getByRole( 'button', { name: 'Ja ho tinc clar' } )
		.click();
	await parla( page )
		.getByRole( 'button', { name: new RegExp( `^${ escapa( text ) }` ) } )
		.click();

	// Amb el progrés sembrat ja hi ha hagut un PUT en carregar: espera el de la missió.
	const puja = page.waitForResponse(
		( r ) =>
			PROGRES.test( r.url() ) &&
			r.request().method() === 'PUT' &&
			!! r.request().postDataJSON()?.progres?.[ MISSIO_JSON.id ]
	);
	await page
		.getByRole( 'dialog' )
		.filter( { hasText: 'Veure el resultat' } )
		.getByRole( 'button', { name: 'Veure el resultat' } )
		.click();
	const pujada = await puja;
	const cos = pujada.request().postDataJSON();
	expect( Object.keys( cos ) ).toEqual( [ 'progres' ] );
	expect( [ 1, 2, 3 ] ).toContain( cos.progres[ MISSIO_JSON.id ] );
	expect( ( await pujada.json() ).progres ).toMatchObject( {
		...LOCAL,
		...SERVIDOR,
	} );

	await expect.poll( () => resultats.length ).toBe( 1 );
	// Control: el PUT del compte sí porta la galeta de sessió.
	expect( await pujada.request().allHeaders() ).toHaveProperty( 'cookie' );
	expect( await page.evaluate( () => window.__nepResultat ) ).toEqual( [
		{ credentials: 'omit', capcaleres: [ 'content-type' ] },
	] );
	const capcaleres = await resultats[ 0 ].allHeaders();
	expect( capcaleres ).not.toHaveProperty( 'cookie' );
	expect( capcaleres ).not.toHaveProperty( 'x-wp-nonce' );
} );

test( 'en tancar la sessió no queda el progrés del jugador a l’ordinador', async () => {
	await page.goto( ruta( 'compte' ) );
	const bloc = page.locator( '.wp-block-noempesquen-compte' );
	await expect(
		bloc.getByRole( 'heading', { name: 'El teu compte' } )
	).toBeVisible();
	expect(
		await page.evaluate( ( c ) => window.localStorage.getItem( c ), CLAU )
	).not.toBeNull();
	await bloc.getByRole( 'button', { name: 'Tanca la sessió' } ).click();
	await expect( page.getByText( 'Has tancat la sessió.' ) ).toBeVisible();
	expect(
		await page.evaluate( () => [
			window.localStorage.getItem( 'noempesquen-progres-v2' ),
			window.localStorage.getItem( 'noempesquen-progres-v1' ),
			window.localStorage.getItem( 'nep-compte-sessio' ),
		] )
	).toEqual( [ null, null, null ] );

	await page.goto( ruta( 'simulador' ) );
	await expect( selector( page ) ).toBeVisible();
	await expect( enllacCompte( page ) ).toBeVisible();
	await expect(
		page.getByRole( 'img', { name: /Millor resultat: [1-3] de 3/ } )
	).toHaveCount( 0 );
} );
