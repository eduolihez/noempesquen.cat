const { test, expect } = require( '@playwright/test' );
const AxeBuilder = require( '@axe-core/playwright' ).default;
const factura = require( '../../plugins/noempesquen-core/missions/llissa-01-factura.json' );

/**
 * Panell de missions: editor del guió amb diagnòstic en viu, publicació i
 * previsualització d'esborranys. Només al projecte d'escriptori. Les missions
 * creades van a la paperera en acabar (el selector compta les targetes).
 */
test.describe.configure( { mode: 'serial' } );

const creades = [];

async function entra( page ) {
	await page.goto( '/wp-login.php' );
	await page.locator( '#user_login' ).fill( 'admin' );
	await page.locator( '#user_pass' ).fill( 'password' );
	await page.locator( '#wp-submit' ).click();
	await expect( page.locator( '#wpadminbar' ) ).toBeVisible();
}

/** Escriu el guió a CodeMirror (tecla a tecla l'autotancament el desfaria). */
async function escriuGuio( page, text ) {
	await page.evaluate( ( valor ) => {
		document.querySelector( '#nep-guio-missio .CodeMirror' ).CodeMirror.setValue( valor );
	}, text );
}

async function novaMissio( page, titol ) {
	await page.goto( '/wp-admin/post-new.php?post_type=nep_missio' );
	await page.locator( '#title' ).fill( titol );
	await expect( page.locator( '#nep-guio-missio .CodeMirror' ) ).toBeVisible();
}

/** Desa (o publica) i apunta l'id per esborrar-la després. */
async function desa( page, boto ) {
	await page.locator( boto ).click();
	await page.waitForURL( /post\.php\?post=\d+&action=edit/ );
	const id = Number( new URL( page.url() ).searchParams.get( 'post' ) );
	if ( ! creades.includes( id ) ) {
		creades.push( id );
	}
	return id;
}

const guio = ( id, extra = {} ) =>
	JSON.stringify( { ...factura, id, titol: `Prova ${ id }`, ...extra } );

test.beforeEach( async ( { page }, testInfo ) => {
	test.skip( testInfo.project.name !== 'escriptori', 'Només a escriptori' );
	await entra( page );
} );

/** Envia una missió a la paperera (fora del selector i dels ids existents). */
async function paperera( page, id ) {
	await page.goto( `/wp-admin/post.php?post=${ id }&action=edit` );
	const enllac = page.locator( '#delete-action a.submitdelete' );
	if ( await enllac.count() ) {
		await enllac.click();
		await page.waitForURL( /edit\.php/ );
	}
	creades.splice( creades.indexOf( id ), 1 );
}

test.afterAll( async ( { browser } ) => {
	if ( ! creades.length ) {
		return;
	}
	const page = await browser.newPage();
	await entra( page );
	for ( const id of [ ...creades ] ) {
		await paperera( page, id );
	}
	await page.close();
} );

test( 'mostra els errors en viu i no publica un guió invàlid', async ( { page } ) => {
	await novaMissio( page, 'Prova e2e invàlida' );
	const diagnostic = page.locator( '#nep-guio-diagnostic' );
	await expect( diagnostic ).toHaveAttribute( 'role', 'status' );

	await escriuGuio( page, '{ "id": ' );
	await expect( diagnostic ).toContainText( 'no és un JSON vàlid' );

	const id = `e2e-invalida-${ Date.now() }`;
	await escriuGuio( page, guio( id, { versio: 1, dispositiu: 'mobil' } ) );
	await expect( diagnostic ).toContainText( 'versio no suportada' );
	await expect( diagnostic ).toContainText( 'no coincideix' );

	const greus = (
		await new AxeBuilder( { page } )
			.include( '#nep-guio-missio' )
			.withTags( [ 'wcag2a', 'wcag2aa', 'wcag22aa' ] )
			.analyze()
	).violations.filter( ( v ) => [ 'serious', 'critical' ].includes( v.impact ) );
	expect( greus ).toEqual( [] );

	const post = await desa( page, '#publish' );
	// «Esborrany actualitzat» (10), no «publicada» (6).
	await expect( page.locator( '#message' ) ).toContainText( 'esborrany' );
	await expect( page.locator( '.notice-error' ) ).toContainText( 'esborrany' );
	await expect( page.locator( '#message' ) ).not.toContainText( /publicad|publicat/i );
	await expect( page.locator( '#post-status-display' ) ).toContainText( /esborrany/i );

	// Provar-la avisa el gestor sense trencar el selector.
	await page.goto( `/simulador/?previsualitza=${ post }` );
	await expect( page.getByRole( 'status' ).filter( { hasText: "No s'ha pogut carregar el guió de prova" } ) ).toBeVisible();
	await expect( page.locator( '[data-missio="llissa-01-factura"]' ) ).toBeVisible();
} );

test( 'publica un guió vàlid i surt al simulador', async ( { page } ) => {
	const id = `e2e-publicada-${ Date.now() }`;
	await novaMissio( page, 'Prova e2e publicada' );
	await escriuGuio( page, guio( id ) );
	await expect( page.locator( '#nep-guio-diagnostic' ) ).toHaveText( 'Cap error' );
	const post = await desa( page, '#publish' );
	try {
		await expect( page.locator( '.notice-error' ) ).toHaveCount( 0 );
		await expect( page.locator( '#post-status-display' ) ).toContainText( /publicad/i );

		await page.goto( '/simulador/' );
		await expect( page.locator( `[data-missio="${ id }"]` ) ).toBeVisible();
	} finally {
		// Publicada la veu tothom: a la paperera de seguida (el selector compta les targetes).
		await paperera( page, post );
	}
} );

test( '«Prova-la» obre un esborrany al simulador només per a qui el gestiona', async ( {
	page,
	browser,
} ) => {
	const id = `e2e-esborrany-${ Date.now() }`;
	await novaMissio( page, 'Prova e2e esborrany' );
	await escriuGuio( page, guio( id ) );
	await desa( page, '#save-post' );
	await expect( page.locator( '#post-status-display' ) ).toContainText( /esborrany/i );

	await page.getByRole( 'link', { name: 'Prova-la al simulador' } ).click();
	await expect( page ).toHaveURL( /previsualitza=\d+/ );
	// La de prova porta id propi (`<id>--prova`): no substitueix cap missió real.
	const targeta = page.locator( `[data-missio="${ id }--prova"]` );
	await expect( targeta ).toBeVisible();
	await expect( targeta ).toContainText( 'esborrany' );
	await targeta.click();
	await expect( page.getByRole( 'button', { name: /Clica o prem/ } ) ).toBeVisible();

	// Un visitant anònim amb el mateix enllaç no veu l'esborrany.
	const anonim = await browser.newPage();
	await anonim.goto( page.url() );
	await expect( anonim.locator( '[data-missio="llissa-01-factura"]' ) ).toBeVisible();
	await expect( anonim.locator( `[data-missio="${ id }--prova"]` ) ).toHaveCount( 0 );
	await expect( anonim.locator( `[data-missio="${ id }"]` ) ).toHaveCount( 0 );
	await anonim.close();
} );
