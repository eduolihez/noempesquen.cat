const { execSync } = require( 'node:child_process' );
const AxeBuilder = require( '@axe-core/playwright' ).default;
const { test, expect } = require( './ajudes' );
const factura = require( '../../plugins/noempesquen-core/missions/ca/llissa-01-factura.json' );
const MISSIO_JSON = require( '../../plugins/noempesquen-core/missions/ca/llissa-05-actualitzacio.json' );
const { iniciaMissio, senseFullscreen } = require( './ajudes' );

/**
 * Estadístiques anònimes: un sol POST /resultat per partida acabada (amb
 * només tres claus) i la pantalla del panell. Al projecte `panell-estadistiques`: publica
 * una missió de prova. El POST s'intercepta (no escriu files a la base de
 * dades ni consumeix el límit d'enviaments).
 */
test.describe.configure( { mode: 'serial' } );

// Només el POST (no el GET de /resultat/resum).
const RESULTAT = /\/noempesquen\/v1\/resultat$/;
const escapa = ( text ) => text.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );

test.beforeEach( ( {}, testInfo ) => {
	test.skip(
		testInfo.project.name !== 'panell-estadistiques',
		'Només al projecte panell-estadistiques'
	);
} );

const barraTasques = ( page ) =>
	page.getByRole( 'navigation', { name: 'Barra de tasques' } );
const parla = ( page ) => page.getByRole( 'region', { name: 'Parla' } );

test( 'una partida acabada envia un sol resultat amb missio, estrelles i decisio', async ( {
	page,
} ) => {
	const peticions = [];
	await page.route( RESULTAT, ( route ) => {
		peticions.push( route.request() );
		return route.fulfill( { status: 204 } );
	} );

	// Sense pantalla completa real per poder canviar la mida de la finestra.
	await senseFullscreen( page );
	await iniciaMissio( page, /Actualitza el navegador/, /Clica o prem/ );
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

	const enviada = page.waitForRequest( RESULTAT );
	await page
		.getByRole( 'dialog' )
		.filter( { hasText: 'Veure el resultat' } )
		.getByRole( 'button', { name: 'Veure el resultat' } )
		.click();
	const peticio = await enviada;
	await expect(
		page.getByRole( 'img', { name: /de 3 estrelles/ } )
	).toBeVisible();

	expect( peticio.method() ).toBe( 'POST' );
	const cos = peticio.postDataJSON();
	expect( Object.keys( cos ).sort() ).toEqual( [
		'decisio',
		'estrelles',
		'missio',
	] );
	expect( cos.missio ).toBe( MISSIO_JSON.id );
	expect( cos.decisio ).toBe( 'a' );
	expect( [ 1, 2, 3 ] ).toContain( cos.estrelles );
	expect( peticio.headers() ).not.toHaveProperty( 'x-wp-nonce' );
	expect( peticio.headers() ).not.toHaveProperty( 'cookie' );

	// Re-renderitzar el resultat (canviar la mida, deixar passar el temps) no torna a enviar.
	await page.setViewportSize( { width: 1100, height: 700 } );
	await page.clock.runFor( 5000 );
	await page.setViewportSize( { width: 1280, height: 720 } );
	await expect(
		page.getByRole( 'img', { name: /de 3 estrelles/ } )
	).toBeVisible();
	expect( peticions ).toHaveLength( 1 );
	// Ni cap altra petició porta res més que aquestes tres claus.
	expect( peticio.postData() ).toBe( JSON.stringify( cos ) );
} );

test( 'el panell mostra la taula i amaga les missions amb poques partides', async ( {
	page,
} ) => {
	await page.goto( '/admin/' );
	await page.locator( '#user_login' ).fill( 'admin' );
	await page.locator( '#user_pass' ).fill( 'password' );
	await page.locator( '#wp-submit' ).click();
	await expect( page.locator( '#wpadminbar' ) ).toBeVisible();

	// Missió nova publicada: segur que no té cap partida.
	const id = `prova-estadistiques-${ Date.now() }`;
	const nonce = await (
		await page.request.get( '/wp-admin/admin-ajax.php?action=rest-nonce' )
	).text();
	const creada = await page.request.post( '/wp-json/wp/v2/nep_missio', {
		headers: { 'X-WP-Nonce': nonce },
		data: {
			title: `Prova ${ id }`,
			status: 'publish',
			meta: {
				nep_dispositiu: factura.dispositiu,
				nep_personatge: factura.personatge,
				nep_guio: JSON.stringify( {
					...factura,
					id,
					titol: `Prova ${ id }`,
				} ),
			},
		},
	} );
	expect( creada.status() ).toBe( 201 );
	const post = ( await creada.json() ).id;

	try {
		await page.goto(
			'/wp-admin/edit.php?post_type=nep_missio&page=nep-estadistiques&periode=7'
		);
		await expect( page.getByText( 'Dades indicatives.' ) ).toBeVisible();
		const taula = page.getByRole( 'table', { name: /darrers 7 dies/ } );
		await expect( taula ).toBeVisible();
		await expect(
			taula.getByRole( 'columnheader', { name: 'Partides' } )
		).toBeVisible();
		const fila = taula.getByRole( 'row', {
			name: new RegExp( escapa( id ) ),
		} );
		await expect( fila ).toContainText(
			'Dades insuficients (menys de 10 partides)'
		);
		await expect( page.getByLabel( 'Període' ) ).toHaveValue( '7' );
	} finally {
		await page.request.delete(
			`/wp-json/wp/v2/nep_missio/${ post }?force=true`,
			{
				headers: { 'X-WP-Nonce': nonce },
			}
		);
	}
} );

// Ordre de dades demo a l'entorn que serveix :8888 (contenidor `cli` de wp-env).
const demo = ( accio ) =>
	execSync( `npm run env:cli -- wp nep demo-estadistiques ${ accio }`, {
		cwd: `${ __dirname }/../..`,
		stdio: 'pipe',
		timeout: 120000,
	} );

test( 'amb dades demo el panell avisa i mostra barres accessibles; en esborrar-les tornen les dades insuficients', async ( {
	page,
} ) => {
	test.setTimeout( 240000 );
	await page.goto( '/admin/' );
	await page.locator( '#user_login' ).fill( 'admin' );
	await page.locator( '#user_pass' ).fill( 'password' );
	await page.locator( '#wp-submit' ).click();
	await expect( page.locator( '#wpadminbar' ) ).toBeVisible();

	// Missió nova abans de sembrar: rep files demo i, en esborrar-les, cap partida.
	const id = `prova-demo-${ Date.now() }`;
	const titol = `Prova ${ id }`;
	const nonce = await (
		await page.request.get( '/wp-admin/admin-ajax.php?action=rest-nonce' )
	).text();
	const creada = await page.request.post( '/wp-json/wp/v2/nep_missio', {
		headers: { 'X-WP-Nonce': nonce },
		data: {
			title: titol,
			status: 'publish',
			meta: {
				nep_dispositiu: factura.dispositiu,
				nep_personatge: factura.personatge,
				nep_guio: JSON.stringify( { ...factura, id, titol } ),
			},
		},
	} );
	expect( creada.status() ).toBe( 201 );
	const post = ( await creada.json() ).id;
	const url =
		'/wp-admin/edit.php?post_type=nep_missio&page=nep-estadistiques&periode=30';

	try {
		demo( 'sembra --partides=80' );
		await page.goto( url );
		await expect(
			page
				.getByRole( 'status' )
				.filter( { hasText: 'Dades de demostració incloses' } )
		).toContainText( 'wp nep demo-estadistiques esborra' );
		const fila = page
			.getByRole( 'table', { name: /darrers 30 dies/ } )
			.getByRole( 'row', { name: new RegExp( escapa( id ) ) } );
		await expect( fila ).not.toContainText( 'Dades insuficients' );

		await page.getByText( `Repartiment: ${ titol }` ).click();
		const estrelles = page.getByRole( 'table', {
			name: `Estrelles: ${ titol }`,
		} );
		const decisions = page.getByRole( 'table', {
			name: `Decisions: ${ titol }`,
		} );
		await expect( estrelles ).toBeVisible();
		await expect( decisions ).toBeVisible();
		await expect( estrelles.getByRole( 'row' ) ).toHaveCount( 4 );
		// El valor és text visible (franja), no només l'amplada de la barra.
		await expect(
			estrelles.getByText( /\d+-\d+ %|Menys de 10 partides/ ).first()
		).toBeVisible();
		await expect(
			decisions.getByText( /\d+-\d+ %/ ).first()
		).toBeVisible();

		const greus = (
			await new AxeBuilder( { page } ).include( '.wrap' ).analyze()
		).violations.filter( ( v ) =>
			[ 'serious', 'critical' ].includes( v.impact )
		);
		expect( greus ).toEqual( [] );
	} finally {
		demo( 'esborra' );
		try {
			await page.goto( url );
			await expect(
				page.getByText( 'Dades de demostració incloses' )
			).toHaveCount( 0 );
			await expect(
				page
					.getByRole( 'table', { name: /darrers 30 dies/ } )
					.getByRole( 'row', { name: new RegExp( escapa( id ) ) } )
			).toContainText( 'Dades insuficients (menys de 10 partides)' );
			await expect(
				page.getByText( `Repartiment: ${ titol }` )
			).toHaveCount( 0 );
		} finally {
			await page.request.delete(
				`/wp-json/wp/v2/nep_missio/${ post }?force=true`,
				{
					headers: { 'X-WP-Nonce': nonce },
				}
			);
		}
	}
} );
