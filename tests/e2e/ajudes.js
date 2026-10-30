const { expect } = require( '@playwright/test' );
const AxeBuilder = require( '@axe-core/playwright' ).default;

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
	await page.goto( '/simulador/' );
	await page.getByRole( 'button', { name: titol } ).click();
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

module.exports = {
	greusAxePc,
	senseFullscreen,
	esHoritzontal,
	greusAxe,
	inspecciona,
	iniciaMissio,
	petits,
	escoltaFuites,
	sensePistes,
};
