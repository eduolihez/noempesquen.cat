const { test, expect } = require( './ajudes' );
const { iniciaMissio } = require( './ajudes' );

const BLOQUEIG_PC = /Clica o prem/;
const TUTORIAL_PC = "Aprèn a jugar a l'ordinador";
// Mides lògiques de l'àrea de finestres (vegeu _pc.scss).
const AREA_LOGICA = { amplada: 1280, alcada: 672 };

// Amb el rellotge fals, l'animationend del bloqueig no arriba.
test.use( { reducedMotion: 'reduce' } );

const finestra = ( page, nom ) =>
	page.locator( '.nep-so-finestra' ).filter( {
		has: page.locator( '.nep-so-finestra__titol', { hasText: nom } ),
	} );
const area = ( page ) => page.locator( '.nep-so-pc__finestres' ).boundingBox();

/**
 * Caixa de la finestra en proporcions de l'àrea (independent de l'escala).
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          nom  Títol.
 * @return {Promise<{x:number,y:number,w:number,h:number}>} Proporcions 0..1.
 */
async function proporcions( page, nom ) {
	const [ a, b ] = await Promise.all( [
		area( page ),
		finestra( page, nom ).boundingBox(),
	] );
	return {
		x: ( b.x - a.x ) / a.width,
		y: ( b.y - a.y ) / a.height,
		w: b.width / a.width,
		h: b.height / a.height,
	};
}

async function arrenca( page ) {
	await iniciaMissio( page, new RegExp( `^${ TUTORIAL_PC }` ), BLOQUEIG_PC );
	await page.getByRole( 'button', { name: BLOQUEIG_PC } ).click();
	await expect( finestra( page, 'Parla' ) ).toBeVisible();
	await expect( finestra( page, 'Navegador' ) ).toBeVisible();
}

// Les dues, sense solapar (0 px, no per marge) i dins de l'àrea.
async function comprovaRepartides( page ) {
	const n = await proporcions( page, 'Navegador' );
	const p = await proporcions( page, 'Parla' );
	const eps = 0.001;
	expect( n.x ).toBeGreaterThanOrEqual( -eps );
	expect( n.x + n.w ).toBeLessThanOrEqual( p.x + eps );
	expect( p.x + p.w ).toBeLessThanOrEqual( 1 + eps );
	for ( const c of [ n, p ] ) {
		expect( c.y ).toBeGreaterThanOrEqual( -eps );
		expect( c.y + c.h ).toBeLessThanOrEqual( 1 + eps );
	}
	return { n, p };
}

test.describe( 'finestres del PC', () => {
	test.beforeEach( async ( { page } ) => {
		const mida = page.viewportSize();
		test.skip(
			mida.height > mida.width,
			'Només PC (escriptori o horitzontal)'
		);
	} );

	for ( const mida of [
		{ width: 1280, height: 720 },
		{ width: 1024, height: 768 },
	] ) {
		test( `Navegador i Parla no se solapen a ${ mida.width }x${ mida.height }, Parla ≥ 420 px lògics`, async ( {
			page,
			isMobile,
		} ) => {
			test.skip(
				isMobile,
				'El mòbil horitzontal té la seva pròpia mida'
			);
			await page.setViewportSize( mida );
			await arrenca( page );
			const { n, p } = await comprovaRepartides( page );
			expect( p.w * AREA_LOGICA.amplada ).toBeGreaterThanOrEqual( 419 );
			expect( p.w ).toBeLessThan( n.w );
		} );
	}

	test( 'al mòbil horitzontal (PC escalat) no se solapen i Parla ≥ 420 px lògics', async ( {
		page,
		isMobile,
	} ) => {
		test.skip( ! isMobile, 'Només mòbil horitzontal' );
		await arrenca( page );
		const { n, p } = await comprovaRepartides( page );
		expect( p.w * AREA_LOGICA.amplada ).toBeGreaterThanOrEqual( 419 );
		expect( p.w ).toBeLessThan( n.w );
	} );

	test( 'una finestra moguda no es recoloca; Parla reoberta no la solapa', async ( {
		page,
	} ) => {
		await arrenca( page );
		const nav = finestra( page, 'Navegador' );
		const b = await nav.locator( '.nep-so-finestra__barra' ).boundingBox();
		await page.mouse.move( b.x + 200, b.y + 10 );
		await page.mouse.down();
		await page.mouse.move( b.x + 215, b.y + 20, { steps: 5 } );
		await page.mouse.up();
		const abans = await nav.boundingBox();
		await finestra( page, 'Parla' )
			.getByRole( 'button', { name: 'Tanca' } )
			.click();
		await expect( finestra( page, 'Parla' ) ).toHaveCount( 0 );
		await page
			.getByRole( 'navigation', { name: 'Barra de tasques' } )
			.getByRole( 'button', { name: /Parla/ } )
			.click();
		await expect( finestra( page, 'Parla' ) ).toBeVisible();
		const despres = await nav.boundingBox();
		for ( const k of [ 'x', 'y', 'width', 'height' ] ) {
			expect( Math.abs( despres[ k ] - abans[ k ] ) ).toBeLessThan( 1 );
		}
		const p = await finestra( page, 'Parla' ).boundingBox();
		const a = await area( page );
		// Dins l'àrea i a la dreta del Navegador, sense tocar-lo.
		expect( p.x ).toBeGreaterThanOrEqual( abans.x + abans.width );
		expect( p.x + p.width ).toBeLessThanOrEqual( a.x + a.width + 1 );
		expect( p.y ).toBeGreaterThanOrEqual( a.y - 1 );
		expect( p.y + p.height ).toBeLessThanOrEqual( a.y + a.height + 1 );
	} );

	test( 'en tancar Parla, el Navegador torna a la mida de finestra sola', async ( {
		page,
	} ) => {
		await arrenca( page );
		const repartit = await proporcions( page, 'Navegador' );
		await finestra( page, 'Parla' )
			.getByRole( 'button', { name: 'Tanca' } )
			.click();
		await expect( finestra( page, 'Parla' ) ).toHaveCount( 0 );
		const sola = await proporcions( page, 'Navegador' );
		expect( sola.w ).toBeGreaterThan( repartit.w + 0.1 );
		expect( sola.w * AREA_LOGICA.amplada ).toBeCloseTo( 1120, -1 );
		expect( sola.x * AREA_LOGICA.amplada ).toBeCloseTo( 80, -1 );
	} );

	test( 'restaurar Parla minimitzada no solapa el Navegador', async ( {
		page,
	} ) => {
		await arrenca( page );
		await finestra( page, 'Parla' )
			.getByRole( 'button', { name: 'Minimitza' } )
			.click();
		const barra = page.getByRole( 'navigation', {
			name: 'Barra de tasques',
		} );
		await barra.getByRole( 'button', { name: /Parla/ } ).click();
		await expect( finestra( page, 'Parla' ) ).not.toHaveClass(
			/is-minimitzada/
		);
		await comprovaRepartides( page );
	} );
} );
