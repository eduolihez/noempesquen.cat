const { test, expect } = require( './ajudes' );
const {
	greusAxe,
	inspecciona,
	iniciaMissio,
	saltaIntro,
	petits,
	escoltaFuites,
	sensePistes,
} = require( './ajudes' );
const MISSIO_JSON = require( '../../plugins/noempesquen-core/missions/ca/remei-05-comprador.json' );

const MISSIO = /Compro la teva bici/;
const BLOQUEIG = /Llisca cap amunt/;
const COMPRADOR = 'Jordi M.';
const DARRER = "Si no ho fas avui, ho agafo d'un altre.";
const INDICIS_XAT = [
	'Em va perfecte, la vull. No cal que la vegi.',
	"Et pago ara per Revenda Cobra; t'envio un enllaç per cobrar.",
	DARRER,
];
// Valors escrits a mà: no han de quedar enlloc.
const FORMULARI = {
	'Nom i cognoms': 'Zqx Nom Comprador',
	'Número de targeta': '4929 7731 0000 6624',
	Caducitat: '11/31',
	CVC: '846',
};
const MISSATGE_XAT = 'zqxbici7731 encara hi ets?';

const dock = ( page ) => page.getByRole( 'list', { name: 'Apps preferides' } );
const apps = ( page ) =>
	page.getByRole( 'list', { name: 'Apps', exact: true } );
const barraEstat = ( page ) =>
	page.getByRole( 'button', { name: /Obre el centre de control/ } );
const banners = ( page ) =>
	page.getByRole( 'list', { name: 'Notificacions noves' } );
const titolXat = ( page ) =>
	page.getByRole( 'heading', { level: 1, name: COMPRADOR, exact: true } );

async function entra( page ) {
	await iniciaMissio( page, MISSIO, BLOQUEIG );
	await page.getByRole( 'button', { name: BLOQUEIG } ).click();
	await expect( dock( page ) ).toBeVisible();
	// Cap avís de l'inici surt abans de la fi de la intro.
	await saltaIntro( page );
}

async function obreRevenda( page ) {
	await apps( page ).getByRole( 'button', { name: 'Revenda' } ).click();
	await expect(
		page.getByRole( 'heading', { level: 1, name: 'Revenda' } )
	).toBeVisible();
}

// Arriben els quatre missatges (fins als 46 s de joc).
async function esperaElsMissatges( page ) {
	await page.clock.runFor( 50000 );
}

async function obreXat( page ) {
	await page.getByRole( 'tab', { name: 'Xats' } ).click();
	await page.getByRole( 'button', { name: new RegExp( COMPRADOR ) } ).click();
	await expect( titolXat( page ) ).toBeVisible();
}

async function alXat( page ) {
	await entra( page );
	await esperaElsMissatges( page );
	await obreRevenda( page );
	await obreXat( page );
	await expect( page.getByText( DARRER, { exact: true } ) ).toBeVisible();
}

async function lupaDelCentre( page ) {
	await barraEstat( page ).click();
	const centre = page.getByRole( 'dialog', { name: 'Centre de control' } );
	await expect( centre ).toBeVisible();
	await centre.getByRole( 'button', { name: /Lupa/ } ).click();
	await expect( centre ).toBeHidden();
}

async function obreLaWeb( page ) {
	await page.getByRole( 'link', { name: 'Cobra aquí' } ).click();
	await expect(
		page.getByRole( 'textbox', { name: 'Nom i cognoms' } )
	).toBeVisible();
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

// Amb el rellotge fals, l'animationend del bloqueig no arriba i els bàners
// es quedarien en silenci: amb menys moviment el bloqueig s'amaga de cop.
test.use( { reducedMotion: 'reduce' } );

test.beforeEach( ( { isMobile } ) => {
	test.skip( ! isMobile, 'Només al projecte mòbil' );
} );

test.describe( 'Compro la teva bici', () => {
	test( 'els missatges s’anuncien i la notificació obre el xat', async ( {
		page,
	} ) => {
		await entra( page );
		await page.clock.runFor( 7000 );
		const banner = banners( page ).getByRole( 'button', {
			name: /Encara la tens\?/,
		} );
		await expect( banner ).toBeVisible();
		await expect( banner ).toContainText( COMPRADOR );
		await expect(
			page.locator( '[aria-live="polite"]' ).filter( {
				hasText: COMPRADOR,
			} )
		).not.toHaveCount( 0 );
		await banner.click();
		await expect( titolXat( page ) ).toBeVisible();
		await expect(
			page.getByText( 'Hola! Encara la tens? En quin estat està?', {
				exact: true,
			} )
		).toBeVisible();
	} );

	test( 'camí correcte: lupa, indicis i Bloqueja donen 3 estrelles', async ( {
		page,
	} ) => {
		await alXat( page );
		await lupaDelCentre( page );
		for ( const t of INDICIS_XAT ) {
			await inspecciona( page, t ).click();
		}
		await lupaDelCentre( page );
		await page
			.getByRole( 'button', { name: 'Bloqueja', exact: true } )
			.click();
		await expect( page.getByRole( 'dialog' ) ).toContainText( 'Ben fet!' );
		await veuResultat( page, 3 );
	} );

	test( 'pescat: l’enllaç del xat, autoompliment i «Cobra 120 €»', async ( {
		page,
	} ) => {
		await alXat( page );
		await obreLaWeb( page );
		await expect( page.getByText( 'revenda-cobra.com' ) ).not.toHaveCount(
			0
		);
		for ( const camp of Object.keys( FORMULARI ) ) {
			await page.getByRole( 'textbox', { name: camp } ).focus();
			await page
				.getByRole( 'button', { name: /Omple aquest camp/ } )
				.click();
		}
		await expect(
			page.getByRole( 'textbox', { name: 'Número de targeta' } )
		).toHaveValue( '4000 1234 5678 9010' );
		await page.getByRole( 'button', { name: 'Cobra 120 €' } ).click();
		const capa = page.getByRole( 'dialog' );
		await expect( capa ).toContainText( "T'han pescat!" );
		await veuResultat( page, 1 );
	} );

	test( 'el que s’escriu al xat i al formulari no surt enlloc', async ( {
		page,
	} ) => {
		const vist = escoltaFuites( page );
		await alXat( page );
		await page
			.getByRole( 'textbox', { name: 'Missatge' } )
			.fill( MISSATGE_XAT );
		await page
			.getByRole( 'button', { name: 'Envia', exact: true } )
			.click();
		await expect(
			page.getByRole( 'textbox', { name: 'Missatge' } )
		).toHaveValue( '' );
		// Acusament genèric al fil, sense el text, i un sol anunci.
		const fil = page.getByRole( 'log', {
			name: `Missatges amb ${ COMPRADOR }`,
		} );
		await expect(
			fil.getByRole( 'listitem' ).filter( { hasText: 'Missatge enviat' } )
		).toHaveCount( 1 );
		await expect( fil ).not.toContainText( MISSATGE_XAT );
		await expect( page.getByRole( 'status' ) ).toHaveText( [
			'Missatge enviat',
		] );
		await sensePistes( page, vist, [ MISSATGE_XAT ] );

		await obreLaWeb( page );
		for ( const [ camp, valor ] of Object.entries( FORMULARI ) ) {
			await page.getByRole( 'textbox', { name: camp } ).fill( valor );
		}
		await page.getByRole( 'button', { name: 'Cobra 120 €' } ).click();
		await expect( page.getByRole( 'dialog' ) ).toContainText(
			"T'han pescat!"
		);
		const tot = [ MISSATGE_XAT, ...Object.values( FORMULARI ) ];
		await sensePistes( page, vist, tot );
		await veuResultat( page, 1 );
		await sensePistes( page, vist, tot );
	} );

	// Bloquejar a remei-05 decideix i tanca el joc: es prova amb una variant
	// sense aquesta decisió perquè el joc continuï.
	test( 'el bloqueig es manté en sortir i tornar al xat', async ( {
		page,
	} ) => {
		const m = JSON.parse( JSON.stringify( MISSIO_JSON ) );
		m.disparadors = m.disparadors.filter( ( d ) => d.id !== 'bloquejat' );
		await page.route(
			( url ) => url.href.includes( 'noempesquen/v1/missions' ),
			( route ) => route.fulfill( { json: [ { guio: m } ] } )
		);
		await alXat( page );
		await page
			.getByRole( 'button', { name: 'Bloqueja', exact: true } )
			.click();
		await expect( page.getByRole( 'dialog' ) ).toHaveCount( 0 );
		// «Enrere» dues vegades: torna a la llista i tanca l'app (es desmunta).
		const enrere = page.getByRole( 'button', {
			name: 'Enrere',
			exact: true,
		} );
		await enrere.click();
		await enrere.click();
		await expect(
			page.getByRole( 'region', { name: 'Revenda' } )
		).toHaveCount( 0 );
		await obreRevenda( page );
		await obreXat( page );
		await expect(
			page.getByText(
				'Has bloquejat aquest usuari. Ja no et pot escriure.'
			)
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: 'Bloqueja', exact: true } )
		).toHaveCount( 0 );
	} );

	test( 'objectius tàctils de 44 px a 360 px: inici, anuncis, xat i web', async ( {
		page,
	} ) => {
		await page.setViewportSize( { width: 360, height: 740 } );
		await entra( page );
		// Les 11 apps del mòbil: la graella més les preferides del dock.
		const graella = await apps( page ).getByRole( 'listitem' ).count();
		const preferides = await dock( page ).getByRole( 'listitem' ).count();
		expect( graella + preferides ).toBe( 11 );
		expect( await petits( page ) ).toEqual( [] );
		await esperaElsMissatges( page );
		await obreRevenda( page );
		expect( await petits( page ) ).toEqual( [] );
		await obreXat( page );
		expect( await petits( page ) ).toEqual( [] );
		await obreLaWeb( page );
		await page.clock.runFor( 10000 );
		expect( await petits( page ) ).toEqual( [] );
	} );

	test.describe( 'accessibilitat', () => {
		test( 'sense violacions axe greus: anuncis de Revenda', async ( {
			page,
		} ) => {
			await entra( page );
			await obreRevenda( page );
			await expect(
				page.getByRole( 'heading', { name: 'Bici de muntanya' } )
			).toBeVisible();
			expect( await greusAxe( page ) ).toEqual( [] );
		} );

		test( 'sense violacions axe greus: xat del comprador', async ( {
			page,
		} ) => {
			await alXat( page );
			expect( await greusAxe( page ) ).toEqual( [] );
		} );

		test( 'sense violacions axe greus: web falsa', async ( { page } ) => {
			await alXat( page );
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
