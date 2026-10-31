const { test, expect } = require( './ajudes' );
const {
	greusAxe,
	inspecciona,
	iniciaMissio,
	petits,
	escoltaFuites,
	sensePistes,
} = require( './ajudes' );

const MISSIO = /Em passes el codi\?/;
const BLOQUEIG = /Llisca cap amunt/;
const MARTA = [
	'Ei! Em pots fer un favor?',
	"T'ha arribat un codi per SMS? Me'l passes? És urgent, el necessito ara!",
];
const SMS = [ "des d'un dispositiu nou", 'No el comparteixis amb ningú.' ];
// El jugador escriu el codi de l'SMS amb un espai, com el veu.
const CODI_ESCRIT = '482 913';
const DECISIO_CORRECTA = "No li passo el codi i l'aviso per un altre mitjà.";

const barraEstat = ( page ) =>
	page.getByRole( 'button', { name: /Obre el centre de control/ } );
const dock = ( page ) => page.getByRole( 'list', { name: 'Apps preferides' } );
const apps = ( page ) =>
	page.getByRole( 'list', { name: 'Apps', exact: true } );
const inici = ( page ) =>
	page
		.getByRole( 'navigation', { name: 'Navegació del sistema' } )
		.getByRole( 'button', { name: 'Inici', exact: true } );
const titolXat = ( page, nom ) =>
	page.getByRole( 'heading', { level: 3, name: nom, exact: true } );

async function entra( page ) {
	await iniciaMissio( page, MISSIO, BLOQUEIG );
	await page.getByRole( 'button', { name: BLOQUEIG } ).click();
	await expect( dock( page ) ).toBeVisible();
}

/** Mou el rellotge fins que han arribat l'SMS (18 s) i la petició (30 s). */
async function esperaTot( page ) {
	await page.clock.runFor( 30000 );
}

async function lupaDelCentre( page ) {
	await barraEstat( page ).click();
	const centre = page.getByRole( 'dialog', { name: 'Centre de control' } );
	await expect( centre ).toBeVisible();
	await centre.getByRole( 'button', { name: /Lupa/ } ).click();
	await expect( centre ).toBeHidden();
}

async function tornaALaLlista( page ) {
	const tornar = page.getByRole( 'button', { name: 'Torna als xats' } );
	if ( await tornar.isVisible() ) {
		await tornar.click();
	}
}

async function alXatDeMarta( page ) {
	await apps( page ).getByRole( 'button', { name: 'Parla' } ).click();
	await tornaALaLlista( page );
	await page.getByRole( 'button', { name: /^Marta/ } ).click();
	await expect( titolXat( page, 'Marta' ) ).toBeVisible();
}

async function alSms( page ) {
	await dock( page ).getByRole( 'button', { name: 'Missatges' } ).click();
	await page.locator( '[data-fil]' ).first().click();
	await expect( page.getByText( SMS[ 1 ], { exact: true } ) ).toBeVisible();
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

test.describe( 'Em passes el codi?', () => {
	test( 'el xat de la Marta rep els missatges amb el seu retard', async ( {
		page,
	} ) => {
		await entra( page );
		await alXatDeMarta( page );
		await expect(
			page.getByText( MARTA[ 0 ], { exact: true } )
		).toHaveCount( 0 );
		await page.clock.runFor( 8000 );
		await expect(
			page.getByText( MARTA[ 0 ], { exact: true } )
		).toBeVisible();
		await expect(
			page.getByText( MARTA[ 1 ], { exact: true } )
		).toHaveCount( 0 );
		await page.clock.runFor( 22000 );
		await expect(
			page.getByText( MARTA[ 1 ], { exact: true } )
		).toBeVisible();
	} );

	test( 'camí correcte: indicis i «No li passo el codi» donen 3 estrelles', async ( {
		page,
	} ) => {
		await entra( page );
		await esperaTot( page );
		await lupaDelCentre( page );
		// SMS.
		await alSms( page );
		for ( const t of SMS ) {
			await inspecciona( page, t ).click();
		}
		await inici( page ).click();
		// Xat de la Marta.
		await alXatDeMarta( page );
		for ( const t of MARTA ) {
			await inspecciona( page, t ).click();
		}
		await lupaDelCentre( page );
		// Decisió final amb el guia.
		await tornaALaLlista( page );
		await page.getByRole( 'button', { name: /^Remei/ } ).click();
		await expect( titolXat( page, 'Remei' ) ).toBeVisible();
		const salta = page.getByRole( 'button', {
			name: 'Salta la presentació',
		} );
		if ( await salta.isVisible() ) {
			await salta.click();
		}
		await page.getByRole( 'button', { name: 'Ja ho tinc clar' } ).click();
		await page.getByRole( 'button', { name: DECISIO_CORRECTA } ).click();
		await expect( page.getByRole( 'dialog' ) ).toContainText( 'Ben fet!' );
		await veuResultat( page, 3 );
	} );

	test( 'pescat: reenviar l’SMS del codi a la Marta', async ( { page } ) => {
		const vist = escoltaFuites( page );
		await entra( page );
		await esperaTot( page );
		await alSms( page );
		await page
			.getByRole( 'button', { name: 'Opcions del missatge' } )
			.last()
			.click();
		await page.getByRole( 'button', { name: 'Reenvia' } ).click();
		await page
			.getByRole( 'dialog', { name: /Reenvia a/ } )
			.getByRole( 'button', { name: /Marta/ } )
			.click();

		const capa = page.getByRole( 'dialog' );
		await expect( capa ).toContainText( "T'han pescat!" );
		await expect( capa ).toContainText( 'Has passat el codi' );
		await sensePistes( page, vist, [ CODI_ESCRIT, '482913' ], {
			dom: false,
		} );
		await veuResultat( page, 1 );
	} );

	test( 'pescat: teclejar el codi al xat de la Marta (el text escrit no surt)', async ( {
		page,
	} ) => {
		const vist = escoltaFuites( page );
		await entra( page );
		await esperaTot( page );
		await alXatDeMarta( page );
		const camp = page.getByRole( 'textbox', { name: 'Missatge' } );
		await expect( camp ).toBeEnabled();
		await camp.fill( CODI_ESCRIT );
		await page
			.getByRole( 'button', { name: 'Envia', exact: true } )
			.click();

		const capa = page.getByRole( 'dialog' );
		await expect( capa ).toContainText( "T'han pescat!" );
		// La bombolla pròpia és a la UI per disseny; només es mira fora d'ella.
		await sensePistes( page, vist, [ CODI_ESCRIT, '482913' ], {
			dom: false,
		} );
		await veuResultat( page, 1 );
		await sensePistes( page, vist, [ CODI_ESCRIT, '482913' ], {
			dom: false,
		} );
	} );

	test( 'un text qualsevol al xat de la Marta no pesca', async ( {
		page,
	} ) => {
		await entra( page );
		await esperaTot( page );
		await alXatDeMarta( page );
		await page
			.getByRole( 'textbox', { name: 'Missatge' } )
			.fill( 'No et passo res, t’he de trucar' );
		await page
			.getByRole( 'button', { name: 'Envia', exact: true } )
			.click();
		await expect( page.getByRole( 'dialog' ) ).toHaveCount( 0 );
	} );

	test( 'objectius tàctils de 44 px: SMS i xat de la Marta', async ( {
		page,
	} ) => {
		await entra( page );
		await esperaTot( page );
		await alSms( page );
		expect( await petits( page ) ).toEqual( [] );
		await inici( page ).click();
		await alXatDeMarta( page );
		await expect(
			page.getByRole( 'button', { name: 'Envia', exact: true } )
		).toBeVisible();
		expect( await petits( page ) ).toEqual( [] );
	} );

	test.describe( 'accessibilitat', () => {
		test( 'sense violacions axe greus: SMS del codi', async ( {
			page,
		} ) => {
			await entra( page );
			await esperaTot( page );
			await alSms( page );
			expect( await greusAxe( page ) ).toEqual( [] );
		} );

		test( 'sense violacions axe greus: xat de la Marta', async ( {
			page,
		} ) => {
			await entra( page );
			await esperaTot( page );
			await alXatDeMarta( page );
			await expect(
				page.getByText( MARTA[ 1 ], { exact: true } )
			).toBeVisible();
			expect( await greusAxe( page ) ).toEqual( [] );
		} );
	} );
} );
