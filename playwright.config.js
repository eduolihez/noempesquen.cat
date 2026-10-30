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
 * - panell: Desktop Chrome, només el panell de missions. Publica missions de
 *   prova que surten a /simulador/, i per això corre quan els altres ja han
 *   acabat (`dependencies`) i cap dels altres l'inclou.
 */
const SPEC_PANELL = /panel-missions\.spec\.js$/;
const SPECS_HORITZONTAL =
	/(paquet|canviat|farcit|so|selector|factura|banc|pc-mobil)\.spec\.js$/;

module.exports = defineConfig( {
	testDir: './tests/e2e',
	use: {
		baseURL: process.env.WP_BASE_URL || 'http://localhost:8888',
		locale: 'ca-ES',
	},
	projects: [
		{
			name: 'escriptori',
			use: { ...devices[ 'Desktop Chrome' ] },
			testIgnore: SPEC_PANELL,
		},
		{
			name: 'mobil',
			use: { ...devices[ 'Pixel 7' ] },
			testIgnore: SPEC_PANELL,
		},
		{
			name: 'mobil-horitzontal',
			use: { ...devices[ 'Pixel 7 landscape' ] },
			testMatch: SPECS_HORITZONTAL,
		},
		{
			name: 'panell',
			use: { ...devices[ 'Desktop Chrome' ] },
			testMatch: SPEC_PANELL,
			dependencies: [ 'escriptori', 'mobil', 'mobil-horitzontal' ],
		},
	],
} );
