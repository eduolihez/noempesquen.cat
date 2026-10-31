const { spawnSync } = require( 'node:child_process' );
const AxeBuilder = require( '@axe-core/playwright' ).default;
const { test, expect } = require( '@playwright/test' );

/**
 * Formulari de contacte (/contacte/): errors, camp trampa, correu invàlid,
 * enviament simulat amb page.route (mai s'envia cap correu real), axe i
 * recorregut només amb teclat.
 */
const ARREL = `${ __dirname }/../..`;

/**
 * WP-CLI a wp-env sense passar per cap shell.
 *
 * @param {...string} args Arguments de `wp`.
 * @return {string} Sortida estàndard.
 */
function wp( ...args ) {
	const r = spawnSync(
		process.execPath,
		[
			'-r',
			'./scripts/dns-fix.cjs',
			'./node_modules/@wordpress/env/bin/wp-env',
			'run',
			'cli',
			'wp',
			...args,
		],
		{ cwd: ARREL, encoding: 'utf8', timeout: 120000 }
	);
	return r.stdout || '';
}

test.beforeAll( () => {
	if (
		! wp(
			'post',
			'list',
			'--post_type=page',
			'--name=contacte',
			'--field=ID'
		).match( /\d+/ )
	) {
		wp(
			'post',
			'create',
			'--post_type=page',
			'--post_name=contacte',
			'--post_title=Contacte',
			'--post_status=publish',
			'--post_content=<!-- wp:noempesquen/contacte /-->'
		);
	}
} );

const bloc = ( page ) => page.locator( '.wp-block-noempesquen-contacte' );
const ENVIA = 'Envia el missatge';

/**
 * Violacions axe greus dins del bloc.
 *
 * @param {import('@playwright/test').Page} page
 */
async function greusAxe( page ) {
	const resultat = await new AxeBuilder( { page } )
		.include( '.wp-block-noempesquen-contacte' )
		.withTags( [ 'wcag2a', 'wcag2aa', 'wcag22aa' ] )
		.analyze();
	return resultat.violations
		.filter( ( v ) => [ 'serious', 'critical' ].includes( v.impact ) )
		.map( ( v ) => ( {
			id: v.id,
			targets: v.nodes.map( ( n ) => n.target.join( ' ' ) ),
		} ) );
}

/**
 * Omple el formulari amb dades vàlides.
 *
 * @param {import('@playwright/test').Page} page
 */
async function omple( page ) {
	await page.getByLabel( 'Nom', { exact: true } ).fill( 'Carla' );
	await page.getByLabel( 'Correu electrònic' ).fill( 'carla@example.com' );
	await page.getByLabel( 'Assumpte' ).selectOption( 'Dubte' );
	await page
		.getByLabel( 'Missatge', { exact: true } )
		.fill( 'Tinc un dubte sobre una missió.' );
	await page.getByLabel( /He llegit l.avís de privacitat/ ).check();
}

/**
 * Intercepta el POST de contacte (cap correu real) i en desa els cossos.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object}                          resposta `{ status, body, retard }`.
 * @return {Promise<Object[]>} Cossos enviats (array viu).
 */
async function simulaPost( page, resposta ) {
	const enviats = [];
	await page.route( '**/noempesquen/v1/contacte*', async ( ruta ) => {
		enviats.push( ruta.request().postDataJSON() );
		if ( resposta.retard ) {
			await new Promise( ( r ) => setTimeout( r, resposta.retard ) );
		}
		await ruta.fulfill( {
			status: resposta.status,
			contentType: 'application/json',
			body: JSON.stringify( resposta.body ),
		} );
	} );
	return enviats;
}

test( 'camps buits: errors associats, resum i focus al primer camp', async ( {
	page,
} ) => {
	const enviats = await simulaPost( page, {
		status: 200,
		body: { ok: true },
	} );
	await page.goto( '/contacte/' );
	await expect( bloc( page ).locator( 'form' ) ).toBeVisible();
	await page.getByRole( 'button', { name: ENVIA } ).click();

	const nom = page.getByLabel( 'Nom', { exact: true } );
	await expect( nom ).toBeFocused();
	await expect( nom ).toHaveAttribute( 'aria-invalid', 'true' );
	await expect( nom ).toHaveAttribute(
		'aria-describedby',
		'contacte-nom-error'
	);
	await expect( page.locator( '#contacte-nom-error' ) ).toHaveText(
		'Escriu el teu nom.'
	);
	await expect( page.locator( '#contacte-privacitat-error' ) ).toBeVisible();
	await expect(
		bloc( page ).locator( '.nep-contacte__resum li' )
	).toHaveCount( 5 );
	expect( await greusAxe( page ) ).toEqual( [] );
	expect( enviats ).toHaveLength( 0 );
} );

test( 'correu invàlid: error de format i cap petició', async ( { page } ) => {
	const enviats = await simulaPost( page, {
		status: 200,
		body: { ok: true },
	} );
	await page.goto( '/contacte/' );
	await omple( page );
	await page.getByLabel( 'Correu electrònic' ).fill( 'no-es-un-correu' );
	await page.getByRole( 'button', { name: ENVIA } ).click();
	await expect( page.getByLabel( 'Correu electrònic' ) ).toBeFocused();
	await expect( page.locator( '#contacte-correu-error' ) ).toContainText(
		'correu vàlid'
	);
	expect( enviats ).toHaveLength( 0 );
} );

test( 'camp trampa: fora del teclat, ocult a les ajudes tècniques i buit', async ( {
	page,
} ) => {
	const enviats = await simulaPost( page, {
		status: 200,
		body: { ok: true },
	} );
	await page.goto( '/contacte/' );
	const web = bloc( page ).locator( 'input[name="web"]' );
	await expect( web ).toHaveAttribute( 'tabindex', '-1' );
	await expect( bloc( page ).locator( '.nep-contacte__web' ) ).toHaveAttribute(
		'aria-hidden',
		'true'
	);
	const caixa = await web.boundingBox();
	expect( caixa.x + caixa.width ).toBeLessThan( 0 );
	await omple( page );
	await page.getByRole( 'button', { name: ENVIA } ).click();
	await expect(
		page.getByRole( 'heading', { name: 'Missatge enviat' } )
	).toBeVisible();
	expect( enviats ).toHaveLength( 1 );
	expect( enviats[ 0 ].web ).toBe( '' );
} );

test( 'enviament vàlid: estat enviant, confirmació amb focus i cos correcte', async ( {
	page,
} ) => {
	const enviats = await simulaPost( page, {
		status: 200,
		body: { ok: true },
		retard: 600,
	} );
	await page.goto( '/contacte/' );
	await omple( page );
	await page.getByRole( 'button', { name: ENVIA } ).click();
	const enviant = page.getByRole( 'button', { name: /S.està enviant/ } );
	await expect( enviant ).toBeDisabled();
	await expect( enviant ).toHaveAttribute( 'aria-busy', 'true' );

	const confirmacio = bloc( page ).locator( '.nep-contacte__confirmacio' );
	await expect( confirmacio ).toBeVisible();
	await expect( confirmacio ).toBeFocused();
	await expect( bloc( page ).locator( 'form' ) ).toHaveCount( 0 );
	expect( enviats ).toHaveLength( 1 );
	expect( enviats[ 0 ] ).toMatchObject( {
		nom: 'Carla',
		correu: 'carla@example.com',
		assumpte: 'Dubte',
		privacitat: true,
	} );
	expect( await greusAxe( page ) ).toEqual( [] );
} );

test( 'fallada del servidor: avís a la regió aria-live i dades conservades', async ( {
	page,
} ) => {
	await simulaPost( page, {
		status: 500,
		body: { ok: false, message: 'Error' },
	} );
	await page.goto( '/contacte/' );
	await omple( page );
	await page.getByRole( 'button', { name: ENVIA } ).click();
	await expect( bloc( page ).locator( '[aria-live="polite"]' ) ).toContainText(
		/No s.ha pogut enviar/
	);
	await expect( page.getByLabel( 'Nom', { exact: true } ) ).toHaveValue(
		'Carla'
	);
	await expect( page.getByRole( 'button', { name: ENVIA } ) ).toBeEnabled();
} );

test( 'recorregut només amb teclat', async ( { page } ) => {
	const enviats = await simulaPost( page, {
		status: 200,
		body: { ok: true },
	} );
	await page.goto( '/contacte/' );
	await page.getByLabel( 'Nom', { exact: true } ).focus();
	await page.keyboard.type( 'Jordi' );
	await page.keyboard.press( 'Tab' );
	await expect( page.getByLabel( 'Correu electrònic' ) ).toBeFocused();
	await page.keyboard.type( 'jordi@example.com' );
	await page.keyboard.press( 'Tab' );
	await expect( page.getByLabel( 'Assumpte' ) ).toBeFocused();
	await page.keyboard.press( 'ArrowDown' );
	await page.keyboard.press( 'Tab' );
	await expect(
		page.getByLabel( 'Missatge', { exact: true } )
	).toBeFocused();
	await page.keyboard.type( 'Un suggeriment prou llarg.' );
	await page.keyboard.press( 'Tab' );
	await expect( page.getByLabel( /He llegit l.avís/ ) ).toBeFocused();
	await page.keyboard.press( 'Space' );
	// Enllaç de privacitat, i després el botó (el camp trampa no rep focus).
	await page.keyboard.press( 'Tab' );
	await expect(
		bloc( page ).getByRole( 'link', { name: 'avís de privacitat' } )
	).toBeFocused();
	await page.keyboard.press( 'Tab' );
	await expect( page.getByRole( 'button', { name: ENVIA } ) ).toBeFocused();
	await page.keyboard.press( 'Enter' );
	await expect(
		bloc( page ).locator( '.nep-contacte__confirmacio' )
	).toBeFocused();
	expect( enviats ).toHaveLength( 1 );
	expect( enviats[ 0 ].assumpte ).not.toBe( '' );
} );
