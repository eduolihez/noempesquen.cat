const { test, expect } = require( '@playwright/test' );
const {
	greusAxe,
	inspecciona,
	iniciaMissio,
	petits,
	escoltaFuites,
	sensePistes,
} = require( './ajudes' );

const MISSIO = /Has guanyat un sorteig!/;
const BLOQUEIG = /Llisca cap amunt/;
const INDICIS_PUBLICACIO = [
	'@cal.roig.botlga',
	"Has estat triat i t'emportes un viatge de luxe per a dues persones, més un mòbil de gamma alta.",
	'Has guanyat el sorteig!',
	'Només avui, o el premi passa a un altre.',
];
// Valors escrits a mà: no han de quedar enlloc.
const FORMULARI = {
	'Nom i cognoms': 'Zqx Nom Sorteig',
	'Número de targeta': '4929 7731 0000 5518',
	Caducitat: '11/31',
	CVC: '739',
};

const barraEstat = ( page ) =>
	page.getByRole( 'button', { name: /Obre el centre de control/ } );
const dock = ( page ) => page.getByRole( 'list', { name: 'Apps preferides' } );
const apps = ( page ) =>
	page.getByRole( 'list', { name: 'Apps', exact: true } );
const ullada = ( page ) => page.getByRole( 'region', { name: 'Ullada' } );
const fals = ( page ) =>
	ullada( page )
		.getByRole( 'article', { name: /Publicació de/ } )
		.first();

async function entra( page ) {
	await iniciaMissio( page, MISSIO, BLOQUEIG );
	await page.getByRole( 'button', { name: BLOQUEIG } ).click();
	await expect( dock( page ) ).toBeVisible();
}

async function obreUllada( page ) {
	await apps( page ).getByRole( 'button', { name: 'Ullada' } ).click();
	await expect( ullada( page ) ).toBeVisible();
	await expect( fals( page ) ).toBeVisible();
}

async function alFeed( page ) {
	await entra( page );
	await obreUllada( page );
}

async function lupaDelCentre( page ) {
	await barraEstat( page ).click();
	const centre = page.getByRole( 'dialog', { name: 'Centre de control' } );
	await expect( centre ).toBeVisible();
	await centre.getByRole( 'button', { name: /Lupa/ } ).click();
	await expect( centre ).toBeHidden();
}

async function obreLaWeb( page ) {
	await ullada( page )
		.getByRole( 'link', { name: 'Reclama el teu premi' } )
		.click();
	await expect(
		page.getByRole( 'textbox', { name: 'Nom i cognoms' } )
	).toBeVisible();
}

async function ompleFormulari( page ) {
	for ( const [ camp, valor ] of Object.entries( FORMULARI ) ) {
		await page.getByRole( 'textbox', { name: camp } ).fill( valor );
	}
}

async function veuResultat( page, estrelles ) {
	await page
		.getByRole( 'dialog' )
		.getByRole( 'button', { name: 'Veure el resultat' } )
		.click();
	await expect(
		page.getByRole( 'img', { name: `${ estrelles } de 3 estrelles` } )
	).toBeVisible();
}

// Amb el rellotge fals, l'animationend del bloqueig no arriba: amb menys
// moviment el bloqueig s'amaga de cop.
test.use( { reducedMotion: 'reduce' } );

test.beforeEach( ( { isMobile } ) => {
	test.skip( ! isMobile, 'Només al projecte mòbil' );
} );

test.describe( 'Has guanyat un sorteig!', () => {
	test( 'camí correcte: lupa, indicis i denunciar donen 3 estrelles', async ( {
		page,
	} ) => {
		await alFeed( page );
		await lupaDelCentre( page );
		for ( const t of INDICIS_PUBLICACIO ) {
			await inspecciona( page, t ).click();
		}
		await lupaDelCentre( page );
		const boto = fals( page ).getByRole( 'button', {
			name: /^Denuncia la publicació/,
		} );
		await boto.click();
		await expect( page.getByRole( 'dialog' ) ).toContainText( 'Ben fet!' );
		await veuResultat( page, 3 );
	} );

	test( 'denunciar la botiga de veritat no tanca la missió', async ( {
		page,
	} ) => {
		await alFeed( page );
		const real = ullada( page ).getByRole( 'article' ).nth( 1 );
		await real
			.getByRole( 'button', { name: /^Denuncia la publicació/ } )
			.click();
		await expect( real.getByRole( 'status' ) ).toHaveText(
			'Denunciada. Gràcies.'
		);
		await expect( page.getByRole( 'dialog' ) ).toHaveCount( 0 );
	} );

	test( 'el botó Denuncia és gran, queda desactivat i anuncia l’estat', async ( {
		page,
	} ) => {
		await alFeed( page );
		const article = fals( page );
		const boto = article.getByRole( 'button', {
			name: /^Denuncia la publicació/,
		} );
		const caixa = await boto.boundingBox();
		expect( caixa.height ).toBeGreaterThanOrEqual( 44 );
		expect( caixa.width ).toBeGreaterThanOrEqual( 44 );
		await expect( boto ).toHaveAttribute( 'aria-disabled', 'false' );
		await boto.click();
		await expect( boto ).toHaveAttribute( 'aria-disabled', 'true' );
		await expect( article.getByRole( 'status' ) ).toHaveText(
			'Denunciada. Gràcies.'
		);
	} );

	test( 'pescat: pagar a la web falsa (sense que el que s’escriu surti)', async ( {
		page,
	} ) => {
		const vist = escoltaFuites( page );
		await alFeed( page );
		await obreLaWeb( page );
		await omplenaIPaga( page );

		const capa = page.getByRole( 'dialog' );
		await expect( capa ).toContainText( "T'han pescat!" );
		await expect( capa ).toContainText( 'Has pagat' );
		await sensePistes( page, vist, Object.values( FORMULARI ) );
		await veuResultat( page, 1 );
		await sensePistes( page, vist, Object.values( FORMULARI ) );
	} );

	test( 'l’autor de cada publicació es veu bé al costat del text', async ( {
		page,
	} ) => {
		await alFeed( page );
		await fals( page ).scrollIntoViewIfNeeded();
		await expect(
			fals( page ).locator( '.nep-ullada-pub__autor' )
		).toBeVisible();
		await fals( page ).screenshot( {
			path: 'test-results/sorteig-publicacio-falsa.png',
		} );
		const real = ullada( page ).getByRole( 'article' ).nth( 1 );
		await real.scrollIntoViewIfNeeded();
		await real.screenshot( {
			path: 'test-results/sorteig-publicacio-real.png',
		} );
	} );

	test( 'objectius tàctils de 44 px: feed d’Ullada i web falsa', async ( {
		page,
	} ) => {
		await alFeed( page );
		expect( await petits( page ) ).toEqual( [] );
		await obreLaWeb( page );
		await page.clock.runFor( 10000 );
		expect( await petits( page ) ).toEqual( [] );
	} );

	test.describe( 'accessibilitat', () => {
		test( 'sense violacions axe greus: feed d’Ullada', async ( {
			page,
		} ) => {
			await alFeed( page );
			expect( await greusAxe( page ) ).toEqual( [] );
		} );

		test( 'sense violacions axe greus: web falsa', async ( { page } ) => {
			await alFeed( page );
			await obreLaWeb( page );
			// El banner del guia tapa la barra un moment: espera que marxi.
			await page.clock.runFor( 10000 );
			await expect(
				page.getByRole( 'button', { name: /Pestanyes/ } )
			).toBeVisible();
			expect( await greusAxe( page ) ).toEqual( [] );
		} );
	} );
} );

async function omplenaIPaga( page ) {
	await ompleFormulari( page );
	await page.getByRole( 'button', { name: /^Paga/ } ).click();
}
