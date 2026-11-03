const nep = require( './scripts/eslint-nep/index.cjs' );
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
	{
		files: [ 'plugins/noempesquen-core/src/blocks/simulador/**/*.js' ],
		ignores: [
			'**/*.test.js',
			'**/nucli/valida.js', // eina d'autor, no text de joc
			'**/idioma.js',
		],
		plugins: { nep },
		rules: { 'nep/no-literal-ui': 'error' },
	},
];
