const { test, expect } = require( '@playwright/test' );
const { greusAxe } = require( './ajudes' );

const MISSIO = /La factura de la llum/;
// Valors d'autoompliment de la missió que no han de quedar enlloc.
const AUTOOMPLI = [ '4000 1234', '5678 9010', '08/28' ];
// Camps de la web falsa i el valor que hi posa l'autoompliment.
const CAMPS_TARGETA = {
	'Titular de la targeta': 'Àlex Puig',
	'Número de targeta': '4000 1234 5678 9010',
	Caducitat: '08/28',
	CVV: '123',
	'PIN de la targeta': '1234',
};

test.beforeEach( ( { isMobile } ) => {
	test.skip( isMobile, 'PC en mòbil: tall 4' );
} );

const barraTasques = ( page ) =>
	page.getByRole( 'navigation', { name: 'Barra de tasques' } );

const parla = ( page ) => page.getByRole( 'region', { name: 'Parla' } );

// La fila de la safata (la notificació emergent també s'anomena així).
const filaTrampa = ( page ) =>
	page
		.getByRole( 'region', { name: 'Entrada' } )
		.getByRole( 'button', { name: /Llum Clara URGENT/ } );

const lupa = ( page ) =>
	barraTasques( page ).getByRole( 'button', { name: 'Lupa', exact: true } );

const inspecciona = ( page, text ) =>
	page.getByRole( 'button', { name: `Inspecciona: ${ text }`, exact: true } );

/** Obre la missió des del selector i entra a l'escriptori. */
async function entra( page ) {
	await page.clock.install();
	await page.goto( '/simulador/' );
	await page.getByRole( 'button', { name: MISSIO } ).click();
	await page.getByRole( 'button', { name: /Clica o prem/ } ).click();
	await expect( parla( page ) ).toBeVisible();
}

/** Salta la presentació i fa arribar el correu trampa (8 s de joc). */
async function saltaIntroIEsperaCorreu( page ) {
	await parla( page )
		.getByRole( 'button', { name: 'Salta la presentació' } )
		.click();
	await page.clock.runFor( 8000 );
	await expect( filaTrampa( page ) ).toBeVisible();
}

/** Porta Posta al davant (Parla la tapa) i obre el correu trampa. */
async function obreCorreu( page ) {
	await barraTasques( page )
		.getByRole( 'button', { name: /^Navegador/ } )
		.click();
	await filaTrampa( page ).click();
	await expect(
		page.getByRole( 'heading', {
			name: 'URGENT: el teu subministrament es tallarà avui',
		} )
	).toBeVisible();
}

async function mirantElCorreu( page ) {
	await entra( page );
	await saltaIntroIEsperaCorreu( page );
	await obreCorreu( page );
}

/** El focus és dins del simulador (no a la pàgina de darrere ni a <body>). */
const focusDins = ( page ) =>
	page.evaluate( () => !! document.activeElement?.closest( '.nep-so' ) );

/** Espera la pantalla completa real i en surt com ho faria Esc o F11. */
async function surtDePantallaCompleta( page ) {
	await expect
		.poll( () => page.evaluate( () => !! document.fullscreenElement ) )
		.toBe( true );
	await page.evaluate( () => document.exitFullscreen() );
}

async function sensePistes( page ) {
	const text = await page.content();
	const emmagatzemat = await page.evaluate( () =>
		JSON.stringify( [
			{ ...window.localStorage },
			{ ...window.sessionStorage },
		] )
	);
	for ( const valor of AUTOOMPLI ) {
		expect( text ).not.toContain( valor );
		expect( emmagatzemat ).not.toContain( valor );
	}
}

test.describe( 'La factura de la llum', () => {
	test( 'després de desbloquejar, Posta mostra la safata sense cap correu obert', async ( {
		page,
	} ) => {
		await entra( page );
		const posta = page.getByRole( 'region', {
			name: 'Posta',
			exact: true,
		} );
		await expect(
			posta.getByRole( 'region', { name: 'Entrada' } )
		).toBeVisible();
		await expect( posta.getByRole( 'article' ) ).toHaveCount( 0 );
		await page.clock.runFor( 8000 );
		await expect( posta.getByRole( 'article' ) ).toHaveCount( 0 );
	} );

	test( 'camí correcte: denunciar el correu com a pesca dona 3 estrelles amb tots els indicis', async ( {
		page,
	} ) => {
		await mirantElCorreu( page );

		// Web falsa oberta des de l'enllaç (la lupa encara és apagada).
		await page
			.getByRole( 'link', { name: 'Paga ara a llumclara.cat' } )
			.click();
		await expect(
			page.getByRole( 'button', {
				name: /^Llum Clara · Pagament de factura$/,
			} )
		).toHaveAttribute( 'aria-current', 'page' );
		await page
			.getByRole( 'button', { name: 'Posta', exact: true } )
			.click();

		await lupa( page ).click();
		await expect( lupa( page ) ).toHaveAttribute( 'aria-pressed', 'true' );

		const indicis = [
			'avisos@llumclara-pagaments.com',
			'URGENT: el teu subministrament es tallarà avui',
			'Benvolgut client,',
			'Si no regularitzes el pagament en les pròximes 24 hores, tallarem el subministrament elèctric del teu domicili.',
			'Paga ara a llumclara.cat',
			'i introdueix les dades de la teva targeta bancària.',
		];
		for ( const indici of indicis ) {
			await inspecciona( page, indici ).click();
		}

		// Senyal 7: el domini a la barra d'adreces de la web falsa.
		await page
			.getByRole( 'button', {
				name: /^Llum Clara · Pagament de factura$/,
			} )
			.click();
		await inspecciona( page, 'llumclara-pagaments.com' ).click();
		await page
			.getByRole( 'button', { name: 'Posta', exact: true } )
			.click();

		await page.getByRole( 'button', { name: 'Més', exact: true } ).click();
		await page.getByRole( 'menuitem', { name: /Denuncia pesca/ } ).click();
		await page
			.getByRole( 'alertdialog' )
			.getByRole( 'button', { name: 'Denuncia', exact: true } )
			.click();

		const capa = page.getByRole( 'dialog' );
		await expect( capa ).toContainText( 'Molt bé!' );
		await capa.getByRole( 'button', { name: 'Veure el resultat' } ).click();
		await expect(
			page.getByRole( 'img', { name: '3 de 3 estrelles' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: 'Torna-ho a provar' } )
		).toBeVisible();
	} );

	test( 'camí de pescat: pagar a la web falsa', async ( { page } ) => {
		await mirantElCorreu( page );
		await page
			.getByRole( 'link', { name: 'Paga ara a llumclara.cat' } )
			.click();
		for ( const camp of Object.keys( CAMPS_TARGETA ) ) {
			await page.getByRole( 'textbox', { name: camp } ).focus();
			await page
				.getByRole( 'button', { name: /Omple aquest camp/ } )
				.click();
		}
		// Control positiu: abans d'enviar, els valors sí que són als camps
		// (page.content() no serialitza .value).
		for ( const [ camp, valor ] of Object.entries( CAMPS_TARGETA ) ) {
			await expect(
				page.getByRole( 'textbox', { name: camp } )
			).toHaveValue( valor );
		}
		await page.getByRole( 'button', { name: 'Paga 87,40 €' } ).click();

		const capa = page.getByRole( 'dialog' );
		await expect( capa ).toContainText( "T'han pescat!" );
		// Els camps s'han desmuntat (no queden inputs amb els valors).
		await expect(
			page.locator( 'input[id^="nep-lc-targeta-"]' )
		).toHaveCount( 0 );

		// Les dades de la targeta no es queden enlloc.
		await sensePistes( page );

		await capa.getByRole( 'button', { name: 'Veure el resultat' } ).click();
		await expect(
			page.getByRole( 'img', { name: '1 de 3 estrelles' } )
		).toBeVisible();
		await sensePistes( page );
	} );

	test( 'decidir pel xat amb «Ja ho tinc clar»', async ( { page } ) => {
		await entra( page );
		await parla( page )
			.getByRole( 'button', { name: 'Salta la presentació' } )
			.click();
		await parla( page )
			.getByRole( 'button', { name: 'Ja ho tinc clar' } )
			.click();
		await expect(
			parla( page ).getByRole( 'button', { name: 'Encara vull mirar' } )
		).toBeVisible();
		await parla( page )
			.getByRole( 'button', {
				name: /^Entro a l'app o al web de Llum Clara/,
			} )
			.click();

		await expect( page.getByRole( 'dialog' ) ).toContainText( 'Molt bé!' );
	} );

	test( 'Esc obre la pausa i Surt torna al selector', async ( { page } ) => {
		await entra( page );
		await page.keyboard.press( 'Escape' );
		const pausa = page.getByRole( 'dialog', { name: 'Pausa' } );
		await expect( pausa ).toBeVisible();
		await expect(
			pausa.getByRole( 'button', { name: 'Continua' } )
		).toBeVisible();
		await expect(
			pausa.getByRole( 'button', { name: 'Reinicia la missió' } )
		).toBeVisible();
		await pausa.getByRole( 'button', { name: 'Surt' } ).click();
		await expect(
			page.getByRole( 'region', { name: 'Tria una missió' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: MISSIO } )
		).toBeFocused();
	} );

	test( 'sortir de pantalla completa sense demanar-ho manté la capa fixa i pausa', async ( {
		page,
	} ) => {
		await entra( page );
		await surtDePantallaCompleta( page );
		await expect( page.locator( '.nep-so' ) ).toHaveClass( /nep-so--fixa/ );
		await expect(
			page.getByRole( 'dialog', { name: 'Pausa' } )
		).toBeVisible();
	} );

	test( 'sortir de pantalla completa al bloqueig també pausa', async ( {
		page,
	} ) => {
		await page.clock.install();
		await page.goto( '/simulador/' );
		await page.getByRole( 'button', { name: MISSIO } ).click();
		await expect(
			page.getByRole( 'button', { name: /Clica o prem/ } )
		).toBeFocused();
		await surtDePantallaCompleta( page );
		await expect( page.locator( '.nep-so' ) ).toHaveClass( /nep-so--fixa/ );
		await expect(
			page.getByRole( 'dialog', { name: 'Pausa' } )
		).toBeVisible();
	} );

	test( 'el focus no surt mai del simulador', async ( { page } ) => {
		await page.clock.install();
		await page.goto( '/simulador/' );
		await page.getByRole( 'button', { name: MISSIO } ).click();
		// Bloqueig: un sol botó, Tab i Maj+Tab hi tornen.
		await page.keyboard.press( 'Tab' );
		expect( await focusDins( page ) ).toBe( true );
		await page.keyboard.press( 'Shift+Tab' );
		expect( await focusDins( page ) ).toBe( true );

		await page.getByRole( 'button', { name: /Clica o prem/ } ).click();
		await expect( parla( page ) ).toBeVisible();
		// Del darrer element (rellotge) Tab torna al principi, i al revés.
		await barraTasques( page )
			.getByRole( 'button', { name: /notificaci/ } )
			.last()
			.focus();
		for ( let i = 0; i < 3; i++ ) {
			await page.keyboard.press( 'Tab' );
			expect( await focusDins( page ) ).toBe( true );
		}
		for ( let i = 0; i < 6; i++ ) {
			await page.keyboard.press( 'Shift+Tab' );
			expect( await focusDins( page ) ).toBe( true );
		}

		// Tancar la darrera finestra no deixa el focus a <body>.
		for ( const nom of [ 'Parla', /Posta/ ] ) {
			await page
				.getByRole( 'region', { name: nom } )
				.first()
				.getByRole( 'button', { name: 'Tanca', exact: true } )
				.click();
		}
		await expect(
			page.getByRole( 'button', { name: 'Tanca' } )
		).toHaveCount( 0 );
		expect( await focusDins( page ) ).toBe( true );
	} );

	test( '«Torna-ho a provar» deixa el focus dins del simulador', async ( {
		page,
	} ) => {
		await entra( page );
		await parla( page )
			.getByRole( 'button', { name: 'Salta la presentació' } )
			.click();
		await parla( page )
			.getByRole( 'button', { name: 'Ja ho tinc clar' } )
			.click();
		await parla( page )
			.getByRole( 'button', {
				name: /^Entro a l'app o al web de Llum Clara/,
			} )
			.click();
		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Veure el resultat' } )
			.click();
		await page.getByRole( 'button', { name: 'Torna-ho a provar' } ).click();
		await expect(
			page.getByRole( 'button', { name: /Clica o prem/ } )
		).toBeVisible();
		expect( await focusDins( page ) ).toBe( true );
	} );

	test( 'amb la lupa, el text del correu conserva els espais', async ( {
		page,
	} ) => {
		await mirantElCorreu( page );
		await lupa( page ).click();
		const correu = page.getByRole( 'article' );
		await expect( correu ).toContainText( 'entra a Paga ara', {
			useInnerText: true,
		} );
		await expect( correu ).toContainText( '87,40 €. Si no', {
			useInnerText: true,
		} );
	} );

	test( 'sense Fullscreen API el joc funciona amb la capa fixa', async ( {
		page,
	} ) => {
		await page.addInitScript( () => {
			delete Element.prototype.requestFullscreen;
			delete Element.prototype.webkitRequestFullscreen;
		} );
		await entra( page );
		await expect( page.locator( '.nep-so--fixa' ) ).toBeVisible();
		await page.keyboard.press( 'Escape' );
		await expect(
			page.getByRole( 'dialog', { name: 'Pausa' } )
		).toBeVisible();
	} );

	test( "sense violacions axe greus a l'escriptori", async ( { page } ) => {
		await entra( page );
		await saltaIntroIEsperaCorreu( page );
		await obreCorreu( page );
		const greus = await greusAxe( page );
		expect( greus ).toEqual( [] );
	} );
} );
