const { test, expect } = require( '@playwright/test' );
const { greusAxePc, iniciaMissio, senseFullscreen } = require( './ajudes' );

/*
 * Revisió visual (D8): captures sense baseline a `test-results/visual-*.png`.
 * El test només falla per problemes mesurables: desbordament horitzontal de
 * la pàgina, peces clau fora de la finestra o violacions axe greus.
 * S'executa només al projecte escriptori: la mida es canvia a mà i el cas
 * tàctil en horitzontal es fa amb `test.use` al seu bloc.
 */

const MIDES = [
	{ width: 1440, height: 900 },
	{ width: 1024, height: 768 },
	{ width: 768, height: 1024 },
	{ width: 400, height: 800 },
];
const TACTIL_HORITZONTAL = { width: 915, height: 412 };

const FACTURA = /La factura de la llum/;
const CANVIAT = /Hola, he canviat de mòbil/;
const BLOQUEIG_PC = /Clica o prem/;
const BLOQUEIG_MOBIL = /Llisca cap amunt/;

const senseDesbordament = ( page ) =>
	page.evaluate(
		() =>
			document.documentElement.scrollWidth <=
			document.documentElement.clientWidth
	);

/** Selectors visibles que surten de la finestra (±1 px). */
const foraDeFinestra = ( page, selectors ) =>
	page.evaluate(
		( sels ) =>
			sels.filter( ( sel ) => {
				const el = document.querySelector( sel );
				if ( ! el ) {
					return true;
				}
				const r = el.getBoundingClientRect();
				return (
					r.left < -1 ||
					r.top < -1 ||
					r.right > window.innerWidth + 1 ||
					r.bottom > window.innerHeight + 1
				);
			} ),
		selectors
	);

/**
 * Captura i comprovacions comunes.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          nom   Nom de la pantalla.
 * @param {string[]}                        claus Selectors que han de cabre a la finestra.
 */
async function revisa( page, nom, claus ) {
	const { width, height } = page.viewportSize();
	await page.screenshot( {
		path: `test-results/visual-${ nom }-${ width }x${ height }.png`,
	} );
	expect( await senseDesbordament( page ), 'desbordament horitzontal' ).toBe(
		true
	);
	expect( await foraDeFinestra( page, claus ), 'fora de la finestra' ).toEqual(
		[]
	);
	expect( await greusAxePc( page ), 'axe greu' ).toEqual( [] );
}

const titolXat = ( page, nom ) =>
	page.getByRole( 'heading', { level: 3, name: nom, exact: true } );

/** PC: escriptori amb Parla oberta (o la petició de girar). */
async function pc( page, mida, prefix ) {
	await senseFullscreen( page );
	await page.setViewportSize( mida );
	// En vertical estret el PC no es mostra: petició de girar o d'ampliar.
	if ( mida.height > mida.width && mida.width < 768 ) {
		await page.clock.install();
		await page.goto( '/simulador/' );
		await page.getByRole( 'button', { name: FACTURA } ).click();
		await expect( page.getByRole( 'alertdialog' ) ).toBeVisible();
		await revisa( page, `${ prefix }girar`, [ '[role="alertdialog"]' ] );
		return;
	}
	await iniciaMissio( page, FACTURA, BLOQUEIG_PC );
	await page.getByRole( 'button', { name: BLOQUEIG_PC } ).click();
	const parla = page.getByRole( 'region', { name: 'Parla' } );
	await expect( parla ).toBeVisible();
	await parla
		.getByRole( 'button', { name: 'Salta la presentació' } )
		.click();
	await page.clock.runFor( 8000 );
	await revisa( page, `${ prefix }pc`, [
		'.nep-so-barra',
		'.nep-so-escriptori',
	] );

	await page.keyboard.press( 'Escape' );
	await expect( page.locator( '.nep-so-pausa__panell' ) ).toBeVisible();
	await revisa( page, `${ prefix }pausa`, [ '.nep-so-pausa__panell' ] );
}

/** Mòbil: xat de Parla obert, després la via parcial fins al resultat. */
async function mobil( page, mida, prefix ) {
	await senseFullscreen( page );
	await page.setViewportSize( mida );
	await iniciaMissio( page, CANVIAT, BLOQUEIG_MOBIL );
	await page.getByRole( 'button', { name: BLOQUEIG_MOBIL } ).click();
	await page.clock.runFor( 8000 );
	await page
		.getByRole( 'list', { name: 'Notificacions noves' } )
		.getByRole( 'button', { name: /he canviat de mòbil/ } )
		.click();
	await page.clock.runFor( 31000 );
	await expect( titolXat( page, '+44 7700 900461' ) ).toBeVisible();
	await revisa( page, `${ prefix }mobil-parla`, [
		'.nep-so',
		'.nep-parla-conversa__enrere',
	] );

	await page.getByRole( 'button', { name: 'Torna als xats' } ).click();
	await page.getByRole( 'button', { name: /^Remei/ } ).click();
	const salta = page.getByRole( 'button', {
		name: 'Salta la presentació',
	} );
	if ( await salta.isVisible() ) {
		await salta.click();
	}
	await page.getByRole( 'button', { name: 'Ja ho tinc clar' } ).click();
	const resposta = page.getByRole( 'button', {
		name: "No contesto i m'ho deixo estar.",
	} );
	await revisa( page, `${ prefix }mobil-respostes`, [ '.nep-parla-resposta' ] );
	await resposta.click();
	await page
		.getByRole( 'dialog' )
		.getByRole( 'button', { name: 'Veure el resultat' } )
		.click();
	await expect(
		page.getByRole( 'img', { name: '1 de 3 estrelles' } )
	).toBeVisible();
	await revisa( page, `${ prefix }resultat`, [ '.nep-res__estrelles' ] );
}

// Amb el rellotge fals l'animació del bloqueig no acaba (vegeu canviat.spec.js).
test.use( { reducedMotion: 'reduce' } );

test.describe( 'Revisió visual', () => {
	test.beforeEach( ( {}, testInfo ) => {
		test.skip(
			testInfo.project.name !== 'escriptori',
			'Només al projecte escriptori'
		);
	} );

	for ( const mida of MIDES ) {
		const m = `${ mida.width }×${ mida.height }`;

		test( `selector a ${ m }`, async ( { page } ) => {
			await page.setViewportSize( mida );
			await page.goto( '/simulador/' );
			await expect(
				page.getByRole( 'region', { name: 'Tria una missió' } )
			).toBeVisible();
			await revisa( page, 'selector', [] );
		} );

		test( `PC i pausa a ${ m }`, async ( { page } ) => {
			await pc( page, mida, '' );
		} );

		test( `mòbil i resultat a ${ m }`, async ( { page } ) => {
			await mobil( page, mida, '' );
		} );
	}

	test.describe( 'tàctil en horitzontal', () => {
		test.use( {
			viewport: TACTIL_HORITZONTAL,
			isMobile: true,
			hasTouch: true,
			deviceScaleFactor: 2,
		} );

		test( 'PC i pausa a 915×412', async ( { page } ) => {
			await pc( page, TACTIL_HORITZONTAL, 'tactil-' );
		} );

		test( 'mòbil i resultat a 915×412', async ( { page } ) => {
			await mobil( page, TACTIL_HORITZONTAL, 'tactil-' );
		} );
	} );
} );
