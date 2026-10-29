const wpConfig = require( '@wordpress/scripts/config/eslint.config.cjs' );

module.exports = [
	...( Array.isArray( wpConfig ) ? wpConfig : [ wpConfig ] ),
	{
		rules: {
			// Els paquets @wordpress/* els proporciona WordPress en temps d'execució.
			'import/no-extraneous-dependencies': 'off',
			'import/no-unresolved': [
				'error',
				{ ignore: [ '^@wordpress/', '^vitest$' ] },
			],
		},
	},
];
