const { test, expect } = require( '@playwright/test' );
const AxeBuilder = require( '@axe-core/playwright' ).default;
const { ruta, PAGINES } = require( '../rutes' );

/*
 * Smoke i axe de les pàgines en castellà (arrel). Corre amb NEP_LANG=es
 * (`npm run test:e2e:es`). Locale es-ES: sense l'avís de suggeriment d'idioma.
 */
test.use( { locale: 'es-ES' } );

const CLAUS = Object.keys( PAGINES );

test.describe( 'Páginas en castellano', () => {
	test( 'el mapa tiene las 7 páginas', () => {
		expect( CLAUS ).toHaveLength( 7 );
	} );

	for ( const clau of CLAUS ) {
		test( `${ ruta( clau, 'es' ) }: 200, lang es-ES y selector a la página CA`, async ( {
			page,
		} ) => {
			const resposta = await page.goto( ruta( clau, 'es' ) );
			expect( resposta.status() ).toBe( 200 );
			await expect( page.locator( 'html' ) ).toHaveAttribute(
				'lang',
				'es-ES'
			);
			const enllac = page.locator(
				'nav.nep-idioma a.nep-idioma__enllac[hreflang="ca"]'
			);
			await expect( enllac ).toHaveCount( 1 );
			const href = new URL( await enllac.getAttribute( 'href' ) );
			expect( href.pathname ).toBe( ruta( clau, 'ca' ) );
		} );
	}
} );

/**
 * Violacions axe greus (serious / critical) de tota la pàgina.
 *
 * @param {import('@playwright/test').Page} page
 * @return {Promise<Array>} Violacions resumides.
 */
async function greus( page ) {
	const res = await new AxeBuilder( { page } )
		.withTags( [ 'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa' ] )
		.analyze();
	return res.violations
		.filter( ( v ) => [ 'serious', 'critical' ].includes( v.impact ) )
		.map( ( v ) => ( {
			id: v.id,
			targets: v.nodes.map( ( n ) => n.target.join( ' ' ) ),
		} ) );
}

test.describe( 'axe en castellano', () => {
	test( 'portada sin violaciones serias', async ( { page } ) => {
		await page.goto( ruta( 'inici', 'es' ) );
		expect( await greus( page ) ).toEqual( [] );
	} );

	test( 'simulador (selector de barcos) sin violaciones serias', async ( {
		page,
	} ) => {
		await page.goto( ruta( 'simulador', 'es' ) );
		await expect( page.locator( '.nep-sel-barco--pc' ) ).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: /Abrir el Pesquer:/ } )
		).toBeVisible();
		expect( await greus( page ) ).toEqual( [] );
	} );
} );
