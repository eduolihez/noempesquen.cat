const { test, expect } = require( './ajudes' );
const { greusAxe } = require( './ajudes' );

const selector = ( page ) =>
	page.getByRole( 'region', { name: 'Tria una missió' } );
const barco = ( page, d ) =>
	page.getByRole( 'button', {
		name: d === 'pc' ? /Obre el Pesquer:/ : /Obre el Pirata:/,
	} );
const mapa = ( page ) => page.locator( '.nep-mapa' );
const tornaAlPort = ( page ) =>
	page.getByRole( 'button', { name: 'Torna al port' } );

const VISTES = {
	'1920×1080': [ 1920, 1080 ],
	'2560×1080': [ 2560, 1080 ],
	'1440×900': [ 1440, 900 ],
	'1280×720': [ 1280, 720 ],
	'768×1024': [ 768, 1024 ],
	'390×844': [ 390, 844 ],
	'844×390': [ 844, 390 ],
};
const nomsVistes = ( ...claus ) => claus.map( ( c ) => [ c, VISTES[ c ] ] );

async function obre( page, [ ample, alt ] ) {
	await page.setViewportSize( { width: ample, height: alt } );
	await page.goto( '/simulador/' );
	await expect( barco( page, 'pc' ) ).toBeVisible();
	await expect( barco( page, 'mobil' ) ).toBeVisible();
}

async function obreMapa( page, d ) {
	await barco( page, d ).click();
	await expect( mapa( page ) ).toBeVisible();
	await page.waitForTimeout( 2200 ); // acaba l'entrada escalonada
}

/**
 * Rect de la barra superior (cada control i el rètol) i de cada vaixell
 * (botó = casc i pals; cartell a part).
 * @param {import("@playwright/test").Page} page
 */
const geometria = ( page ) =>
	page.evaluate( () => {
		const r = ( el ) => {
			const b = el.getBoundingClientRect();
			return {
				x: b.left,
				y: b.top,
				w: b.width,
				h: b.height,
				r: b.right,
				b: b.bottom,
			};
		};
		const barres = [
			...document.querySelectorAll(
				'.nep-selector__cap > :not(.nep-selector__accions), .nep-selector__accions > *, .nep-selector__peu > *'
			),
		]
			.filter( ( el ) => {
				const b = el.getBoundingClientRect();
				return b.width > 0 && b.height > 0;
			} )
			.map( ( el ) => ( { n: el.className, ...r( el ) } ) );
		const vaixells = {};
		for ( const d of [ 'pc', 'mobil' ] ) {
			const boto = document.querySelector( `.nep-sel-barco--${ d }` );
			vaixells[ d ] = {
				boto: r( boto ),
				cartell: r( boto.querySelector( '.nep-sel-barco__cartell' ) ),
				svg: [
					...document.querySelectorAll(
						`.nep-port__barca--${ d === 'pc' ? 'pesquer' : 'pirata' }`
					),
				].map( r )[ 0 ],
			};
		}
		return {
			barres,
			vaixells,
		};
	} );

// El rect de l'SVG inclou el reflex sota la línia de flotació (Pesquer 330/420,
// Pirata 400/520): el casc visible acaba allà.
const casc = ( d, b ) => {
	const baix = b.y + b.h * ( d === 'pc' ? 330 / 420 : 400 / 520 );
	return { ...b, b: baix, h: baix - b.y };
};

const solapa = ( a, b ) => a.x < b.r && a.r > b.x && a.y < b.b && a.b > b.y;

test.describe( 'Selector a pantalla completa', () => {
	for ( const [ nom, mida ] of nomsVistes(
		'1920×1080',
		'390×844',
		'844×390'
	) ) {
		test( `ocupa tota la finestra sense scroll de pàgina a ${ nom }`, async ( {
			page,
		} ) => {
			await obre( page, mida );
			const [ w, h ] = mida;
			const rect = await selector( page ).evaluate( ( el ) => {
				const b = el.getBoundingClientRect();
				return { x: b.left, y: b.top, w: b.width, h: b.height };
			} );
			expect( Math.abs( rect.x ) ).toBeLessThanOrEqual( 1 );
			expect( Math.abs( rect.y ) ).toBeLessThanOrEqual( 1 );
			expect( Math.abs( rect.w - w ) ).toBeLessThanOrEqual( 1 );
			expect( Math.abs( rect.h - h ) ).toBeLessThanOrEqual( 1 );
			const scroll = await page.evaluate( () => {
				return {
					alt: document.documentElement.scrollHeight,
					dins: window.innerHeight,
					ample: document.documentElement.scrollWidth,
					dinsAmple: window.innerWidth,
					bloquejat:
						window.getComputedStyle( document.documentElement )
							.overflowY === 'hidden',
				};
			} );
			// La pàgina de sota pot ser més alta, però no es pot desplaçar.
			expect( scroll.alt <= scroll.dins || scroll.bloquejat ).toBe(
				true
			);
			expect( scroll.ample ).toBeLessThanOrEqual( scroll.dinsAmple );
			// També amb el mapa obert.
			await obreMapa( page, 'pc' );
			const mapaBloquejat = await page.evaluate(
				() =>
					document.documentElement.scrollHeight <=
						window.innerHeight ||
					window.getComputedStyle( document.documentElement )
						.overflowY === 'hidden'
			);
			expect( mapaBloquejat ).toBe( true );
		} );
	}

	test( '«Surt» enllaça a la portada i «Pantalla completa» demana la pantalla completa', async ( {
		page,
	} ) => {
		await page.addInitScript( () => {
			window.__fs = 0;
			window.Element.prototype.requestFullscreen = function () {
				window.__fs++;
				return Promise.resolve();
			};
		} );
		await obre( page, VISTES[ '1920×1080' ] );
		const surt = selector( page ).getByRole( 'link', { name: 'Surt' } );
		await expect( surt ).toBeVisible();
		const href = new URL( await surt.getAttribute( 'href' ), page.url() )
			.pathname;
		expect( href ).toBe( '/' );

		const completa = selector( page ).getByRole( 'button', {
			name: 'Pantalla completa',
		} );
		await expect( completa ).toBeVisible();
		await completa.click();
		await expect.poll( () => page.evaluate( () => window.__fs ) ).toBe( 1 );
	} );

	test( 'cada vaixell té mapa i capçalera propis', async ( { page } ) => {
		await obre( page, VISTES[ '1920×1080' ] );
		const dades = {};
		for ( const d of [ 'pc', 'mobil' ] ) {
			await barco( page, d ).click();
			await expect( mapa( page ) ).toBeVisible();
			dades[ d ] = {
				tema: await mapa( page ).getAttribute( 'data-tema' ),
				titol: await mapa( page )
					.getByRole( 'heading', { level: 3 } )
					.textContent(),
			};
			await tornaAlPort( page ).click();
			await expect( barco( page, d ) ).toBeVisible();
		}
		expect( dades.pc.tema ).toBe( 'carta' );
		expect( dades.mobil.tema ).toBe( 'tresor' );
		expect( dades.pc.titol ).not.toBe( dades.mobil.titol );
		expect( dades.pc.titol.trim() ).not.toBe( '' );
		expect( dades.mobil.titol.trim() ).not.toBe( '' );
	} );

	const animacionsActives = ( page ) =>
		page.evaluate( () =>
			document
				.getAnimations()
				.filter(
					( a ) =>
						a.playState === 'running' &&
						a.effect?.getComputedTiming().iterations === Infinity &&
						a.effect.target?.closest( '.nep-selector' )
				)
				.map(
					( a ) =>
						a.animationName ??
						a.effect.target.getAttribute( 'class' )
				)
		);

	test( 'la pausa atura les animacions del port i del mapa', async ( {
		page,
	} ) => {
		await obre( page, VISTES[ '1920×1080' ] );
		const pausa = page.getByRole( 'button', { name: 'Pausa animacions' } );
		expect( ( await animacionsActives( page ) ).length ).toBeGreaterThan(
			0
		);
		await pausa.click();
		await expect( pausa ).toHaveAttribute( 'aria-pressed', 'true' );
		await expect( page.locator( '.nep-selector' ) ).toHaveClass(
			/nep-sel--pausat/
		);
		expect( await animacionsActives( page ) ).toEqual( [] );
		for ( const d of [ 'pc', 'mobil' ] ) {
			await obreMapa( page, d );
			expect( await animacionsActives( page ) ).toEqual( [] );
			await tornaAlPort( page ).click();
			await expect( barco( page, d ) ).toBeVisible();
		}
		await pausa.click();
		await expect( pausa ).toHaveAttribute( 'aria-pressed', 'false' );
	} );

	test( 'amb moviment reduït cap animació infinita corre al port ni als mapes', async ( {
		page,
	} ) => {
		await page.emulateMedia( { reducedMotion: 'reduce' } );
		await obre( page, VISTES[ '1920×1080' ] );
		expect( await animacionsActives( page ) ).toEqual( [] );
		for ( const d of [ 'pc', 'mobil' ] ) {
			await obreMapa( page, d );
			expect( await animacionsActives( page ) ).toEqual( [] );
			await tornaAlPort( page ).click();
			await expect( barco( page, d ) ).toBeVisible();
		}
	} );

	for ( const [ nom, mida ] of nomsVistes(
		'1920×1080',
		'2560×1080',
		'844×390',
		'390×844'
	) ) {
		test( `cartells i cascos no solapen les barres a ${ nom }`, async ( {
			page,
		} ) => {
			await obre( page, mida );
			await page.waitForTimeout( 500 );
			const g = await geometria( page );
			const [ w, h ] = mida;
			const errors = [];
			for ( const d of [ 'pc', 'mobil' ] ) {
				const v = g.vaixells[ d ];
				for ( const [ que, rect ] of [
					[ 'cartell', v.cartell ],
					[ 'casc', casc( d, v.svg ?? v.boto ) ],
				] ) {
					for ( const b of g.barres ) {
						if ( solapa( rect, b ) ) {
							errors.push( `${ d } ${ que } × ${ b.n }` );
						}
					}
				}
				// El cartell sencer és dins de la finestra.
				const c = v.cartell;
				if ( c.x < 0 || c.r > w || c.y < 0 || c.b > h ) {
					errors.push( `${ d } cartell fora de la finestra` );
				}
			}
			expect( errors ).toEqual( [] );
		} );
	}

	for ( const [ nom, mida ] of nomsVistes( '1920×1080', '390×844' ) ) {
		test( `axe sense violacions serioses al port i als dos mapes a ${ nom }`, async ( {
			page,
		} ) => {
			await obre( page, mida );
			expect( await greusAxe( page ) ).toEqual( [] );
			for ( const d of [ 'pc', 'mobil' ] ) {
				await obreMapa( page, d );
				expect( await greusAxe( page ) ).toEqual( [] );
				await tornaAlPort( page ).click();
				await expect( barco( page, d ) ).toBeVisible();
			}
		} );
	}
} );

// Captures finals (només a mà: SHOTS=ruta npx playwright test selector-pantalla).
test.describe( 'Captures del selector', () => {
	test.skip( ! process.env.SHOTS, 'Només amb SHOTS=<carpeta>' );
	for ( const [ nom, mida ] of Object.entries( VISTES ) ) {
		test( `captura ${ nom }`, async ( { page } ) => {
			const dir = process.env.SHOTS;
			await obre( page, mida );
			await page.waitForTimeout( 1000 );
			await page.screenshot( { path: `${ dir }/port-${ nom }.png` } );
			for ( const d of [ 'pc', 'mobil' ] ) {
				await obreMapa( page, d );
				await page.screenshot( {
					path: `${ dir }/mapa-${ d }-${ nom }.png`,
				} );
				await tornaAlPort( page ).click();
				await expect( barco( page, d ) ).toBeVisible();
			}
		} );
	}
} );
