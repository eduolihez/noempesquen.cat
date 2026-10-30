const { test, expect } = require( '@playwright/test' );
const { greusAxe, petits } = require( './ajudes' );

const PC = [ 'llissa-01-factura', 'llissa-02-banc' ];
const MOBIL = [ 'remei-01-paquet', 'remei-02-canviat' ];
const TITOLS = {
	'llissa-01-factura': 'La factura de la llum',
	'remei-01-paquet': 'El paquet retingut',
	'remei-02-canviat': 'Hola, he canviat de mòbil',
};

// Progrés de prova: la primera de cada dispositiu, ja jugada.
const PROGRES = { [ PC[ 0 ] ]: 3, [ MOBIL[ 0 ] ]: 2 };

const selector = ( page ) =>
	page.getByRole( 'region', { name: 'Tria una missió' } );

const seccio = ( page, nom ) =>
	selector( page ).getByRole( 'group', { name: nom, exact: true } );

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

// El selector decideix pel mateix punt de tall que `useEsMobil` (767 px),
// no pel tipus de dispositiu: un mòbil en horitzontal hi compta com a PC.
const estret = ( page ) => page.viewportSize().width < 768;

const desborda = ( page ) =>
	page.evaluate(
		() =>
			document.documentElement.scrollWidth >
			document.documentElement.clientWidth
	);

test.describe( 'Selector de missions', () => {
	test( 'seccions i ordre segons el dispositiu', async ( { page } ) => {
		const isMobile = estret( page );
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

		// Un sol h2 (el selector) i les seccions com a h3 que en pengen.
		expect(
			await selector( page )
				.getByRole( 'heading', { level: 2 } )
				.allTextContents()
		).toEqual( [ 'Tria una missió' ] );
		expect(
			await selector( page )
				.getByRole( 'heading', { level: 3 } )
				.allTextContents()
		).toEqual( [ 'Continua per aquí', titolPropi, 'Altres dispositius' ] );

		// «Millor en horitzontal» només a les de PC vistes des d'un mòbil.
		const horitzontal = selector( page ).getByText(
			'Millor en horitzontal'
		);
		await expect( horitzontal ).toHaveCount( isMobile ? PC.length : 0 );
	} );

	test( 'la recomanada apareix una sola vegada', async ( { page } ) => {
		const isMobile = estret( page );
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
		).toHaveCount( PC.length + MOBIL.length );
	} );

	test( 'amb progrés recomana la següent i mostra el resum', async ( {
		page,
	} ) => {
		const isMobile = estret( page );
		await page.addInitScript( ( p ) => {
			window.localStorage.setItem(
				'noempesquen-progres-v2',
				JSON.stringify( p )
			);
		}, PROGRES );
		await page.goto( '/simulador/' );
		const esperada = isMobile ? MOBIL[ 1 ] : PC[ 1 ];
		expect( await idsDe( seccio( page, 'Continua per aquí' ) ) ).toEqual( [
			esperada,
		] );
		const total = PC.length + MOBIL.length;
		const valors = Object.values( PROGRES );
		const guanyades = valors.reduce( ( a, b ) => a + b, 0 );
		await expect( selector( page ) ).toContainText(
			`${ valors.length } de ${ total } missions jugades · ${ guanyades } de ${
				total * 3
			} estrelles`
		);
		for ( const n of new Set( valors ) ) {
			await expect(
				page.getByRole( 'img', {
					name: `Millor resultat: ${ n } de 3 estrelles`,
				} )
			).toHaveCount( valors.filter( ( v ) => v === n ).length );
		}
		await expect(
			page.getByRole( 'img', { name: "Encara no l'has jugada" } )
		).toHaveCount( total - valors.length );
	} );

	test( 'el focus torna a la targeta jugada', async ( { page } ) => {
		await page.clock.install();
		await page.goto( '/simulador/' );
		// Una de les no destacades i, després, la recomanada. Al mòbil, totes
		// dues de mòbil (una de PC en vertical demana girar).
		const parella = estret( page )
			? [ 'remei-02-canviat', 'remei-01-paquet' ]
			: [ 'remei-02-canviat', 'llissa-01-factura' ];
		for ( const titol of parella.map( ( id ) => TITOLS[ id ] ) ) {
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
