/**
 * Bateria comuna de la pàgina de vídeos (galeria + pàgina filla de demostració).
 * La criden `tests/e2e/videos.spec.js` (CA, contra /ca/) i
 * `tests/e2e/es/videos.spec.js` (ES, contra l'arrel).
 *
 * Les pàgines demo (`/videos/video-demo/` i `/ca/videos/video-demo/`) les crea
 * `wp nep demo-videos` (idempotent). Si no hi són, el `beforeAll` les crea amb
 * `npm run env:cli -- wp nep demo-videos`; cal wp-env en marxa.
 *
 * Capturas: amb `NEP_SHOTS_DIR=<carpeta>` guarda galeria i filla als 4 amples.
 */
const { test, expect } = require( '@playwright/test' );
const AxeBuilder = require( '@axe-core/playwright' ).default;
const { spawnSync } = require( 'node:child_process' );
const { mkdirSync } = require( 'node:fs' );
const { ruta } = require( './rutes' );

const BASE = ( process.env.WP_BASE_URL || 'http://localhost:8888' ).replace(
	/\/+$/,
	''
);
const AMPLADES = [ 320, 768, 1024, 1280 ];
const CAPTURES = process.env.NEP_SHOTS_DIR || '';

/**
 * Camí de la pàgina filla de demostració.
 *
 * @param {string} lang `es` o `ca`.
 * @return {string} P. ex. `/ca/videos/video-demo/`.
 */
const filla = ( lang ) => `${ ruta( 'videos', lang ) }video-demo/`;

/**
 * Violacions axe greus.
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

/**
 * Assegura que les pàgines demo existeixen; si no, les crea amb WP-CLI.
 *
 * @param {import('@playwright/test').APIRequestContext} request
 */
async function asseguraDemo( request ) {
	const ok = async () =>
		( await request.get( `${ BASE }${ filla( 'es' ) }` ) ).status() ===
			200 &&
		( await request.get( `${ BASE }${ filla( 'ca' ) }` ) ).status() === 200;
	if ( await ok() ) {
		return;
	}
	spawnSync( 'npm', [ 'run', 'env:cli', '--', 'wp', 'nep', 'demo-videos' ], {
		stdio: 'inherit',
		shell: process.platform === 'win32',
	} );
	expect( await ok(), 'pàgines demo de vídeos creades' ).toBe( true );
}

/**
 * Comprova que l'element enfocat (o el seu `portador`, p. ex. la targeta que
 * dibuixa l'anell amb `:has(a:focus-visible)`) té un anell de focus mesurable.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string|null}                     portador Selector de l'ancestre amb l'anell.
 */
async function foco( page, portador = null ) {
	const r = await page.locator( ':focus' ).evaluate( ( actiu, sel ) => {
		const s = window.getComputedStyle(
			( sel && actiu.closest( sel ) ) || actiu
		);
		return {
			amplada: parseFloat( s.outlineWidth ) || 0,
			estil: s.outlineStyle,
			ombra: s.boxShadow,
		};
	}, portador );
	// `auto` és l'anell del navegador (controls natius del vídeo).
	expect(
		( r.estil !== 'none' && r.amplada >= 1 ) || r.ombra !== 'none',
		`anell de focus: ${ JSON.stringify( r ) }`
	).toBe( true );
}

/**
 * Tabula fins que `selector` té el focus (màx. 80 pulsacions).
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          selector
 */
async function tabulaFins( page, selector ) {
	for ( let i = 0; i < 80; i++ ) {
		await page.keyboard.press( 'Tab' );
		const dins =
			( await page.locator( ':focus' ).count() ) > 0 &&
			( await page
				.locator( ':focus' )
				.evaluate( ( e, sel ) => e.matches( sel ), selector ) );
		if ( dins ) {
			return;
		}
	}
	throw new Error( `Tab no arriba a ${ selector }` );
}

/**
 * Registra la bateria per a un idioma.
 *
 * @param {'es'|'ca'} lang Idioma.
 */
function bateriaVideos( lang ) {
	const altre = lang === 'es' ? 'ca' : 'es';
	const htmlLang = lang === 'es' ? 'es-ES' : 'ca';
	const galeria = ruta( 'videos', lang );
	const pare = filla( lang );

	test.use( { locale: lang === 'es' ? 'es-ES' : 'ca-ES' } );
	// Els viewports els fixa cada test: n'hi ha prou amb el projecte d'escriptori.
	test.skip(
		( { isMobile } ) => isMobile,
		'només escriptori (els amples es fixen als tests)'
	);

	test.beforeAll( async ( { request } ) => {
		await asseguraDemo( request );
	} );

	const hreflangs = ( page ) =>
		page.evaluate( () =>
			Object.fromEntries(
				[
					...document.querySelectorAll(
						'link[rel="alternate"][hreflang]'
					),
				].map( ( l ) => [
					l.getAttribute( 'hreflang' ),
					new URL( l.href ).pathname,
				] )
			)
		);

	test.describe( `Vídeos (${ lang }): galeria`, () => {
		test( 'metadades, h1, targeta i hreflang recíproc', async ( {
			page,
		} ) => {
			const r = await page.goto( galeria );
			expect( r.status() ).toBe( 200 );
			await expect( page.locator( 'html' ) ).toHaveAttribute(
				'lang',
				htmlLang
			);
			await expect( page.locator( 'h1' ) ).toHaveCount( 1 );
			const targeta = page.locator( '.nep-targeta-video' ).first();
			await expect( targeta ).toBeVisible();
			const href = await targeta
				.locator( 'a[href$="/video-demo/"]' )
				.getAttribute( 'href' );
			expect( new URL( href ).pathname ).toBe( pare );
			const canonical = await page
				.locator( 'link[rel="canonical"]' )
				.getAttribute( 'href' );
			expect( new URL( canonical ).pathname ).toBe( galeria );
			const h = await hreflangs( page );
			expect( h ).toEqual( {
				es: ruta( 'videos', 'es' ),
				ca: ruta( 'videos', 'ca' ),
				'x-default': ruta( 'videos', 'es' ),
			} );
			// Recíproc: la parella declara el mateix conjunt.
			await page.goto( ruta( 'videos', altre ) );
			expect( await hreflangs( page ) ).toEqual( h );
		} );

		test( 'la targeta s’assoleix amb Tab i té focus visible', async ( {
			page,
		} ) => {
			await page.goto( galeria );
			await tabulaFins( page, '.nep-targeta-video a' );
			await foco( page, '.nep-targeta-video' );
		} );
	} );

	test.describe( `Vídeos (${ lang }): pàgina filla`, () => {
		test( 'estructura, pistes, transcripció i enllaços', async ( {
			page,
		} ) => {
			const r = await page.goto( pare );
			expect( r.status() ).toBe( 200 );
			await expect( page.locator( 'html' ) ).toHaveAttribute(
				'lang',
				htmlLang
			);
			await expect( page.locator( 'h1' ) ).toHaveCount( 1 );
			const video = page.locator( 'video[controls]' );
			await expect( video ).toHaveCount( 1 );
			await expect( video.locator( 'track' ) ).toHaveCount( 2 );
			const defecte = video.locator( 'track[default]' );
			await expect( defecte ).toHaveCount( 1 );
			await expect( defecte ).toHaveAttribute( 'srclang', lang );

			const det = page.locator( 'details.nep-video__transcripcio' );
			await expect( det ).toBeVisible();
			await expect( det ).toHaveJSProperty( 'open', false );
			await det.locator( 'summary' ).focus();
			await page.keyboard.press( 'Enter' );
			await expect( det ).toHaveJSProperty( 'open', true );
			await expect( det.locator( '.nep-video__text' ) ).toBeVisible();
			await page.keyboard.press( 'Enter' );
			await expect( det ).toHaveJSProperty( 'open', false );

			await expect(
				page.locator(
					`.nep-video__missio a[href$="${ ruta( 'simulador', lang ) }"]`
				)
			).toHaveCount( 1 );

			const canonical = await page
				.locator( 'link[rel="canonical"]' )
				.getAttribute( 'href' );
			expect( new URL( canonical ).pathname ).toBe( pare );
			expect( await hreflangs( page ) ).toEqual( {
				es: filla( 'es' ),
				ca: filla( 'ca' ),
				'x-default': filla( 'es' ),
			} );

			const sel = page.locator(
				`nav.nep-idioma a.nep-idioma__enllac[hreflang="${ altre }"]`
			);
			await expect( sel ).toHaveCount( 1 );
			expect( new URL( await sel.getAttribute( 'href' ) ).pathname ).toBe(
				filla( altre )
			);
		} );

		test( 'teclat: vídeo i transcripció amb focus visible', async ( {
			page,
		} ) => {
			await page.goto( pare );
			await tabulaFins( page, 'video' );
			await foco( page );
			await tabulaFins( page, 'details.nep-video__transcripcio summary' );
			await foco( page );
		} );

		test( 'sense tercers ni galetes', async ( { page, context } ) => {
			const origen = new URL( BASE ).origin;
			const externes = [];
			page.on( 'request', ( req ) => {
				const u = new URL( req.url() );
				if (
					! [ 'data:', 'blob:', 'about:' ].includes( u.protocol ) &&
					u.origin !== origen
				) {
					externes.push( req.url() );
				}
			} );
			for ( const url of [ galeria, pare ] ) {
				await page.goto( url, { waitUntil: 'networkidle' } );
			}
			expect( externes ).toEqual( [] );
			expect( await context.cookies() ).toEqual( [] );
		} );
	} );

	test.describe( `Vídeos (${ lang }): accessibilitat`, () => {
		for ( const [ nom, url ] of [
			[ 'galeria', galeria ],
			[ 'filla', pare ],
		] ) {
			test( `axe sense violacions greus (${ nom })`, async ( {
				page,
			} ) => {
				await page.goto( url );
				expect( await greus( page ) ).toEqual( [] );
			} );
		}

		test( 'prefers-reduced-motion: sense transicions ni animacions', async ( {
			page,
		} ) => {
			await page.emulateMedia( { reducedMotion: 'reduce' } );
			for ( const url of [ galeria, pare ] ) {
				await page.goto( url );
				const mogudes = await page.evaluate( () =>
					[
						...document.querySelectorAll(
							'.nep-targeta-video, .nep-targeta-video *, .nep-video, .nep-video *'
						),
					]
						.filter( ( e ) => {
							const s = window.getComputedStyle( e );
							const llarg = ( v ) =>
								v
									.split( ',' )
									.some( ( d ) => parseFloat( d ) > 0 );
							return (
								llarg( s.transitionDuration ) ||
								( s.animationName !== 'none' &&
									llarg( s.animationDuration ) )
							);
						} )
						.map( ( e ) => String( e.className || e.tagName ) )
				);
				expect( mogudes ).toEqual( [] );
			}
		} );
	} );

	test.describe( `Vídeos (${ lang }): responsive`, () => {
		for ( const amplada of AMPLADES ) {
			test( `${ amplada }px: sense scroll horitzontal i vídeo dins del contenidor`, async ( {
				page,
			} ) => {
				await page.setViewportSize( { width: amplada, height: 900 } );
				for ( const [ nom, url ] of [
					[ 'galeria', galeria ],
					[ 'filla', pare ],
				] ) {
					await page.goto( url );
					const m = await page.evaluate( () => ( {
						sw: document.documentElement.scrollWidth,
						iw: window.innerWidth,
					} ) );
					expect( m.sw, `${ nom } scrollWidth` ).toBeLessThanOrEqual(
						m.iw
					);
					if ( nom === 'filla' ) {
						const dins = await page.evaluate( () => {
							const v = document
								.querySelector( 'video' )
								.getBoundingClientRect();
							const c = document
								.querySelector( '.nep-video__marc' )
								.getBoundingClientRect();
							return (
								v.left >= c.left - 0.5 &&
								v.right <= c.right + 0.5
							);
						} );
						expect( dins ).toBe( true );
					}
					if ( CAPTURES ) {
						mkdirSync( CAPTURES, { recursive: true } );
						await page.screenshot( {
							path: `${ CAPTURES }/${ lang }-${ nom }-${ amplada }.png`,
							fullPage: true,
						} );
					}
				}
			} );
		}
	} );
}

module.exports = { bateriaVideos };
