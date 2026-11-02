const { test, expect, iniciaMissio, saltaIntro } = require( './ajudes' );

test.describe( 'Avisos de notificació', () => {
	test( 'en tàctil, tocar un banner no l’atura: caduca igualment', async ( {
		page,
		isMobile,
	} ) => {
		test.skip( ! isMobile, 'Només al mòbil' );
		await iniciaMissio( page, /El paquet retingut/, /Llisca cap amunt/ );
		await page.getByRole( 'button', { name: /Llisca cap amunt/ } ).click();
		await expect( page.locator( '.nep-so__sistema' ) ).toBeVisible();
		await saltaIntro( page );
		await page.clock.runFor( 9000 );
		const banner = page.locator( '.nep-so-m-banners li', {
			hasText: /paquet/i,
		} );
		await expect( banner ).toBeVisible();
		// Un toc real genera pointerover tàctil i, després, mouseover de
		// compatibilitat: cap dels dos no ha d'aturar el compte enrere.
		await banner.dispatchEvent( 'pointerover', {
			pointerType: 'touch',
			bubbles: true,
		} );
		await banner.dispatchEvent( 'mouseover', { bubbles: true } );
		await page.clock.runFor( 9500 );
		await expect( banner ).toHaveCount( 0 );
	} );
} );
