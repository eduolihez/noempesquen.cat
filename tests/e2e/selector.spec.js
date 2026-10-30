const { test, expect } = require( '@playwright/test' );
const { greusAxe, petits } = require( './ajudes' );

const PC = [ 'llissa-01-factura', 'llissa-02-banc' ];
const MOBIL = [ 'remei-01-paquet', 'remei-02-canviat' ];
const TITOLS = {
	'llissa-01-factura': 'La factura de la llum',
	'remei-01-paquet': 'El paquet retingut',
	'remei-02-canviat': 'Hola, he canviat de mòbil',
};

const selector = ( page ) =>
	page.getByRole( 'region', { name: 'Tria una missió' } );

const seccio = ( page, nom ) =>
	selector( page ).getByRole( 'region', { name: nom, exact: true } );

const idsDe = ( loc ) =>
	loc
		.locator( '[data-missio]' )
		.evaluateAll( ( els ) => els.map( ( el ) => el.dataset.missio ) );

// Botons del selector (el bloc és fora de `.nep-so`) més petits de 44 px.
const petitsSelector = ( page ) =>
	page.evaluate( () =>
		[ ...document.querySelectorAll( '.nep-selector button' ) ]
			.filter( ( el ) => {
				const r = el.getBoundingClientRect();
				return r.width > 0 && ( r.width < 44 || r.height < 44 );
			} )
			.map( ( el ) => el.dataset.missio )
	);

const desborda = ( page ) =>
	page.evaluate(
		() =>
			document.documentElement.scrollWidth >
			document.documentElement.clientWidth
	);

test.describe( 'Selector de missions', () => {
	test( 'seccions i ordre segons el dispositiu', async ( {
		page,
		isMobile,
	} ) => {
		await page.goto( '/simulador/' );
		await expect( selector( page ) ).toBeVisible();

		const propi = isMobile ? MOBIL : PC;
		const altre = isMobile ? PC : MOBIL;
		const titolPropi = isMobile
			? 'Per al teu mòbil'
			: 'Per al teu ordinador';

		// Sense progrés, la recomanada és la primera del dispositiu en ús.
		expect( await idsDe( seccio( page, 'Continua per aquí' ) ) ).toEqual( [
			propi[ 0 ],
		] );
		expect( await idsDe( seccio( page, titolPropi ) ) ).toEqual( [
			propi[ 1 ],
		] );
		expect( await idsDe( seccio( page, 'Altres dispositius' ) ) ).toEqual(
			altre
		);

		const titols = await selector( page )
			.getByRole( 'heading', { level: 2 } )
			.allTextContents();
		expect( titols ).toEqual( [
			'Tria una missió',
			'Continua per aquí',
			titolPropi,
			'Altres dispositius',
		] );

		// «Millor en horitzontal» només a les de PC vistes des d'un mòbil.
		const horitzontal = selector( page ).getByText(
			'Millor en horitzontal'
		);
		await expect( horitzontal ).toHaveCount( isMobile ? 2 : 0 );
	} );

	test( 'la recomanada apareix una sola vegada', async ( {
		page,
		isMobile,
	} ) => {
		await page.goto( '/simulador/' );
		const id = isMobile ? 'remei-01-paquet' : 'llissa-01-factura';
		await expect( page.locator( `[data-missio="${ id }"]` ) ).toHaveCount(
			1
		);
		await expect(
			page.getByRole( 'button', { name: TITOLS[ id ], exact: true } )
		).toHaveCount( 1 );
		await expect(
			page.getByRole( 'img', { name: "Encara no l'has jugada" } )
		).toHaveCount( 4 );
	} );

	test( 'amb progrés recomana la següent i mostra el resum', async ( {
		page,
		isMobile,
	} ) => {
		await page.addInitScript( () => {
			window.localStorage.setItem(
				'noempesquen-progres-v2',
				JSON.stringify( {
					'llissa-01-factura': 3,
					'remei-01-paquet': 2,
				} )
			);
		} );
		await page.goto( '/simulador/' );
		const esperada = isMobile ? 'remei-02-canviat' : 'llissa-02-banc';
		expect( await idsDe( seccio( page, 'Continua per aquí' ) ) ).toEqual( [
			esperada,
		] );
		await expect( selector( page ) ).toContainText(
			'2 de 4 missions jugades · 5 de 12 estrelles'
		);
		await expect(
			page.getByRole( 'img', {
				name: 'Millor resultat: 3 de 3 estrelles',
			} )
		).toHaveCount( 1 );
	} );

	test( 'el focus torna a la targeta jugada', async ( { page } ) => {
		await page.clock.install();
		await page.goto( '/simulador/' );
		// Una de la secció «Altres dispositius» i, després, la recomanada.
		for ( const titol of [
			TITOLS[ 'remei-02-canviat' ],
			TITOLS[ 'llissa-01-factura' ],
		] ) {
			await page
				.getByRole( 'button', { name: titol, exact: true } )
				.click();
			await expect( selector( page ) ).toBeHidden();
			await page.keyboard.press( 'Escape' );
			const pausa = page.getByRole( 'dialog', { name: 'Pausa' } );
			await expect( pausa ).toBeVisible();
			await pausa.getByRole( 'button', { name: 'Surt' } ).click();
			await expect(
				page.getByRole( 'button', { name: titol, exact: true } )
			).toBeFocused();
		}
	} );

	test( 'accessibilitat, mida dels objectius i captura', async ( {
		page,
		isMobile,
	} ) => {
		if ( ! isMobile ) {
			await page.setViewportSize( { width: 1440, height: 900 } );
		}
		await page.goto( '/simulador/' );
		await expect( selector( page ) ).toBeVisible();
		expect( await greusAxe( page ) ).toEqual( [] );
		expect( await petitsSelector( page ) ).toEqual( [] );
		if ( isMobile ) {
			expect( await petits( page ) ).toEqual( [] );
		}
		await page.screenshot( {
			path: `test-results/selector-${ isMobile ? 'mobil' : '1440' }.png`,
			fullPage: true,
		} );
	} );

	test( 'sense desbordament horitzontal a 400 px', async ( {
		page,
	}, testInfo ) => {
		await page.setViewportSize( { width: 400, height: 800 } );
		await page.goto( '/simulador/' );
		await expect( selector( page ) ).toBeVisible();
		expect( await desborda( page ) ).toBe( false );
		expect( await petitsSelector( page ) ).toEqual( [] );
		expect( await greusAxe( page ) ).toEqual( [] );
		await page.screenshot( {
			path: `test-results/selector-400-${ testInfo.project.name }.png`,
			fullPage: true,
		} );
	} );
} );
