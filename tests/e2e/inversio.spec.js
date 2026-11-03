const { test, expect } = require( './ajudes' );
const {
	greusAxePc,
	senseFullscreen,
	iniciaMissio,
	escoltaFuites,
	sensePistes,
} = require( './ajudes' );
const MISSIO_JSON = require( '../../plugins/noempesquen-core/missions/ca/llissa-03-inversio.json' );

const MISSIO = /El truc d'inversió/;
const BLOQUEIG = /Clica o prem/;
const TITOL_ANUNCI = 'Carla Montsant revela el truc per multiplicar 250 €';
const ENLLAC = 'Descobreix el truc';
const URL_FALSA = 'https://invest-rapid.top/carla';
// Valors escrits a mà: no han de quedar enlloc.
const FORMULARI = {
	'Nom i cognoms': 'Zqx Nom Inversio',
	Telèfon: '699 773 155',
	'Número de targeta': '4929 7731 0000 4417',
	CVC: '582',
};
// Marques dels disparadors de prova (missió injectada).
const PRIMERA = 'Zqx prova: primera denúncia';
const SEGONA = 'Zqx prova: denúncia duplicada';
const MARCA_ENLLAC = 'Zqx prova: enllaç obert';

const barraTasques = ( page ) =>
	page.getByRole( 'navigation', { name: 'Barra de tasques' } );
const parla = ( page ) => page.getByRole( 'region', { name: 'Parla' } );
const anunci = ( page ) =>
	page.getByRole( 'region', { name: 'Anunci: Contingut patrocinat' } );
const informa = ( page ) =>
	anunci( page ).getByRole( 'button', { name: "Informa d'aquest anunci" } );

// Variant de prova: sense la decisió en denunciar (el joc continua) i amb
// disparadors marcats. `prova-denuncia-2` va abans i només coincideix si
// `prova-denuncia-1` ja s'ha executat: si apareix, s'ha emès dues vegades.
function variantDeProva() {
	const m = JSON.parse( JSON.stringify( MISSIO_JSON ) );
	m.apps = {
		posta: {
			correus: [
				{
					id: 'prova-denunciat',
					ocult: true,
					carpeta: 'entrada',
					llegit: true,
					data: '17:40',
					remitent: { nom: 'Prova', adreca: 'prova@posta.cat' },
					assumpte: 'Prova',
					cos: [ [ { t: 'Prova' } ] ],
				},
			],
		},
	};
	m.disparadors = [
		...m.disparadors.filter( ( d ) => d.id !== 'denunciat' ),
		{
			id: 'prova-denuncia-2',
			quan: {
				esdeveniment: 'publicacio.denuncia',
				id: 'anunci-carla',
				visible: 'prova-denunciat',
			},
			efectes: [ { tipus: 'guia-diu', text: SEGONA } ],
		},
		{
			id: 'prova-denuncia-1',
			quan: { esdeveniment: 'publicacio.denuncia', id: 'anunci-carla' },
			efectes: [
				{ tipus: 'mostra', id: 'prova-denunciat' },
				{ tipus: 'guia-diu', text: PRIMERA },
			],
		},
		{
			id: 'prova-enllac',
			quan: { esdeveniment: 'enllac.obre', url: URL_FALSA },
			efectes: [ { tipus: 'guia-diu', text: MARCA_ENLLAC } ],
		},
	];
	return m;
}

// Serveix la variant de prova en lloc de la missió inclosa.
const injectaVariant = ( page ) =>
	page.route(
		( url ) => url.href.includes( 'noempesquen/v1/missions' ),
		( route ) => route.fulfill( { json: [ { guio: variantDeProva() } ] } )
	);

async function entra( page ) {
	await iniciaMissio( page, MISSIO, BLOQUEIG );
	await page.getByRole( 'button', { name: BLOQUEIG } ).click();
	await expect( parla( page ) ).toBeVisible();
	await parla( page )
		.getByRole( 'button', { name: 'Salta la presentació' } )
		.click();
}

async function obreElDiari( page ) {
	await barraTasques( page )
		.getByRole( 'button', { name: /^Navegador/ } )
		.click();
	await page
		.getByRole( 'list', { name: 'Dreceres' } )
		.getByRole( 'link', { name: 'El Diari del Barri' } )
		.click();
	await expect(
		page.getByRole( 'heading', { name: 'Últimes notícies del barri' } )
	).toBeVisible();
}

// Escriu una adreça a la barra d'adreces de la pestanya activa.
async function vesA( page, adreca ) {
	const barra = page.getByRole( 'textbox', { name: "Barra d'adreces" } );
	await barra.fill( adreca );
	await barra.press( 'Enter' );
}

async function alDiari( page ) {
	await entra( page );
	await obreElDiari( page );
	await expect( anunci( page ) ).toBeVisible();
}

async function obreLaWeb( page ) {
	await anunci( page ).getByRole( 'link', { name: ENLLAC } ).click();
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

// Cert si l'element desborda horitzontalment.
const desborda = ( page, selector ) =>
	page
		.locator( selector )
		.evaluate( ( el ) => el.scrollWidth > el.clientWidth + 1 );

test.beforeEach( ( { isMobile } ) => {
	test.skip( isMobile, 'Només al projecte escriptori' );
} );

test.describe( "El truc d'inversió", () => {
	test( 'la portada del Diari mostra l’anunci patrocinat', async ( {
		page,
	} ) => {
		await alDiari( page );
		await expect( anunci( page ) ).toContainText( 'Contingut patrocinat' );
		await expect(
			anunci( page ).getByRole( 'heading', { name: TITOL_ANUNCI } )
		).toBeVisible();
		await expect( anunci( page ) ).toContainText( 'Carla Montsant' );
		await expect( anunci( page ) ).toContainText( 'CM' );
	} );

	test( 'camí correcte: informar de l’anunci dona la resposta correcta', async ( {
		page,
	} ) => {
		await alDiari( page );
		await informa( page ).click();
		await expect( page.getByRole( 'dialog' ) ).toContainText( 'Ben fet!' );
		await veuResultat( page, 1 );
	} );

	test( 'informar dues vegades només emet una denúncia', async ( {
		page,
	} ) => {
		await injectaVariant( page );
		await alDiari( page );
		await informa( page ).click();
		await expect( informa( page ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		await expect( anunci( page ).getByRole( 'status' ) ).toHaveText(
			'Anunci denunciat. Gràcies.'
		);
		// Control positiu: la variant s'ha carregat i la primera ha arribat.
		await expect( page.getByText( PRIMERA ).first() ).toBeAttached();
		await informa( page ).click( { force: true } );
		await page.clock.runFor( 1000 );
		await expect( page.getByText( SEGONA ) ).toHaveCount( 0 );
	} );

	test( 'la denúncia es manté en canviar de web i tornar', async ( {
		page,
	} ) => {
		await injectaVariant( page );
		await alDiari( page );
		await informa( page ).click();
		await expect( page.getByText( PRIMERA ).first() ).toBeAttached();
		await obreLaWeb( page );
		await vesA( page, 'diaridelbarri.cat' );
		await expect( anunci( page ) ).toBeVisible();
		await expect( informa( page ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		await informa( page ).click( { force: true } );
		await page.clock.runFor( 1000 );
		await expect( page.getByText( SEGONA ) ).toHaveCount( 0 );
	} );

	test( 'l’enllaç de l’anunci emet enllac.obre i no navega de debò', async ( {
		page,
	} ) => {
		await injectaVariant( page );
		await alDiari( page );
		const real = page.url();
		await obreLaWeb( page );
		await expect( page.getByText( MARCA_ENLLAC ).first() ).toBeAttached();
		await expect(
			page.getByText( 'invest-rapid.top' ).first()
		).toBeVisible();
		expect( page.url() ).toBe( real );
	} );

	test( 'pescat: autoompliment i «Diposita 250 €»', async ( { page } ) => {
		await alDiari( page );
		await obreLaWeb( page );
		for ( const camp of [
			'Nom i cognoms',
			'Telèfon',
			'Número de targeta',
			'Caducitat',
			'CVC',
		] ) {
			await page.getByRole( 'textbox', { name: camp } ).focus();
			await page
				.getByRole( 'button', { name: /Omple aquest camp/ } )
				.click();
		}
		await expect(
			page.getByRole( 'textbox', { name: 'Número de targeta' } )
		).toHaveValue( '4000 1234 5678 9010' );
		await page.getByRole( 'button', { name: 'Diposita 250 €' } ).click();
		await expect( page.getByRole( 'dialog' ) ).toContainText(
			"T'han pescat!"
		);
		await veuResultat( page, 1 );
	} );

	test( 'el que s’escriu a la web falsa no surt enlloc', async ( {
		page,
	} ) => {
		const vist = escoltaFuites( page );
		await alDiari( page );
		await obreLaWeb( page );
		for ( const [ camp, valor ] of Object.entries( FORMULARI ) ) {
			await page.getByRole( 'textbox', { name: camp } ).fill( valor );
		}
		await page
			.getByRole( 'textbox', { name: 'Caducitat' } )
			.fill( '11/31' );
		await page.getByRole( 'button', { name: 'Diposita 250 €' } ).click();
		await expect( page.getByRole( 'dialog' ) ).toContainText(
			"T'han pescat!"
		);
		const tot = Object.values( FORMULARI );
		await sensePistes( page, vist, tot );
		await veuResultat( page, 1 );
		await sensePistes( page, vist, tot );
	} );

	test( 'la portada normal (una altra missió) no té cap anunci', async ( {
		page,
	} ) => {
		await iniciaMissio( page, /El banc et bloqueja el compte/, BLOQUEIG );
		await page.getByRole( 'button', { name: BLOQUEIG } ).click();
		await parla( page )
			.getByRole( 'button', { name: 'Salta la presentació' } )
			.click();
		await barraTasques( page )
			.getByRole( 'button', { name: /^Navegador/ } )
			.click();
		await vesA( page, 'diaridelbarri.cat' );
		await expect(
			page.getByRole( 'heading', { name: 'Últimes notícies del barri' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'region', { name: /^Anunci:/ } )
		).toHaveCount( 0 );
	} );

	test( 'a 1024 px la web falsa no desborda en horitzontal', async ( {
		page,
	} ) => {
		await page.setViewportSize( { width: 1024, height: 768 } );
		await senseFullscreen( page );
		await alDiari( page );
		await obreLaWeb( page );
		await page.clock.runFor( 10000 );
		expect( await desborda( page, '.nep-iv' ) ).toBe( false );
		await page.screenshot( { path: 'test-results/inversio-1024.png' } );
		// revenda-cobra.com només existeix a remei-05 (mòbil): al PC no s'hi
		// arriba, i aquí només es comprova invest-rapid.top.
	} );

	test.describe( 'accessibilitat', () => {
		test( 'sense violacions axe greus: Diari amb anunci', async ( {
			page,
		} ) => {
			await alDiari( page );
			expect( await greusAxePc( page ) ).toEqual( [] );
		} );

		test( 'sense violacions axe greus: invest-rapid.top', async ( {
			page,
		} ) => {
			await alDiari( page );
			await obreLaWeb( page );
			await page.clock.runFor( 10000 );
			expect( await greusAxePc( page ) ).toEqual( [] );
		} );
	} );
} );
