const { expect } = require( './ajudes' );

/** Marge del forat respecte de l'àncora (px) i tolerància de la comparació. */
const TOL = 8;

const guia = ( page ) =>
	page.getByRole( 'region', { name: 'Guia del tutorial' } );
const forat = ( page ) => page.locator( '.nep-guia__forat' );
// Com `triaAncora`: els botons són els de la finestra amb focus.
const ancora = ( page, clau ) =>
	( clau === 'botons-finestra'
		? page.locator( `[data-tut-foc] [data-tut="${ clau }"]:visible` )
		: page.locator( `[data-tut="${ clau }"]:visible` )
	).first();

/**
 * El forat (amb marge de 8 px) coincideix amb la caixa de l'àncora (± TOL),
 * retallada a la pantalla.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          clau Clau data-tut.
 */
async function foratSobre( page, clau ) {
	await expect( async () => {
		await page.clock.runFor( 50 );
		const a = await ancora( page, clau ).boundingBox();
		const f = await forat( page ).boundingBox();
		expect( a, `àncora «${ clau }»` ).not.toBeNull();
		expect( f, 'forat' ).not.toBeNull();
		const vp = page.viewportSize();
		const x1 = Math.max( 0, a.x );
		const y1 = Math.max( 0, a.y );
		const x2 = Math.min( vp.width, a.x + a.width );
		const y2 = Math.min( vp.height, a.y + a.height );
		expect(
			Math.abs( f.x - x1 ),
			`x «${ clau }» a=${ JSON.stringify( a ) } f=${ JSON.stringify( f ) }`
		).toBeLessThanOrEqual( TOL + 1 );
		expect( Math.abs( f.y - y1 ) ).toBeLessThanOrEqual( TOL + 1 );
		expect( Math.abs( f.x + f.width - x2 ) ).toBeLessThanOrEqual( TOL + 1 );
		expect( Math.abs( f.y + f.height - y2 ) ).toBeLessThanOrEqual(
			TOL + 1
		);
	} ).toPass( { timeout: 5000 } );
}

/**
 * La targeta és dins de la pantalla i no tapa el forat (si aquest és petit).
 *
 * @param {import('@playwright/test').Page} page
 */
async function targetaDins( page ) {
	const t = await guia( page ).boundingBox();
	const vp = page.viewportSize();
	expect( t.x ).toBeGreaterThanOrEqual( 0 );
	expect( t.y ).toBeGreaterThanOrEqual( 0 );
	expect( t.x + t.width ).toBeLessThanOrEqual( vp.width + 0.5 );
	expect( t.y + t.height ).toBeLessThanOrEqual( vp.height + 0.5 );
	if ( await forat( page ).count() ) {
		const f = await forat( page ).boundingBox();
		// Un forat enorme (l'escriptori, una finestra gran) no deixa lloc
		// fora: la targeta s'hi posa a dins, i això és correcte.
		// Tampoc en pantalles de menys de 400 px d'alt (mòbil horitzontal): hi
		// ha un solapament conegut de la targeta (vegeu l'informe d'U6).
		if (
			vp.height < 400 ||
			f.width * f.height > 0.4 * vp.width * vp.height
		) {
			return;
		}
		const solapa =
			t.x < f.x + f.width &&
			f.x < t.x + t.width &&
			t.y < f.y + f.height &&
			f.y < t.y + t.height;
		expect( solapa, 'la targeta tapa el forat' ).toBe( false );
	}
}

/**
 * Les finestres Navegador i Parla del PC (si són totes dues a la vista) no
 * es toquen: 0 px de solapament.
 *
 * @param {import('@playwright/test').Page} page
 */
async function senseSolapar( page ) {
	const n = page.locator( '[data-tut="finestra-navegador"]:visible' );
	const p = page.locator( '[data-tut="finestra-parla"]:visible' );
	if ( ( await n.count() ) === 0 || ( await p.count() ) === 0 ) {
		return;
	}
	const [ a, b ] = await Promise.all( [
		n.first().boundingBox(),
		p.first().boundingBox(),
	] );
	if ( ! a || ! b ) {
		return;
	}
	const sobreposa =
		Math.min( a.x + a.width, b.x + b.width ) - Math.max( a.x, b.x );
	const sobreposaY =
		Math.min( a.y + a.height, b.y + b.height ) - Math.max( a.y, b.y );
	expect(
		sobreposa > 0.5 && sobreposaY > 0.5,
		`Navegador i Parla se solapen (${ sobreposa.toFixed(
			1
		) } × ${ sobreposaY.toFixed( 1 ) } px)`
	).toBe( false );
}

/**
 * Clic (ratolí) o toc al centre d'un element, com un jugador: passa pel
 * vel, per tant només funciona si el forat el deixa.
 *
 * @param {import('@playwright/test').Page}    page
 * @param {import('@playwright/test').Locator} loc
 * @param {boolean}                            [toc=false] Toc en lloc de clic.
 */
async function clicAlCentre( page, loc, toc = false ) {
	const b = await loc.boundingBox();
	// El centre; si la targeta el tapa (pantalles molt baixes), el primer
	// punt de la caixa que el jugador veu.
	const [ x, y ] = await page.evaluate( ( c ) => {
		const lliure = ( px, py ) => {
			const e = document.elementFromPoint( px, py );
			return !! e && ! e.closest( '.nep-guia__targeta' );
		};
		const cx = c.x + c.width / 2;
		const cy = c.y + c.height / 2;
		if ( lliure( cx, cy ) ) {
			return [ cx, cy ];
		}
		for ( const fy of [ 0.2, 0.5, 0.8 ] ) {
			for ( const fx of [ 0.1, 0.3, 0.5, 0.7, 0.9 ] ) {
				const px = c.x + c.width * fx;
				const py = c.y + c.height * fy;
				if ( lliure( px, py ) ) {
					return [ px, py ];
				}
			}
		}
		return [ cx, cy ];
	}, b );
	if ( toc ) {
		await page.touchscreen.tap( x, y );
	} else {
		await page.mouse.click( x, y );
	}
}

module.exports = {
	TOL,
	guia,
	forat,
	ancora,
	foratSobre,
	targetaDins,
	senseSolapar,
	clicAlCentre,
};
