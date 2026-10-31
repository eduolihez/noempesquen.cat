const { test, expect } = require( './ajudes' );
const { greusAxe, iniciaMissio, petits } = require( './ajudes' );

const MISSIO = /El paquet retingut/;
const BLOQUEIG = /Llisca cap amunt/;

const APPS = [
	'Parla',
	'Banc Sòlid',
	'Galeria',
	'Càmera',
	'Ullada',
	'Calculadora',
	'Rellotge',
	'Ajustos',
];

const quadricula = ( page ) =>
	page.getByRole( 'list', { name: 'Apps', exact: true } );
const dock = ( page ) => page.getByRole( 'list', { name: 'Apps preferides' } );
const inici = ( page ) =>
	page
		.getByRole( 'navigation', { name: 'Navegació del sistema' } )
		.getByRole( 'button', { name: 'Inici' } );

test.beforeEach( ( { isMobile } ) => {
	test.skip( ! isMobile, 'Només al projecte mòbil' );
} );

async function entra( page ) {
	await iniciaMissio( page, MISSIO, BLOQUEIG );
	await page.getByRole( 'button', { name: BLOQUEIG } ).click();
	await expect( dock( page ) ).toBeVisible();
}

const obre = async ( page, nom ) => {
	await quadricula( page ).getByRole( 'button', { name: nom } ).click();
};

test.describe( 'Apps de farciment del mòbil', () => {
	test( 'la quadrícula mostra les noves apps i el dock manté Missatges i Navegador', async ( {
		page,
	} ) => {
		await entra( page );
		for ( const nom of APPS ) {
			await expect(
				quadricula( page ).getByRole( 'button', { name: nom } )
			).toBeVisible();
		}
		await expect( dock( page ).getByRole( 'button' ) ).toHaveCount( 2 );
	} );

	for ( const nom of [
		'Galeria',
		'Càmera',
		'Ullada',
		'Calculadora',
		'Rellotge',
		'Ajustos',
	] ) {
		test( `${ nom }: s'obre, sense violacions axe greus i tornem a l'inici`, async ( {
			page,
		} ) => {
			await entra( page );
			await obre( page, nom );
			await expect(
				page.getByRole( 'region', { name: nom, exact: true } )
			).toBeVisible();
			expect( await greusAxe( page ) ).toEqual( [] );
			expect( await petits( page ) ).toEqual( [] );
			await inici( page ).click();
			await expect( quadricula( page ) ).toBeVisible();
		} );
	}

	test( 'Calculadora calcula 7 × 8 = 56', async ( { page } ) => {
		await entra( page );
		await obre( page, 'Calculadora' );
		const c = page.getByRole( 'region', { name: 'Calculadora' } );
		await c.getByRole( 'button', { name: '7', exact: true } ).click();
		await c.getByRole( 'button', { name: 'Multiplicar' } ).click();
		await c.getByRole( 'button', { name: '8', exact: true } ).click();
		await c.getByRole( 'button', { name: 'Igual' } ).click();
		await expect( c.getByRole( 'status' ) ).toHaveText( '56' );
	} );

	test( 'Calculadora recupera el focus en tornar a primer pla', async ( {
		page,
	} ) => {
		await entra( page );
		await obre( page, 'Calculadora' );
		await inici( page ).click();
		await obre( page, 'Calculadora' );
		await expect(
			page.locator( '.nep-calculadora:focus-within' )
		).toHaveCount( 1 );
	} );

	test( "Galeria: el visor s'obre, es navega i Esc el tanca sense obrir la pausa", async ( {
		page,
	} ) => {
		await entra( page );
		await obre( page, 'Galeria' );
		await page.locator( '[data-foto]' ).first().click();
		const visor = page.getByRole( 'dialog' );
		await expect( visor ).toBeVisible();
		expect( await greusAxe( page ) ).toEqual( [] );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Escape' );
		await expect( visor ).toBeHidden();
		await expect(
			page.getByRole( 'dialog', { name: /Pausa/ } )
		).toHaveCount( 0 );
		// ArrowRight va a la foto següent: el focus torna al botó de la foto
		// que s'estava mirant en tancar (no al de partida), que és on l'usuari
		// es queda al context de la graella.
		await expect( page.locator( '[data-foto]' ).nth( 1 ) ).toBeFocused();
	} );

	test( 'Ajustos: la subpantalla torna enrere i el focus no es perd', async ( {
		page,
	} ) => {
		await entra( page );
		await obre( page, 'Ajustos' );
		const a = page.getByRole( 'region', { name: 'Ajustos' } );
		await a.getByRole( 'button', { name: /Sobre el telèfon/ } ).click();
		await expect( a.getByText( 'Mòbil Nova 5' ) ).toBeVisible();
		const enrere = page
			.getByRole( 'navigation', { name: 'Navegació del sistema' } )
			.getByRole( 'button', { name: 'Enrere' } );
		await enrere.click();
		// El botó d'Enrere del sistema és fora de l'app i continua al DOM:
		// el focus hi roman (no cau a <body>) i no se'l roba a l'usuari.
		await expect(
			a.getByRole( 'heading', { name: 'Ajustos' } )
		).toBeVisible();
		await expect(
			a.getByRole( 'button', { name: /Sobre el telèfon/ } )
		).toBeVisible();
		await expect( enrere ).toBeFocused();
	} );

	test( 'Ullada: Mi agrada alterna i les pestanyes es mouen amb fletxes', async ( {
		page,
	} ) => {
		await entra( page );
		await obre( page, 'Ullada' );
		const u = page.getByRole( 'region', { name: 'Ullada' } );
		const pub = u.getByRole( 'article' ).first();
		const m = pub.getByRole( 'button', { name: "M'agrada" } );
		const likes = pub.locator( '.nep-ullada-pub__likes' );
		const abans = await likes.textContent();
		await expect( m ).toHaveAttribute( 'aria-pressed', 'false' );
		await m.click();
		await expect( m ).toHaveAttribute( 'aria-pressed', 'true' );
		await expect( likes ).not.toHaveText( abans );
		await m.click();
		await expect( m ).toHaveAttribute( 'aria-pressed', 'false' );
		await expect( likes ).toHaveText( abans );
		await u.getByRole( 'tab' ).first().focus();
		await page.keyboard.press( 'End' );
		await expect( u.getByRole( 'tab' ).last() ).toHaveAttribute(
			'aria-selected',
			'true'
		);
	} );

	test( 'Rellotge: les tres pestanyes responen a Home/End', async ( {
		page,
	} ) => {
		await entra( page );
		await obre( page, 'Rellotge' );
		const r = page.getByRole( 'region', { name: 'Rellotge' } );
		await r.getByRole( 'tab' ).first().focus();
		await page.keyboard.press( 'End' );
		await expect( r.getByRole( 'tab' ).last() ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		await page.keyboard.press( 'Home' );
		await expect( r.getByRole( 'tab' ).first() ).toHaveAttribute(
			'aria-selected',
			'true'
		);
	} );

	test( 'El Diari del Barri: carrega a diaridelbarri.cat i obre una notícia', async ( {
		page,
	} ) => {
		await entra( page );
		await dock( page ).getByRole( 'button', { name: 'Navegador' } ).click();
		const cerca = page.getByRole( 'textbox', {
			name: 'Cerca o escriu una adreça web',
		} );
		await cerca.fill( 'diaridelbarri.cat' );
		await cerca.press( 'Enter' );
		const h1 = page.locator( '.nep-dv h1' );
		await expect( h1 ).toHaveCount( 1 );
		await expect(
			page.getByRole( 'link', { name: /El Diari del Barri/ } ).first()
		).toBeVisible();
		expect( await greusAxe( page ) ).toEqual( [] );
		const url = page.url();
		await page.locator( '.nep-dv a[href*="/noticia/"]' ).first().click();
		expect( page.url() ).toBe( url );
		await expect( page.locator( '.nep-dv h1' ) ).toHaveCount( 1 );
		await expect(
			page.getByText( 'No hem trobat aquesta notícia' )
		).toHaveCount( 0 );
	} );
} );
