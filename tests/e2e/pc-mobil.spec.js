const { test, expect } = require( './ajudes' );
const {
	greusAxePc,
	iniciaMissio,
	petits,
	senseFullscreen,
} = require( './ajudes' );

const MISSIO = /La factura de la llum/;
const BLOQUEIG = /Clica o prem/;
const HORITZONTAL = { width: 915, height: 412 };
const VERTICAL = { width: 412, height: 915 };

/* Peces del sistema PC (no el contingut de les apps) que han de fer 44 px. */
const SISTEMA_PC = [
	'.nep-so-bloqueig button',
	'.nep-so-barra button',
	'.nep-so-finestra__control',
	'.nep-so-escriptori__icona',
	'.nep-so-toasts button',
	'.nep-so-centre button',
	'.nep-so-inici button',
	'.nep-so-inici input',
	'.nep-so-girar button',
].join( ', ' );

/**
 * Com `petits` (ajudes.js), però només amb les peces del sistema PC.
 * El contingut de les apps (navegador, Posta, Parla) a escala ~0,57 encara
 * no arriba a 44 px: deute pendent (vegeu D3).
 *
 * @param {import('@playwright/test').Page} page
 * @return {Promise<string[]>} Elements petits.
 */
const petitsPc = ( page ) =>
	page.evaluate(
		( sel ) =>
			[ ...document.querySelectorAll( sel ) ]
				.filter( ( el ) => {
					const r = el.getBoundingClientRect();
					return (
						r.width > 0 &&
						r.height > 0 &&
						! el.closest( '[inert]' ) &&
						( r.width < 44 || r.height < 44 )
					);
				} )
				.map(
					( el ) =>
						`${ el.className } | ${ Math.round(
							el.getBoundingClientRect().width
						) }×${ Math.round( el.getBoundingClientRect().height ) }`
				),
		SISTEMA_PC
	);

const senseDesbordament = ( page ) =>
	page.evaluate(
		() =>
			document.documentElement.scrollWidth <=
			document.documentElement.clientWidth
	);

const parla = ( page ) => page.getByRole( 'region', { name: 'Parla' } );
const barra = ( page ) =>
	page.getByRole( 'navigation', { name: 'Barra de tasques' } );
/* CSS i no rol: en mode girar el PC és aria-hidden. */
const hora = ( page ) =>
	page.locator( '.nep-so-barra__hora > span' ).first().textContent();

/** Entra a l'escriptori de la factura i salta la presentació. */
async function entra( page ) {
	await senseFullscreen( page );
	await iniciaMissio( page, MISSIO, BLOQUEIG );
	await page.getByRole( 'button', { name: BLOQUEIG } ).tap();
	await expect( parla( page ) ).toBeVisible();
	await parla( page )
		.getByRole( 'button', { name: 'Salta la presentació' } )
		.tap();
}

test.describe( 'PC en pantalles petites', () => {
	test( 'en horitzontal tàctil el PC s’escala i es pot fer servir', async ( {
		page,
	}, testInfo ) => {
		test.skip(
			testInfo.project.name !== 'mobil-horitzontal',
			'Només al projecte mòbil horitzontal'
		);
		await page.setViewportSize( HORITZONTAL );
		await entra( page );
		await expect( page.locator( '.nep-so-pantalla' ) ).toHaveClass(
			/is-escalat/
		);
		expect( await senseDesbordament( page ) ).toBe( true );
		const caixaBarra = await barra( page ).boundingBox();
		expect( caixaBarra.height ).toBeGreaterThanOrEqual( 44 );
		expect( caixaBarra.y + caixaBarra.height ).toBeLessThanOrEqual(
			HORITZONTAL.height + 1
		);

		// Arriba el correu (la notificació queda al centre de notificacions).
		await page.clock.runFor( 8000 );
		expect( await petitsPc( page ) ).toEqual( [] );
		testInfo.annotations.push( {
			type: 'apps-petites',
			description: `${ ( await petits( page ) ).length } elements de les apps per sota de 44 px`,
		} );
		await page.screenshot( { path: 'test-results/pc-915x412.png' } );

		// Arrossegar Parla segueix el dit (±2 px).
		const finestra = parla( page );
		const titol = finestra.locator( '.nep-so-finestra__titol' );
		const abans = await finestra.boundingBox();
		const t = await titol.boundingBox();
		const x0 = t.x + 10;
		const y0 = t.y + t.height / 2;
		await page.mouse.move( x0, y0 );
		await page.mouse.down();
		await page.mouse.move( x0 - 40, y0 + 15, { steps: 5 } );
		await page.mouse.move( x0 - 80, y0 + 30, { steps: 5 } );
		await page.mouse.up();
		const despres = await finestra.boundingBox();
		expect( Math.abs( despres.x - abans.x + 80 ) ).toBeLessThanOrEqual( 2 );
		expect( Math.abs( despres.y - abans.y - 30 ) ).toBeLessThanOrEqual( 2 );

		// Menú d'inici i centre de notificacions, també a 44 px.
		await barra( page )
			.getByRole( 'button', { name: 'Inici', exact: true } )
			.tap();
		await expect( page.locator( '.nep-so-inici' ) ).toBeVisible();
		expect( await petitsPc( page ) ).toEqual( [] );
		await barra( page )
			.getByRole( 'button', { name: 'Inici', exact: true } )
			.tap();
		await page.locator( '.nep-so-barra__rellotge' ).tap();
		await expect( page.locator( '.nep-so-centre' ) ).toBeVisible();
		expect( await petitsPc( page ) ).toEqual( [] );
		expect( await greusAxePc( page ) ).toEqual( [] );
	} );

	test( 'el teclat en pantalla (viewport visual més petit) no reescala el PC', async ( {
		page,
	}, testInfo ) => {
		test.skip(
			! testInfo.project.name.includes( 'horitzontal' ),
			'Només al projecte mòbil horitzontal'
		);
		await page.setViewportSize( HORITZONTAL );
		await entra( page );
		const pantalla = page.locator( '.nep-so-pantalla' );
		const escala = () =>
			pantalla.evaluate( ( el ) =>
				el.style.getPropertyValue( '--so-escala' )
			);
		const abans = await escala();
		expect( abans ).not.toBe( '' );

		await page
			.locator( '.nep-so-pantalla input:not([disabled])' )
			.first()
			.focus();
		// Simula el teclat: el viewport visual s'encongeix, el de disseny no.
		await page.evaluate( () => {
			const vv = window.visualViewport;
			Object.defineProperty( vv, 'height', { get: () => 150 } );
			Object.defineProperty( vv, 'width', { get: () => 915 } );
			vv.dispatchEvent( new window.Event( 'resize' ) );
			window.dispatchEvent( new window.Event( 'resize' ) );
		} );
		await page.clock.runFor( 500 );
		expect( await escala() ).toBe( abans );
		await expect( pantalla ).toHaveClass( /is-escalat/ );
		await expect( page.getByRole( 'alertdialog' ) ).toHaveCount( 0 );
	} );

	test( 'en vertical demana girar, atura el rellotge i després continua', async ( {
		page,
	}, testInfo ) => {
		test.skip(
			testInfo.project.name !== 'mobil-horitzontal',
			'Només al projecte mòbil horitzontal'
		);
		await page.setViewportSize( HORITZONTAL );
		await entra( page );
		await page.clock.runFor( 8000 );

		await page.setViewportSize( VERTICAL );
		const peticio = page.getByRole( 'alertdialog', {
			name: 'Gira el mòbil',
		} );
		await expect( peticio ).toBeVisible();
		const torna = peticio.getByRole( 'button', {
			name: 'Torna al selector',
		} );
		await expect( torna ).toBeFocused();
		const caixa = await torna.boundingBox();
		expect( caixa.height ).toBeGreaterThanOrEqual( 44 );
		expect( await senseDesbordament( page ) ).toBe( true );
		await page.screenshot( { path: 'test-results/pc-412x915.png' } );
		expect( await greusAxePc( page ) ).toEqual( [] );

		// El rellotge de la barra no avança mentre es demana girar.
		const aturada = await hora( page );
		await page.clock.runFor( 120000 );
		expect( await hora( page ) ).toBe( aturada );

		// Tornem a horitzontal: la mateixa partida continua.
		await page.setViewportSize( HORITZONTAL );
		await expect( peticio ).toBeHidden();
		await expect( parla( page ) ).toBeVisible();
		await expect(
			page.getByRole( 'region', { name: 'Posta', exact: true } )
		).toBeVisible();
		await page.clock.runFor( 120000 );
		expect( await hora( page ) ).not.toBe( aturada );
	} );

	test( 'en vertical amb el PC bloquejat, cap tecla el desbloqueja i «Torna al selector» hi torna', async ( {
		page,
	}, testInfo ) => {
		test.skip(
			testInfo.project.name !== 'mobil-horitzontal',
			'Només al projecte mòbil horitzontal'
		);
		await page.setViewportSize( HORITZONTAL );
		await senseFullscreen( page );
		await iniciaMissio( page, MISSIO, BLOQUEIG );

		await page.setViewportSize( VERTICAL );
		const peticio = page.getByRole( 'alertdialog', {
			name: 'Gira el mòbil',
		} );
		const torna = peticio.getByRole( 'button', {
			name: 'Torna al selector',
		} );
		await expect( torna ).toBeFocused();
		// El bloqueig escolta qualsevol tecla: en mode girar no ha de fer res.
		await page.keyboard.press( 'a' );
		await page.keyboard.press( 'Shift' );
		await page.clock.runFor( 1000 );
		await page.setViewportSize( HORITZONTAL );
		await expect(
			page.getByRole( 'button', { name: BLOQUEIG } )
		).toBeVisible();
		await expect( parla( page ) ).toHaveCount( 0 );

		// Torna al selector amb Enter: surt de la missió.
		await page.setViewportSize( VERTICAL );
		await expect( torna ).toBeFocused();
		await page.keyboard.press( 'Enter' );
		await expect( page.locator( '.nep-so' ) ).toHaveCount( 0 );
		await expect(
			page.getByRole( 'button', { name: MISSIO } )
		).toBeVisible();
	} );

	test( 'a l’escriptori gran no s’escala; a 1024×768 sí', async ( {
		page,
	}, testInfo ) => {
		test.skip(
			testInfo.project.name !== 'escriptori',
			'Només al projecte escriptori'
		);
		const transform = () =>
			page
				.locator( '.nep-so-pantalla__contingut' )
				.evaluate( ( el ) => getComputedStyle( el ).transform );

		await page.setViewportSize( { width: 1440, height: 900 } );
		await senseFullscreen( page );
		await iniciaMissio( page, MISSIO, BLOQUEIG );
		await expect( page.locator( '.nep-so-pantalla' ) ).toHaveClass(
			/is-normal/
		);
		expect( await transform() ).toBe( 'none' );

		await page.setViewportSize( { width: 1280, height: 720 } );
		await expect( page.locator( '.nep-so-pantalla' ) ).toHaveClass(
			/is-normal/
		);
		expect( await transform() ).toBe( 'none' );
		const alt = await page
			.locator( '.nep-so-bloqueig' )
			.evaluate( ( el ) => el.getBoundingClientRect().height );
		expect( alt ).toBe( 720 );

		await page.setViewportSize( { width: 1024, height: 768 } );
		await expect( page.locator( '.nep-so-pantalla' ) ).toHaveClass(
			/is-escalat/
		);
		expect( await transform() ).toMatch( /^matrix\(0\.8, 0, 0, 0\.8/ );
		await page.getByRole( 'button', { name: BLOQUEIG } ).click();
		await expect( parla( page ) ).toBeVisible();
		expect( await senseDesbordament( page ) ).toBe( true );
		await page.screenshot( { path: 'test-results/pc-1024x768.png' } );
	} );
} );
