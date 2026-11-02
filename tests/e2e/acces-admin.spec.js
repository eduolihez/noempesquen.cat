/**
 * Accés amagat a l'administració: /admin serveix l'entrada i les rutes
 * habituals de WordPress no ho revelen. També comprova la icona del web.
 */
const { test, expect } = require( '@playwright/test' );

test.describe( 'accés a l’administració', () => {
	test( '/admin mostra el formulari d’entrada de WordPress', async ( { page } ) => {
		const resposta = await page.goto( '/admin/' );
		expect( resposta.status() ).toBe( 200 );
		await expect( page.locator( '#loginform' ) ).toBeVisible();
		await expect( page.locator( '#loginform' ) ).toHaveAttribute( 'action', /\/admin\/?$/ );
	} );

	test( 'wp-login.php, /wp-admin/, /login i /dashboard donen 404 sense sessió', async ( { request } ) => {
		for ( const ruta of [ '/wp-login.php', '/wp-login.php?action=lostpassword', '/wp-admin/', '/login', '/dashboard' ] ) {
			const resposta = await request.get( ruta, { maxRedirects: 0 } );
			expect( resposta.status(), ruta ).toBe( 404 );
		}
	} );

	test( 'els enllaços de recuperació apunten a /admin', async ( { page } ) => {
		await page.goto( '/admin/' );
		await expect( page.locator( 'a.wp-login-lost-password' ) ).toHaveAttribute( 'href', /\/admin\/\?action=lostpassword/ );
	} );

	test( 'admin-ajax.php segueix responent sense sessió', async ( { request } ) => {
		const resposta = await request.get( '/wp-admin/admin-ajax.php?action=nep_inexistent' );
		expect( resposta.status() ).not.toBe( 404 );
	} );
} );

test.describe( 'icona del web', () => {
	test( 'el cap porta la icona pròpia i /favicon.ico no és la de WordPress', async ( { page, request } ) => {
		await page.goto( '/' );
		const icones = await page.locator( 'link[rel~="icon"], link[rel="apple-touch-icon"]' ).evaluateAll( ( ns ) => ns.map( ( n ) => n.href ) );
		expect( icones.length ).toBeGreaterThan( 0 );
		for ( const href of icones ) {
			expect( href ).toContain( '/themes/noempesquen/assets/img/favicon' );
			expect( ( await request.get( href ) ).status() ).toBe( 200 );
		}
		const ico = await request.get( '/favicon.ico', { maxRedirects: 0 } );
		expect( ico.headers().location || '' ).not.toContain( 'wp-includes' );
	} );
} );
