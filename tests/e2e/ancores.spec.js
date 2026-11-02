const { test, expect, iniciaMissio } = require( './ajudes' );

const BLOQUEIG_PC = /Clica o prem/;
const BLOQUEIG_MOBIL = /Llisca cap amunt/;

// Amb el rellotge fals, l'animationend del bloqueig no arriba.
test.use( { reducedMotion: 'reduce' } );

/**
 * Cada àncora té una caixa no nul·la (és al DOM i es veu).
 *
 * @param {import('@playwright/test').Page} page
 * @param {string[]}                        claus Valors de data-tut.
 */
async function comprovaAncores( page, claus ) {
	for ( const clau of claus ) {
		const caixa = await page
			.locator( `[data-tut="${ clau }"]:visible` )
			.first()
			.boundingBox();
		expect( caixa, `àncora ${ clau }` ).not.toBeNull();
	}
}

test.describe( 'Àncores data-tut', () => {
	test( 'PC: àncores del sistema, finestres i Parla', async ( {
		page,
		isMobile,
	} ) => {
		test.skip( isMobile, 'Només al projecte escriptori' );
		await iniciaMissio( page, /^Aprèn a jugar a l'ordinador/, BLOQUEIG_PC );
		await expect( page.locator( '[data-tut="bloqueig"]' ) ).toHaveCount(
			0
		);
		await page.getByRole( 'button', { name: BLOQUEIG_PC } ).click();
		await expect(
			page.getByRole( 'region', { name: 'Parla' } )
		).toBeVisible();
		await comprovaAncores( page, [
			'pantalla',
			'escriptori',
			'barra',
			'rellotge',
			'app-navegador',
			'app-parla',
			'finestra-navegador',
			'finestra-parla',
			'botons-finestra',
			'parla-xat',
		] );
	} );

	test( 'mòbil: bloqueig, dock, apps i barra de navegació', async ( {
		page,
		isMobile,
	} ) => {
		test.skip( ! isMobile, 'Només al projecte mòbil' );
		await iniciaMissio( page, /^Aprèn a jugar al mòbil/, BLOQUEIG_MOBIL );
		await comprovaAncores( page, [ 'bloqueig' ] );
		await page.getByRole( 'button', { name: BLOQUEIG_MOBIL } ).click();
		await expect(
			page.getByRole( 'list', { name: 'Apps preferides' } )
		).toBeVisible();
		await comprovaAncores( page, [
			'dock',
			'app-missatges',
			'app-parla-mobil',
			'nav-enrere',
			'nav-inici',
		] );
	} );
} );
