const { test, expect } = require( '@playwright/test' );
const {
	greusAxePc,
	inspecciona,
	iniciaMissio,
	escoltaFuites,
	sensePistes,
} = require( './ajudes' );
const MISSIO_JSON = require( '../../plugins/noempesquen-core/missions/llissa-04-suport.json' );

const MISSIO = /Virus detectat!/;
const BLOQUEIG = /Clica o prem/;
const AVIS = MISSIO_JSON.webs[ 'cuinaravui.cat' ].avis;
const TELEFON = AVIS.telefon;
const INSTALA = AVIS.instal_la.text_boto;
// Text escrit a mà amb l'avís obert: no ha de quedar enlloc.
const ESCRIT = 'Zqxprovasuport7731';
// Rastres d'una baixada o d'un fitxer real.
const BAIXADA = /blob:|\.exe|suport-segur-digital\.top|download/i;

const barraTasques = ( page ) =>
	page.getByRole( 'navigation', { name: 'Barra de tasques' } );
const parla = ( page ) => page.getByRole( 'region', { name: 'Parla' } );
const avis = ( page ) => page.getByRole( 'alertdialog' );
const baixada = ( page ) => page.getByRole( 'dialog', { name: 'Baixada' } );
const pausa = ( page ) => page.getByRole( 'dialog', { name: 'Pausa' } );
const consequencia = ( page ) =>
	page.getByRole( 'dialog' ).filter( { hasText: 'Veure el resultat' } );
const escapa = ( text ) => text.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
const textsDelCos = () =>
	AVIS.cos.flat().map( ( seg ) => ( { t: seg.t, senyal: seg.senyal } ) );

// Desbloqueja, salta la presentació i porta el navegador al davant.
async function entra( page ) {
	await iniciaMissio( page, MISSIO, BLOQUEIG );
	await page.getByRole( 'button', { name: BLOQUEIG } ).click();
	await expect( parla( page ) ).toBeVisible();
	await parla( page )
		.getByRole( 'button', { name: 'Salta la presentació' } )
		.click();
	await barraTasques( page )
		.getByRole( 'button', { name: /^Navegador/ } )
		.click();
	// Fora de la barra de tasques: la seva pista flotant també consumiria Esc.
	await page.mouse.move( 0, 0 );
	await expect(
		page.getByRole( 'heading', { name: 'Crema de carbassa en 20 minuts' } )
	).toBeVisible();
}

// Espera els 8 s de joc de l'avís.
async function ambAvis( page ) {
	await entra( page );
	await page.clock.runFor( 7000 );
	await expect( avis( page ) ).toHaveCount( 0 );
	await page.clock.runFor( 1500 );
	await expect( avis( page ) ).toBeVisible();
}

async function decideix( page, text ) {
	// L'avís és dins del navegador: Parla ha de passar al davant.
	await barraTasques( page )
		.getByRole( 'button', { name: /^Parla/ } )
		.click();
	await parla( page )
		.getByRole( 'button', { name: 'Ja ho tinc clar' } )
		.click();
	await parla( page )
		.getByRole( 'button', { name: new RegExp( `^${ escapa( text ) }` ) } )
		.click();
}

async function veuResultat( page, estrelles ) {
	await consequencia( page )
		.getByRole( 'button', { name: 'Veure el resultat' } )
		.click();
	await expect(
		page.getByRole( 'img', { name: `${ estrelles } de 3 estrelles` } )
	).toBeVisible();
}

// Escolta baixades reals i peticions sospitoses. Abans de `goto`.
function escoltaBaixades( page ) {
	const vist = { baixades: 0, peticions: [] };
	page.on( 'download', () => vist.baixades++ );
	page.on( 'request', ( r ) => {
		if ( BAIXADA.test( r.url() ) ) {
			vist.peticions.push( r.url() );
		}
	} );
	return vist;
}

async function senseBaixades( page, vist ) {
	expect( vist.baixades ).toBe( 0 );
	expect( vist.peticions ).toEqual( [] );
	await expect( page.locator( 'a[download]' ) ).toHaveCount( 0 );
	await expect( page.locator( '[href^="blob:"]' ) ).toHaveCount( 0 );
}

// Cert si el focus és dins de l'avís.
const focusDinsAvis = ( page ) =>
	avis( page ).evaluate( ( dialeg ) =>
		dialeg.contains( dialeg.ownerDocument.activeElement )
	);

test.beforeEach( ( { isMobile } ) => {
	test.skip( isMobile, 'Només al projecte escriptori' );
} );

test.describe( 'Virus detectat!', () => {
	test( "l'avís surt al cap de 8 s amb el focus a dins", async ( {
		page,
	} ) => {
		await ambAvis( page );
		await expect( avis( page ) ).toContainText( AVIS.titol );
		await expect(
			avis( page ).getByRole( 'button', { name: 'Tanca', exact: true } )
		).toBeFocused();
		expect( await focusDinsAvis( page ) ).toBe( true );
	} );

	test( '«Tanca» no tanca: mostra «No s’ha pogut tancar»', async ( {
		page,
	} ) => {
		await ambAvis( page );
		await avis( page )
			.getByRole( 'button', { name: 'Tanca', exact: true } )
			.click();
		await expect( avis( page ).getByRole( 'status' ) ).toHaveText(
			"No s'ha pogut tancar"
		);
		await expect( avis( page ) ).toBeVisible();
	} );

	test( 'Esc tanca l’avís sense obrir la pausa; el segon Esc la obre', async ( {
		page,
	} ) => {
		await ambAvis( page );
		await page.keyboard.press( 'Escape' );
		await expect( avis( page ) ).toHaveCount( 0 );
		await expect( pausa( page ) ).toHaveCount( 0 );
		await page.keyboard.press( 'Escape' );
		await expect( pausa( page ) ).toBeVisible();
	} );

	test( 'avís i baixada apilats: Esc tanca primer la baixada', async ( {
		page,
	} ) => {
		await ambAvis( page );
		await avis( page ).getByRole( 'button', { name: INSTALA } ).click();
		await expect( baixada( page ) ).toBeVisible();
		await expect(
			baixada( page ).getByRole( 'button', { name: 'Cancel·la' } )
		).toBeFocused();
		await page.keyboard.press( 'Escape' );
		await expect( baixada( page ) ).toHaveCount( 0 );
		await expect( avis( page ) ).toBeVisible();
		await expect( pausa( page ) ).toHaveCount( 0 );
		await page.keyboard.press( 'Escape' );
		await expect( avis( page ) ).toHaveCount( 0 );
		await expect( pausa( page ) ).toHaveCount( 0 );
		await page.keyboard.press( 'Escape' );
		await expect( pausa( page ) ).toBeVisible();
	} );

	test( 'en una altra pestanya abans de l’avís, Esc obre la pausa', async ( {
		page,
	} ) => {
		await entra( page );
		await page.getByRole( 'button', { name: 'Pestanya nova' } ).click();
		await page.clock.runFor( 10000 );
		await expect( avis( page ) ).toHaveCount( 0 );
		await page.keyboard.press( 'Escape' );
		await expect( pausa( page ) ).toBeVisible();
		await pausa( page ).getByRole( 'button', { name: 'Continua' } ).click();
		// En tornar a la recepta, l'avís encara ha d'esperar el seu temps.
		await page
			.getByRole( 'button', { name: /^Cuina Avui|Crema de carbassa/ } )
			.first()
			.click();
		await expect( avis( page ) ).toHaveCount( 0 );
		await page.clock.runFor( 9000 );
		await expect( avis( page ) ).toBeVisible();
	} );

	test( 'camí correcte: indicis amb la lupa i triar «a» donen 3 estrelles', async ( {
		page,
	} ) => {
		await ambAvis( page );
		const lupa = barraTasques( page ).getByRole( 'button', {
			name: 'Lupa',
			exact: true,
		} );
		await lupa.click();
		await expect( lupa ).toHaveAttribute( 'aria-pressed', 'true' );
		for ( const { t } of textsDelCos() ) {
			await inspecciona( page, t ).click();
		}
		await inspecciona( page, TELEFON ).click();
		await decideix(
			page,
			MISSIO_JSON.decisio.opcions.find( ( o ) => o.id === 'a' ).text
		);
		await expect( consequencia( page ) ).toContainText( 'Molt bé!' );
		await veuResultat( page, 3 );
	} );

	test( 'pescat: «Truca ara»', async ( { page } ) => {
		await ambAvis( page );
		await avis( page ).getByRole( 'button', { name: 'Truca ara' } ).click();
		await expect( consequencia( page ) ).toContainText( "T'han pescat!" );
		await veuResultat( page, 1 );
	} );

	test( 'pescat: instal·lar l’eina i «Obre»', async ( { page } ) => {
		await ambAvis( page );
		await avis( page ).getByRole( 'button', { name: INSTALA } ).click();
		await expect( baixada( page ) ).toContainText( AVIS.instal_la.fitxer );
		await expect( baixada( page ) ).toContainText( AVIS.instal_la.origen );
		await baixada( page ).getByRole( 'button', { name: 'Obre' } ).click();
		await expect( consequencia( page ) ).toContainText( "T'han pescat!" );
		await veuResultat( page, 1 );
	} );

	test( 'cap baixada real ni fuita del que s’escriu', async ( { page } ) => {
		const fuites = escoltaFuites( page );
		const baixades = escoltaBaixades( page );
		await ambAvis( page );
		await page.keyboard.type( ESCRIT );
		await avis( page ).getByRole( 'button', { name: INSTALA } ).click();
		await page.keyboard.type( ESCRIT );
		await senseBaixades( page, baixades );
		await baixada( page ).getByRole( 'button', { name: 'Obre' } ).click();
		await expect( consequencia( page ) ).toContainText( "T'han pescat!" );
		await senseBaixades( page, baixades );
		await sensePistes( page, fuites, [ ESCRIT ] );
		await veuResultat( page, 1 );
		await senseBaixades( page, baixades );
		await sensePistes( page, fuites, [ ESCRIT ] );
	} );

	test( 'activar la lupa amb el teclat no deixa el focus a <body>', async ( {
		page,
	} ) => {
		await ambAvis( page );
		const numero = avis( page ).getByRole( 'button', { name: TELEFON } );
		await numero.focus();
		await expect( numero ).toBeFocused();
		await page.keyboard.press( 'Alt+Shift+KeyL' );
		await expect(
			barraTasques( page ).getByRole( 'button', {
				name: 'Lupa',
				exact: true,
			} )
		).toHaveAttribute( 'aria-pressed', 'true' );
		expect( await focusDinsAvis( page ) ).toBe( true );
		// I en treure-la des d'un botó «Inspecciona» de l'avís, tampoc.
		await inspecciona( page, TELEFON ).focus();
		await page.keyboard.press( 'Alt+Shift+KeyL' );
		await expect(
			avis( page ).getByRole( 'button', { name: TELEFON } )
		).toBeVisible();
		expect( await focusDinsAvis( page ) ).toBe( true );
	} );

	test.describe( 'accessibilitat', () => {
		test( 'sense violacions axe greus: avís obert', async ( { page } ) => {
			await ambAvis( page );
			expect( await greusAxePc( page ) ).toEqual( [] );
		} );

		test( 'sense violacions axe greus: diàleg de baixada', async ( {
			page,
		} ) => {
			await ambAvis( page );
			await avis( page ).getByRole( 'button', { name: INSTALA } ).click();
			await expect( baixada( page ) ).toBeVisible();
			expect( await greusAxePc( page ) ).toEqual( [] );
		} );
	} );
} );
