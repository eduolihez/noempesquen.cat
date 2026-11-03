const { spawnSync } = require( 'node:child_process' );
const AxeBuilder = require( '@axe-core/playwright' ).default;
const { test, expect } = require( '@playwright/test' );

/**
 * Verificació del correu i recuperació de la contrasenya (/compte/). El correu
 * no surt: un mu-plugin de prova (`pre_wp_mail`) desa l'últim missatge en un
 * transient i el test en segueix l'enllaç real. Un sol compte per execució, en
 * sèrie.
 */
test.describe.configure( { mode: 'serial' } );

const ARREL = `${ __dirname }/../..`;
const EMAIL = `recupera+${ Date.now() }${ Math.floor(
	Math.random() * 1000
) }@example.com`;
const CONTRASENYA = `Prova-e2e-${ Math.random().toString( 36 ).slice( 2, 10 ) }`;
const NOVA = `Nova-e2e-${ Math.random().toString( 36 ).slice( 2, 10 ) }`;
const MU = 'nep-e2e-correu.php';

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

const netejaCorreu = () =>
	wp( 'eval', 'delete_transient( "nep_e2e_correu" );' );

/**
 * Enllaç `/compte/?verifica=…` o `?restableix=…` de l'últim correu capturat.
 *
 * @param {'verifica'|'restableix'} tipus Tipus d'enllaç.
 * @return {string} Camí i query de l'enllaç.
 */
function enllacDelCorreu( tipus ) {
	const cos = wp( 'eval', 'echo get_transient( "nep_e2e_correu" );' );
	const m = cos.match(
		new RegExp( `/compte/\\?${ tipus }=[0-9]+\\.[0-9a-f]{64}` )
	);
	expect( m, `cal un enllaç ${ tipus } al correu` ).not.toBeNull();
	return m[ 0 ];
}

/**
 * Violacions axe greus dins del bloc de compte.
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
const peticions = [];
const consola = [];

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
	wp(
		'eval',
		`wp_mkdir_p( WPMU_PLUGIN_DIR ); file_put_contents( WPMU_PLUGIN_DIR . "/${ MU }", '<?php add_filter( "pre_wp_mail", static function ( $nul, $a ) { set_transient( "nep_e2e_correu", $a["message"], 600 ); return true; }, 10, 2 );' );`
	);
	wp(
		'eval',
		'global $wpdb; foreach ( $wpdb->get_col( "SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE \'_transient_nep_rl_%\'" ) as $o ) { delete_transient( substr( $o, 11 ) ); }'
	);
	netejaCorreu();
	context = await browser.newContext( { ...testInfo.project.use } );
	page = await context.newPage();
	page.on( 'console', ( m ) => consola.push( m.text() ) );
	page.on( 'request', ( r ) =>
		peticions.push( { url: r.url(), cos: r.postData() || '' } )
	);
} );

test.afterAll( async ( {}, testInfo ) => {
	if ( testInfo.project.name !== 'compte' ) {
		return;
	}
	await context?.close();
	wp(
		'eval',
		`@unlink( WPMU_PLUGIN_DIR . "/${ MU }" ); delete_transient( "nep_e2e_correu" );`
	);
	const id = wp( 'user', 'get', EMAIL, '--field=ID' ).match( /^\d+$/m );
	if ( id ) {
		wp( 'user', 'delete', id[ 0 ], '--yes' );
	}
} );

const bloc = () => page.locator( '.wp-block-noempesquen-compte' );
const titolPanell = () =>
	bloc().getByRole( 'heading', { name: 'El teu compte' } );

/**
 * Obre una URL de `/compte/` i espera que l'aplicació hagi acabat de carregar.
 *
 * @param {string} ruta Camí amb query.
 */
async function obre( ruta ) {
	await page.goto( ruta );
	await expect( bloc().getByText( 'Carregant el teu compte' ) ).toHaveCount(
		0
	);
}

test( 'alta: el compte funciona sense verificar i mostra el banner amb el correu enviat', async () => {
	await page.goto( '/compte/' );
	await page.getByLabel( 'Correu electrònic' ).fill( EMAIL );
	await page.getByLabel( 'Contrasenya', { exact: true } ).fill( CONTRASENYA );
	await page.getByLabel( 'Tinc 14 anys o més' ).check();
	await page.getByLabel( /Accepto que es desin/ ).check();
	await bloc().getByRole( 'button', { name: 'Crea el compte' } ).click();

	await expect( titolPanell() ).toBeFocused();
	const banner = bloc().getByRole( 'group', { name: 'Verifica el correu' } );
	await expect( banner ).toBeVisible();
	expect( await greusAxe( page ) ).toEqual( [] );

	// Es pot reenviar el correu des del panell.
	netejaCorreu();
	await banner.getByRole( 'button', { name: 'Reenvia el correu' } ).click();
	await expect( bloc().getByRole( 'status' ) ).toHaveText(
		/tornat a enviar el correu/
	);
	expect( enllacDelCorreu( 'verifica' ) ).toMatch( /verifica=/ );
} );

test( 'l’enllaç del correu verifica el compte; el token surt de la URL i no es reutilitza', async () => {
	const enllac = enllacDelCorreu( 'verifica' );
	const abans = peticions.length;
	await obre( enllac );

	await expect( bloc().getByRole( 'status' ) ).toHaveText(
		/Correu verificat/
	);
	await expect(
		bloc().getByRole( 'group', { name: 'Verifica el correu' } )
	).toHaveCount( 0 );
	// El token ha desaparegut de la barra d'adreces.
	expect( new URL( page.url() ).search ).toBe( '' );

	// Va pel cos de la petició, no per la URL.
	const crides = peticions
		.slice( abans )
		.filter( ( p ) => p.url.includes( '/compte/verifica' ) );
	expect( crides ).toHaveLength( 1 );
	expect( crides[ 0 ].url ).not.toMatch( /[0-9a-f]{64}/ );
	expect( JSON.parse( crides[ 0 ].cos ).token ).toMatch(
		/^\d+\.[0-9a-f]{64}$/
	);

	// Un sol ús.
	await obre( enllac );
	await expect( bloc().getByRole( 'status' ) ).toHaveText(
		/no és vàlid o ha caducat/
	);
	expect( new URL( page.url() ).search ).toBe( '' );

	// Cap rastre del token a la consola.
	expect( consola.join( '\n' ) ).not.toMatch( /[0-9a-f]{64}/ );
} );

test( 'la pàgina de compte porta Referrer-Policy: no-referrer', async () => {
	const r = await page.request.get( '/compte/' );
	expect( r.headers()[ 'referrer-policy' ] ).toBe( 'no-referrer' );
} );

test( 'recuperació completa: correu, contrasenya nova, sessions tancades i enllaç d’un sol ús', async () => {
	await obre( '/compte/' );
	await bloc().getByRole( 'button', { name: 'Tanca la sessió' } ).click();
	await bloc().getByRole( 'tab', { name: 'Entra' } ).click();
	await bloc()
		.getByRole( 'button', { name: 'He oblidat la contrasenya' } )
		.click();
	await expect(
		bloc().getByRole( 'heading', { name: 'Recupera la contrasenya' } )
	).toBeFocused();
	expect( await greusAxe( page ) ).toEqual( [] );

	// Camp buit: error associat i cap petició.
	const abans = peticions.length;
	await bloc()
		.getByRole( 'button', { name: /Envia'm l'enllaç/ } )
		.click();
	await expect( page.getByLabel( 'Correu electrònic' ) ).toHaveAttribute(
		'aria-invalid',
		'true'
	);
	expect(
		peticions
			.slice( abans )
			.filter( ( p ) => p.url.includes( '/compte/recupera' ) )
	).toHaveLength( 0 );

	netejaCorreu();
	await page.getByLabel( 'Correu electrònic' ).fill( EMAIL );
	await bloc()
		.getByRole( 'button', { name: /Envia'm l'enllaç/ } )
		.click();
	await expect(
		bloc().getByText( /Si hi ha un compte amb aquest correu verificat/ )
	).toBeVisible();
	const enllac = enllacDelCorreu( 'restableix' );

	await obre( enllac );
	await expect(
		bloc().getByRole( 'heading', { name: 'Tria una contrasenya nova' } )
	).toBeFocused();
	expect( new URL( page.url() ).search ).toBe( '' );
	expect( await greusAxe( page ) ).toEqual( [] );

	// Massa curta: error al camp i el token no es crema.
	await page
		.getByLabel( 'Contrasenya nova', { exact: true } )
		.fill( 'curta' );
	await bloc()
		.getByRole( 'button', { name: 'Desa la contrasenya nova' } )
		.click();
	await expect(
		page.getByLabel( 'Contrasenya nova', { exact: true } )
	).toHaveAttribute( 'aria-invalid', 'true' );

	await page.getByLabel( 'Contrasenya nova', { exact: true } ).fill( NOVA );
	await bloc()
		.getByRole( 'button', { name: 'Desa la contrasenya nova' } )
		.click();
	await expect( bloc().getByRole( 'status' ) ).toHaveText(
		/Contrasenya canviada/
	);
	await expect(
		bloc().getByRole( 'tab', { name: 'Entra' } )
	).toHaveAttribute( 'aria-selected', 'true' );

	// La vella ja no val, la nova sí.
	await page.getByLabel( 'Correu electrònic' ).fill( EMAIL );
	await page.getByLabel( 'Contrasenya', { exact: true } ).fill( CONTRASENYA );
	await bloc()
		.getByRole( 'button', { name: 'Entra', exact: true } )
		.last()
		.click();
	await expect( bloc().getByRole( 'alert' ) ).toBeVisible();
	await page.getByLabel( 'Contrasenya', { exact: true } ).fill( NOVA );
	await bloc()
		.getByRole( 'button', { name: 'Entra', exact: true } )
		.last()
		.click();
	await expect( titolPanell() ).toBeVisible();

	// L'enllaç no es pot reutilitzar.
	await obre( enllac );
	await page
		.getByLabel( 'Contrasenya nova', { exact: true } )
		.fill( `${ NOVA }-2` );
	await bloc()
		.getByRole( 'button', { name: 'Desa la contrasenya nova' } )
		.click();
	await expect( bloc().getByRole( 'alert' ) ).toContainText(
		'no és vàlid o ha caducat'
	);
} );

test( 'un enllaç caducat dóna l’error genèric i permet demanar-ne un de nou', async () => {
	const id = wp( 'user', 'get', EMAIL, '--field=ID' ).trim();
	const token = wp(
		'eval',
		`$t = nep_token_genera( ${ Number( id ) }, random_bytes( 32 ) ); $p = nep_token_parseja( $t ); update_user_meta( ${ Number( id ) }, "nep_token_recupera", nep_token_registre( $p["secret"], wp_salt( "auth" ), time(), -10 ) ); echo $t;`
	).trim();
	expect( token ).toMatch( /^\d+\.[0-9a-f]{64}$/ );

	await obre( `/compte/?restableix=${ token }` );
	await page
		.getByLabel( 'Contrasenya nova', { exact: true } )
		.fill( `${ NOVA }-3` );
	await bloc()
		.getByRole( 'button', { name: 'Desa la contrasenya nova' } )
		.click();
	await expect( bloc().getByRole( 'alert' ) ).toContainText(
		'no és vàlid o ha caducat'
	);
	await bloc()
		.getByRole( 'button', { name: 'He oblidat la contrasenya' } )
		.click();
	await expect(
		bloc().getByRole( 'heading', { name: 'Recupera la contrasenya' } )
	).toBeVisible();
} );

test( 'amb un correu que no existeix la resposta és idèntica i no surt cap correu', async () => {
	await obre( '/compte/' );
	// La sessió segueix oberta de la prova anterior? Surt si cal.
	const sortir = bloc().getByRole( 'button', { name: 'Tanca la sessió' } );
	if ( await sortir.isVisible() ) {
		await sortir.click();
	}
	await bloc().getByRole( 'tab', { name: 'Entra' } ).click();
	await bloc()
		.getByRole( 'button', { name: 'He oblidat la contrasenya' } )
		.click();
	netejaCorreu();
	await page
		.getByLabel( 'Correu electrònic' )
		.fill( 'no-existeix@example.com' );
	await bloc()
		.getByRole( 'button', { name: /Envia'm l'enllaç/ } )
		.click();
	await expect(
		bloc().getByText( /Si hi ha un compte amb aquest correu verificat/ )
	).toBeVisible();
	expect(
		wp( 'eval', 'echo get_transient( "nep_e2e_correu" ) ? "SI" : "NO";' )
	).toBe( 'NO' );
} );
