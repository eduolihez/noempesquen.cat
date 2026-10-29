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

module.exports = { greusAxe };
