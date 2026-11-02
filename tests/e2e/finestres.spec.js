const { test, expect } = require( './ajudes' );
const { iniciaMissio } = require( './ajudes' );

const BLOQUEIG_PC = /Clica o prem/;
const TUTORIAL_PC = "Aprèn a jugar a l'ordinador";

// Amb el rellotge fals, l'animationend del bloqueig no arriba.
test.use( { reducedMotion: 'reduce' } );

const finestra = ( page, nom ) =>
	page.locator( '.nep-so-finestra' ).filter( {
		has: page.locator( '.nep-so-finestra__titol', { hasText: nom } ),
	} );

const caixa = async ( loc ) => {
	const b = await loc.boundingBox();
	return b;
};
const solapament = ( a, b ) =>
	Math.max(
		0,
		Math.min( a.x + a.width, b.x + b.width ) - Math.max( a.x, b.x )
	);

async function arrenca( page ) {
	await iniciaMissio( page, new RegExp( `^${ TUTORIAL_PC }` ), BLOQUEIG_PC );
	await page.getByRole( 'button', { name: BLOQUEIG_PC } ).click();
	await expect( finestra( page, 'Parla' ) ).toBeVisible();
	await expect( finestra( page, 'Navegador' ) ).toBeVisible();
}

test.describe( 'finestres del PC', () => {
	test.beforeEach( ( { isMobile } ) => {
		test.skip( isMobile, 'Només a l’escriptori' );
	} );

	for ( const mida of [
		{ width: 1280, height: 720 },
		{ width: 1024, height: 768 },
	] ) {
		test( `Navegador i Parla no se solapen a ${ mida.width }x${ mida.height }`, async ( {
			page,
		} ) => {
			await page.setViewportSize( mida );
			await arrenca( page );
			const n = await caixa( finestra( page, 'Navegador' ) );
			const p = await caixa( finestra( page, 'Parla' ) );
			const escala = await page.evaluate(
				() =>
					document
						.querySelector( '.nep-so-pc__finestres' )
						.getBoundingClientRect().width /
					document.querySelector( '.nep-so-pc__finestres' )
						.clientWidth
			);
			expect( solapament( n, p ) / escala ).toBeLessThanOrEqual( 4 );
			expect( n.x ).toBeLessThan( p.x );
			expect( p.width / escala ).toBeGreaterThanOrEqual( 419 );
		} );
	}

	test( 'una finestra moguda no es recoloca en obrir/tancar l’altra', async ( {
		page,
	} ) => {
		await page.setViewportSize( { width: 1280, height: 720 } );
		await arrenca( page );
		const nav = finestra( page, 'Navegador' );
		const barra = nav.locator( '.nep-so-finestra__barra' );
		const b = await caixa( barra );
		await page.mouse.move( b.x + 200, b.y + 10 );
		await page.mouse.down();
		await page.mouse.move( b.x + 230, b.y + 40, { steps: 5 } );
		await page.mouse.up();
		const abans = await caixa( nav );
		await finestra( page, 'Parla' )
			.getByRole( 'button', { name: 'Tanca' } )
			.click();
		await expect( finestra( page, 'Parla' ) ).toHaveCount( 0 );
		await page
			.getByRole( 'navigation', { name: 'Barra de tasques' } )
			.getByRole( 'button', { name: /Parla/ } )
			.click();
		await expect( finestra( page, 'Parla' ) ).toBeVisible();
		expect( await caixa( nav ) ).toEqual( abans );
	} );
} );
