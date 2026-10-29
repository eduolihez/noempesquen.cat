const { test, expect } = require( '@playwright/test' );
const { greusAxe } = require( './ajudes' );

const MISSIO = /El paquet retingut/;
const NUMERO = '+44 7700 900461';

const mobil = ( page ) => page.locator( '.nep-so' );
const barraEstat = ( page ) =>
	page.getByRole( 'button', { name: /Obre el centre de control/ } );
const dock = ( page ) => page.getByRole( 'list', { name: 'Apps preferides' } );
const inspecciona = ( page, text ) =>
	page.getByRole( 'button', { name: `Inspecciona: ${ text }`, exact: true } );

/** Obre la missió des del selector (pantalla de bloqueig). */
async function iniciaMissio( page ) {
	await page.clock.install();
	await page.goto( '/simulador/' );
	await page.getByRole( 'button', { name: MISSIO } ).click();
	await expect(
		page.getByRole( 'button', { name: /Llisca cap amunt/ } )
	).toBeVisible();
}

/** Desbloqueja i arriba a la pantalla d'inici. */
async function entra( page ) {
	await iniciaMissio( page );
	await page.getByRole( 'button', { name: /Llisca cap amunt/ } ).click();
	await expect( dock( page ) ).toBeVisible();
}

/** Obre Missatges i l'SMS trampa (arriba als 8 s de joc). */
async function obreMissatges( page ) {
	await page.clock.runFor( 8000 );
	await dock( page ).getByRole( 'button', { name: 'Missatges' } ).click();
	await page.locator( '[data-fil]' ).first().click();
	await expect(
		page.getByText( 'el teu paquet 4471-CA està retingut al magatzem.', { exact: true } )
	).toBeVisible();
}

async function obreSms( page ) {
	await entra( page );
	await obreMissatges( page );
}

async function obreMenuSms( page ) {
	await page
		.getByRole( 'button', { name: 'Opcions del missatge' } )
		.last()
		.click();
	await expect(
		page.getByRole( 'dialog', { name: 'Opcions del missatge' } )
	).toBeVisible();
}

/** Full de l'enllaç amb la tecla de menú (alternativa a la pulsació llarga). */
async function mantenEnllac( page ) {
	const enllac = page.getByRole( 'link', {
		name: 'enviat-entrega.top/c/4471',
	} );
	await enllac.focus();
	await page.keyboard.press( 'Shift+F10' );
	const full = page.getByRole( 'dialog', { name: 'Enllaç' } );
	await expect( full ).toBeVisible();
	await expect( full ).toContainText( 'https://enviat-entrega.top/c/4471' );
	return full;
}

async function lupaDelCentre( page ) {
	await barraEstat( page ).click();
	const centre = page.getByRole( 'dialog', { name: 'Centre de control' } );
	await expect( centre ).toBeVisible();
	await centre.getByRole( 'button', { name: /Lupa/ } ).click();
	await expect( centre ).toBeHidden();
}

async function reenviaAFamilia( page ) {
	await obreMenuSms( page );
	await page.getByRole( 'button', { name: 'Reenvia' } ).click();
	await page
		.getByRole( 'dialog', { name: /Reenvia a/ } )
		.getByRole( 'button', { name: /Família/ } )
		.click();
}

async function arribaAlFormulari( page ) {
	await mantenEnllac( page );
	await page.getByRole( 'button', { name: 'Obre', exact: true } ).click();
	await expect(
		page.getByRole( 'textbox', { name: 'Titular de la targeta' } )
	).toBeVisible();
}

test.describe( 'El paquet retingut', () => {
	test( 'el desbloqueig porta a la pantalla d’inici del mòbil', async ( {
		page,
	} ) => {
		await entra( page );
		await expect( mobil( page ) ).toBeVisible();
		await expect(
			dock( page ).getByRole( 'button', { name: 'Navegador' } )
		).toBeVisible();
	} );

	test( 'camí correcte: lupa, adreça sencera, bloquejar i esborrar dona 3 estrelles', async ( {
		page,
	} ) => {
		await obreSms( page );

		await lupaDelCentre( page );
		for ( const t of [
			NUMERO,
			'el teu paquet 4471-CA està retingut al magatzem.',
			" Cal pagar 1,99 € de despeses d'enviament",
			" abans de les 23:59 d'avui",
			'enviat-entrega.top/c/4471',
		] ) {
			await inspecciona( page, t ).click();
		}
		await lupaDelCentre( page );

		await mantenEnllac( page );
		await page.getByRole( 'button', { name: 'Cancel·la' } ).click();

		await obreMenuSms( page );
		await page
			.getByRole( 'button', { name: 'Bloqueja el número' } )
			.click();
		const bloqueig = page.getByRole( 'dialog' ).last();
		await bloqueig.getByLabel( 'I esborra la conversa' ).check();
		await bloqueig
			.getByRole( 'button', { name: 'Bloqueja', exact: true } )
			.click();

		const capa = page.getByRole( 'dialog' );
		await expect( capa ).toContainText( 'Ben fet!' );
		await capa.getByRole( 'button', { name: 'Veure el resultat' } ).click();
		await expect(
			page.getByRole( 'img', { name: '3 de 3 estrelles' } )
		).toBeVisible();
	} );

	test( 'pescat: obrir l’enllaç i enviar el formulari fals', async ( {
		page,
	} ) => {
		await obreSms( page );
		await arribaAlFormulari( page );
		for ( const camp of [
			'Titular de la targeta',
			'Número de targeta',
			'Caducitat',
			'CVV',
		] ) {
			await page.getByRole( 'textbox', { name: camp } ).focus();
			await page
				.getByRole( 'button', { name: /Omple aquest camp/ } )
				.click();
		}
		await expect(
			page.getByRole( 'textbox', { name: 'Número de targeta' } )
		).toHaveValue( '4000 1234 5678 9010' );
		await page.getByRole( 'button', { name: 'Paga 1,99 €' } ).click();

		const capa = page.getByRole( 'dialog' );
		await expect( capa ).toContainText( "T'han pescat" );
		const text = await page.content();
		const emmagatzemat = await page.evaluate( () =>
			JSON.stringify( [
				{ ...window.localStorage },
				{ ...window.sessionStorage },
			] )
		);
		for ( const valor of [ '4000 1234', '5678 9010', '08/28' ] ) {
			expect( text ).not.toContain( valor );
			expect( emmagatzemat ).not.toContain( valor );
		}
		await capa.getByRole( 'button', { name: 'Veure el resultat' } ).click();
		await expect(
			page.getByRole( 'img', { name: '1 de 3 estrelles' } )
		).toBeVisible();
	} );

	test( 'via parcial: reenviar a Família', async ( { page } ) => {
		await obreSms( page );
		await reenviaAFamilia( page );

		const capa = page.getByRole( 'dialog' );
		await expect( capa ).toContainText( 'Bona intenció' );
		await capa.getByRole( 'button', { name: 'Veure el resultat' } ).click();
		await expect(
			page.getByRole( 'img', { name: '1 de 3 estrelles' } )
		).toBeVisible();
	} );

	test( 'Esc tanca primer el menú i només després obre la pausa', async ( {
		page,
	} ) => {
		await obreSms( page );
		await obreMenuSms( page );
		const pausa = page.getByRole( 'dialog', { name: 'Pausa' } );
		await page.keyboard.press( 'Escape' );
		await expect(
			page.getByRole( 'dialog', { name: 'Opcions del missatge' } )
		).toHaveCount( 0 );
		await expect( pausa ).toHaveCount( 0 );
		await page.keyboard.press( 'Escape' );
		await expect( pausa ).toBeVisible();
	} );

	test.describe( 'accessibilitat', () => {
		test( 'sense violacions axe greus: bloqueig', async ( { page } ) => {
			await iniciaMissio( page );
			expect( await greusAxe( page ) ).toEqual( [] );
		} );

		test( 'sense violacions axe greus: inici', async ( { page } ) => {
			await entra( page );
			expect( await greusAxe( page ) ).toEqual( [] );
		} );

		test( 'sense violacions axe greus: Missatges', async ( { page } ) => {
			await obreSms( page );
			expect( await greusAxe( page ) ).toEqual( [] );
		} );

		test( 'sense violacions axe greus: Navegador', async ( { page } ) => {
			await obreSms( page );
			await arribaAlFormulari( page );
			// El banner del guia tapa la barra un moment: espera que marxi.
			await page.clock.runFor( 10000 );
			await expect(
				page.getByRole( 'button', { name: /Pestanyes/ } )
			).toBeVisible();
			expect( await greusAxe( page ) ).toEqual( [] );
		} );

		test( 'sense violacions axe greus: resultat', async ( { page } ) => {
			await obreSms( page );
			await reenviaAFamilia( page );
			await page
				.getByRole( 'dialog' )
				.getByRole( 'button', { name: 'Veure el resultat' } )
				.click();
			await expect(
				page.getByRole( 'img', { name: /estrelles/ } )
			).toBeVisible();
			expect( await greusAxe( page ) ).toEqual( [] );
		} );
	} );

	test( 'objectius tàctils de 44 px', async ( { page, isMobile } ) => {
		test.skip( ! isMobile, 'Només al projecte mòbil' );
		const petits = () =>
			page.evaluate( () =>
				[
					...document.querySelectorAll(
						'.nep-so button, .nep-so input'
					),
				]
					.filter( ( el ) => {
						const r = el.getBoundingClientRect();
						return (
							r.width > 0 &&
							r.height > 0 &&
							! el.closest( '[inert]' ) &&
							( r.width < 44 || r.height < 44 )
						);
					} )
					.map(
						( el ) =>
							`${ el.className } | ${
								el.getAttribute( 'aria-label' ) ??
								el.textContent.slice( 0, 20 )
							}`
					)
			);
		await iniciaMissio( page );
		expect( await petits() ).toEqual( [] );
		await page.getByRole( 'button', { name: /Llisca cap amunt/ } ).click();
		await expect( dock( page ) ).toBeVisible();
		expect( await petits() ).toEqual( [] );
		await obreMissatges( page );
		expect( await petits() ).toEqual( [] );
		await obreMenuSms( page );
		expect( await petits() ).toEqual( [] );
	} );
} );
