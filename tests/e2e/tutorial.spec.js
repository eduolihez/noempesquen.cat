const { test, expect } = require( './ajudes' );
const {
	RESULTAT,
	esHoritzontal,
	greusAxe,
	greusAxePc,
	inspecciona,
	iniciaMissio,
	petits,
} = require( './ajudes' );

const PROGRES = 'noempesquen-progres-v2';
const BLOQUEIG_PC = /Clica o prem/;
const BLOQUEIG_MOBIL = /Llisca cap amunt/;
const TUTORIAL_PC = "Aprèn a jugar a l'ordinador";
const TUTORIAL_MOBIL = 'Aprèn a jugar al mòbil';

// Amb el rellotge fals, l'animationend del bloqueig no arriba.
test.use( { reducedMotion: 'reduce' } );

const selector = ( page ) =>
	page.getByRole( 'region', { name: 'Tria una missió' } );
const seccio = ( page, nom ) =>
	selector( page ).getByRole( 'group', { name: nom, exact: true } );
const idsDe = ( loc ) =>
	loc
		.locator( '[data-missio]' )
		.evaluateAll( ( els ) => els.map( ( el ) => el.dataset.missio ) );
const parla = ( page ) => page.getByRole( 'region', { name: 'Parla' } );
const barraTasques = ( page ) =>
	page.getByRole( 'navigation', { name: 'Barra de tasques' } );
const pausa = ( page ) => page.getByRole( 'dialog', { name: 'Pausa' } );

/**
 * Compta els POST a /resultat des d'ara (el GET /resultat/resum no compta).
 *
 * @param {import('@playwright/test').Page} page
 * @return {() => number} Nombre de POST vistos.
 */
function comptaPosts( page ) {
	let n = 0;
	page.on( 'request', ( r ) => {
		if ( r.method() === 'POST' && RESULTAT.test( r.url() ) ) {
			n++;
		}
	} );
	return () => n;
}

/**
 * Progrés desat al navegador.
 *
 * @param {import('@playwright/test').Page} page
 */
const progres = ( page ) =>
	page.evaluate(
		( clau ) => JSON.parse( window.localStorage.getItem( clau ) ?? '{}' ),
		PROGRES
	);

/**
 * Pantalla final del tutorial: «Ja estàs a punt», sense estrelles ni punts,
 * cap POST a /resultat; «Juga una missió» torna al selector amb el tutorial
 * fet i ja no recomanat.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object}                          opc
 * @param {string}                          opc.id      Id del tutorial.
 * @param {string}                          opc.titol   Títol del tutorial.
 * @param {string}                          opc.seguent Id de la missió que passa a ser recomanada.
 * @param {() => number}                    opc.posts   Comptador de POST.
 * @param {Function}                        opc.axe     Comprovació axe.
 * @param {boolean}                         opc.mobil   Comprova també els 44 px.
 */
async function comprovaFinal(
	page,
	{ id, titol, seguent, posts, axe, mobil }
) {
	const capa = page.getByRole( 'dialog' );
	await expect( capa ).toBeVisible();
	await capa.getByRole( 'button', { name: 'Continua', exact: true } ).click();

	await expect(
		page.getByRole( 'heading', { level: 2, name: titol } )
	).toBeVisible();
	await expect( page.locator( '.nep-res__veredicte' ) ).toContainText(
		'Ja estàs a punt.'
	);
	await expect( page.getByRole( 'img', { name: /estrelles/ } ) ).toHaveCount(
		0
	);
	await expect( page.locator( '.nep-res' ) ).not.toContainText( /punts/i );
	await expect(
		page.getByRole( 'button', { name: 'Torna-ho a provar' } )
	).toHaveCount( 0 );
	expect( await axe( page ) ).toEqual( [] );
	if ( mobil ) {
		expect( await petits( page ) ).toEqual( [] );
	}

	// Ni en acabar ni una estona després s'envia cap resultat.
	await page.clock.runFor( 5000 );
	expect( posts() ).toBe( 0 );

	await page.getByRole( 'button', { name: 'Juga una missió' } ).click();
	await expect( selector( page ) ).toBeVisible();
	expect( posts() ).toBe( 0 );
	expect( ( await progres( page ) )[ id ] ).toBe( 1 );
	const targeta = selector( page ).locator( `[data-missio="${ id }"]` );
	await expect( targeta ).toHaveCount( 1 );
	await expect( targeta ).toContainText( 'Fet' );
	await expect( seccio( page, 'Comença per aquí' ) ).toHaveCount( 0 );
	expect( await idsDe( seccio( page, 'Continua per aquí' ) ) ).toEqual( [
		seguent,
	] );
}

test.describe( 'tutorial al PC', () => {
	test.beforeEach( ( { page } ) => {
		test.skip( ! esHoritzontal( page ), 'PC en vertical: demana girar' );
	} );

	test( 'de principi a fi, sense puntuar ni enviar res', async ( {
		page,
	} ) => {
		// Recorregut sencer amb dues passades d'axe: més de 30 s.
		test.slow();
		const posts = comptaPosts( page );
		await iniciaMissio(
			page,
			new RegExp( `^${ TUTORIAL_PC }` ),
			BLOQUEIG_PC
		);

		// 1. Desbloqueja: Parla amb la presentació i respostes ràpides.
		await page.getByRole( 'button', { name: BLOQUEIG_PC } ).click();
		await expect( parla( page ) ).toBeVisible();
		await expect( parla( page ) ).toContainText( 'Sóc la Llissa' );
		await parla( page ).getByRole( 'button', { name: 'Següent' } ).click();
		await parla( page ).getByRole( 'button', { name: 'Següent' } ).click();
		await parla( page ).getByRole( 'button', { name: 'Som-hi!' } ).click();
		await expect( parla( page ) ).toContainText(
			"Tanca el Navegador amb la creu i torna'l a obrir"
		);
		// El desbloqueig obre les finestres sol: encara no compta.
		await expect( parla( page ) ).not.toContainText( 'Molt bé!' );

		// 2. Tanca el Navegador i torna'l a obrir des de la barra de tasques.
		await page
			.getByRole( 'region', { name: /Posta/ } )
			.first()
			.getByRole( 'button', { name: 'Tanca', exact: true } )
			.click();
		await barraTasques( page )
			.getByRole( 'button', { name: /^Navegador/ } )
			.click();
		await expect( parla( page ) ).toContainText(
			"Així es tanquen i s'obren les finestres"
		);

		// 3. Arriba l'avís de la Llissa i s'obre amb un clic.
		await page.clock.runFor( 6000 );
		const avis = page
			.locator( '.nep-so-toast' )
			.filter( { hasText: 'Això és una notificació' } );
		await expect( avis ).toBeVisible();
		await avis.getByRole( 'button' ).last().click();
		await expect( parla( page ) ).toContainText(
			'Has obert la notificació i has arribat a Parla'
		);

		// 4. Arriba el correu de mentida i la Llissa hi envia.
		await page.clock.runFor( 5000 );
		await expect( parla( page ) ).toContainText(
			"T'acaba d'arribar un correu de mentida"
		);
		// L'avís de Posta porta a la safata.
		await page
			.locator( '.nep-so-toast' )
			.filter( { hasText: 'Premis Fantasia' } )
			.getByRole( 'button' )
			.last()
			.click();
		await page
			.getByRole( 'region', { name: 'Entrada' } )
			.getByRole( 'button', { name: /Premis Fantasia/ } )
			.click();
		await expect(
			page.getByRole( 'heading', {
				name: 'Enhorabona! Has guanyat un iot',
			} )
		).toBeVisible();

		// 5. Lupa: activa, marca el remitent i el comptador puja.
		const lupa = barraTasques( page ).getByRole( 'button', {
			name: 'Lupa, 0 de 2 indicis',
		} );
		await expect( lupa ).toContainText( '0/2' );
		await lupa.click();
		await expect( parla( page ) ).toContainText( 'Lupa activada!' );
		await inspecciona( page, 'guanyador@premis-fantasia.xyz' ).click();
		await expect(
			barraTasques( page ).getByRole( 'button', {
				name: 'Lupa, 1 de 2 indicis',
			} )
		).toContainText( '1/2' );
		expect( await greusAxePc( page ) ).toEqual( [] );
		// Al PC (ratolí) no es demanen 44 px, com a la resta de specs de PC.

		// 6. Porta Parla al davant: «Ja ho tinc clar» i l'única opció.
		await barraTasques( page )
			.getByRole( 'button', { name: /^Parla/ } )
			.click();
		await parla( page )
			.getByRole( 'button', { name: 'Ja ho tinc clar', exact: true } )
			.click();
		await parla( page )
			.getByRole( 'button', { name: /^Ja ho tinc clar: és un correu/ } )
			.click();

		await comprovaFinal( page, {
			id: 'tutorial-pc',
			titol: TUTORIAL_PC,
			seguent: 'llissa-01-factura',
			posts,
			axe: greusAxePc,
		} );
	} );
} );

test.describe( 'tutorial al mòbil', () => {
	test.beforeEach( ( { isMobile } ) => {
		test.skip( ! isMobile, 'Només al projecte mòbil' );
	} );

	const dock = ( page ) =>
		page.getByRole( 'list', { name: 'Apps preferides' } );
	const banner = ( page, text ) =>
		page.locator( '.nep-so-m-banner' ).filter( { hasText: text } );

	test( 'de principi a fi, sense puntuar ni enviar res', async ( {
		page,
	} ) => {
		// Recorregut sencer amb dues passades d'axe: més de 30 s.
		test.slow();
		const posts = comptaPosts( page );
		await iniciaMissio(
			page,
			new RegExp( `^${ TUTORIAL_MOBIL }` ),
			BLOQUEIG_MOBIL
		);

		// 1. Desbloqueja, obre el Navegador i torna a l'inici.
		await page.getByRole( 'button', { name: BLOQUEIG_MOBIL } ).click();
		await dock( page ).getByRole( 'button', { name: 'Navegador' } ).click();
		await page
			.getByRole( 'navigation', { name: 'Navegació del sistema' } )
			.getByRole( 'button', { name: 'Inici' } )
			.click();
		await expect( dock( page ) ).toBeVisible();

		// 2. Arriba l'avís de la Remei i s'obre tocant-lo.
		await page.clock.runFor( 6000 );
		const avis = banner( page, 'Això és una notificació' );
		await expect( avis ).toBeVisible();
		await avis.locator( '.nep-so-m-notif' ).click();
		await expect( parla( page ) ).toBeVisible();
		await expect( parla( page ) ).toContainText(
			'Has obert la notificació i has arribat a Parla'
		);

		// 3. Parla: presentació amb les respostes ràpides.
		await expect( parla( page ) ).toContainText( 'Sóc la Pirata Remei' );
		await parla( page ).getByRole( 'button', { name: 'Següent' } ).click();
		await parla( page ).getByRole( 'button', { name: 'Següent' } ).click();
		await parla( page ).getByRole( 'button', { name: 'Som-hi!' } ).click();

		// 4. Arriba l'SMS de mentida: obre Missatges.
		await page.clock.runFor( 5000 );
		await expect( parla( page ) ).toContainText(
			"T'acaba d'arribar un SMS de mentida"
		);
		await page
			.getByRole( 'navigation', { name: 'Navegació del sistema' } )
			.getByRole( 'button', { name: 'Inici' } )
			.click();
		await dock( page ).getByRole( 'button', { name: 'Missatges' } ).click();
		await page.locator( '[data-fil]' ).first().click();

		// 5. Lupa: activa, marca el remitent i el comptador puja.
		const lupa = page.getByRole( 'button', {
			name: 'Lupa, 0 de 2 indicis',
		} );
		await expect( lupa ).toContainText( '0/2' );
		await lupa.click();
		await expect( lupa ).toHaveAttribute( 'aria-pressed', 'true' );
		await inspecciona( page, 'Premis Fantasia' ).click();
		await expect(
			page.getByRole( 'button', { name: 'Lupa, 1 de 2 indicis' } )
		).toContainText( '1/2' );
		expect( await greusAxe( page ) ).toEqual( [] );
		// Amb la lupa, els fragments de text inspeccionables són objectius en
		// línia (excepció de WCAG 2.5.8): la resta ha de fer 44 px.
		expect(
			( await petits( page ) ).filter(
				( p ) => ! p.startsWith( 'nep-inspecciona' )
			)
		).toEqual( [] );

		// 6. Torna a Parla: la guia ha vist la lupa; «Ja ho tinc clar».
		await page
			.getByRole( 'navigation', { name: 'Navegació del sistema' } )
			.getByRole( 'button', { name: 'Inici' } )
			.click();
		await page
			.getByRole( 'list', { name: /Apps/ } )
			.getByRole( 'button', { name: 'Parla' } )
			.first()
			.click();
		await expect( parla( page ) ).toContainText( 'Lupa activada!' );
		await parla( page )
			.getByRole( 'button', { name: 'Ja ho tinc clar', exact: true } )
			.click();
		await parla( page )
			.getByRole( 'button', { name: /^Ja ho tinc clar: és un SMS/ } )
			.click();

		await comprovaFinal( page, {
			id: 'tutorial-mobil',
			titol: TUTORIAL_MOBIL,
			seguent: 'remei-01-paquet',
			posts,
			axe: greusAxe,
			mobil: true,
		} );
	} );
} );

test.describe( 'tutorial al selector', () => {
	// El selector decideix pel mateix punt de tall que `useEsMobil`.
	const estret = ( page ) => page.viewportSize().width < 768;

	test( 'la primera vegada recomana el tutorial i es pot saltar', async ( {
		page,
	} ) => {
		const isMobile = estret( page );
		const tutorial = isMobile ? 'tutorial-mobil' : 'tutorial-pc';
		const altre = isMobile ? 'tutorial-pc' : 'tutorial-mobil';
		const primera = isMobile ? 'remei-01-paquet' : 'llissa-01-factura';
		await page.clock.install();
		await page.goto( '/simulador/' );
		expect( await idsDe( seccio( page, 'Comença per aquí' ) ) ).toEqual( [
			tutorial,
		] );
		expect( await idsDe( seccio( page, 'Tutorial' ) ) ).toEqual( [
			altre,
		] );

		// Saltar-lo jugant una altra missió: la primera del dispositiu.
		await page.locator( `[data-missio="${ primera }"]` ).click();
		await expect( selector( page ) ).toBeHidden();
		await page.keyboard.press( 'Escape' );
		await expect( pausa( page ) ).toBeVisible();
		await expect(
			pausa( page ).getByRole( 'button', { name: 'Salta el tutorial' } )
		).toHaveCount( 0 );
		await pausa( page ).getByRole( 'button', { name: 'Surt' } ).click();
		await expect( selector( page ) ).toBeVisible();
	} );

	test( '«Salta el tutorial» torna al selector sense marcar-lo fet', async ( {
		page,
	} ) => {
		const isMobile = estret( page );
		const tutorial = isMobile ? 'tutorial-mobil' : 'tutorial-pc';
		await iniciaMissio(
			page,
			new RegExp( `^${ isMobile ? TUTORIAL_MOBIL : TUTORIAL_PC }` ),
			isMobile ? BLOQUEIG_MOBIL : BLOQUEIG_PC
		);
		await page.keyboard.press( 'Escape' );
		await expect( pausa( page ) ).toBeVisible();
		await pausa( page )
			.getByRole( 'button', { name: 'Salta el tutorial' } )
			.click();
		await expect( selector( page ) ).toBeVisible();
		expect( ( await progres( page ) )[ tutorial ] ).toBeUndefined();
		expect( await idsDe( seccio( page, 'Comença per aquí' ) ) ).toEqual( [
			tutorial,
		] );
		await expect(
			selector( page ).locator( `[data-missio="${ tutorial }"]` )
		).not.toContainText( 'Fet' );
	} );
} );
