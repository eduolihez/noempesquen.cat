const { spawnSync } = require( 'node:child_process' );
const { readFileSync } = require( 'node:fs' );
const AxeBuilder = require( '@axe-core/playwright' ).default;
const { test, expect } = require( '@playwright/test' );

/**
 * Pantalla de compte (/compte/): alta, sessió per galeta + rest-nonce, bloqueig
 * de wp-admin, descàrrega, sortida i entrada, i esborrat. Un sol compte de
 * prova per execució (el límit d'altes és de 5 per IP i hora) i una sola
 * pàgina compartida entre tests (sèrie) per conservar la sessió.
 */
test.describe.configure( { mode: 'serial' } );

const ARREL = `${ __dirname }/../..`;
const EMAIL = `prova+${ Date.now() }${ Math.floor(
	Math.random() * 1000
) }@example.com`;
const CONTRASENYA = `Prova-e2e-${ Math.random().toString( 36 ).slice( 2, 10 ) }`;

/**
 * WP-CLI a wp-env sense passar per cap shell (cmd.exe interpretaria `<` i `>`).
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

const usuariExisteix = () =>
	/^\d+$/m.test( wp( 'user', 'get', EMAIL, '--field=ID' ) );

/**
 * Violacions axe greus dins del bloc de compte (i del diàleg, que hi és a dins).
 *
 * @param {import('@playwright/test').Page} page
 */
async function greusAxe( page ) {
	const resultat = await new AxeBuilder( { page } )
		.include( '.wp-block-noempesquen-compte' )
		.withTags( [ 'wcag2a', 'wcag2aa', 'wcag22aa' ] )
		.analyze();
	return resultat.violations
		.filter( ( v ) => [ 'serious', 'critical' ].includes( v.impact ) )
		.map( ( v ) => ( {
			id: v.id,
			targets: v.nodes.map( ( n ) => n.target.join( ' ' ) ),
		} ) );
}

let context;
let page;
const consola = [];
const urls = [];

test.beforeAll( async ( { browser }, testInfo ) => {
	test.skip( testInfo.project.name !== 'compte', 'Només al projecte compte' );
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
	// Buida els límits d'intents (nep_rl_*) perquè les execucions repetides no topin amb el 429.
	wp(
		'eval',
		'global $wpdb; foreach ( $wpdb->get_col( "SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE \'_transient_nep_rl_%\'" ) as $o ) { delete_transient( substr( $o, 11 ) ); }'
	);
	context = await browser.newContext( { ...testInfo.project.use } );
	page = await context.newPage();
	page.on( 'console', ( m ) => consola.push( m.text() ) );
	page.on( 'request', ( r ) => urls.push( r.url() ) );
} );

test.afterAll( async ( {}, testInfo ) => {
	if ( testInfo.project.name !== 'compte' ) {
		return;
	}
	await context?.close();
	const id = wp( 'user', 'get', EMAIL, '--field=ID' ).match( /^\d+$/m );
	if ( id ) {
		wp( 'user', 'delete', id[ 0 ], '--yes' );
	}
} );

const bloc = () => page.locator( '.wp-block-noempesquen-compte' );
const titolPanell = () =>
	bloc().getByRole( 'heading', { name: 'El teu compte' } );

test( 'alta amb teclat: sense caselles no es crea; amb les dues, sessió iniciada', async () => {
	const altes = [];
	page.on( 'request', ( r ) => {
		if ( r.url().includes( '/compte/registre' ) ) {
			altes.push( r );
		}
	} );
	await page.goto( '/compte/' );
	await expect(
		bloc().getByRole( 'tab', { name: 'Crea un compte' } )
	).toHaveAttribute( 'aria-selected', 'true' );
	expect( await greusAxe( page ) ).toEqual( [] );

	// Només teclat: de la pestanya al correu, contrasenya, caselles i botó.
	await bloc().getByRole( 'tab', { name: 'Crea un compte' } ).focus();
	await page.keyboard.press( 'Tab' );
	await expect( page.getByLabel( 'Correu electrònic' ) ).toBeFocused();
	await page.keyboard.type( EMAIL );
	await page.keyboard.press( 'Tab' );
	await expect( page.getByLabel( 'Contrasenya' ) ).toBeFocused();
	await page.keyboard.type( CONTRASENYA );
	await page.keyboard.press( 'Enter' );

	// Sense caselles: errors associats, focus a la primera i cap petició.
	const majoria = page.getByLabel( 'Tinc 14 anys o més' );
	await expect( majoria ).toBeFocused();
	await expect( majoria ).toHaveAttribute( 'aria-invalid', 'true' );
	await expect( majoria ).toHaveAccessibleDescription( /14 anys o més/ );
	await expect( page.getByLabel( /Accepto que es desin/ ) ).toHaveAttribute(
		'aria-invalid',
		'true'
	);
	expect( altes ).toHaveLength( 0 );
	expect( await greusAxe( page ) ).toEqual( [] );

	await page.keyboard.press( 'Space' );
	await page.keyboard.press( 'Tab' );
	await expect( page.getByLabel( /Accepto que es desin/ ) ).toBeFocused();
	await page.keyboard.press( 'Space' );
	await page.keyboard.press( 'Tab' );
	await expect( bloc().getByText( 'Quines dades es guarden' ) ).toBeFocused();
	await page.keyboard.press( 'Tab' );
	await expect(
		bloc().getByRole( 'button', { name: 'Crea el compte' } )
	).toBeFocused();
	await page.keyboard.press( 'Enter' );

	await expect( titolPanell() ).toBeFocused();
	await expect( bloc().getByRole( 'status' ) ).toHaveText( /Compte creat/ );
	expect( altes ).toHaveLength( 1 );
	expect( JSON.parse( altes[ 0 ].postData() ) ).toMatchObject( {
		acepta: true,
		majoria_edat: true,
	} );
	expect( usuariExisteix() ).toBe( true );
} );

test( 'en recarregar segueix amb sessió i l’HTML no porta cap nonce', async () => {
	await page.reload();
	await expect( titolPanell() ).toBeVisible();

	const nonce = (
		await (
			await page.request.get(
				'/wp-admin/admin-ajax.php?action=rest-nonce'
			)
		).text()
	).trim();
	expect( nonce ).toMatch( /^[a-f0-9]{10}$/ );
	const html = await ( await page.request.get( '/compte/' ) ).text();
	expect( html ).toContain( 'wp-block-noempesquen-compte' );
	expect( html ).not.toContain( nonce );
	expect( html ).not.toContain( 'nonceMiddleware' );
	expect( html ).not.toContain( 'wpApiSettings' );
	await expect( page.locator( '#wpadminbar' ) ).toHaveCount( 0 );
	expect( await greusAxe( page ) ).toEqual( [] );
} );

// FIXME (T01, includes/capacitats.php): el rol nep_jugador no té cap capacitat i
// wp-admin/includes/menu.php fa wp_die («No teniu permisos…») abans que arribi
// `admin_init`, on hi ha la redirecció. Cal moure-la a un ganxo anterior
// (p. ex. `admin_page_access_denied`) o donar `read` al rol.
test.fixme( 'un jugador que obre /wp-admin/ acaba a /compte/ sense barra d’administració', async () => {
	await page.goto( '/wp-admin/' );
	await expect( page ).toHaveURL( /\/compte\/$/ );
	await expect( titolPanell() ).toBeVisible();
	await expect( page.locator( '#wpadminbar' ) ).toHaveCount( 0 );
} );

test( 'descarrega un JSON amb només correu, consentiment, progrés i data', async () => {
	const baixada = page.waitForEvent( 'download' );
	await bloc()
		.getByRole( 'button', { name: 'Descarrega les meves dades' } )
		.click();
	const fitxer = await baixada;
	const dades = JSON.parse( readFileSync( await fitxer.path(), 'utf8' ) );
	expect( Object.keys( dades ).sort() ).toEqual( [
		'consentiment',
		'creat',
		'email',
		'progres',
	] );
	expect( dades.email ).toBe( EMAIL );
	expect( Object.keys( dades.consentiment ).sort() ).toEqual( [
		'data',
		'versio',
	] );
} );

test( 'tanca la sessió i torna a entrar (contrasenya incorrecta → missatge genèric)', async () => {
	await bloc().getByRole( 'button', { name: 'Tanca la sessió' } ).click();
	await expect(
		bloc().getByRole( 'heading', { name: 'Accés al compte' } )
	).toBeFocused();
	await expect( bloc().getByRole( 'status' ) ).toHaveText(
		'Has tancat la sessió.'
	);

	await bloc().getByRole( 'tab', { name: 'Entra' } ).click();
	await page.getByLabel( 'Correu electrònic' ).fill( EMAIL );
	await page.getByLabel( 'Contrasenya' ).fill( 'no-es-aquesta-123' );
	await bloc().getByRole( 'button', { name: 'Entra', exact: true } ).click();
	await expect( bloc().getByRole( 'alert' ) ).toHaveText(
		'Correu o contrasenya incorrectes.'
	);
	// La contrasenya s'esborra del camp després d'enviar.
	await expect( page.getByLabel( 'Contrasenya' ) ).toHaveValue( '' );

	await page.getByLabel( 'Contrasenya' ).fill( CONTRASENYA );
	await bloc().getByRole( 'button', { name: 'Entra', exact: true } ).click();
	await expect( titolPanell() ).toBeFocused();
} );

test( 'esborra el compte amb teclat: Esc tanca el diàleg i retorna el focus', async () => {
	const boto = bloc().getByRole( 'button', { name: 'Esborra el compte' } );
	await boto.focus();
	await page.keyboard.press( 'Enter' );
	const dialeg = page.getByRole( 'dialog', { name: 'Esborrar el compte' } );
	await expect( dialeg ).toBeVisible();
	await expect( dialeg.getByLabel( 'Contrasenya' ) ).toBeFocused();
	expect( await greusAxe( page ) ).toEqual( [] );
	await page.keyboard.press( 'Escape' );
	await expect( dialeg ).toHaveCount( 0 );
	await expect( boto ).toBeFocused();

	await page.keyboard.press( 'Enter' );
	await expect( dialeg.getByLabel( 'Contrasenya' ) ).toBeFocused();
	await page.keyboard.type( CONTRASENYA );
	await page.keyboard.press( 'Enter' );
	await expect( bloc().getByRole( 'status' ) ).toHaveText(
		"El compte s'ha esborrat."
	);
	await expect(
		bloc().getByRole( 'heading', { name: 'Accés al compte' } )
	).toBeVisible();
	expect( usuariExisteix() ).toBe( false );

	// Ja no es pot entrar amb el compte esborrat.
	await page.reload();
	await bloc().getByRole( 'tab', { name: 'Entra' } ).click();
	await page.getByLabel( 'Correu electrònic' ).fill( EMAIL );
	await page.getByLabel( 'Contrasenya' ).fill( CONTRASENYA );
	await bloc().getByRole( 'button', { name: 'Entra', exact: true } ).click();
	await expect( bloc().getByRole( 'alert' ) ).toHaveText(
		'Correu o contrasenya incorrectes.'
	);
} );

test( 'la contrasenya no apareix a cap URL, localStorage ni consola', async () => {
	expect( urls.filter( ( u ) => u.includes( CONTRASENYA ) ) ).toEqual( [] );
	expect( consola.filter( ( t ) => t.includes( CONTRASENYA ) ) ).toEqual(
		[]
	);
	const emmagatzemat = await page.evaluate( () =>
		JSON.stringify( { ...window.localStorage, ...window.sessionStorage } )
	);
	expect( emmagatzemat ).not.toContain( CONTRASENYA );
} );
