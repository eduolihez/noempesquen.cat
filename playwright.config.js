// @ts-check
const { defineConfig, devices } = require( '@playwright/test' );

/**
 * Projectes i què executa cadascun:
 * - escriptori: Desktop Chrome, tota la bateria (misions de PC i de mòbil
 *   segons `isMobile`).
 * - mobil: Pixel 7 en vertical, tota la bateria (misions de mòbil; les de PC
 *   queden saltades perquè hi apareix la petició de girar).
 * - mobil-horitzontal: Pixel 7 en horitzontal, els specs de mòbil clau i les
 *   missions de PC escalades (la resta duplicaria la durada sense aportar
 *   cobertura).
 * - panell: Desktop Chrome, només el panell de missions; panell-estadistiques,
 *   després, la pantalla d'estadístiques. Publiquen missions de
 *   prova que surten a /simulador/, i per això corre quan els altres ja han
 *   acabat (`dependencies`) i cap dels altres l'inclou.
 * - compte: Desktop Chrome, només la pantalla de compte (sèrie, un sol compte de
 *   prova per execució; sense dependències per poder-lo llançar sol).
 * - El compte dins del simulador (compte-simulador.spec.js) corre només a
 *   escriptori, en sèrie i amb un sol usuari de prova.
 */
const SPEC_PANELL = /(panel-missions|estadistiques)\.spec\.js$/;
const SPEC_COMPTE = /compte(-recuperacio)?\.spec\.js$/;
const SPEC_COMPTE_SIMULADOR = /compte-simulador\.spec\.js$/;
const SPECS_HORITZONTAL =
	/(paquet|canviat|farcit|so|selector|factura|banc|pc-mobil|finestres|guia-tutorial|ancores|tutorial)\.spec\.js$/;

/*
 * Idioma (NEP_LANG):
 * - sense variable o NEP_LANG=ca: la bateria catalana de sempre, contra `/ca/`
 *   (les rutes surten de `tests/e2e/rutes.js`), locale ca-ES. Ignora
 *   `tests/e2e/es/`.
 * - NEP_LANG=es: només `tests/e2e/es/` (smoke, axe i recorreguts en castellà),
 *   locale es-ES, arrel en castellà.
 * Playwright resol les rutes absolutes (`/simulador/`) contra l'origen, no
 * contra la baseURL; per això `ruta()` ja retorna el camí amb el prefix.
 */
const NEP_LANG = [ 'es', 'ca' ].includes( process.env.NEP_LANG )
	? process.env.NEP_LANG
	: null;
const BASE = ( process.env.WP_BASE_URL || 'http://localhost:8888' ).replace(
	/\/+$/,
	''
);
const ES = NEP_LANG === 'es';
const SPEC_ES = /[\\/]e2e[\\/]es[\\/]/;
/** testIgnore d'un projecte: sense NEP_LANG=es, també la carpeta `es/`. */
const ignora = ( ...patrons ) => ( ES ? patrons : [ ...patrons, SPEC_ES ] );

module.exports = defineConfig( {
	testDir: ES ? './tests/e2e/es' : './tests/e2e',
	use: {
		baseURL: NEP_LANG === 'ca' ? `${ BASE }/ca/` : BASE,
		locale: ES ? 'es-ES' : 'ca-ES',
	},
	projects: [
		{
			name: 'escriptori',
			use: { ...devices[ 'Desktop Chrome' ] },
			testIgnore: ignora( SPEC_PANELL, SPEC_COMPTE ),
		},
		{
			name: 'mobil',
			use: { ...devices[ 'Pixel 7' ] },
			testIgnore: ignora(
				SPEC_PANELL,
				SPEC_COMPTE,
				SPEC_COMPTE_SIMULADOR
			),
		},
		{
			name: 'mobil-horitzontal',
			use: { ...devices[ 'Pixel 7 landscape' ] },
			testMatch: SPECS_HORITZONTAL,
		},
		{
			name: 'panell',
			use: { ...devices[ 'Desktop Chrome' ] },
			testMatch: /panel-missions\.spec\.js$/,
			dependencies: [ 'escriptori', 'mobil', 'mobil-horitzontal' ],
		},
		// Després del panell, no en paral·lel: la pantalla d'estadístiques (mateix
		// usuari admin) mostraria i esborraria l'avís `nep_avis_1` que espera panel-missions.
		{
			name: 'panell-estadistiques',
			use: { ...devices[ 'Desktop Chrome' ] },
			testMatch: /(?<!resum-)estadistiques\.spec\.js$/,
			dependencies: [ 'panell' ],
		},
		// Després de les estadístiques: les seves dades demo toquen totes les
		// missions jugables, també la de prova que publica aquest spec.
		{
			name: 'panell-resum',
			use: { ...devices[ 'Desktop Chrome' ] },
			testMatch: /resum-estadistiques\.spec\.js$/,
			dependencies: [ 'panell-estadistiques' ],
		},
		{
			name: 'compte',
			use: { ...devices[ 'Desktop Chrome' ] },
			testMatch: SPEC_COMPTE,
		},
	],
} );
