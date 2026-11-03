/**
 * Rutes de les pàgines públiques segons l'idioma de la suite.
 *
 * L'idioma surt de `NEP_LANG` (`es` o `ca`); sense variable, `ca`, perquè la
 * bateria històrica està escrita amb textos catalans. Els specs de
 * `tests/e2e/es/` passen l'idioma explícit.
 *
 * Retorna camins absoluts amb el prefix (`/ca/simulador/`): Playwright resol
 * les rutes absolutes contra l'origen, no contra la `baseURL`. Admin
 * (`/admin/`, `/wp-admin/`) i REST (`/wp-json/`) no porten prefix.
 *
 * El mapa de slugs es llegeix de `nep_pagines()` (includes/idioma-nucli.php),
 * l'única font.
 */
const { readFileSync } = require( 'node:fs' );
const { join } = require( 'node:path' );

const IDIOMA = process.env.NEP_LANG === 'es' ? 'es' : 'ca';

const font = readFileSync(
	join( __dirname, '../../plugins/noempesquen-core/includes/idioma-nucli.php' ),
	'utf8'
);
const cos = font.slice( font.indexOf( 'function nep_pagines()' ) );
const PAGINES = {};
for ( const m of cos.matchAll(
	/'([\w-]+)'\s*=>\s*array\(\s*'es'\s*=>\s*'([^']*)',\s*'ca'\s*=>\s*'([^']*)',?\s*\)/g
) ) {
	PAGINES[ m[ 1 ] ] = { es: m[ 2 ], ca: m[ 3 ] };
}
if ( ! PAGINES.simulador || ! PAGINES.compte ) {
	throw new Error( 'rutes.js: no s’ha pogut llegir nep_pagines()' );
}

/**
 * Camí absolut d'una pàgina.
 *
 * @param {string} clau   Clau de `nep_pagines()` (simulador, compte, contacte…).
 * @param {string} [lang] `es` o `ca`; per defecte, el de la suite.
 * @return {string} P. ex. `/ca/simulador/` o `/simulador/`.
 */
function ruta( clau, lang = IDIOMA ) {
	const pagina = PAGINES[ clau ];
	if ( ! pagina ) {
		throw new Error( `rutes.js: pàgina desconeguda «${ clau }»` );
	}
	const prefix = lang === 'ca' ? '/ca/' : '/';
	return pagina[ lang ] ? `${ prefix }${ pagina[ lang ] }/` : prefix;
}

module.exports = { ruta, IDIOMA, PAGINES };
