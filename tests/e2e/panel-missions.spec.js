const { test, expect } = require( './ajudes' );
const AxeBuilder = require( '@axe-core/playwright' ).default;
const factura = require( '../../plugins/noempesquen-core/missions/llissa-01-factura.json' );

/**
 * Panell de missions: editor del guió amb diagnòstic en viu, publicació i
 * previsualització d'esborranys. Només al projecte `panell`, que corre quan
 * els altres ja han acabat: una missió publicada surt a /simulador/ i
 * canviaria el recompte de targetes d'altres specs. Les creades van a la
 * paperera en acabar.
 */
test.describe.configure( { mode: 'serial' } );

const creades = [];

async function entra( page ) {
	await page.goto( '/admin/' );
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
	test.skip( testInfo.project.name !== 'panell', 'Només al projecte panell' );
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
	await expect( diagnostic ).toContainText( 'La versió del format ha de ser 2' );
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

/** Guió actual de l'editor (CodeMirror), descodificat. */
async function llegeixGuio( page ) {
	return JSON.parse(
		await page.evaluate( () =>
			document.querySelector( '#nep-guio-missio .CodeMirror' ).CodeMirror.getValue()
		)
	);
}

test( '«Nova missió des de plantilla» omple un guió sense errors i no desa res sol', async ( { page } ) => {
	const marca = Date.now();
	await novaMissio( page, `Plantilla e2e ${ marca }` );
	await page.getByRole( 'button', { name: 'Nova missió des de plantilla' } ).click();
	await expect( page.locator( '#nep-guio-diagnostic' ) ).toHaveText( 'Cap error' );
	await expect( page.locator( '#nep-guio-plantilla-avis' ) ).toHaveAttribute( 'role', 'status' );
	await expect( page.locator( '#nep-guio-plantilla-avis' ) ).toContainText( `plantilla-e2e-${ marca }` );
	// Encara és a post-new.php: no s'ha desat res.
	await expect( page ).toHaveURL( /post-new\.php/ );
	const guioNou = await llegeixGuio( page );
	expect( guioNou.id ).toBe( `plantilla-e2e-${ marca }` );
	expect( guioNou.titol ).toBe( `Plantilla e2e ${ marca }` );

	await desa( page, '#save-post' );
	await expect( page.locator( '#post-status-display' ) ).toContainText( /esborrany/i );
	await expect( page.locator( '.notice-error' ) ).toHaveCount( 0 );
	expect( ( await llegeixGuio( page ) ).id ).toBe( `plantilla-e2e-${ marca }` );
	await expect( page.getByRole( 'button', { name: 'Nova missió des de plantilla' } ) ).toHaveCount( 0 );
} );

test( '«Duplica la missió» crea un esborrany amb un id nou i no toca l’original', async ( { page } ) => {
	const id = `e2e-original-${ Date.now() }`;
	await novaMissio( page, 'Prova e2e original' );
	await escriuGuio( page, guio( id ) );
	const original = await desa( page, '#save-post' );

	await page.getByRole( 'link', { name: 'Duplica la missió' } ).click();
	await page.waitForURL( /nep_duplicada=\d+/ );
	const copia = Number( new URL( page.url() ).searchParams.get( 'post' ) );
	creades.push( copia );
	expect( copia ).not.toBe( original );
	await expect( page.getByRole( 'status' ).filter( { hasText: "S'ha creat un esborrany" } ) ).toBeVisible();
	await expect( page.locator( '#title' ) ).toHaveValue( 'Prova e2e original (còpia)' );
	await expect( page.locator( '#post-status-display' ) ).toContainText( /esborrany/i );
	expect( ( await llegeixGuio( page ) ).id ).toBe( `${ id }-copia` );
	await expect( page.locator( '#nep-guio-diagnostic' ) ).toHaveText( 'Cap error' );

	await page.goto( `/wp-admin/post.php?post=${ original }&action=edit` );
	await expect( page.locator( '#title' ) ).toHaveValue( 'Prova e2e original' );
	expect( ( await llegeixGuio( page ) ).id ).toBe( id );
} );

test( '«Duplica» a la llista no reutilitza l’id d’una missió inclosa', async ( { page } ) => {
	const titol = `Prova e2e inclosa ${ Date.now() }`;
	await novaMissio( page, titol );
	await escriuGuio( page, JSON.stringify( factura ) );
	const original = await desa( page, '#save-post' );

	await page.goto( '/wp-admin/edit.php?post_type=nep_missio&post_status=draft' );
	const fila = page.locator( `#post-${ original }` );
	await fila.hover();
	await fila.getByRole( 'link', { name: `Duplica «${ titol }»` } ).click();
	await page.waitForURL( /nep_duplicada=\d+/ );
	creades.push( Number( new URL( page.url() ).searchParams.get( 'post' ) ) );
	const nou = ( await llegeixGuio( page ) ).id;
	expect( nou ).not.toBe( factura.id );
	expect( nou ).toMatch( /^llissa-01-factura-copia(-\d+)?$/ );

	await page.goto( `/wp-admin/post.php?post=${ original }&action=edit` );
	expect( ( await llegeixGuio( page ) ).id ).toBe( factura.id );
} );

const cursor = ( page ) =>
	page.evaluate( () => document.querySelector( '#nep-guio-missio .CodeMirror' ).CodeMirror.getCursor() );

test( '«Exporta» descarrega el guió de l’editor com a <id>.json', async ( { page } ) => {
	const id = `e2e-exporta-${ Date.now() }`;
	await novaMissio( page, 'Prova e2e exporta' );
	const text = JSON.stringify( { ...factura, id }, null, '	' );
	await escriuGuio( page, text );
	const [ baixada ] = await Promise.all( [
		page.waitForEvent( 'download' ),
		page.getByRole( 'button', { name: 'Exporta' } ).click(),
	] );
	expect( baixada.suggestedFilename() ).toBe( `${ id }.json` );
	const fs = require( 'fs' );
	expect( fs.readFileSync( await baixada.path(), 'utf8' ) ).toBe( `${ text }\n` );
} );

test( '«Importa» posa el guió a l’editor sense desar i rebutja fitxers dolents', async ( { page } ) => {
	await novaMissio( page, 'Prova e2e importa' );
	const avis = page.locator( '#nep-guio-io-avis' );
	await expect( avis ).toHaveAttribute( 'role', 'status' );
	const fitxer = page.locator( '#nep-guio-fitxer' );
	const id = `e2e-importa-${ Date.now() }`;
	const text = JSON.stringify( { ...factura, id, versio: 1 }, null, '	' );

	await fitxer.setInputFiles( { name: 'guio.json', mimeType: 'application/json', buffer: Buffer.from( text ) } );
	await expect( avis ).toHaveText( 'Guió importat. Revisa els errors abans de desar.' );
	expect( ( await llegeixGuio( page ) ).id ).toBe( id );
	await expect( page.locator( '#nep-guio-diagnostic' ) ).toContainText( 'La versió del format ha de ser 2' );
	await expect( page ).toHaveURL( /post-new\.php/ );

	await fitxer.setInputFiles( { name: 'trencat.json', mimeType: 'application/json', buffer: Buffer.from( '{ "id": <b>x</b>' ) } );
	await expect( avis ).toContainText( 'no és un JSON vàlid' );
	expect( ( await llegeixGuio( page ) ).id ).toBe( id );
	await expect( page.locator( '#nep-guio-missio b' ) ).toHaveCount( 0 );

	await fitxer.setInputFiles( {
		name: 'gran.json',
		mimeType: 'application/json',
		buffer: Buffer.from( `{"a":"${ 'x'.repeat( 524288 ) }"}` ),
	} );
	await expect( avis ).toContainText( 'massa gran' );
	expect( ( await llegeixGuio( page ) ).id ).toBe( id );
} );

test( '«Ves-hi» porta el cursor a la línia de l’error', async ( { page } ) => {
	await novaMissio( page, 'Prova e2e ves-hi' );
	const text = JSON.stringify( { ...factura, id: `e2e-vesi-${ Date.now() }`, versio: 1 }, null, '	' );
	await escriuGuio( page, text );
	const error = page.locator( '#nep-guio-diagnostic li' ).filter( { hasText: 'La versió del format' } );
	const boto = error.getByRole( 'button', { name: 'Ves-hi' } );
	await expect( boto ).toBeVisible();
	const linia = text.split( '\n' ).findIndex( ( l ) => l.includes( '"versio"' ) );
	await boto.focus();
	await page.keyboard.press( 'Enter' );
	expect( ( await cursor( page ) ).line ).toBe( linia );

	// Un error de sintaxi també es pot localitzar.
	await escriuGuio( page, '{\n\t"id": "x",\n\t"titol": oops\n}' );
	await expect( page.locator( '#nep-guio-diagnostic' ) ).toContainText( 'no és un JSON vàlid' );
	await page.locator( '#nep-guio-diagnostic' ).getByRole( 'button', { name: 'Ves-hi' } ).click();
	expect( await cursor( page ) ).toMatchObject( { line: 2, ch: 10 } );
} );

test( 'un Editor no veu «Missions» ni pot crear-ne per REST', async ( { page, browser } ) => {
	const nonce = await ( await page.request.get( '/wp-admin/admin-ajax.php?action=rest-nonce' ) ).text();
	const login = `e2e_editor_${ Date.now() }`;
	const contrasenya = `Pw-${ Date.now() }-x9!`;
	const creat = await page.request.post( '/wp-json/wp/v2/users', {
		headers: { 'X-WP-Nonce': nonce },
		data: { username: login, password: contrasenya, email: `${ login }@exemple.test`, roles: [ 'editor' ] },
	} );
	expect( creat.status() ).toBe( 201 );
	const usuari = ( await creat.json() ).id;
	const context = await browser.newContext();
	try {
		const editor = await context.newPage();
		await editor.goto( '/admin/' );
		await editor.locator( '#user_login' ).fill( login );
		await editor.locator( '#user_pass' ).fill( contrasenya );
		await editor.locator( '#wp-submit' ).click();
		await expect( editor.locator( '#wpadminbar' ) ).toBeVisible();
		await editor.goto( '/wp-admin/' );
		await expect( editor.locator( '#adminmenu' ) ).toBeVisible();
		await expect( editor.locator( '#menu-posts-nep_missio' ) ).toHaveCount( 0 );
		await expect( editor.locator( '#adminmenu' ) ).not.toContainText( 'Missions' );

		const nonceEditor = await ( await editor.request.get( '/wp-admin/admin-ajax.php?action=rest-nonce' ) ).text();
		const r = await editor.request.post( '/wp-json/wp/v2/nep_missio', {
			headers: { 'X-WP-Nonce': nonceEditor },
			data: { title: 'Prova editor', status: 'draft' },
		} );
		expect( r.status() ).toBe( 403 );
	} finally {
		await context.close();
		const esborrat = await page.request.delete( `/wp-json/wp/v2/users/${ usuari }?force=true&reassign=1`, {
			headers: { 'X-WP-Nonce': nonce },
		} );
		expect( esborrat.status() ).toBe( 200 );
	}
} );
