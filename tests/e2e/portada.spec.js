const { test, expect } = require( '@playwright/test' );

test( 'la portada carrega en català', async ( { page } ) => {
	await page.goto( '/' );
	await expect( page.locator( 'html' ) ).toHaveAttribute( 'lang', /^ca/ );
} );
