const { test, expect } = require( './ajudes' );
const { greusAxe, petits, rutaDe } = require( './ajudes' );

const PROGRES = 'noempesquen-progres-v2';
const NOM = { pc: /^Obre el Pesquer:/, mobil: /^Obre el Pirata:/ };

const selector = ( page ) =>
	page.getByRole( 'region', { name: 'Tria una missió' } );
const barco = ( page, d ) => page.getByRole( 'button', { name: NOM[ d ] } );
const mapa = ( page ) => page.locator( '.nep-mapa' );
const nodeDe = ( page, id ) => page.locator( `[data-missio="${ id }"]` );
const pausa = ( page ) => page.getByRole( 'dialog', { name: 'Pausa' } );
const tornaAlPort = ( page ) =>
	page.getByRole( 'button', { name: 'Torna al port' } );

// El selector decideix pel mateix punt de tall que `useEsMobil` (767 px),
// no pel tipus de dispositiu: un mòbil en horitzontal hi compta com a PC.
const estret = ( page ) => page.viewportSize().width < 768;
const propi = ( page ) => ( estret( page ) ? 'mobil' : 'pc' );

const sembra = ( page, progres ) =>
	page.addInitScript(
		( [ clau, p ] ) =>
			window.localStorage.setItem( clau, JSON.stringify( p ) ),
		[ PROGRES, progres ]
	);

// Botons del selector (el bloc és fora de `.nep-so`) més petits de 44 px.
const petitsSelector = ( page ) =>
	page.evaluate( () =>
		[ ...document.querySelectorAll( '.nep-selector button' ) ]
			.filter( ( el ) => {
				const r = el.getBoundingClientRect();
				return r.width > 0 && ( r.width < 44 || r.height < 44 );
			} )
			.map( ( el ) => el.dataset.missio ?? el.className )
	);

const desborda = ( page ) =>
	page.evaluate(
		() =>
			document.documentElement.scrollWidth >
			document.documentElement.clientWidth
	);

/**
 * Cert si el centre del node és tapat per un element aliè al node.
 * @param node
 */
const tapat = ( node ) =>
	node.evaluate( ( el ) => {
		const r = el.getBoundingClientRect();
		const dalt = document.elementFromPoint(
			r.left + r.width / 2,
			r.top + r.height / 2
		);
		return ! dalt || ! el.contains( dalt );
	} );

/**
 * Obre el port i el mapa del vaixell indicat.
 * @param page
 * @param d
 */
async function obreMapa( page, d ) {
	await page.goto( '/simulador/' );
	await barco( page, d ).click();
	await expect( tornaAlPort( page ) ).toBeVisible();
}

test.describe( 'Selector de missions: port', () => {
	test( 'mostra els dos vaixells i marca «Aquí» el del dispositiu en ús', async ( {
		page,
	} ) => {
		await page.goto( '/simulador/' );
		await expect( selector( page ) ).toBeVisible();
		await expect( barco( page, 'pc' ) ).toBeVisible();
		await expect( barco( page, 'mobil' ) ).toBeVisible();
		const aqui = propi( page );
		const altre = aqui === 'pc' ? 'mobil' : 'pc';
		await expect( barco( page, aqui ) ).toContainText( 'Aquí' );
		await expect( barco( page, altre ) ).not.toContainText( 'Aquí' );
		await expect( page.getByText( 'Aquí', { exact: true } ) ).toHaveCount(
			1
		);
		// Nom accessible amb el recompte de la ruta (sense progrés).
		await expect( barco( page, 'pc' ) ).toHaveAccessibleName(
			/^Obre el Pesquer: ordinador amb la Llissa, 0 de 6 missions, 0 de 15 estrelles/
		);
		await expect( barco( page, 'mobil' ) ).toHaveAccessibleName(
			/^Obre el Pirata: mòbil amb la Remei, 0 de 6 missions, 0 de 15 estrelles/
		);
		// «Millor en horitzontal» només al Pesquer vist des d'un mòbil.
		await expect(
			selector( page ).getByText( 'Millor en horitzontal' )
		).toHaveCount( estret( page ) ? 1 : 0 );
		// Un sol h2: el del selector.
		await expect(
			selector( page ).getByRole( 'heading', { level: 2 } )
		).toHaveText( 'Tria una missió' );
	} );

	test( 'el resum del port suma les dues rutes', async ( { page } ) => {
		await sembra( page, {
			'tutorial-pc': 1,
			'llissa-01-factura': 2,
			'remei-01-paquet': 3,
		} );
		await page.goto( '/simulador/' );
		await expect( selector( page ) ).toContainText(
			'3 de 12 missions fetes · 5 de 30 estrelles'
		);
		await expect( barco( page, 'pc' ) ).toHaveAccessibleName(
			/^Obre el Pesquer: ordinador amb la Llissa, 2 de 6 missions, 2 de 15 estrelles/
		);
	} );
} );

test.describe( 'Selector de missions: mapa', () => {
	test( 'sense progrés, només el tutorial és disponible i la resta és bloquejada', async ( {
		page,
	} ) => {
		const d = propi( page );
		const ruta = rutaDe( d );
		await obreMapa( page, d );
		const nodes = mapa( page ).locator( '[data-missio]' );
		await expect( nodes ).toHaveCount( ruta.length );
		expect(
			await nodes.evaluateAll( ( els ) =>
				els.map( ( el ) => el.dataset.missio )
			)
		).toEqual( ruta.map( ( m ) => m.id ) );
		// Primer: tutorial, disponible, amb la bandera «Toca ara».
		await expect( nodeDe( page, ruta[ 0 ].id ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
		await expect( nodeDe( page, ruta[ 0 ].id ) ).toContainText(
			'Toca ara'
		);
		await expect( mapa( page ).getByText( 'Toca ara' ) ).toHaveCount( 1 );
		// Resta: bloquejades, amb el motiu com a descripció.
		for ( let i = 1; i < ruta.length; i++ ) {
			const node = nodeDe( page, ruta[ i ].id );
			await expect( node ).toHaveAttribute( 'aria-disabled', 'true' );
			await expect( node ).toHaveAccessibleName( ruta[ i ].titol );
			await expect( node ).toHaveAccessibleDescription(
				`Encara no l'has jugada. Bloquejada: acaba “${
					ruta[ i - 1 ].titol
				}” primer`
			);
		}
		// La disponible també porta resultat i estat a la descripció.
		await expect( nodeDe( page, ruta[ 0 ].id ) ).toHaveAccessibleName(
			ruta[ 0 ].titol
		);
		await expect(
			nodeDe( page, ruta[ 0 ].id )
		).toHaveAccessibleDescription( "Encara no l'has jugada. Disponible." );
	} );

	test( 'una missió bloquejada no s’inicia', async ( { page } ) => {
		const d = propi( page );
		const ruta = rutaDe( d );
		await obreMapa( page, d );
		const motiu = `Bloquejada: acaba “${ ruta[ 0 ].titol }” primer`;
		// aria-disabled: Playwright el tracta com a inhabilitat, per això `force`.
		await nodeDe( page, ruta[ 1 ].id ).click( { force: true } );
		// S'anuncia i es veu al cartell del node (també en tàctil).
		await expect(
			selector( page ).locator( '[aria-live="polite"]' )
		).toHaveText( motiu );
		await expect(
			nodeDe( page, ruta[ 1 ].id ).locator( '.nep-mapa__motiu' )
		).toBeVisible();
		await expect( selector( page ) ).toBeVisible();
		await expect( mapa( page ) ).toBeVisible();
		await expect( pausa( page ) ).toHaveCount( 0 );
		await expect(
			page.getByRole( 'button', {
				name: /Clica o prem|Llisca cap amunt/,
			} )
		).toHaveCount( 0 );
	} );

	test( 'amb progrés, la següent és disponible i les fetes mostren el resultat', async ( {
		page,
	} ) => {
		await sembra( page, { 'tutorial-pc': 1, 'llissa-01-factura': 2 } );
		await obreMapa( page, 'pc' );
		const ruta = rutaDe( 'pc' );
		const [ tut, uns, dos, tres ] = ruta.map( ( m ) =>
			nodeDe( page, m.id )
		);
		await expect( dos ).not.toHaveAttribute( 'aria-disabled', 'true' );
		await expect( dos ).toContainText( 'Toca ara' );
		await expect( tres ).toHaveAttribute( 'aria-disabled', 'true' );
		await expect( tres ).toHaveAccessibleDescription(
			`Encara no l'has jugada. Bloquejada: acaba “${ ruta[ 2 ].titol }” primer`
		);
		await expect( tut ).toHaveAccessibleDescription( 'Fet.' );
		await expect( uns ).toHaveAccessibleName( ruta[ 1 ].titol );
		await expect( uns ).toHaveAccessibleDescription(
			'Millor resultat: 2 de 3 estrelles. Fet.'
		);
		await expect( tut ).toContainText( 'Fet' );
		await expect( tut ).not.toHaveAttribute( 'aria-disabled', 'true' );
		await expect(
			uns.getByRole( 'img', {
				name: 'Millor resultat: 2 de 3 estrelles',
			} )
		).toBeVisible();
		await expect(
			dos.getByRole( 'img', { name: "Encara no l'has jugada" } )
		).toBeVisible();
		await expect( mapa( page ) ).toContainText( '2 de 6 missions' );
		await expect( mapa( page ) ).toContainText( '2 de 15 estrelles' );
	} );

	test( 'Esc torna al port sense obrir la pausa i el focus va al vaixell', async ( {
		page,
	} ) => {
		const d = propi( page );
		await obreMapa( page, d );
		await page.keyboard.press( 'Escape' );
		await expect( barco( page, d ) ).toBeVisible();
		await expect( barco( page, d ) ).toBeFocused();
		await expect( mapa( page ) ).toHaveCount( 0 );
		await expect( pausa( page ) ).toHaveCount( 0 );
	} );

	test( '«Torna al port» hi torna, amb el focus al vaixell', async ( {
		page,
	} ) => {
		await obreMapa( page, 'pc' );
		await expect(
			mapa( page ).getByRole( 'heading', { level: 3 } )
		).toBeFocused();
		await tornaAlPort( page ).click();
		await expect( barco( page, 'pc' ) ).toBeFocused();
		await expect( barco( page, 'mobil' ) ).toBeVisible();
	} );

	test( 'transició: la càmera s’acosta al vaixell i el mapa apareix', async ( {
		page,
	} ) => {
		await page.goto( '/simulador/' );
		await expect( page.locator( '.nep-port--zoom' ) ).toHaveCount( 0 );
		await barco( page, 'pc' ).click();
		await expect( page.locator( '.nep-port--zoom' ) ).toHaveCount( 1 );
		await expect( page.locator( '.nep-port--zoom-pc' ) ).toHaveCount( 1 );
		await expect( mapa( page ) ).toBeVisible();
		await tornaAlPort( page ).click();
		await expect( page.locator( '.nep-port--zoom' ) ).toHaveCount( 0 );
	} );

	test( 'aria-live anuncia l’obertura del mapa i el retorn al port', async ( {
		page,
	} ) => {
		await page.goto( '/simulador/' );
		const anunci = selector( page ).locator( '[aria-live="polite"]' );
		await barco( page, 'mobil' ).click();
		await expect( anunci ).toHaveText(
			'Has obert el mapa del Pirata: 0 de 6 missions fetes'
		);
		await tornaAlPort( page ).click();
		await expect( anunci ).toHaveText( 'Has tornat al port' );
	} );

	test( 'en tornar d’una partida s’obre el mapa amb el focus al node jugat', async ( {
		page,
	} ) => {
		await page.clock.install();
		const d = propi( page );
		// El tutorial no té «Surt» a la pausa: es juga la primera missió.
		const [ tutorial, id ] = rutaDe( d ).map( ( m ) => m.id );
		await sembra( page, { [ tutorial ]: 1 } );
		await obreMapa( page, d );
		await nodeDe( page, id ).click();
		await expect( selector( page ) ).toBeHidden();
		await page.keyboard.press( 'Escape' );
		await expect( pausa( page ) ).toBeVisible();
		await pausa( page ).getByRole( 'button', { name: 'Surt' } ).click();
		await expect( mapa( page ) ).toBeVisible();
		await expect( nodeDe( page, id ) ).toBeFocused();
		// S'obre directament el mapa, no el port.
		await expect( barco( page, d ) ).toHaveCount( 0 );
	} );
} );

test.describe( 'Selector de missions: accessibilitat i disposició', () => {
	test( 'axe, mida dels objectius i captura (port i mapa)', async ( {
		page,
		isMobile,
	} ) => {
		if ( ! isMobile ) {
			await page.setViewportSize( { width: 1440, height: 900 } );
		}
		const nom = isMobile ? 'mobil' : '1440';
		await sembra( page, { 'tutorial-pc': 1, 'llissa-01-factura': 2 } );
		await page.goto( '/simulador/' );
		await expect( selector( page ) ).toBeVisible();
		expect( await greusAxe( page ) ).toEqual( [] );
		expect( await petitsSelector( page ) ).toEqual( [] );
		await page.screenshot( {
			path: `test-results/selector-${ nom }.png`,
			fullPage: true,
		} );

		await barco( page, 'pc' ).click();
		await expect( mapa( page ) ).toBeVisible();
		await expect( nodeDe( page, 'llissa-02-banc' ) ).toBeVisible();
		await page.waitForTimeout( 2200 ); // acaba l'entrada escalonada
		expect( await greusAxe( page ) ).toEqual( [] );
		expect( await petitsSelector( page ) ).toEqual( [] );
		if ( isMobile ) {
			expect( await petits( page ) ).toEqual( [] );
		}
		await page.screenshot( {
			path: `test-results/selector-mapa-${ nom }.png`,
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
		await barco( page, 'pc' ).click();
		await expect( mapa( page ) ).toBeVisible();
		await page.waitForTimeout( 2200 ); // acaba l'entrada escalonada
		expect( await desborda( page ) ).toBe( false );
		expect( await petitsSelector( page ) ).toEqual( [] );
	} );

	for ( const [ ample, alt ] of [
		[ 390, 844 ],
		[ 844, 390 ],
	] ) {
		test( `mòbil ${ ample }×${ alt }: port i mapa sense desbordament ni nodes tapats`, async ( {
			page,
		} ) => {
			await page.setViewportSize( { width: ample, height: alt } );
			await page.goto( '/simulador/' );
			await expect( barco( page, 'pc' ) ).toBeVisible();
			await expect( barco( page, 'mobil' ) ).toBeVisible();
			expect( await desborda( page ) ).toBe( false );
			for ( const d of [ 'mobil', 'pc' ] ) {
				await barco( page, d ).click();
				await expect( mapa( page ) ).toBeVisible();
				await page.waitForTimeout( 2200 ); // acaba l'entrada escalonada
				expect( await desborda( page ) ).toBe( false );
				const nodes = mapa( page ).locator( '[data-missio]' );
				const n = await nodes.count();
				expect( n ).toBe( 6 );
				for ( let i = 0; i < n; i++ ) {
					await nodes.nth( i ).scrollIntoViewIfNeeded();
					expect( await tapat( nodes.nth( i ) ) ).toBe( false );
				}
				await tornaAlPort( page ).click();
				await expect( barco( page, d ) ).toBeVisible();
			}
		} );
	}

	test( 'moviment reduït: res no s’anima i el mapa és visible a la primera', async ( {
		page,
	} ) => {
		await page.emulateMedia( { reducedMotion: 'reduce' } );
		await page.goto( '/simulador/' );
		const animats = () =>
			page.evaluate(
				() =>
					[
						...document.querySelectorAll(
							'.nep-port *, .nep-mapa *, .nep-sel-barco'
						),
					].filter(
						( el ) =>
							getComputedStyle( el ).animationName !== 'none'
					).length
			);
		await expect( barco( page, 'pc' ) ).toBeVisible();
		expect( await animats() ).toBe( 0 );
		expect(
			await barco( page, 'pc' ).evaluate(
				( el ) => getComputedStyle( el ).animationName
			)
		).toBe( 'none' );
		await barco( page, 'pc' ).click();
		// Sense espera: el mapa i els nodes són visibles de seguida.
		await expect( mapa( page ) ).toBeVisible( { timeout: 1000 } );
		const primer = mapa( page ).locator( '[data-missio]' ).first();
		await expect( primer ).toBeVisible( { timeout: 1000 } );
		expect(
			await primer.evaluate(
				( el ) => getComputedStyle( el ).animationName
			)
		).toBe( 'none' );
		expect( await animats() ).toBe( 0 );
		await primer.scrollIntoViewIfNeeded();
		expect( await tapat( primer ) ).toBe( false );
	} );
} );
