const { test, expect } = require( './ajudes' );
const factura = require( '../../plugins/noempesquen-core/missions/llissa-01-factura.json' );
const MISSIO_JSON = require( '../../plugins/noempesquen-core/missions/llissa-05-actualitzacio.json' );
const { iniciaMissio, senseFullscreen } = require( './ajudes' );

/**
 * Estadístiques anònimes: un sol POST /resultat per partida acabada (amb
 * només tres claus) i la pantalla del panell. Al projecte `panell`: publica
 * una missió de prova. El POST s'intercepta (no escriu files a la base de
 * dades ni consumeix el límit d'enviaments).
 */
test.describe.configure( { mode: 'serial' } );

const RESULTAT = /\/noempesquen\/v1\/resultat/;
const escapa = ( text ) => text.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );

test.beforeEach( ( {}, testInfo ) => {
	test.skip( testInfo.project.name !== 'panell', 'Només al projecte panell' );
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
	await parla( page ).getByRole( 'button', { name: 'Ja ho tinc clar' } ).click();
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
	await expect( page.getByRole( 'img', { name: /de 3 estrelles/ } ) ).toBeVisible();

	expect( peticio.method() ).toBe( 'POST' );
	const cos = peticio.postDataJSON();
	expect( Object.keys( cos ).sort() ).toEqual( [ 'decisio', 'estrelles', 'missio' ] );
	expect( cos.missio ).toBe( MISSIO_JSON.id );
	expect( cos.decisio ).toBe( 'a' );
	expect( [ 1, 2, 3 ] ).toContain( cos.estrelles );
	expect( peticio.headers() ).not.toHaveProperty( 'x-wp-nonce' );
	expect( peticio.headers() ).not.toHaveProperty( 'cookie' );

	// Re-renderitzar el resultat (canviar la mida, deixar passar el temps) no torna a enviar.
	await page.setViewportSize( { width: 1100, height: 700 } );
	await page.clock.runFor( 5000 );
	await page.setViewportSize( { width: 1280, height: 720 } );
	await expect( page.getByRole( 'img', { name: /de 3 estrelles/ } ) ).toBeVisible();
	expect( peticions ).toHaveLength( 1 );
	// Ni cap altra petició porta res més que aquestes tres claus.
	expect( peticio.postData() ).toBe( JSON.stringify( cos ) );
} );

test( 'el panell mostra la taula i amaga les missions amb poques partides', async ( {
	page,
} ) => {
	await page.goto( '/wp-login.php' );
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
				nep_guio: JSON.stringify( { ...factura, id, titol: `Prova ${ id }` } ),
			},
		},
	} );
	expect( creada.status() ).toBe( 201 );
	const post = ( await creada.json() ).id;

	try {
		await page.goto( '/wp-admin/edit.php?post_type=nep_missio&page=nep-estadistiques&periode=7' );
		await expect( page.getByText( 'Dades indicatives.' ) ).toBeVisible();
		const taula = page.getByRole( 'table', { name: /darrers 7 dies/ } );
		await expect( taula ).toBeVisible();
		await expect( taula.getByRole( 'columnheader', { name: 'Partides' } ) ).toBeVisible();
		const fila = taula.getByRole( 'row', { name: new RegExp( escapa( id ) ) } );
		await expect( fila ).toContainText( 'Dades insuficients (menys de 10 partides)' );
		await expect( page.getByLabel( 'Període' ) ).toHaveValue( '7' );
	} finally {
		await page.request.delete( `/wp-json/wp/v2/nep_missio/${ post }?force=true`, {
			headers: { 'X-WP-Nonce': nonce },
		} );
	}
} );
