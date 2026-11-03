const { test, expect } = require( '@playwright/test' );

// L'arrel és castellà (`/`); el català viu a `/ca/` (pàgines a T09c).
test( 'la portada carrega en castellà', async ( { page } ) => {
	await page.goto( '/' );
	await expect( page.locator( 'html' ) ).toHaveAttribute( 'lang', 'es-ES' );
} );
