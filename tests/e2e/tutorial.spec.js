const { test, expect } = require( './ajudes' );
const {
	RESULTAT,
	esHoritzontal,
	greusAxe,
	greusAxePc,
	iniciaMissio,
	petits,
	senseFullscreen,
} = require( './ajudes' );
const {
	guia,
	forat,
	ancora,
	foratSobre,
	targetaDins,
	senseSolapar,
	clicAlCentre,
} = require( './ajudes-guia' );

const PROGRES = 'noempesquen-progres-v2';
const BLOQUEIG_PC = /Clica o prem/;
const BLOQUEIG_MOBIL = /Llisca cap amunt/;
const TUTORIAL_PC = "Aprèn a jugar a l'ordinador";
const TUTORIAL_MOBIL = 'Aprèn a jugar al mòbil';

// Amb el rellotge fals, l'animationend del bloqueig no arriba.
test.use( { reducedMotion: 'reduce' } );

const selector = ( page ) =>
	page.getByRole( 'region', { name: 'Tria una missió' } );
const mapa = ( page ) => page.locator( '.nep-mapa' );
const parla = ( page ) => page.getByRole( 'region', { name: 'Parla' } );
const barraTasques = ( page ) =>
	page.getByRole( 'navigation', { name: 'Barra de tasques' } );
const pausa = ( page ) => page.getByRole( 'dialog', { name: 'Pausa' } );

/**
 * Compta els POST a /resultat des d'ara (el GET /resultat/resum no compta).
 *
 * @param {import('@playwright/test').Page} page
 * @return {() => number} Nombre de POST vistos.
 */
function comptaPosts( page ) {
	let n = 0;
	page.on( 'request', ( r ) => {
		if ( r.method() === 'POST' && RESULTAT.test( r.url() ) ) {
			n++;
		}
	} );
	return () => n;
}

/**
 * Progrés desat al navegador.
 *
 * @param {import('@playwright/test').Page} page
 */
const progres = ( page ) =>
	page.evaluate(
		( clau ) => JSON.parse( window.localStorage.getItem( clau ) ?? '{}' ),
		PROGRES
	);

/**
 * Pantalla final del tutorial: «Ja estàs a punt», sense estrelles ni punts,
 * cap POST a /resultat; «Juga una missió» torna al selector amb el tutorial
 * fet i ja no recomanat.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object}                          opc
 * @param {string}                          opc.id      Id del tutorial.
 * @param {string}                          opc.titol   Títol del tutorial.
 * @param {string}                          opc.seguent Id de la missió que passa a ser recomanada.
 * @param {() => number}                    opc.posts   Comptador de POST.
 * @param {Function}                        opc.axe     Comprovació axe.
 * @param {boolean}                         opc.mobil   Comprova també els 44 px.
 */
async function comprovaFinal(
	page,
	{ id, titol, seguent, posts, axe, mobil }
) {
	const capa = page.getByRole( 'dialog' );
	await expect( capa ).toBeVisible();
	await capa.getByRole( 'button', { name: 'Continua', exact: true } ).click();

	await expect(
		page.getByRole( 'heading', { level: 2, name: titol } )
	).toBeVisible();
	await expect( page.locator( '.nep-res__veredicte' ) ).toContainText(
		'Ara ja saps on mirar.'
	);
	await expect( page.getByRole( 'img', { name: /estrelles/ } ) ).toHaveCount(
		0
	);
	await expect( page.locator( '.nep-res' ) ).not.toContainText( /punts/i );
	await expect(
		page.getByRole( 'button', { name: 'Torna-ho a provar' } )
	).toHaveCount( 0 );
	expect( await axe( page ) ).toEqual( [] );
	if ( mobil ) {
		expect( await petits( page ) ).toEqual( [] );
	}

	// Ni en acabar ni una estona després s'envia cap resultat.
	await page.clock.runFor( 5000 );
	expect( posts() ).toBe( 0 );

	await page.getByRole( 'button', { name: 'Juga una missió' } ).click();
	// Torna al mapa del vaixell del tutorial: fet, i la missió següent disponible.
	await expect( selector( page ) ).toBeVisible();
	await expect( mapa( page ) ).toBeVisible();
	expect( posts() ).toBe( 0 );
	expect( ( await progres( page ) )[ id ] ).toBe( 1 );
	const targeta = selector( page ).locator( `[data-missio="${ id }"]` );
	await expect( targeta ).toHaveCount( 1 );
	await expect( targeta ).toContainText( 'Fet' );
	await expect( targeta ).toBeFocused();
	const proxima = selector( page ).locator( `[data-missio="${ seguent }"]` );
	await expect( proxima ).toContainText( 'Toca ara' );
	await expect( proxima ).not.toHaveAttribute( 'aria-disabled', 'true' );
}

const tutorialPc = require( '../../plugins/noempesquen-core/missions/tutorial-pc.json' );
const tutorialMobil = require( '../../plugins/noempesquen-core/missions/tutorial-mobil.json' );

const PASSOS_PC = tutorialPc.passos;
const PASSOS_MOBIL = tutorialMobil.passos;
const ALTERNATIVA = { decisio: 'parla-respostes' };

/**
 * Àncora d'un pas (amb l'alternativa d'abans d'obrir la decisió).
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          clau Clau data-tut.
 * @return {Promise<string>} Clau que cal fer servir.
 */
async function ancoraDelPas( page, clau ) {
	const principal = ancora( page, clau );
	if ( ( await principal.count() ) > 0 || ! ALTERNATIVA[ clau ] ) {
		return clau;
	}
	return ALTERNATIVA[ clau ];
}

/**
 * Comprova el pas: comptador, títol, forat sobre l'àncora, targeta dins la
 * pantalla, botons segons el tipus de pas i, al PC, finestres sense solapar.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object[]}                        passos Passos de la missió.
 * @param {number}                          i      Índex del pas.
 * @param {boolean}                         pc     Cert al PC.
 */
async function comprovaPas( page, passos, i, pc ) {
	const pas = passos[ i ];
	const g = guia( page );
	await expect( g, pas.id ).toContainText(
		`Pas ${ i + 1 } de ${ passos.length }`
	);
	await expect( g.getByRole( 'heading', { level: 2 } ) ).toHaveText(
		pas.titol
	);
	const entes = g.getByRole( 'button', { name: 'Entès' } );
	await expect( entes ).toHaveCount( pas.continua === 'boto' ? 1 : 0 );
	await expect(
		g.getByRole( 'button', { name: 'Salta el tutorial' } )
	).toBeVisible();
	if ( pas.ancora ) {
		await foratSobre( page, await ancoraDelPas( page, pas.ancora ) );
	} else {
		await expect( forat( page ) ).toHaveCount( 0 );
	}
	await targetaDins( page );
	if ( pc ) {
		await senseSolapar( page );
	}
}

/**
 * El botó no té res a sobre (avisos, banners, vel): l'element que hi ha al
 * centre és ell mateix o un descendent. No fa servir `click()`, que espera i
 * amaga el solapament.
 *
 * @param {import('@playwright/test').Page}    page
 * @param {import('@playwright/test').Locator} boto Botó a comprovar.
 */
async function senseTapar( page, boto ) {
	await expect( boto ).toBeVisible();
	const caixa = await boto.boundingBox();
	const tapat = await boto.evaluate(
		( el, [ x, y ] ) => {
			const dalt = el.ownerDocument.elementFromPoint( x, y );
			return dalt === null || ! el.contains( dalt )
				? `${ dalt?.className } | ${ dalt?.textContent?.slice( 0, 40 ) }`
				: null;
		},
		[ caixa.x + caixa.width / 2, caixa.y + caixa.height / 2 ]
	);
	expect( tapat, 'el botó de decidir és tapat per' ).toBeNull();
}

const inspeccionaText = ( page, patro ) =>
	page.getByRole( 'button', { name: patro } ).first();

// L'àncora `avis` és el cos de l'avís (el botó que l'obre), no la X.
const cosAvis = ( page ) => ancora( page, 'avis' );

const ACCIONS_PC = {
	tanca: ( page ) =>
		clicAlCentre(
			page,
			ancora( page, 'finestra-navegador' ).getByRole( 'button', {
				name: 'Tanca',
				exact: true,
			} )
		),
	obre: ( page ) => clicAlCentre( page, ancora( page, 'app-navegador' ) ),
	avis: ( page ) => clicAlCentre( page, cosAvis( page ) ),
	'correu-nou': ( page ) => clicAlCentre( page, cosAvis( page ) ),
	'obre-correu': ( page ) =>
		clicAlCentre(
			page,
			ancora( page, 'correu-primer' ).getByRole( 'button', {
				name: /Premis Fantasia/,
			} )
		),
	lupa: ( page ) => clicAlCentre( page, ancora( page, 'lupa' ) ),
	'indici-remitent': ( page ) =>
		clicAlCentre(
			page,
			inspeccionaText( page, /^Inspecciona: .*premis-fantasia\.xyz/ )
		),
	'indici-premi': ( page ) =>
		clicAlCentre(
			page,
			inspeccionaText( page, /^Inspecciona: Has guanyat/ )
		),
	'indici-enllac': ( page ) =>
		clicAlCentre( page, inspeccionaText( page, /^Inspecciona: Reclama/ ) ),
	decisio: async ( page ) => {
		// Cap avís (p. ex. la reacció de la Llissa) no pot tapar el botó.
		const respon = page.getByRole( 'button', {
			name: 'Ja ho tinc clar',
			exact: true,
		} );
		await senseTapar( page, respon );
		await clicAlCentre( page, respon );
		const opcio = page.getByRole( 'button', {
			name: /^Ja ho tinc clar: és un correu/,
		} );
		await senseTapar( page, opcio );
		await clicAlCentre( page, opcio );
	},
};

const ACCIONS_MOBIL = {
	dock: ( page ) =>
		clicAlCentre(
			page,
			ancora( page, 'dock' ).getByRole( 'button', { name: 'Navegador' } ),
			true
		),
	'nav-enrere': ( page ) =>
		clicAlCentre( page, ancora( page, 'nav-enrere' ), true ),
	'nav-inici': ( page ) =>
		clicAlCentre( page, ancora( page, 'nav-inici' ), true ),
	parla: ( page ) =>
		clicAlCentre( page, ancora( page, 'app-parla-mobil' ), true ),
	banner: ( page ) => clicAlCentre( page, ancora( page, 'banner' ), true ),
	missatges: ( page ) =>
		clicAlCentre(
			page,
			ancora( page, 'llista-sms' ).locator( '[data-fil]' ).first(),
			true
		),
	lupa: ( page ) => clicAlCentre( page, ancora( page, 'lupa' ), true ),
	'indici-remitent': ( page ) =>
		clicAlCentre(
			page,
			inspeccionaText( page, /^Inspecciona: Premis Fantasia/ ),
			true
		),
	'indici-premi': ( page ) =>
		clicAlCentre(
			page,
			inspeccionaText( page, /^Inspecciona: .*iot/ ),
			true
		),
	'obre-centre': ( page ) =>
		clicAlCentre( page, ancora( page, 'barra-estat' ), true ),
	'centre-control': ( page ) =>
		clicAlCentre(
			page,
			ancora( page, 'centre-control' )
				.getByRole( 'button', { name: /Remei/ } )
				.first(),
			true
		),
	decisio: async ( page ) => {
		const respon = page.getByRole( 'button', {
			name: 'Ja ho tinc clar',
			exact: true,
		} );
		await senseTapar( page, respon );
		await clicAlCentre( page, respon, true );
		const opcio = page.getByRole( 'button', {
			name: /^Ja ho tinc clar: és un SMS/,
		} );
		await senseTapar( page, opcio );
		await clicAlCentre( page, opcio, true );
	},
};

/**
 * Fa el pas `i`: «Entès» als d'explicació, l'acció real als d'acció.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object[]}                        passos  Passos.
 * @param {number}                          i       Índex.
 * @param {Object}                          accions Mapa id -> acció.
 */
async function fesPas( page, passos, i, accions ) {
	const pas = passos[ i ];
	if ( pas.continua === 'boto' ) {
		await guia( page ).getByRole( 'button', { name: 'Entès' } ).click();
		return;
	}
	expect( accions[ pas.id ], `acció del pas «${ pas.id }»` ).toBeDefined();
	await accions[ pas.id ]( page );
}

/**
 * Recorre els passos des del primer fins al pas `finsId` (no inclòs).
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object[]}                        passos   Passos.
 * @param {Object}                          accions  Accions.
 * @param {boolean}                         pc       Cert al PC.
 * @param {string}                          finsId   Id del pas on aturar-se.
 * @param {Object}                          [ganxos] Funcions per id, cridades un cop comprovat el pas.
 */
async function vesA( page, passos, accions, pc, finsId, ganxos = {} ) {
	for ( let i = 0; i < passos.length; i++ ) {
		await comprovaPas( page, passos, i, pc );
		await ganxos[ passos[ i ].id ]?.();
		if ( passos[ i ].id === finsId ) {
			return i;
		}
		await fesPas( page, passos, i, accions );
	}
	return passos.length;
}

const arrencaPc = async ( page ) => {
	await senseFullscreen( page );
	await iniciaMissio( page, new RegExp( `^${ TUTORIAL_PC }` ), BLOQUEIG_PC );
	await page.getByRole( 'button', { name: BLOQUEIG_PC } ).click();
	await expect( guia( page ) ).toBeVisible();
};

const arrencaMobil = async ( page ) => {
	await iniciaMissio(
		page,
		new RegExp( `^${ TUTORIAL_MOBIL }` ),
		BLOQUEIG_MOBIL
	);
	await page.getByRole( 'button', { name: BLOQUEIG_MOBIL } ).click();
	await expect( guia( page ) ).toBeVisible();
};

const sistemaInert = ( page ) => page.locator( '.nep-so__sistema' );

test.describe( 'tutorial al PC', () => {
	test.beforeEach( ( { page } ) => {
		test.skip( ! esHoritzontal( page ), 'PC en vertical: demana girar' );
		test.slow();
	} );

	test( 'recorregut real dels 22 passos, sense puntuar ni enviar res', async ( {
		page,
		isMobile,
	} ) => {
		const posts = comptaPosts( page );
		await arrencaPc( page );
		expect( PASSOS_PC ).toHaveLength( 22 );
		const axe = isMobile ? greusAxePc : greusAxe;
		const fi = await vesA( page, PASSOS_PC, ACCIONS_PC, true, '', {
			// Un pas d'explicació (sistema inert) i un d'acció.
			escriptori: async () => {
				await expect( sistemaInert( page ) ).toHaveAttribute(
					'inert',
					''
				);
				expect( await axe( page ) ).toEqual( [] );
			},
			tanca: async () => {
				await expect( sistemaInert( page ) ).not.toHaveAttribute(
					'inert',
					''
				);
				expect( await axe( page ) ).toEqual( [] );
			},
		} );
		expect( fi ).toBe( 22 );
		await comprovaFinal( page, {
			id: 'tutorial-pc',
			titol: TUTORIAL_PC,
			seguent: 'llissa-01-factura',
			posts,
			axe,
		} );
	} );

	test( 'clic fora del forat no avança ni actua; Esc obre la pausa', async ( {
		page,
	} ) => {
		await arrencaPc( page );
		await vesA( page, PASSOS_PC, ACCIONS_PC, true, 'tanca' );
		const g = guia( page );
		await expect( g ).toContainText( 'Pas 7 de 22' );
		// Clic a la icona de Parla de la barra i a la barra de títol de Parla.
		await clicAlCentre( page, ancora( page, 'app-parla' ) );
		await clicAlCentre(
			page,
			ancora( page, 'finestra-parla' ).locator(
				'.nep-so-finestra__titol'
			)
		);
		await expect( g ).toContainText( 'Pas 7 de 22' );
		await expect( ancora( page, 'finestra-navegador' ) ).toBeVisible();
		await expect( ancora( page, 'finestra-parla' ) ).toBeVisible();

		await page.keyboard.press( 'Escape' );
		await expect( pausa( page ) ).toBeVisible();
		await expect( g ).toHaveCount( 0 );
		await page.getByRole( 'button', { name: /^Continua/ } ).click();
		await expect( g ).toContainText( 'Pas 7 de 22' );
		await foratSobre( page, 'finestra-navegador' );
	} );

	test( '«Salta el tutorial» a mig camí deixa la missió jugable i acabable', async ( {
		page,
		isMobile,
	} ) => {
		const posts = comptaPosts( page );
		await arrencaPc( page );
		await vesA( page, PASSOS_PC, ACCIONS_PC, true, 'respostes' );
		await guia( page )
			.getByRole( 'button', { name: 'Salta el tutorial' } )
			.click();
		await expect( guia( page ) ).toHaveCount( 0 );
		await expect( sistemaInert( page ) ).not.toHaveAttribute( 'inert', '' );
		// Els disparadors pendents s'han aplicat: l'avís del correu hi és.
		const avis = page
			.locator( '.nep-so-toast' )
			.filter( { hasText: 'Premis Fantasia' } );
		await expect( avis ).toBeVisible();
		await avis.getByRole( 'button' ).last().click();
		await page
			.getByRole( 'region', { name: 'Entrada' } )
			.getByRole( 'button', { name: /Premis Fantasia/ } )
			.click();
		await expect(
			page.getByRole( 'heading', {
				name: 'Enhorabona! Has guanyat un iot',
			} )
		).toBeVisible();
		await barraTasques( page )
			.getByRole( 'button', { name: /^Parla/ } )
			.click();
		await parla( page )
			.getByRole( 'button', { name: 'Ja ho tinc clar', exact: true } )
			.click();
		await parla( page )
			.getByRole( 'button', { name: /^Ja ho tinc clar: és un correu/ } )
			.click();
		await comprovaFinal( page, {
			id: 'tutorial-pc',
			titol: TUTORIAL_PC,
			seguent: 'llissa-01-factura',
			posts,
			axe: isMobile ? greusAxePc : greusAxe,
		} );
	} );

	test( 'xarxa de seguretat: si es tanca l’avís amb la X, el vel desapareix', async ( {
		page,
	} ) => {
		await arrencaPc( page );
		await vesA( page, PASSOS_PC, ACCIONS_PC, true, 'avis' );
		await expect( page.locator( '.nep-guia__vel' ) ).not.toHaveCount( 0 );
		// La X queda fora del forat: a sobre hi ha el vel (o la targeta).
		const x = page
			.locator( '.nep-so-toast' )
			.getByRole( 'button', { name: 'Descarta la notificació' } );
		const caixa = await x.boundingBox();
		const tapa = await page.evaluate(
			( [ px, py ] ) =>
				document.elementFromPoint( px, py )?.closest( '.nep-guia' ) !==
				null,
			[ caixa.x + caixa.width / 2, caixa.y + caixa.height / 2 ]
		);
		expect( tapa ).toBe( true );
		// Si l'avís desapareix igualment (descartat per codi), el vel se'n va.
		await x.evaluate( ( b ) => b.click() );
		await expect( page.locator( '.nep-guia__vel' ) ).toHaveCount( 0 );
		await expect( forat( page ) ).toHaveCount( 0 );
		await expect( guia( page ) ).toContainText( 'Pas 9 de 22' );
		await expect(
			guia( page ).getByRole( 'button', { name: 'Salta el tutorial' } )
		).toBeVisible();
		await targetaDins( page );
	} );
} );

test.describe( 'tutorial al mòbil', () => {
	test.beforeEach( ( { page, isMobile } ) => {
		test.skip(
			! isMobile || esHoritzontal( page ),
			'Només al mòbil en vertical'
		);
		test.slow();
	} );

	test( 'recorregut real dels 16 passos, sense puntuar ni enviar res', async ( {
		page,
	} ) => {
		const posts = comptaPosts( page );
		await arrencaMobil( page );
		expect( PASSOS_MOBIL ).toHaveLength( 16 );
		const fi = await vesA( page, PASSOS_MOBIL, ACCIONS_MOBIL, false, '', {
			inici: async () => {
				await expect( sistemaInert( page ) ).toHaveAttribute(
					'inert',
					''
				);
				expect( await greusAxe( page ) ).toEqual( [] );
				const b = await guia( page )
					.getByRole( 'button', { name: 'Entès' } )
					.boundingBox();
				expect( b.height ).toBeGreaterThanOrEqual( 44 );
			},
			'nav-enrere': async () => {
				await expect( sistemaInert( page ) ).not.toHaveAttribute(
					'inert',
					''
				);
				expect( await greusAxe( page ) ).toEqual( [] );
			},
		} );
		expect( fi ).toBe( 16 );
		await comprovaFinal( page, {
			id: 'tutorial-mobil',
			titol: TUTORIAL_MOBIL,
			seguent: 'remei-01-paquet',
			posts,
			axe: greusAxe,
			mobil: true,
		} );
	} );

	test( 'toc fora del forat no avança; «Salta el tutorial» deixa acabar', async ( {
		page,
	} ) => {
		const posts = comptaPosts( page );
		await arrencaMobil( page );
		await vesA( page, PASSOS_MOBIL, ACCIONS_MOBIL, false, 'dock' );
		const g = guia( page );
		await expect( g ).toContainText( 'Pas 3 de 16' );
		// Missatges és al dock però el forat és només la icona del Navegador? Toc al botó Inici del sistema.
		await clicAlCentre( page, ancora( page, 'nav-inici' ), true );
		await expect( g ).toContainText( 'Pas 3 de 16' );
		await expect( ancora( page, 'dock' ) ).toBeVisible();

		await page.keyboard.press( 'Escape' );
		await expect( pausa( page ) ).toBeVisible();
		await page.getByRole( 'button', { name: /^Continua/ } ).click();
		await expect( g ).toContainText( 'Pas 3 de 16' );

		await g.getByRole( 'button', { name: 'Salta el tutorial' } ).click();
		await expect( g ).toHaveCount( 0 );
		await expect( sistemaInert( page ) ).not.toHaveAttribute( 'inert', '' );
		// L'SMS i l'avís de la Remei existeixen: obre Parla i decideix.
		await clicAlCentre(
			page,
			page
				.getByRole( 'list', { name: /Apps/ } )
				.getByRole( 'button', { name: 'Parla' } )
				.first(),
			true
		);
		await parla( page )
			.getByRole( 'button', { name: 'Ja ho tinc clar', exact: true } )
			.click();
		await parla( page )
			.getByRole( 'button', { name: /^Ja ho tinc clar: és un SMS/ } )
			.click();
		await comprovaFinal( page, {
			id: 'tutorial-mobil',
			titol: TUTORIAL_MOBIL,
			seguent: 'remei-01-paquet',
			posts,
			axe: greusAxe,
			mobil: true,
		} );
	} );
} );

test.describe( 'tutorial al selector', () => {
	// El selector decideix pel mateix punt de tall que `useEsMobil`.
	const estret = ( page ) => page.viewportSize().width < 768;

	test( 'la primera vegada només el tutorial és jugable', async ( {
		page,
	} ) => {
		const mobil = estret( page );
		const tutorial = mobil ? 'tutorial-mobil' : 'tutorial-pc';
		const primera = mobil ? 'remei-01-paquet' : 'llissa-01-factura';
		await page.clock.install();
		await page.goto( '/simulador/' );
		await page
			.getByRole( 'button', {
				name: mobil ? /^Obre el Pirata:/ : /^Obre el Pesquer:/,
			} )
			.click();
		await expect(
			page.locator( `[data-missio="${ tutorial }"]` )
		).toContainText( 'Toca ara' );
		// La primera missió no es pot saltar-se el tutorial: és bloquejada.
		const bloquejada = page.locator( `[data-missio="${ primera }"]` );
		await expect( bloquejada ).toHaveAttribute( 'aria-disabled', 'true' );
		// aria-disabled: Playwright el tracta com a inhabilitat, per això `force`.
		await bloquejada.click( { force: true } );
		await expect( selector( page ) ).toBeVisible();
		await expect( pausa( page ) ).toHaveCount( 0 );
	} );

	test( '«Salta el tutorial» torna al selector sense marcar-lo fet', async ( {
		page,
	} ) => {
		const isMobile = estret( page );
		const tutorial = isMobile ? 'tutorial-mobil' : 'tutorial-pc';
		await iniciaMissio(
			page,
			new RegExp( `^${ isMobile ? TUTORIAL_MOBIL : TUTORIAL_PC }` ),
			isMobile ? BLOQUEIG_MOBIL : BLOQUEIG_PC
		);
		await page.keyboard.press( 'Escape' );
		await expect( pausa( page ) ).toBeVisible();
		await pausa( page )
			.getByRole( 'button', { name: 'Salta el tutorial' } )
			.click();
		await expect( selector( page ) ).toBeVisible();
		await expect( mapa( page ) ).toBeVisible();
		expect( ( await progres( page ) )[ tutorial ] ).toBeUndefined();
		const node = selector( page ).locator( `[data-missio="${ tutorial }"]` );
		await expect( node ).not.toContainText( 'Fet' );
		await expect( node ).toContainText( 'Toca ara' );
	} );
} );
