// @ts-check
const { defineConfig, devices } = require( '@playwright/test' );

/**
 * Projectes i què executa cadascun:
 * - escriptori: Desktop Chrome, tota la bateria (misions de PC i de mòbil
 *   segons `isMobile`).
 * - mobil: Pixel 7 en vertical, tota la bateria (misions de mòbil; les de PC
 *   queden saltades fins que T5 escali el PC).
 * - mobil-horitzontal: Pixel 7 en horitzontal, només els specs de mòbil clau
 *   (la resta de la bateria duplicaria la durada sense aportar cobertura).
 */
const SPECS_HORITZONTAL = /(paquet|canviat|farcit|so|selector)\.spec\.js$/;

module.exports = defineConfig( {
	testDir: './tests/e2e',
	use: { baseURL: process.env.WP_BASE_URL || 'http://localhost:8888', locale: 'ca-ES' },
	projects: [
		{ name: 'escriptori', use: { ...devices[ 'Desktop Chrome' ] } },
		{ name: 'mobil', use: { ...devices[ 'Pixel 7' ] } },
		{
			name: 'mobil-horitzontal',
			use: { ...devices[ 'Pixel 7 landscape' ] },
			testMatch: SPECS_HORITZONTAL,
		},
	],
} );
