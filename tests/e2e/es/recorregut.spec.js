const { readFileSync } = require( 'node:fs' );
const { join } = require( 'node:path' );
const { test, expect, esHoritzontal } = require( '../ajudes' );
const { ruta } = require( '../rutes' );

/*
 * Recorregut sencer d'una missió de PC (llissa-01) i una de mòbil (remei-01)
 * en castellà. Els textos d'interfície surten del .po (msgid català → msgstr
 * castellà), i els de la missió, de `missions/es/`. Al final es comprova que cap
 * dels textos catalans usats no és a la pàgina.
 */
test.use( { locale: 'es-ES' } );

const PO = readFileSync(
	join(
		__dirname,
		'../../../plugins/noempesquen-core/languages/noempesquen-es_ES.po'
	),
	'utf8'
);
const desescapa = ( s ) => s.replace( /\\(["\\])/g, '$1' );
const TRADUCCIONS = new Map(
	[
		...PO.matchAll(
			/^msgid "((?:[^"\\]|\\.)+)"\nmsgstr "((?:[^"\\]|\\.)+)"$/gm
		),
	].map( ( m ) => [ desescapa( m[ 1 ] ), desescapa( m[ 2 ] ) ] )
);
/** Catalans usats en aquest spec amb traducció diferent (no han de sortir). */
const USATS = new Set();

/**
 * Traducció castellana d'un msgid català; falla si no n'hi ha.
 *
 * @param {string} msgid Text català.
 * @return {string} Text castellà.
 */
function t( msgid ) {
	const es = TRADUCCIONS.get( msgid );
	if ( ! es ) {
		throw new Error( `Sense traducció al .po: «${ msgid }»` );
	}
	if ( es !== msgid ) {
		USATS.add( msgid );
	}
	return es;
}
const escapa = ( s ) => s.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );

const missio = ( id, lang = 'es' ) =>
	require(
		`../../../plugins/noempesquen-core/missions/${ lang }/${ id }.json`
	);

/**
 * Text castellà de la missió al mateix camp on el català comença per `inici`.
 *
 * @param {string} id    Id de la missió.
 * @param {string} inici Començament del text català.
 * @return {string} Text castellà.
 */
function textMissio( id, inici ) {
	const busca = ( ca, es ) => {
		if ( typeof ca === 'string' ) {
			return ca.startsWith( inici ) ? es : null;
		}
		if ( ca && typeof ca === 'object' ) {
			for ( const k of Object.keys( ca ) ) {
				const r = busca( ca[ k ], es?.[ k ] );
				if ( r ) {
					return r;
				}
			}
		}
		return null;
	};
	const es = busca( missio( id, 'ca' ), missio( id ) );
	if ( ! es ) {
		throw new Error( `${ id }: cap text comença per «${ inici }»` );
	}
	return es;
}

/**
 * Sembra el progrés dels tutorials, obre el vaixell i la missió.
 *
 * @param {import('@playwright/test').Page} page
 * @param {'pc'|'mobil'}                    dispositiu
 * @param {string}                          titol      Títol ES de la missió.
 */
async function obre( page, dispositiu, titol ) {
	await page.clock.install();
	await page.addInitScript( () => {
		window.localStorage.setItem(
			'noempesquen-progres-v2',
			JSON.stringify( { 'tutorial-pc': 1, 'tutorial-mobil': 1 } )
		);
	} );
	await page.goto( ruta( 'simulador', 'es' ) );
	const vaixell = dispositiu === 'pc' ? 'el Pesquer' : 'el Pirata';
	// «Abrir el Pesquer: …» (msgid amb format).
	const obreVaixell = t(
		'Obre %1$s: %2$s, %3$d de %4$d missions, %5$d de %6$d estrelles'
	).split( '%1$s' )[ 0 ];
	await page
		.getByRole( 'button', {
			name: new RegExp( escapa( `${ obreVaixell }${ vaixell }:` ) ),
		} )
		.click();
	await page
		.getByRole( 'button', { name: new RegExp( escapa( titol ) ) } )
		.click();
}

/**
 * Comprova la capa final, obre el resultat i mira que no hi quedi català.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          titolCapa Text castellà esperat a la capa.
 */
async function resultat( page, titolCapa ) {
	const capa = page.getByRole( 'dialog' );
	await expect( capa ).toContainText( titolCapa );
	await capa
		.getByRole( 'button', { name: t( 'Veure el resultat' ) } )
		.click();
	await expect(
		page.getByRole( 'img', { name: /3/ } ).first()
	).toBeVisible();
	await expect(
		page.getByRole( 'button', { name: t( 'Torna-ho a provar' ) } )
	).toBeVisible();
	const text = await page.locator( 'body' ).innerText();
	const catala = [ ...USATS ].filter( ( c ) => text.includes( c ) );
	expect( catala ).toEqual( [] );
}

test.describe( 'Recorrido en castellano', () => {
	test( 'PC: La factura de la luz, denunciar como pesca', async ( {
		page,
	} ) => {
		test.skip( ! esHoritzontal( page ), 'PC en vertical: pide girar' );
		const m = missio( 'llissa-01-factura' );
		await obre( page, 'pc', m.titol );

		const bloqueig = page.getByRole( 'button', {
			name: new RegExp(
				escapa( t( 'Clica o prem una tecla per entrar' ) )
			),
		} );
		await bloqueig.click();
		const parla = page.getByRole( 'region', { name: 'Parla' } );
		await expect( parla ).toBeVisible();
		await parla
			.getByRole( 'button', { name: t( 'Salta la presentació' ) } )
			.click();
		await page.clock.runFor( 8000 );

		const barra = page.getByRole( 'navigation', {
			name: t( 'Barra de tasques' ),
		} );
		await barra
			.getByRole( 'button', {
				name: new RegExp( `^${ escapa( t( 'Navegador' ) ) }` ),
			} )
			.click();
		const correu = m.correus?.find( ( c ) => c.assumpte ) ?? null;
		const assumpte =
			correu?.assumpte ?? 'URGENTE: tu suministro se cortará hoy';
		await page
			.getByRole( 'region', { name: t( 'Entrada' ) } )
			.getByRole( 'button', { name: /URGENTE/ } )
			.click();
		await expect(
			page.getByRole( 'heading', { name: assumpte } )
		).toBeVisible();

		await page
			.getByRole( 'button', { name: t( 'Més' ), exact: true } )
			.click();
		await page
			.getByRole( 'menuitem', {
				name: new RegExp( escapa( t( 'Denuncia pesca (phishing)' ) ) ),
			} )
			.click();
		await page
			.getByRole( 'alertdialog' )
			.getByRole( 'button', { name: t( 'Denuncia' ), exact: true } )
			.click();

		await resultat( page, t( 'Molt bé!' ) );
	} );

	test( 'Móvil: El paquete retenido, bloquear y borrar', async ( {
		page,
		isMobile,
	} ) => {
		test.skip( ! isMobile, 'Solo en el proyecto móvil' );
		const m = missio( 'remei-01-paquet' );
		await obre( page, 'mobil', m.titol );

		const bloqueig = page.getByRole( 'button', {
			name: new RegExp(
				escapa(
					t( 'Llisca cap amunt, toca o prem una tecla per entrar' )
				)
			),
		} );
		await bloqueig.click();
		const dock = page.getByRole( 'list', { name: t( 'Apps preferides' ) } );
		await expect( dock ).toBeVisible();
		// Salta la presentació de Parla (com `saltaIntro` d'ajudes.js) i torna a l'inici.
		await page
			.getByRole( 'list', { name: 'Apps', exact: true } )
			.getByRole( 'button', { name: 'Parla', exact: true } )
			.click();
		const salta = page
			.getByRole( 'button', { name: t( 'Salta la presentació' ) } )
			.first();
		if ( ! ( await salta.isVisible() ) ) {
			await page
				.getByRole( 'button', { name: /^Remei/ } )
				.first()
				.click();
		}
		await salta.click();
		await expect( salta ).toBeHidden();
		await page
			.getByRole( 'button', { name: t( 'Torna als xats' ) } )
			.click();
		const enrere = page.getByRole( 'button', {
			name: t( 'Enrere' ),
			exact: true,
		} );
		for ( let i = 0; i < 3 && ! ( await dock.isVisible() ); i++ ) {
			await enrere.click();
		}
		await expect( dock ).toBeVisible();
		await page.clock.runFor( 8000 );

		await dock.getByRole( 'button', { name: t( 'Missatges' ) } ).click();
		await page
			.locator( '[data-fil]' )
			.filter( { hasText: /4471/ } )
			.first()
			.click();
		await expect(
			page.getByText( 'tu paquete 4471-ES está retenido en el almacén.', {
				exact: true,
			} )
		).toBeVisible();

		await page
			.getByRole( 'button', { name: t( 'Opcions del missatge' ) } )
			.last()
			.click();
		await page
			.getByRole( 'button', { name: t( 'Bloqueja el número' ) } )
			.click();
		const dialeg = page.getByRole( 'dialog' ).last();
		await dialeg.getByLabel( t( 'I esborra la conversa' ) ).check();
		await dialeg
			.getByRole( 'button', { name: t( 'Bloqueja' ), exact: true } )
			.click();

		await resultat(
			page,
			textMissio( 'remei-01-paquet', 'Ben fet!' ).slice( 0, 30 )
		);
	} );
} );
