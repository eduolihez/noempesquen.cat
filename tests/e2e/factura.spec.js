const { test, expect } = require( '@playwright/test' );
const AxeBuilder = require( '@axe-core/playwright' ).default;

const MISSIO = /La factura de la llum/;
// Valors d'autoompliment de la missió que no han de quedar enlloc.
const AUTOOMPLI = [ '4000 1234', '5678 9010', '08/28' ];

test.beforeEach( ( { isMobile } ) => {
	test.skip( isMobile, 'PC en mòbil: tall 4' );
} );

const barraTasques = ( page ) =>
	page.getByRole( 'navigation', { name: 'Barra de tasques' } );

const parla = ( page ) => page.getByRole( 'region', { name: 'Parla' } );

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
	await expect(
		page.getByRole( 'button', { name: /Llum Clara URGENT/ } )
	).toBeVisible();
}

/** Porta Posta al davant (Parla la tapa) i obre el correu trampa. */
async function obreCorreu( page ) {
	await barraTasques( page )
		.getByRole( 'button', { name: /^Navegador/ } )
		.click();
	await page.getByRole( 'button', { name: /Llum Clara URGENT/ } ).click();
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
		const posta = page.getByRole( 'tabpanel', { name: 'Posta' } );
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
			page.getByRole( 'tab', { name: /Pagament de factura/ } )
		).toHaveAttribute( 'aria-selected', 'true' );
		await page.getByRole( 'tab', { name: 'Posta' } ).click();

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
		await page.getByRole( 'tab', { name: /Pagament de factura/ } ).click();
		await inspecciona( page, 'llumclara-pagaments.com' ).click();
		await page.getByRole( 'tab', { name: 'Posta' } ).click();

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
		for ( const camp of [
			'Titular de la targeta',
			'Número de targeta',
			'Caducitat',
			'CVV',
			'PIN de la targeta',
		] ) {
			await page.getByRole( 'textbox', { name: camp } ).focus();
			await page
				.getByRole( 'button', { name: /Omple aquest camp/ } )
				.click();
		}
		await page.getByRole( 'button', { name: 'Paga 87,40 €' } ).click();

		const capa = page.getByRole( 'dialog' );
		await expect( capa ).toContainText( "T'han pescat!" );

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
		const resultat = await new AxeBuilder( { page } )
			.include( '.wp-block-noempesquen-simulador' )
			.withTags( [ 'wcag2a', 'wcag2aa', 'wcag22aa' ] )
			.analyze();
		const greus = resultat.violations
			.filter( ( v ) => [ 'serious', 'critical' ].includes( v.impact ) )
			.map( ( v ) => ( {
				id: v.id,
				impact: v.impact,
				targets: v.nodes.map( ( n ) => n.target.join( ' ' ) ),
			} ) );
		expect( greus ).toEqual( [] );
	} );
} );
