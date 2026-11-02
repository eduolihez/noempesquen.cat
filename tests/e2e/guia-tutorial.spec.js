const {
	test,
	expect,
	iniciaMissio,
	greusAxe,
	greusAxePc,
	senseFullscreen,
	esHoritzontal,
} = require( './ajudes' );
const { guiaPc, guiaMobil } = require( './missions-guia' );

const BLOQUEIG_PC = /Clica o prem/;
const BLOQUEIG_MOBIL = /Llisca cap amunt/;
const TOL = 8;

// Amb el rellotge fals, l'animationend del bloqueig no arriba.
test.use( { reducedMotion: 'reduce' } );

/**
 * Serveix una missió de prova com a remota (substitueix la inclosa pel
 * mateix id); cap mecanisme nou de producció.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object}                          missio Guió.
 */
const serveix = ( page, missio ) =>
	page.route(
		( url ) => url.href.includes( 'noempesquen/v1/missions' ),
		( route ) => route.fulfill( { json: [ { guio: missio } ] } )
	);

const guia = ( page ) =>
	page.getByRole( 'region', { name: 'Guia del tutorial' } );
const forat = ( page ) => page.locator( '.nep-guia__forat' );
const ancora = ( page, clau ) =>
	page.locator( `[data-tut="${ clau }"]:visible` ).first();

/**
 * El forat (amb marge de 8 px) coincideix amb l'àncora (± TOL).
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          clau Clau data-tut.
 */
async function foratSobre( page, clau ) {
	await expect( async () => {
		const a = await ancora( page, clau ).boundingBox();
		const f = await forat( page ).boundingBox();
		expect( a ).not.toBeNull();
		expect( f ).not.toBeNull();
		const vp = page.viewportSize();
		// Retallat a la pantalla: compara amb l'àncora també retallada.
		const x1 = Math.max( 0, a.x );
		const y1 = Math.max( 0, a.y );
		const x2 = Math.min( vp.width, a.x + a.width );
		const y2 = Math.min( vp.height, a.y + a.height );
		expect( Math.abs( f.x - x1 ) ).toBeLessThanOrEqual( TOL + 1 );
		expect( Math.abs( f.y - y1 ) ).toBeLessThanOrEqual( TOL + 1 );
		expect( Math.abs( f.x + f.width - x2 ) ).toBeLessThanOrEqual( TOL + 1 );
		expect( Math.abs( f.y + f.height - y2 ) ).toBeLessThanOrEqual(
			TOL + 1
		);
	} ).toPass( { timeout: 5000 } );
}

/**
 * La targeta és dins de la pantalla i no tapa el forat.
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
		const solapa =
			t.x < f.x + f.width &&
			f.x < t.x + t.width &&
			t.y < f.y + f.height &&
			f.y < t.y + t.height;
		expect( solapa, 'la targeta tapa el forat' ).toBe( false );
	}
}

/**
 * Cert si el focus és dins de l'àncora o de la targeta (mai a <body>).
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          clau Clau data-tut.
 * @return {Promise<boolean>} Cert si és dins.
 */
const focusDins = ( page, clau ) =>
	page.evaluate( ( c ) => {
		const a = document.body.ownerDocument.activeElement;
		return !! (
			a?.closest( `[data-tut="${ c }"]` ) ||
			a?.closest( '.nep-guia__targeta' )
		);
	}, clau );

/**
 * Clic real (ratolí) al centre d'un element.
 *
 * @param {import('@playwright/test').Page}    page
 * @param {import('@playwright/test').Locator} loc
 */
async function clicAlCentre( page, loc ) {
	const b = await loc.boundingBox();
	await page.mouse.click( b.x + b.width / 2, b.y + b.height / 2 );
}

/**
 * Obre la missió PC de prova i desbloqueja.
 *
 * @param {import('@playwright/test').Page} page
 */
async function entraPc( page ) {
	await senseFullscreen( page );
	await serveix( page, guiaPc() );
	await iniciaMissio( page, /^Aprèn a jugar a l'ordinador/, BLOQUEIG_PC );
	await page.getByRole( 'button', { name: BLOQUEIG_PC } ).click();
	await expect( guia( page ) ).toBeVisible();
}

/**
 * Recorregut sencer dels tres passos de la missió PC de prova.
 *
 * @param {import('@playwright/test').Page}     page
 * @param {boolean}                             escalat Cert al mòbil horitzontal (PC escalat).
 * @param {import('@playwright/test').TestInfo} info
 */
async function fluxPc( page, escalat, info ) {
	const isMobile = escalat;
	const g = guia( page );
	// Pas 0: explicació centrada, sense forat, focus a «Entès».
	await expect( g ).toContainText( 'Pas 1 de 3' );
	await expect( g ).toContainText( 'Benvingut' );
	await expect( forat( page ) ).toHaveCount( 0 );
	const entes = g.getByRole( 'button', { name: 'Entès' } );
	await expect( entes ).toBeFocused();
	await expect( page.locator( '.nep-so__sistema' ) ).toHaveAttribute(
		'inert',
		''
	);
	// Zona live: comptador + títol + text (s'omple després de muntar).
	await expect( page.locator( '.nep-guia__anunci' ) ).toHaveAttribute(
		'aria-live',
		'polite'
	);
	await expect( page.locator( '.nep-guia__anunci' ) ).toHaveText(
		/^Pas 1 de 3\. Benvingut\./
	);
	expect(
		await ( isMobile ? greusAxePc( page ) : greusAxe( page ) )
	).toEqual( [] );
	if ( ! isMobile ) {
		await page.screenshot( {
			path: info.outputPath( 'guia-pc-pas1.png' ),
		} );
	}
	await entes.click();

	// Pas 1: acció sobre la icona del Navegador.
	await expect( g ).toContainText( 'Pas 2 de 3' );
	await expect( page.locator( '.nep-guia__anunci' ) ).toHaveText(
		/^Pas 2 de 3\. Obre el Navegador\./
	);
	// El focus no cau a <body>: va a l'àncora (o a la targeta).
	expect( await focusDins( page, 'app-navegador' ) ).toBe( true );
	await expect( g.getByRole( 'button', { name: 'Entès' } ) ).toHaveCount( 0 );
	await expect(
		g.getByRole( 'button', { name: 'Salta el tutorial' } )
	).toBeVisible();
	await foratSobre( page, 'app-navegador' );
	await targetaDins( page );
	await expect( page.locator( '.nep-so__sistema' ) ).not.toHaveAttribute(
		'inert',
		''
	);
	expect(
		await ( isMobile ? greusAxePc( page ) : greusAxe( page ) )
	).toEqual( [] );
	if ( ! isMobile ) {
		await page.screenshot( {
			path: info.outputPath( 'guia-pc-pas2.png' ),
		} );
	}

	// Clic fora del forat (icona de Parla, sota un panell del vel): no passa res.
	const parla = ancora( page, 'app-parla' );
	const etiqueta = await parla.getAttribute( 'aria-label' );
	const caixa = await parla.boundingBox();
	expect(
		await page.evaluate(
			( [ x, y ] ) => document.elementFromPoint( x, y )?.className ?? '',
			[ caixa.x + caixa.width / 2, caixa.y + caixa.height / 2 ]
		)
	).toContain( 'nep-guia__vel' );
	await clicAlCentre( page, parla );
	await expect( g ).toContainText( 'Pas 2 de 3' );
	await expect( parla ).toHaveAttribute( 'aria-label', etiqueta );

	// Tab no surt del forat i la targeta.
	for ( let i = 0; i < 4; i++ ) {
		await page.keyboard.press( 'Tab' );
		expect(
			await focusDins( page, 'app-navegador' ),
			`Tab ${ i + 1 }`
		).toBe( true );
	}

	// Perquè el clic a la icona obri el Navegador, cal que estigui tancat:
	// el jugador no pot tancar-lo amb el vel, ho fem per programa.
	await page.evaluate( () =>
		document
			.querySelector(
				'[data-tut="finestra-navegador"] button[aria-label="Tanca"]'
			)
			.click()
	);
	await expect(
		page.locator( '[data-tut="finestra-navegador"]' )
	).toHaveCount( 0 );
	// Clic al forat: funciona i avança.
	await clicAlCentre( page, ancora( page, 'app-navegador' ) );
	await expect( g ).toContainText( 'Pas 3 de 3' );
	await expect(
		page.locator( '[data-tut="finestra-navegador"]' )
	).toHaveCount( 1 );

	// Pas 2: explicació sobre la barra; el forat també és bloquejat.
	await foratSobre( page, 'barra' );
	await targetaDins( page );
	await expect( g.getByRole( 'button', { name: 'Entès' } ) ).toBeFocused();
	await expect( page.locator( '.nep-guia__tapa' ) ).toHaveCount( 1 );
	expect(
		await ( isMobile ? greusAxePc( page ) : greusAxe( page ) )
	).toEqual( [] );
	const etiquetaParla = await parla.getAttribute( 'aria-label' );
	await clicAlCentre( page, parla );
	await expect( parla ).toHaveAttribute( 'aria-label', etiquetaParla );

	// Reposicionat en canviar la mida de la finestra.
	const vp = page.viewportSize();
	await page.setViewportSize( {
		width: Math.round( vp.width * 0.8 ),
		height: Math.round( vp.height * 0.85 ),
	} );
	await page.clock.runFor( 200 );
	await foratSobre( page, 'barra' );
	await targetaDins( page );
	await page.setViewportSize( vp );
	await page.clock.runFor( 200 );
	await foratSobre( page, 'barra' );

	// «Entès» a l'últim pas: s'acaba i la missió es pot jugar.
	await g.getByRole( 'button', { name: 'Entès' } ).click();
	await expect( g ).toHaveCount( 0 );
	await expect( page.locator( '.nep-guia' ) ).toHaveCount( 0 );
	await expect( page.locator( '.nep-so__sistema' ) ).not.toHaveAttribute(
		'inert',
		''
	);
	await parla.click();
	await expect( parla ).not.toHaveAttribute( 'aria-label', etiquetaParla );
}

test.describe( 'Overlay del tutorial (PC)', () => {
	test.beforeEach( async ( { page, isMobile } ) => {
		test.skip(
			isMobile && ! esHoritzontal( page ),
			'PC: escriptori o mòbil horitzontal (PC escalat)'
		);
		await entraPc( page );
	} );

	test( 'passos: explicació, acció, aïllament i reposicionat', async ( {
		page,
		isMobile,
	}, info ) => {
		await fluxPc( page, isMobile, info );
		if ( isMobile ) {
			await page.screenshot( {
				path: info.outputPath( 'guia-horitzontal-final.png' ),
			} );
		}
	} );

	test( 'reposicionat en canviar el viewport en un pas d’acció', async ( {
		page,
		isMobile,
	} ) => {
		test.skip( isMobile, 'Només a escriptori' );
		// Al pas d'acció, el forat segueix la icona quan canvia el viewport.
		await guia( page ).getByRole( 'button', { name: 'Entès' } ).click();
		await foratSobre( page, 'app-navegador' );
		const abans = await forat( page ).boundingBox();
		await page.setViewportSize( { width: 1100, height: 680 } );
		await page.clock.runFor( 200 );
		await foratSobre( page, 'app-navegador' );
		const despres = await forat( page ).boundingBox();
		expect( despres.y ).not.toBe( abans.y );
	} );

	test( '«Salta el tutorial» tanca la guia i deixa jugar', async ( {
		page,
	} ) => {
		await guia( page )
			.getByRole( 'button', { name: 'Salta el tutorial' } )
			.click();
		await expect( guia( page ) ).toHaveCount( 0 );
		await expect( page.locator( '.nep-so__sistema' ) ).not.toHaveAttribute(
			'inert',
			''
		);
		const parla = ancora( page, 'app-parla' );
		const etiqueta = await parla.getAttribute( 'aria-label' );
		await parla.click();
		await expect( parla ).not.toHaveAttribute( 'aria-label', etiqueta );
	} );

	test( 'Esc obre la pausa i la guia torna en continuar', async ( {
		page,
	} ) => {
		await page.keyboard.press( 'Escape' );
		await expect(
			page.getByRole( 'dialog', { name: 'Pausa' } )
		).toBeVisible();
		await expect( guia( page ) ).toHaveCount( 0 );
		await page.getByRole( 'button', { name: /^Continua/ } ).click();
		await expect( guia( page ) ).toContainText( 'Pas 1 de 3' );
		await expect(
			guia( page ).getByRole( 'button', { name: 'Entès' } )
		).toBeFocused();
	} );
} );

test.describe( 'Overlay del tutorial (mòbil)', () => {
	test( 'mòbil vertical: targeta a l’amplada, botons ≥ 44 px i forat sobre Parla', async ( {
		page,
		isMobile,
	}, info ) => {
		test.skip(
			! isMobile || esHoritzontal( page ),
			'Només al mòbil en vertical'
		);
		await serveix( page, guiaMobil() );
		await iniciaMissio( page, /^Aprèn a jugar al mòbil/, BLOQUEIG_MOBIL );
		await page.getByRole( 'button', { name: BLOQUEIG_MOBIL } ).click();
		const g = guia( page );
		await expect( g ).toContainText( 'Pas 1 de 3' );
		const vp = page.viewportSize();
		const t = await g.boundingBox();
		expect( t.width ).toBeGreaterThan( vp.width - 40 );
		for ( const nom of [ 'Entès', 'Salta el tutorial' ] ) {
			const b = await g
				.getByRole( 'button', { name: nom } )
				.boundingBox();
			expect( b.height, nom ).toBeGreaterThanOrEqual( 44 );
			expect( b.width, nom ).toBeGreaterThanOrEqual( 44 );
		}
		expect( await greusAxe( page ) ).toEqual( [] );
		await g.getByRole( 'button', { name: 'Entès' } ).click();

		await expect( g ).toContainText( 'Pas 2 de 3' );
		await foratSobre( page, 'app-parla-mobil' );
		await targetaDins( page );
		expect( await greusAxe( page ) ).toEqual( [] );
		await page.screenshot( {
			path: info.outputPath( 'guia-mobil-pas2.png' ),
		} );
		await ancora( page, 'app-parla-mobil' ).tap();
		await expect( g ).toContainText( 'Pas 3 de 3' );
		await foratSobre( page, 'nav-inici' );
		await targetaDins( page );
		await page.screenshot( {
			path: info.outputPath( 'guia-mobil-pas3.png' ),
		} );
		await g.getByRole( 'button', { name: 'Entès' } ).click();
		await expect( g ).toHaveCount( 0 );
	} );
} );

test.describe( 'Overlay del tutorial a 320 px', () => {
	test.use( { viewport: { width: 320, height: 640 } } );

	test( 'targeta sencera, sense retalls ni desbordament', async ( {
		page,
		isMobile,
	}, info ) => {
		test.skip( ! isMobile, 'Només al projecte mobil' );
		await serveix( page, guiaMobil() );
		await iniciaMissio( page, /^Aprèn a jugar al mòbil/, BLOQUEIG_MOBIL );
		await page.getByRole( 'button', { name: BLOQUEIG_MOBIL } ).click();
		const g = guia( page );
		for ( const pas of [ 'Pas 1 de 3', 'Pas 2 de 3' ] ) {
			await expect( g ).toContainText( pas );
			await targetaDins( page );
			const desborda = await g.evaluate(
				( el ) =>
					el.scrollWidth > el.clientWidth + 1 ||
					el.scrollHeight > el.clientHeight + 1
			);
			expect( desborda, pas ).toBe( false );
			for ( const b of await g.getByRole( 'button' ).all() ) {
				const caixa = await b.boundingBox();
				expect( caixa.height ).toBeGreaterThanOrEqual( 44 );
				expect( caixa.x + caixa.width ).toBeLessThanOrEqual( 320 );
			}
			if ( pas === 'Pas 1 de 3' ) {
				await g.getByRole( 'button', { name: 'Entès' } ).click();
			}
		}
		await page.screenshot( {
			path: info.outputPath( 'guia-mobil-320.png' ),
		} );
	} );
} );
