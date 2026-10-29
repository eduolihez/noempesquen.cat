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

module.exports = { greusAxe, inspecciona, iniciaMissio };
