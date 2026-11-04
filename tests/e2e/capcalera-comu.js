const { test, expect } = require( '@playwright/test' );
const AxeBuilder = require( '@axe-core/playwright' ).default;
const { ruta } = require( './rutes' );

/*
 * Capçalera: logo a l'esquerra, pàgines centrades i desplegable d'idioma a la
 * dreta. Corre en les dues suites (NEP_LANG=es|ca).
 */
test.use( { viewport: { width: 1440, height: 800 } } );

module.exports = ( IDIOMA ) => {
	const ALTRE = IDIOMA === 'ca' ? 'es' : 'ca';
	test.use( { locale: IDIOMA === 'ca' ? 'ca-ES' : 'es-ES' } );
	test.describe( 'capçalera', () => {
		test.beforeEach( async ( { page } ) => {
			await page.goto( ruta( 'missions', IDIOMA ) );
		} );

		test( "tres zones: logo a l'esquerra, menú centrat, idioma a la dreta", async ( {
			page,
		} ) => {
			const caixa = ( s ) => page.locator( s ).first().boundingBox();
			const marca = await caixa( '.nep-capcalera .nep-marca' );
			const menu = await caixa( '.nep-capcalera nav.nep-menu' );
			const idioma = await caixa( '.nep-capcalera nav.nep-idioma' );
			expect( marca.x + marca.width ).toBeLessThan( menu.x );
			expect( menu.x + menu.width ).toBeLessThan( idioma.x );
			expect( menu.x + menu.width / 2 ).toBeCloseTo( 720, -1 );
			await expect(
				page.locator( '.nep-capcalera .nep-capcalera__joc' )
			).toHaveCount( 0 );
		} );

		test( "desplegable: obre, marca l'idioma actual i tanca amb Esc", async ( {
			page,
		} ) => {
			const boto = page.locator( 'nav.nep-idioma .nep-idioma__boto' );
			const enllac = page.locator(
				`nav.nep-idioma a.nep-idioma__enllac[hreflang="${ ALTRE }"]`
			);
			await expect( enllac ).toBeHidden();
			await boto.focus();
			await page.keyboard.press( 'Enter' );
			await expect( enllac ).toBeVisible();
			await expect(
				page.locator(
					`nav.nep-idioma a[hreflang="${ IDIOMA }"][aria-current="true"]`
				)
			).toHaveCount( 1 );
			const mida = await enllac.boundingBox();
			expect( mida.height ).toBeGreaterThanOrEqual( 24 );
			await page.keyboard.press( 'Escape' );
			await expect( enllac ).toBeHidden();
			await expect( boto ).toBeFocused();
		} );

		test( "desplegable: es tanca amb un clic fora i porta a l'altre idioma", async ( {
			page,
		} ) => {
			const boto = page.locator( 'nav.nep-idioma .nep-idioma__boto' );
			const enllac = page.locator(
				`nav.nep-idioma a.nep-idioma__enllac[hreflang="${ ALTRE }"]`
			);
			await boto.click();
			await expect( enllac ).toBeVisible();
			await page.locator( '.nep-capcalera .nep-marca' ).hover();
			await page.mouse.click( 700, 400 );
			await expect( enllac ).toBeHidden();
			await boto.click();
			await Promise.all( [ page.waitForURL( /.*/ ), enllac.click() ] );
			await expect( page.locator( 'html' ) ).toHaveAttribute(
				'lang',
				ALTRE === 'ca' ? 'ca' : 'es-ES'
			);
		} );

		test( 'axe amb el desplegable obert', async ( { page } ) => {
			await page.locator( 'nav.nep-idioma .nep-idioma__boto' ).click();
			const r = await new AxeBuilder( { page } )
				.include( '.nep-capcalera' )
				.analyze();
			expect(
				r.violations.filter( ( v ) =>
					[ 'serious', 'critical' ].includes( v.impact )
				)
			).toEqual( [] );
		} );

		test( 'mòbil: logo, idioma i hamburguesa sense scroll horitzontal', async ( {
			page,
		} ) => {
			await page.setViewportSize( { width: 375, height: 700 } );
			await page.goto( ruta( 'missions', IDIOMA ) );
			const ample = await page.evaluate(
				() => document.documentElement.scrollWidth
			);
			expect( ample ).toBeLessThanOrEqual( 375 );
			await expect(
				page.locator(
					'.nep-menu .wp-block-navigation__responsive-container-open'
				)
			).toBeVisible();
			await expect(
				page.locator( '.nep-capcalera .nep-capcalera__compte' )
			).toBeHidden();
		} );
	} );
};
