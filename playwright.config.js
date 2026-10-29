// @ts-check
const { defineConfig, devices } = require( '@playwright/test' );

module.exports = defineConfig( {
	testDir: './tests/e2e',
	use: { baseURL: process.env.WP_BASE_URL || 'http://localhost:8888', locale: 'ca-ES' },
	projects: [
		{ name: 'escriptori', use: { ...devices[ 'Desktop Chrome' ] } },
		{ name: 'mobil', use: { ...devices[ 'Pixel 7' ] } },
	],
} );
