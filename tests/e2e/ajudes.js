const { test: base, expect } = require( '@playwright/test' );
const { ruta } = require( './rutes' );
const AxeBuilder = require( '@axe-core/playwright' ).default;

/** Endpoint d'estadístiques. */
const RESULTAT = /\/noempesquen\/v1\/resultat/;

/**
 * `test` comú de tots els specs: per defecte el POST /resultat es respon amb
 * 204 sense arribar al servidor (no escriu files a la BD de desenvolupament ni
 * consumeix el límit d'enviaments). També el GET /resultat/resum (el
 * resultat no mostra cap resum; `resum-estadistiques.spec.js` el deixa
 * passar). És una ruta del context: un `page.route` propi del spec (p. ex.
 * `estadistiques.spec.js`) hi té preferència.
 */
const test = base.extend( {
	context: async ( { context }, usa ) => {
		await context.route( RESULTAT, ( route ) =>
			route.fulfill( { status: 204 } )
		);
		await usa( context );
	},
} );

/**
 * Violacions axe greus (serious / critical) dins del bloc del simulador.
 *
 * @param {import('@playwright/test').Page} page
 */
async function greusAxe( page ) {
	const resultat = await new AxeBuilder( { page } )
		.include( '.wp-block-noempesquen-simulador' )
		.withTags( [ 'wcag2a', 'wcag2aa', 'wcag22aa' ] )
		.analyze();
	return resultat.violations
		.filter( ( v ) => [ 'serious', 'critical' ].includes( v.impact ) )
		.map( ( v ) => ( {
			id: v.id,
			impact: v.impact,
			targets: v.nodes.map( ( n ) => n.target.join( ' ' ) ),
		} ) );
}

/** Botó «Inspecciona» d'un text concret (missatge, web o correu). */
const inspecciona = ( page, text ) =>
	page.getByRole( 'button', { name: `Inspecciona: ${ text }`, exact: true } );

/** Misions incloses, en l'ordre d'`INCLOSES` (SIM/simulador/App.js). */
const ID_INCLOSES = [
	'tutorial-pc',
	'tutorial-mobil',
	'llissa-01-factura',
	'llissa-02-banc',
	'llissa-03-inversio',
	'llissa-04-suport',
	'llissa-05-actualitzacio',
	'remei-01-paquet',
	'remei-02-canviat',
	'remei-03-sorteig',
	'remei-04-codi',
	'remei-05-comprador',
];
const INCLOSES = ID_INCLOSES.map( ( id ) =>
	require( `../../plugins/noempesquen-core/missions/ca/${ id }.json` )
);
const VAIXELL = { pc: 'el Pesquer', mobil: 'el Pirata' };
const NOM_PROGRES = 'noempesquen-progres-v2';

/** Cert si `titol` (text o RegExp) designa el títol d'una missió. */
const coincideix = ( titol, m ) =>
	titol instanceof RegExp
		? titol.test( m.titol )
		: m.titol.includes( titol );

/** Ruta d'un dispositiu: tutorial primer i la resta en l'ordre d'INCLOSES (com `construeixRuta`). */
const rutaDe = ( dispositiu ) => {
	const llista = INCLOSES.filter( ( m ) => m.dispositiu === dispositiu );
	return [
		...llista.filter( ( m ) => m.tutorial === true ),
		...llista.filter( ( m ) => m.tutorial !== true ),
	];
};

/**
 * Sembra el progrés (1 estrella) de totes les misions anteriors de la ruta
 * de la missió demanada, perquè el mapa la deixi jugar. No sembra res si és
 * el tutorial. Si el títol no és d'una missió inclosa (remota), se suposa
 * del PC i se sembra tota la ruta. Cal cridar-la abans
 * de `page.goto`. No trepitja el progrés que el spec ja hagi sembrat.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string|RegExp}                   titol Títol de la missió.
 * @return {Object|null} La missió trobada (amb `dispositiu`) o null.
 */
function desbloqueja( page, titol ) {
	let missio = INCLOSES.find( ( m ) => coincideix( titol, m ) ) ?? null;
	let anteriors;
	if ( missio ) {
		const ruta = rutaDe( missio.dispositiu );
		anteriors = ruta
			.slice( 0, ruta.findIndex( ( m ) => m.id === missio.id ) )
			.map( ( m ) => m.id );
	} else {
		// Missió remota (publicada pels specs): va al final de la ruta del PC
		// (són còpies de la factura). Se sembren totes les incloses.
		missio = { dispositiu: 'pc' };
		anteriors = rutaDe( 'pc' ).map( ( m ) => m.id );
	}
	if ( anteriors.length ) {
		page.addInitScript(
			( [ clau, ids ] ) => {
				let actual = {};
				try {
					actual = JSON.parse( window.localStorage.getItem( clau ) );
				} catch {
					actual = {};
				}
				if ( ! actual || typeof actual !== 'object' ) {
					actual = {};
				}
				ids.forEach( ( id ) => {
					actual[ id ] = Math.max( 1, actual[ id ] || 0 );
				} );
				window.localStorage.setItem( clau, JSON.stringify( actual ) );
			},
			[ NOM_PROGRES, anteriors ]
		);
	}
	return missio;
}

/**
 * Del port, obre el vaixell de la missió i clica el seu node del mapa.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string|RegExp}                   titol
 * @param {Object|null}                     [missio] Retorn de `desbloqueja`.
 */
async function obreMissio( page, titol, missio = null ) {
	const trobada = missio ?? INCLOSES.find( ( m ) => coincideix( titol, m ) );
	if ( trobada ) {
		await page
			.getByRole( 'button', {
				name: new RegExp( `Obre ${ VAIXELL[ trobada.dispositiu ] }:` ),
			} )
			.click();
	}
	await page.getByRole( 'button', { name: titol } ).click();
}

/**
 * Obre el simulador, tria la missió i espera la pantalla de bloqueig.
 * Els fake clocks s'instal·len abans de carregar la pàgina.
 *
 * @param {import('@playwright/test').Page} page
 * @param {RegExp}                          titol    Nom del botó de la missió al selector.
 * @param {RegExp}                          bloqueig Nom del botó de la pantalla de bloqueig que cal esperar.
 */
async function iniciaMissio( page, titol, bloqueig ) {
	await page.clock.install();
	const missio = desbloqueja( page, titol );
	await page.goto( ruta( 'simulador' ) );
	await obreMissio( page, titol, missio );
	await expect(
		page.getByRole( 'button', { name: bloqueig } )
	).toBeVisible();
}

/**
 * Elements interactius visibles del simulador (botons i camps) més petits
 * de 44 × 44 px, fora de les zones inertes.
 *
 * @param {import('@playwright/test').Page} page
 * @return {Promise<string[]>} Descripció dels elements petits.
 */
const petits = ( page ) =>
	page.evaluate( () =>
		[ ...document.querySelectorAll( '.nep-so button, .nep-so input' ) ]
			.filter( ( el ) => {
				const r = el.getBoundingClientRect();
				return (
					r.width > 0 &&
					r.height > 0 &&
					! el.closest( '[inert]' ) &&
					( r.width < 44 || r.height < 44 )
				);
			} )
			.map(
				( el ) =>
					`${ el.className } | ${
						el.getAttribute( 'aria-label' ) ??
						el.textContent.slice( 0, 20 )
					} | ${ Math.round( el.getBoundingClientRect().width ) }×${ Math.round(
						el.getBoundingClientRect().height
					) }`
			)
	);

/**
 * Escolta la consola i les peticions de xarxa des d'ara. Cal cridar-la
 * abans de `page.goto`.
 *
 * @param {import('@playwright/test').Page} page
 * @return {() => string} Tot el que s'ha vist (consola, URL i cos de les peticions).
 */
function escoltaFuites( page ) {
	const vist = [];
	page.on( 'console', ( m ) => vist.push( m.text() ) );
	page.on( 'request', ( r ) =>
		vist.push( `${ r.url() } ${ r.postData() ?? '' }` )
	);
	return () => vist.join( '\n' );
}

/**
 * Comprova que cap dels valors no és a l'emmagatzematge, a la consola ni a
 * la xarxa (ni al DOM serialitzat, si `dom` és cert).
 *
 * @param {import('@playwright/test').Page} page
 * @param {() => string}                    vist    Retorn d'escoltaFuites.
 * @param {string[]}                        valors  Textos que no han d'aparèixer.
 * @param {Object}                          [opc]
 * @param {boolean}                         [opc.dom=true] Comprova també page.content().
 */
async function sensePistes( page, vist, valors, { dom = true } = {} ) {
	const emmagatzemat = await page.evaluate( () =>
		JSON.stringify( [
			{ ...window.localStorage },
			{ ...window.sessionStorage },
		] )
	);
	const text = dom ? await page.content() : '';
	const registre = vist();
	for ( const valor of valors ) {
		expect( emmagatzemat ).not.toContain( valor );
		expect( registre ).not.toContain( valor );
		expect( text ).not.toContain( valor );
	}
}

/**
 * Cert si la pàgina és en horitzontal (més ampla que alta).
 *
 * @param {import('@playwright/test').Page} page
 * @return {boolean} Cert si és horitzontal.
 */
const esHoritzontal = ( page ) => {
	const { width, height } = page.viewportSize();
	return width > height;
};

/**
 * Com `greusAxe`, però sense els `target-size` del contingut de les apps
 * (cos de les finestres) quan el PC és escalat: a escala ~0,5 el navegador,
 * Posta i Parla no arriben a 24 px reals. La resta del sistema PC sí que
 * es comprova.
 * Deute: treure aquest filtre quan les apps tinguin objectius tàctils
 * grans en mode escalat o es baixi el mínim lògic (D3, 1024×576).
 *
 * @param {import('@playwright/test').Page} page
 */
async function greusAxePc( page ) {
	const greus = await greusAxe( page );
	const resultat = [];
	for ( const v of greus ) {
		if ( v.id !== 'target-size' ) {
			resultat.push( v );
			continue;
		}
		const fora = await page.evaluate(
			( selectors ) =>
				selectors.filter(
					( sel ) =>
						! document
							.querySelector( sel )
							?.closest(
								'.nep-so-pantalla.is-escalat .nep-so-finestra__cos'
							)
				),
			v.targets
		);
		if ( fora.length ) {
			resultat.push( { ...v, targets: fora } );
		}
	}
	return resultat;
}

/**
 * Sense pantalla completa real (la capa fixa fa el mateix paper): amb
 * pantalla completa Playwright no pot canviar la mida de la finestra.
 * Cal cridar-la abans de `page.goto`.
 *
 * @param {import('@playwright/test').Page} page
 */
const senseFullscreen = ( page ) =>
	page.addInitScript( () => {
		window.Element.prototype.requestFullscreen = () =>
			Promise.reject( new Error( 'test' ) );
	} );

/**
 * Salta la presentació de la guia: cap avís programat des de l'inici surt
 * abans de la fi de la intro + MS_TRAS_INTRO. Al PC el botó és al panell de
 * Parla; al mòbil obre Parla, el xat de la guia, salta i torna a l'inici.
 * Amb `nomesClick` dispara només l'esdeveniment click (sense pointerdown, per
 * no comptar com a interacció de so).
 *
 * @param {import('@playwright/test').Page} page
 * @param {{nomesClick?: boolean}}          [opcions]
 */
async function saltaIntro( page, { nomesClick = false } = {} ) {
	const prem = ( loc ) =>
		nomesClick ? loc.dispatchEvent( 'click' ) : loc.click();
	const salta = page
		.getByRole( 'button', { name: 'Salta la presentació' } )
		.first();
	const dock = page.getByRole( 'list', { name: 'Apps preferides' } );
	// PC: el botó surt al panell de Parla; mòbil: l'inici amb el dock.
	await salta.or( dock ).first().waitFor();
	if ( await salta.isVisible() ) {
		await prem( salta );
		await expect( salta ).toBeHidden();
		return;
	}
	await prem(
		page
			.getByRole( 'list', { name: /^Apps( preferides)?$/ } )
			.getByRole( 'button', { name: 'Parla', exact: true } )
			.first()
	);
	if ( ! ( await salta.isVisible() ) ) {
		const llista = page.getByRole( 'button', { name: 'Torna als xats' } );
		if ( await llista.isVisible() ) {
			await prem( llista );
		}
		await prem(
			page.getByRole( 'button', { name: /^(Remei|Llissa)/ } ).first()
		);
	}
	await prem( salta );
	await expect( salta ).toBeHidden();
	// Deixa Parla a la llista de xats (com si no s'hagués obert) i torna amb
	// «Enrere» fins a tancar-la (que no quedi a la pila d'apps).
	const tornar = page.getByRole( 'button', { name: 'Torna als xats' } );
	await prem( tornar );
	await expect( tornar ).toBeHidden();
	const enrere = page.getByRole( 'button', { name: 'Enrere', exact: true } );
	for ( let i = 0; i < 3 && ! ( await dock.isVisible() ); i++ ) {
		await prem( enrere );
	}
	await expect( dock ).toBeVisible();
}

module.exports = {
	saltaIntro,
	test,
	expect,
	RESULTAT,
	greusAxePc,
	senseFullscreen,
	esHoritzontal,
	greusAxe,
	inspecciona,
	iniciaMissio,
	desbloqueja,
	obreMissio,
	rutaDe,
	INCLOSES,
	petits,
	escoltaFuites,
	sensePistes,
};
