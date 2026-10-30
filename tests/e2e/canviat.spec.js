const { test, expect } = require( '@playwright/test' );
const {
	esHoritzontal,
	greusAxe,
	inspecciona,
	iniciaMissio,
	petits,
	escoltaFuites,
	sensePistes,
} = require( './ajudes' );

const MISSIO = /Hola, he canviat de mòbil/;
const BLOQUEIG = /Llisca cap amunt/;
const NUMERO = '+44 7700 900461';
const AVIS = 'Aquest número no és als teus contactes';
const MISSATGES = [
	'Hola, he canviat de mòbil. Aquest és el meu número nou. Em pots ajudar amb una cosa urgent?',
	"Soc el Pau, no m'has desat? Se m'ha bloquejat la targeta i ho he de pagar avui mateix",
	'No puc parlar, estic en una reunió. Escriu-me només per aqui vale?',
	"Em pots fer una transferència de 380 € ara? És urgent, demà te'ls torno",
	"IBAN: ES21 9999 0000 0000 0000 0000, a nom de R. Dumitrescu. Avisa'm quan ho facis",
	'Va, que es urgent, no puc esperar. Fes-ho ja si pots',
];
// Valors escrits a mà: no han de quedar enlloc.
const TRANSFERENCIA = {
	Beneficiari: 'Zqx Beneficiari',
	'IBAN del destinatari': 'ES9121000418450200051332',
	'Import (€)': '37,45',
	Concepte: 'zqxconcepte7731',
};
const MISSATGE_PAU = 'zqxpau7731 ets tu?';

const barraEstat = ( page ) =>
	page.getByRole( 'button', { name: /Obre el centre de control/ } );
const dock = ( page ) => page.getByRole( 'list', { name: 'Apps preferides' } );
const apps = ( page ) => page.getByRole( 'list', { name: 'Apps', exact: true } );
const banners = ( page ) =>
	page.getByRole( 'list', { name: 'Notificacions noves' } );
const avis = ( page ) =>
	page.getByRole( 'group', { name: 'Número desconegut' } );
const titolXat = ( page, nom ) =>
	page.getByRole( 'heading', { level: 3, name: nom, exact: true } );

async function entra( page ) {
	await iniciaMissio( page, MISSIO, BLOQUEIG );
	await page.getByRole( 'button', { name: BLOQUEIG } ).click();
	await expect( dock( page ) ).toBeVisible();
}

/** Des de l'inici, espera el primer missatge (8 s) i n'obre la notificació. */
async function obreDesDelBanner( page ) {
	await page.clock.runFor( 8000 );
	const banner = banners( page ).getByRole( 'button', {
		name: /he canviat de mòbil/,
	} );
	await expect( banner ).toBeVisible();
	await expect( banner ).toContainText( NUMERO );
	await banner.click();
	await expect( titolXat( page, NUMERO ) ).toBeVisible();
	await expect( avis( page ) ).toBeVisible();
}

/** Arriben la resta de missatges (fins als 38 s de joc). */
async function esperaTotsElsMissatges( page ) {
	await page.clock.runFor( 31000 );
	await expect(
		page.getByText( MISSATGES[ MISSATGES.length - 1 ], { exact: true } )
	).toBeVisible();
}

async function alXatDesconegut( page ) {
	await entra( page );
	await obreDesDelBanner( page );
	await esperaTotsElsMissatges( page );
}

async function lupaDelCentre( page ) {
	await barraEstat( page ).click();
	const centre = page.getByRole( 'dialog', { name: 'Centre de control' } );
	await expect( centre ).toBeVisible();
	await centre.getByRole( 'button', { name: /Lupa/ } ).click();
	await expect( centre ).toBeHidden();
}

async function inspeccionaTot( page ) {
	await lupaDelCentre( page );
	for ( const t of [ AVIS, ...MISSATGES ] ) {
		await inspecciona( page, t ).click();
	}
	await lupaDelCentre( page );
}

async function obreApp( page, nom ) {
	await apps( page ).getByRole( 'button', { name: nom } ).click();
}

async function obreTransferencia( page ) {
	await obreApp( page, 'Banc Sòlid' );
	await expect(
		page.getByRole( 'heading', { name: 'Hola, Àlex' } )
	).toBeVisible();
	await page.getByRole( 'button', { name: 'Transferència' } ).click();
	await expect(
		page.getByRole( 'textbox', { name: 'Beneficiari' } )
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

test.describe( 'Hola, he canviat de mòbil', () => {
	test( 'la notificació obre el xat del número nou, no el del guia', async ( {
		page,
	} ) => {
		await entra( page );
		await obreDesDelBanner( page );
		await expect( titolXat( page, 'Remei' ) ).toHaveCount( 0 );
		await expect(
			page.getByText( MISSATGES[ 0 ], { exact: true } )
		).toBeVisible();
		// Els següents encara no han arribat.
		await expect(
			page.getByText( MISSATGES[ 1 ], { exact: true } )
		).toHaveCount( 0 );
	} );

	test( 'camí correcte: lupa i bloquejar des del bàner donen 3 estrelles', async ( {
		page,
	} ) => {
		await alXatDesconegut( page );
		await inspeccionaTot( page );
		await avis( page )
			.getByRole( 'button', { name: 'Bloqueja', exact: true } )
			.click();
		await expect( page.getByRole( 'dialog' ) ).toContainText( 'Ben fet!' );
		await veuResultat( page, 3 );
		await expect( page.getByText( '120 de 120 punts' ) ).toBeVisible();
	} );

	test( 'camí correcte: lupa i «Bloqueja el número» del menú donen 3 estrelles', async ( {
		page,
	} ) => {
		await alXatDesconegut( page );
		await inspeccionaTot( page );
		await page.getByRole( 'button', { name: 'Més opcions' } ).click();
		await page
			.getByRole( 'menuitem', { name: 'Bloqueja el número' } )
			.click();
		await expect( page.getByRole( 'dialog' ) ).toContainText( 'Ben fet!' );
		await veuResultat( page, 3 );
	} );

	test( 'via alternativa: escriure al Pau pel seu xat (sense que el text surti de la UI)', async ( {
		page,
	} ) => {
		const vist = escoltaFuites( page );
		await entra( page );
		await page.clock.runFor( 8000 );
		await obreApp( page, 'Parla' );
		const tornar = page.getByRole( 'button', { name: 'Torna als xats' } );
		if ( await tornar.isVisible() ) {
			await tornar.click();
		}
		await page.getByRole( 'button', { name: /^Pau/ } ).click();
		await expect( titolXat( page, 'Pau' ) ).toBeVisible();
		const camp = page.getByRole( 'textbox', { name: 'Missatge' } );
		await expect( camp ).toBeEnabled();
		await camp.fill( MISSATGE_PAU );
		await page.getByRole( 'button', { name: 'Envia', exact: true } ).click();

		const capa = page.getByRole( 'dialog' );
		await expect( capa ).toContainText( 'Molt bé!' );
		await expect( capa ).toContainText(
			'Verificar per una altra via és el truc'
		);
		// La bombolla pròpia és a la UI per disseny; només es mira fora d'ella.
		await sensePistes( page, vist, [ MISSATGE_PAU ], { dom: false } );
	} );

	test( 'pescat: transferència des de l’app Banc Sòlid', async ( {
		page,
	} ) => {
		const vist = escoltaFuites( page );
		await alXatDesconegut( page );
		await page.getByRole( 'button', { name: 'Inici', exact: true } ).click();
		await obreTransferencia( page );
		for ( const [ camp, valor ] of Object.entries( TRANSFERENCIA ) ) {
			await page.getByRole( 'textbox', { name: camp } ).fill( valor );
		}
		await page
			.getByRole( 'button', { name: 'Envia la transferència' } )
			.click();

		const capa = page.getByRole( 'dialog' );
		await expect( capa ).toContainText( "T'han pescat!" );
		await expect( capa ).toContainText( 'Has fet la transferència' );
		await sensePistes( page, vist, Object.values( TRANSFERENCIA ) );
		await veuResultat( page, 1 );
		await sensePistes( page, vist, Object.values( TRANSFERENCIA ) );
	} );

	test( 'via parcial: no contestar i deixar-ho estar', async ( { page } ) => {
		// BUG horitzontal (915x412): el log del xat tapa els botons de resposta.
		test.fixme(
			esHoritzontal( page ),
			'Bug en horitzontal: .nep-parla-missatges intercepta el clic a les respostes'
		);
		await alXatDesconegut( page );
		await page.getByRole( 'button', { name: 'Torna als xats' } ).click();
		await page.getByRole( 'button', { name: /^Remei/ } ).click();
		await expect( titolXat( page, 'Remei' ) ).toBeVisible();
		const salta = page.getByRole( 'button', {
			name: 'Salta la presentació',
		} );
		if ( await salta.isVisible() ) {
			await salta.click();
		}
		await page.getByRole( 'button', { name: 'Ja ho tinc clar' } ).click();
		await page
			.getByRole( 'button', { name: "No contesto i m'ho deixo estar." } )
			.click();
		await expect( page.getByRole( 'dialog' ) ).toContainText( 'Gairebé!' );
		await veuResultat( page, 1 );
	} );

	test( 'Esc tanca primer el menú del xat i només després obre la pausa', async ( {
		page,
	} ) => {
		await entra( page );
		await obreDesDelBanner( page );
		await page.getByRole( 'button', { name: 'Més opcions' } ).click();
		await expect( page.getByRole( 'menu' ) ).toBeVisible();
		const pausa = page.getByRole( 'dialog', { name: 'Pausa' } );
		await page.keyboard.press( 'Escape' );
		await expect( page.getByRole( 'menu' ) ).toHaveCount( 0 );
		await expect( pausa ).toHaveCount( 0 );
		await page.keyboard.press( 'Escape' );
		await expect( pausa ).toBeVisible();
	} );

	test( 'objectius tàctils de 44 px: Banc Sòlid i xat de Parla', async ( {
		page,
		isMobile,
	} ) => {
		test.skip( ! isMobile, 'Només al projecte mòbil' );
		await entra( page );
		await obreDesDelBanner( page );
		// Xat amb el bàner i el camp de text.
		expect( await petits( page ) ).toEqual( [] );
		await page.getByRole( 'button', { name: 'Més opcions' } ).click();
		expect( await petits( page ) ).toEqual( [] );
		await page.keyboard.press( 'Escape' );
		await page.getByRole( 'button', { name: 'Torna als xats' } ).click();
		await page.getByRole( 'button', { name: /^Pau/ } ).click();
		await expect(
			page.getByRole( 'button', { name: 'Envia', exact: true } )
		).toBeVisible();
		expect( await petits( page ) ).toEqual( [] );

		await page.getByRole( 'button', { name: 'Inici', exact: true } ).click();
		await obreApp( page, 'Banc Sòlid' );
		await expect(
			page.getByRole( 'heading', { name: 'Hola, Àlex' } )
		).toBeVisible();
		expect( await petits( page ) ).toEqual( [] );
		await page.getByRole( 'button', { name: 'Transferència' } ).click();
		await expect(
			page.getByRole( 'textbox', { name: 'Beneficiari' } )
		).toBeVisible();
		expect( await petits( page ) ).toEqual( [] );
	} );

	test.describe( 'accessibilitat', () => {
		test( 'sense violacions axe greus: xat de Parla amb el bàner', async ( {
			page,
		} ) => {
			await alXatDesconegut( page );
			await expect( avis( page ) ).toBeVisible();
			expect( await greusAxe( page ) ).toEqual( [] );
		} );

		test( 'sense violacions axe greus: app Banc Sòlid', async ( {
			page,
		} ) => {
			await entra( page );
			await obreApp( page, 'Banc Sòlid' );
			await expect(
				page.getByRole( 'heading', { name: 'Hola, Àlex' } )
			).toBeVisible();
			expect( await greusAxe( page ) ).toEqual( [] );
			await page.getByRole( 'button', { name: 'Transferència' } ).click();
			await expect(
				page.getByRole( 'textbox', { name: 'Beneficiari' } )
			).toBeVisible();
			expect( await greusAxe( page ) ).toEqual( [] );
		} );
	} );
} );
