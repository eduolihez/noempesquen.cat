const { test, expect } = require( '@playwright/test' );
const {
	greusAxePc,
	senseFullscreen,
	inspecciona,
	iniciaMissio,
	escoltaFuites,
	sensePistes,
	esHoritzontal,
} = require( './ajudes' );


const MISSIO = /El banc et bloqueja el compte/;
const BLOQUEIG = /Clica o prem/;
const ASSUMPTE = 'Compte bloquejat: verifica la teva identitat';
const WEB_FALSA = /^Banc Sòlid · Verificació del compte$/;
const ORIGEN_MOBIL = "Mòbil d'Àlex · Missatges";
const CODI = '482913';
// Valors escrits a mà a la web falsa: no han de quedar enlloc.
const ESCRITS = {
	Usuari: 'zqxusuari7731',
	Contrasenya: 'zqxclau7731',
	DNI: 'ZQX7731DNI',
};

test.beforeEach( ( { page } ) => {
	// En mòbil vertical el PC no hi cap: hi apareix la petició de girar
	// (pc-mobil.spec.js). En horitzontal el PC s'escala i es juga sencera.
	test.skip( ! esHoritzontal( page ), 'PC en vertical: demana girar' );
} );

const barraTasques = ( page ) =>
	page.getByRole( 'navigation', { name: 'Barra de tasques' } );

const parla = ( page ) => page.getByRole( 'region', { name: 'Parla' } );

const filaTrampa = ( page ) =>
	page
		.getByRole( 'region', { name: 'Entrada' } )
		.getByRole( 'button', { name: /Compte bloquejat/ } );

const lupa = ( page ) =>
	barraTasques( page ).getByRole( 'button', { name: 'Lupa', exact: true } );

const rellotge = ( page ) =>
	barraTasques( page ).getByRole( 'button', { name: /notificaci/ } );

const pestanya = ( page, nom ) =>
	page.getByRole( 'button', { name: nom, exact: typeof nom === 'string' } );

async function entra( page ) {
	await iniciaMissio( page, MISSIO, BLOQUEIG );
	await page.getByRole( 'button', { name: BLOQUEIG } ).click();
	await expect( parla( page ) ).toBeVisible();
	await parla( page )
		.getByRole( 'button', { name: 'Salta la presentació' } )
		.click();
}

/** Fa arribar el correu trampa (8 s de joc) i l'obre a Posta. */
async function obreCorreu( page ) {
	await page.clock.runFor( 8000 );
	await expect( filaTrampa( page ) ).toBeVisible();
	await barraTasques( page )
		.getByRole( 'button', { name: /^Navegador/ } )
		.click();
	await filaTrampa( page ).click();
	await expect(
		page.getByRole( 'heading', { name: ASSUMPTE } )
	).toBeVisible();
}

async function mirantElCorreu( page ) {
	await entra( page );
	await obreCorreu( page );
}

/** Obre la web falsa des de l'enllaç del correu. */
async function obreWebFalsa( page ) {
	await page.getByRole( 'link', { name: 'Accedeix al teu banc' } ).click();
	await expect( pestanya( page, WEB_FALSA ) ).toHaveAttribute(
		'aria-current',
		'page'
	);
	await expect(
		page.getByRole( 'textbox', { name: 'Usuari' } )
	).toBeVisible();
}

/** Escriu una adreça a la barra d'adreces de la pestanya activa. */
async function vesA( page, adreca ) {
	const barra = page.getByRole( 'textbox', { name: "Barra d'adreces" } );
	await barra.fill( adreca );
	await barra.press( 'Enter' );
}

/** Envia el pas 1 de la web falsa amb dades escrites a mà. */
async function enviaPas1( page ) {
	for ( const [ camp, valor ] of Object.entries( ESCRITS ) ) {
		await page.getByRole( 'textbox', { name: camp } ).fill( valor );
	}
	await page.getByRole( 'button', { name: 'Accedeix', exact: true } ).click();
	await expect(
		page.getByRole( 'textbox', { name: 'Codi SMS' } )
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

test.describe( 'El banc et bloqueja el compte', () => {
	test( 'camí correcte: indicis amb la lupa i denunciar pesca donen 3 estrelles', async ( {
		page,
	} ) => {
		await mirantElCorreu( page );
		await obreWebFalsa( page );
		await pestanya( page, 'Posta' ).click();

		await lupa( page ).click();
		await expect( lupa( page ) ).toHaveAttribute( 'aria-pressed', 'true' );
		for ( const indici of [
			'seguretat@bancsolid-acces.top',
			ASSUMPTE,
			'Benvolgut client,',
			"Per motius de seguretat, el teu compte s'ha bloquejat. Si no verifiques la teva identitat en les pròximes 24 hores, el compte es cancel·larà definitivament.",
			'Accedeix al teu banc',
		] ) {
			await inspecciona( page, indici ).click();
		}

		await pestanya( page, WEB_FALSA ).click();
		for ( const indici of [
			'bancsolid-acces.top',
			'El teu conte ha estat bloquejat',
			'Hem detectat un accés no autoritzat al teu conte.',
			'DNI',
		] ) {
			await inspecciona( page, indici ).click();
		}
		await pestanya( page, 'Posta' ).click();
		await lupa( page ).click();

		await page.getByRole( 'button', { name: 'Més', exact: true } ).click();
		await page.getByRole( 'menuitem', { name: /Denuncia pesca/ } ).click();
		await page
			.getByRole( 'alertdialog' )
			.getByRole( 'button', { name: 'Denuncia', exact: true } )
			.click();

		await expect( page.getByRole( 'dialog' ) ).toContainText( 'Molt bé!' );
		await veuResultat( page, 3 );
		await expect( page.getByText( '130 de 140 punts' ) ).toBeVisible();
	} );

	test( 'via alternativa: entrar a bancsolid.cat després del correu', async ( {
		page,
	} ) => {
		await mirantElCorreu( page );
		await vesA( page, 'bancsolid.cat' );
		const capa = page.getByRole( 'dialog' );
		await expect( capa ).toContainText( 'Molt bé!' );
		await expect( capa ).toContainText( 'Al web oficial no hi ha cap bloqueig' );
	} );

	test( 'entrar a bancsolid.cat abans del correu no tanca la missió', async ( {
		page,
	} ) => {
		await entra( page );
		await barraTasques( page )
			.getByRole( 'button', { name: /^Navegador/ } )
			.click();
		await vesA( page, 'bancsolid.cat' );
		await expect(
			page.getByRole( 'heading', {
				name: 'La banca de sempre, al costat de casa.',
			} )
		).toBeVisible();
		await expect( page.getByText( 'Molt bé!' ) ).toHaveCount( 0 );

		// Arriba el correu: la càrrega anterior no compta.
		await page.clock.runFor( 8000 );
		await expect( page.getByText( 'Molt bé!' ) ).toHaveCount( 0 );

		// Una càrrega nova, ja amb el correu, sí.
		await page
			.getByRole( 'button', { name: 'Torna a carregar', exact: true } )
			.click();
		await expect( page.getByRole( 'dialog' ) ).toContainText( 'Molt bé!' );
	} );

	test( 'pescat: dades al pas 1, codi SMS al mòbil vinculat i codi enviat', async ( {
		page,
	} ) => {
		const vist = escoltaFuites( page );
		await mirantElCorreu( page );
		await obreWebFalsa( page );
		await enviaPas1( page );
		await sensePistes( page, vist, Object.values( ESCRITS ) );

		// El codi arriba al mòbil vinculat 3 s després.
		await page.clock.runFor( 3500 );
		const toast = page
			.getByRole( 'list', { name: 'Notificacions noves' } )
			.getByRole( 'listitem' )
			.filter( { hasText: ORIGEN_MOBIL } );
		await expect( toast ).toBeVisible();
		await expect( toast ).toContainText( 'Banc Sòlid' );
		await expect( toast ).toContainText( CODI );

		await rellotge( page ).click();
		const centre = page.getByRole( 'dialog', {
			name: 'Notificacions i calendari',
		} );
		await expect( centre ).toBeVisible();
		await expect(
			centre.getByRole( 'region', { name: ORIGEN_MOBIL } )
		).toContainText( `El teu codi de verificació és ${ CODI }` );
		await rellotge( page ).click();
		await expect( centre ).toHaveCount( 0 );

		await page.getByRole( 'textbox', { name: 'Codi SMS' } ).fill( CODI );
		await page.getByRole( 'button', { name: 'Verifica', exact: true } ).click();

		const capa = page.getByRole( 'dialog' );
		await expect( capa ).toContainText( "T'han pescat!" );
		await expect( capa ).toContainText( 'Has donat el codi' );
		await expect(
			page.locator( 'input[id^="nep-lc-codi-"], input[id^="nep-lc-acces-"]' )
		).toHaveCount( 0 );
		await sensePistes( page, vist, Object.values( ESCRITS ) );
		await veuResultat( page, 1 );
		await sensePistes( page, vist, Object.values( ESCRITS ) );
	} );

	test( 'via parcial: esborrar el correu', async ( { page } ) => {
		await mirantElCorreu( page );
		await page
			.getByRole( 'toolbar', { name: 'Accions del missatge' } )
			.getByRole( 'button', { name: 'Elimina', exact: true } )
			.click();
		await expect( page.getByRole( 'dialog' ) ).toContainText( 'Gairebé!' );
		await veuResultat( page, 1 );
	} );

	test( 'Esc tanca primer el menú i només després obre la pausa', async ( {
		page,
	} ) => {
		await mirantElCorreu( page );
		await page.getByRole( 'button', { name: 'Més', exact: true } ).click();
		await expect( page.getByRole( 'menu' ) ).toBeVisible();
		const pausa = page.getByRole( 'dialog', { name: 'Pausa' } );
		await page.keyboard.press( 'Escape' );
		await expect( page.getByRole( 'menu' ) ).toHaveCount( 0 );
		await expect( pausa ).toHaveCount( 0 );
		await page.keyboard.press( 'Escape' );
		await expect( pausa ).toBeVisible();
	} );

	test( 'en mode girar el toast no caduca i la partida continua', async ( {
		page,
	}, testInfo ) => {
		test.skip(
			testInfo.project.name !== 'mobil-horitzontal',
			'Només al projecte mòbil horitzontal'
		);
		await page.setViewportSize( { width: 915, height: 412 } );
		await senseFullscreen( page );
		await mirantElCorreu( page );
		await obreWebFalsa( page );
		await enviaPas1( page );
		await page.clock.runFor( 3500 );
		const toast = page
			.locator( '.nep-so-toasts li' )
			.filter( { hasText: ORIGEN_MOBIL } );
		await expect( toast ).toBeVisible();

		// En vertical el joc s'atura: el toast (6 s) no es descarta.
		await page.setViewportSize( { width: 412, height: 915 } );
		await expect(
			page.getByRole( 'alertdialog', { name: 'Gira el mòbil' } )
		).toBeVisible();
		await page.clock.runFor( 8000 );
		await page.setViewportSize( { width: 915, height: 412 } );
		await expect( toast ).toBeVisible();
	} );

	test.describe( 'accessibilitat', () => {
		test( 'sense violacions axe greus: web falsa', async ( { page } ) => {
			await mirantElCorreu( page );
			await obreWebFalsa( page );
			expect( await greusAxePc( page ) ).toEqual( [] );
		} );

		test( 'sense violacions axe greus: web oficial', async ( { page } ) => {
			await entra( page );
			await barraTasques( page )
				.getByRole( 'button', { name: /^Navegador/ } )
				.click();
			await vesA( page, 'bancsolid.cat/area-clients' );
			await expect(
				page.getByRole( 'heading', { name: 'Avisos' } )
			).toBeVisible();
			expect( await greusAxePc( page ) ).toEqual( [] );
		} );

		test( 'sense violacions axe greus: centre amb la notificació del mòbil', async ( {
			page,
		} ) => {
			await mirantElCorreu( page );
			await obreWebFalsa( page );
			await enviaPas1( page );
			await page.clock.runFor( 3500 );
			await rellotge( page ).click();
			await expect(
				page
					.getByRole( 'dialog', { name: 'Notificacions i calendari' } )
					.getByRole( 'region', { name: ORIGEN_MOBIL } )
			).toBeVisible();
			expect( await greusAxePc( page ) ).toEqual( [] );
		} );
	} );
} );
