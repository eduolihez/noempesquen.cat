import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';

const MARQUES = [
	'Windows',
	'Microsoft',
	'Gmail',
	'Google',
	'WhatsApp',
	'Instagram',
	'Facebook',
	'Telegram',
	'Amazon',
	'Wallapop',
	'Bizum',
	'Santander',
	'BBVA',
	'CaixaBank',
	'Revolut',
	'PayPal',
	'Netflix',
	'Apple',
	'iPhone',
	'Samsung',
	'Correos',
	'SEUR',
	'TikTok',
	'Twitter',
	'Binance',
	'Vinted',
	'Milanuncios',
	'Coinbase',
	'Trade Republic',
	'eToro',
];

/*
 * Excepcions: «Correos» es cerca amb majúscula exacta perquè en castellà
 * «correos» (correus electrònics) és una paraula comuna. La resta, sense
 * distingir majúscules.
 */
const EXACTES = [ 'Correos' ];
const troba = ( contingut ) =>
	MARQUES.filter( ( m ) =>
		new RegExp( `\\b${ m }\\b`, EXACTES.includes( m ) ? '' : 'i' ).test(
			contingut
		)
	);

// Control: la cerca troba una marca dins d'un text (evita un test que mai falla).
describe( 'detector de marques', () => {
	it( 'detecta una marca real com a paraula', () => {
		expect( troba( 'Ven-ho per Wallapop' ) ).toEqual( [ 'Wallapop' ] );
	} );

	it( '«correos» en minúscula no és la marca', () => {
		expect( troba( 'Revisa tus correos' ) ).toEqual( [] );
		expect( troba( 'Un aviso de Correos' ) ).toEqual( [ 'Correos' ] );
	} );
} );

describe( 'sense marques reals', () => {
	[ 'ca', 'es' ].forEach( ( idioma ) => {
		const dir = new URL(
			`../../../../../missions/${ idioma }/`,
			import.meta.url
		);
		readdirSync( dir )
			.filter( ( nom ) => nom.endsWith( '.json' ) )
			.forEach( ( nom ) => {
				it( `${ idioma }/${ nom } no menciona cap marca real`, () => {
					expect(
						troba( readFileSync( new URL( nom, dir ), 'utf8' ) )
					).toEqual( [] );
				} );
			} );
	} );
} );
