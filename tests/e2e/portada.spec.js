const { test, expect } = require( '@playwright/test' );

// El català és l'idioma per defecte: l'arrel (`/`) redirigeix a `/ca/` sigui quin
// sigui l'idioma del navegador (aquí es-ES), llevat que s'hagi triat el castellà.
test( 'la portada redirigeix al català encara que el navegador sigui en castellà', async ( {
	browser,
} ) => {
	const context = await browser.newContext( { locale: 'es-ES' } );
	const page = await context.newPage();
	await page.goto( '/' );
	await expect( page ).toHaveURL( /\/ca\/$/ );
	await expect( page.locator( 'html' ) ).toHaveAttribute( 'lang', 'ca' );
	await context.close();
} );

// El castellà viu a l'arrel i s'hi arriba triant-lo al selector (galeta `nep_idioma=es`).
test( 'la portada carrega en castellà si s\'ha triat al selector', async ( {
	browser,
	baseURL,
} ) => {
	const context = await browser.newContext();
	await context.addCookies( [
		{ name: 'nep_idioma', value: 'es', url: new URL( baseURL ).origin },
	] );
	const page = await context.newPage();
	await page.goto( '/' );
	await expect( page.locator( 'html' ) ).toHaveAttribute( 'lang', 'es-ES' );
	await context.close();
} );
