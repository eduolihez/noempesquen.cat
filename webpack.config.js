/**
 * Configuració de @wordpress/scripts amb un entry extra: l'editor del guió de
 * les missions al panell. Els entries dels blocs (block.json) es mantenen.
 */
const path = require( 'path' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

const EDITOR_MISSIO = {
	'editor-missio/index': path.resolve(
		__dirname,
		'plugins/noempesquen-core/src/editor-missio/index.js'
	),
};

// Avaluació mandrosa: la carpeta de src la fixa la CLI amb variables d'entorn.
const ambEditor = ( config ) => ( {
	...config,
	entry: async () => {
		const base =
			typeof config.entry === 'function'
				? await config.entry()
				: config.entry;
		return { ...base, ...EDITOR_MISSIO };
	},
} );

module.exports = Array.isArray( defaultConfig )
	? [ ambEditor( defaultConfig[ 0 ] ), ...defaultConfig.slice( 1 ) ]
	: ambEditor( defaultConfig );
