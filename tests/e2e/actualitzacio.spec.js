const { test, expect } = require( './ajudes' );
const {
	greusAxePc,
	inspecciona,
	iniciaMissio,
	escoltaFuites,
	sensePistes,
} = require( './ajudes' );
const MISSIO_JSON = require( '../../plugins/noempesquen-core/missions/llissa-05-actualitzacio.json' );

const MISSIO = /Actualitza el navegador/;
const BLOQUEIG = /Clica o prem/;
const BARRA = MISSIO_JSON.webs[ 'tempsavui.cat' ].barra;
// Text escrit a mà amb el diàleg obert: no ha de quedar enlloc.
const ESCRIT = 'Zqxprovaactualitza7731';
// Rastres d'una baixada o d'un fitxer real.
const BAIXADA = /blob:|\.exe|descarrega-navegador\.top|download/i;

const barraTasques = ( page ) =>
	page.getByRole( 'navigation', { name: 'Barra de tasques' } );
const parla = ( page ) => page.getByRole( 'region', { name: 'Parla' } );
const finestraNav = ( page ) =>
	page.getByRole( 'region', { name: /— Navegador$/ } );
const barra = ( page ) =>
	page.getByRole( 'region', { name: 'Avís del navegador' } );
const baixada = ( page ) => page.getByRole( 'dialog', { name: 'Baixada' } );
const pausa = ( page ) => page.getByRole( 'dialog', { name: 'Pausa' } );
const botoMenu = ( page ) =>
	page.getByRole( 'button', { name: 'Menú del navegador' } );
const quantA = ( page ) =>
	page.getByRole( 'dialog', { name: 'Quant a Brúixola' } );
const consequencia = ( page ) =>
	page.getByRole( 'dialog' ).filter( { hasText: 'Veure el resultat' } );
const escapa = ( text ) => text.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );

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
		page.getByRole( 'heading', { name: 'El temps al barri per a avui' } )
	).toBeVisible();
}

async function obreQuantA( page ) {
	await botoMenu( page ).click();
	await page.getByRole( 'button', { name: 'Quant a Brúixola' } ).click();
	await expect( quantA( page ) ).toBeVisible();
}

async function decideix( page, id ) {
	const { text } = MISSIO_JSON.decisio.opcions.find( ( o ) => o.id === id );
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

test.beforeEach( ( { isMobile } ) => {
	test.skip( isMobile, 'Només al projecte escriptori' );
} );

test.describe( 'Actualitza el navegador', () => {
	test( 'la barra es veu des del principi i «Tanca la barra» la treu', async ( {
		page,
	} ) => {
		await entra( page );
		await expect( barra( page ) ).toBeVisible();
		await expect( barra( page ) ).toContainText(
			'El teu navegador està desactualitzat.'
		);
		await barra( page )
			.getByRole( 'button', { name: 'Tanca la barra' } )
			.click();
		await expect( barra( page ) ).toHaveCount( 0 );
		await expect( consequencia( page ) ).toHaveCount( 0 );
	} );

	test( 'la barra tancada no torna en sortir de la web i tornar-hi', async ( {
		page,
	} ) => {
		await entra( page );
		await barra( page )
			.getByRole( 'button', { name: 'Tanca la barra' } )
			.click();
		await expect( barra( page ) ).toHaveCount( 0 );
		const adreces = page.getByRole( 'textbox', {
			name: "Barra d'adreces",
		} );
		await adreces.fill( 'diaridelbarri.cat' );
		await adreces.press( 'Enter' );
		await expect(
			page.getByRole( 'heading', {
				name: 'El temps al barri per a avui',
			} )
		).toHaveCount( 0 );
		await page.getByRole( 'button', { name: 'Enrere' } ).click();
		await expect(
			page.getByRole( 'heading', {
				name: 'El temps al barri per a avui',
			} )
		).toBeVisible();
		await expect( barra( page ) ).toHaveCount( 0 );
	} );

	test( '«Cancel·la» tanca la baixada sense pescar', async ( { page } ) => {
		await entra( page );
		await barra( page ).getByRole( 'button', { name: BARRA.boto } ).click();
		await expect( baixada( page ) ).toContainText( BARRA.fitxer );
		await expect( baixada( page ) ).toContainText( BARRA.origen );
		await expect(
			baixada( page ).getByRole( 'button', { name: 'Cancel·la' } )
		).toBeFocused();
		await baixada( page )
			.getByRole( 'button', { name: 'Cancel·la' } )
			.click();
		await expect( baixada( page ) ).toHaveCount( 0 );
		await page.clock.runFor( 1000 );
		await expect( consequencia( page ) ).toHaveCount( 0 );
	} );

	test( 'pescat: «Descarrega» i «Obre»', async ( { page } ) => {
		await entra( page );
		await barra( page ).getByRole( 'button', { name: BARRA.boto } ).click();
		await baixada( page ).getByRole( 'button', { name: 'Obre' } ).click();
		await expect( consequencia( page ) ).toContainText( "T'han pescat!" );
		await veuResultat( page, 1 );
	} );

	test( 'camí correcte: indicis, «Quant a» sense esdeveniments i «a» donen 3 estrelles', async ( {
		page,
	} ) => {
		await entra( page );
		const lupa = barraTasques( page ).getByRole( 'button', {
			name: 'Lupa',
			exact: true,
		} );
		await lupa.click();
		await expect( lupa ).toHaveAttribute( 'aria-pressed', 'true' );
		for ( const { t, senyal } of BARRA.text ) {
			if ( senyal ) {
				await inspecciona( page, t.trim() ).click();
			}
		}
		await lupa.click();
		await expect( lupa ).toHaveAttribute( 'aria-pressed', 'false' );
		// Les reaccions de la guia surten d'una en una: que acabin abans.
		await page.clock.runFor( 8000 );
		await expect( parla( page ) ).toContainText( 'Indicis: 3 de 4' );
		const xatAbans = await parla( page ).innerText();
		await obreQuantA( page );
		await expect( quantA( page ) ).toContainText( 'Versió 118.4' );
		await expect( quantA( page ) ).toContainText(
			'El navegador està al dia.'
		);
		await page.clock.runFor( 1000 );
		expect( await parla( page ).innerText() ).toBe( xatAbans );
		await expect( consequencia( page ) ).toHaveCount( 0 );
		await quantA( page ).getByRole( 'button', { name: 'Tanca' } ).click();
		await expect( quantA( page ) ).toBeHidden();
		await expect( botoMenu( page ) ).toBeFocused();
		await decideix( page, 'a' );
		await expect( consequencia( page ) ).toContainText( 'Perfecte!' );
		await veuResultat( page, 3 );
	} );

	test( 'Esc tanca el menú del navegador abans que la pausa', async ( {
		page,
	} ) => {
		await entra( page );
		await obreQuantA( page );
		await page.keyboard.press( 'Escape' );
		await expect( quantA( page ) ).toBeHidden();
		await expect( pausa( page ) ).toHaveCount( 0 );
		await page.keyboard.press( 'Escape' );
		await expect( pausa( page ) ).toBeVisible();
	} );

	test( 'menú obert i finestra minimitzada: Esc obre la pausa', async ( {
		page,
	} ) => {
		await entra( page );
		await obreQuantA( page );
		await finestraNav( page )
			.getByRole( 'button', { name: 'Minimitza' } )
			.click();
		await expect( finestraNav( page ) ).toHaveAttribute( 'inert', '' );
		await page.mouse.move( 0, 0 );
		await page.keyboard.press( 'Escape' );
		await expect( pausa( page ) ).toBeVisible();
	} );

	test( 'cap baixada real ni fuita del que s’escriu', async ( { page } ) => {
		const fuites = escoltaFuites( page );
		const baixades = escoltaBaixades( page );
		await entra( page );
		await barra( page ).getByRole( 'button', { name: BARRA.boto } ).click();
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

	test.describe( 'accessibilitat', () => {
		test( 'sense violacions axe greus: barra', async ( { page } ) => {
			await entra( page );
			expect( await greusAxePc( page ) ).toEqual( [] );
		} );

		test( 'sense violacions axe greus: diàleg de baixada', async ( {
			page,
		} ) => {
			await entra( page );
			await barra( page )
				.getByRole( 'button', { name: BARRA.boto } )
				.click();
			await expect( baixada( page ) ).toBeVisible();
			expect( await greusAxePc( page ) ).toEqual( [] );
		} );

		test( 'sense violacions axe greus: «Quant a Brúixola»', async ( {
			page,
		} ) => {
			await entra( page );
			await obreQuantA( page );
			expect( await greusAxePc( page ) ).toEqual( [] );
		} );
	} );
} );
