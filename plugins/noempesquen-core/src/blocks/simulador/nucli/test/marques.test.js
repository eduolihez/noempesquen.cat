import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

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
];

const text = ( nom ) =>
	readFileSync(
		new URL( `../../../../../missions/${ nom }.json`, import.meta.url ),
		'utf8'
	);

describe( 'sense marques reals', () => {
	[ 'remei-03-sorteig', 'remei-04-codi', 'mon' ].forEach( ( nom ) => {
		it( `${ nom }.json no menciona cap marca real`, () => {
			const contingut = text( nom );
			const trobades = MARQUES.filter( ( m ) =>
				new RegExp( `\b${ m }\b`, 'i' ).test( contingut )
			);
			expect( trobades ).toEqual( [] );
		} );
	} );
} );
