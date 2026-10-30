import { describe, it, expect } from 'vitest';
import {
	destiRevenda,
	formataPreu,
	idsVisibles,
	textMissatge,
} from '../anuncis.js';

describe( 'revenda/anuncis (ajudes de la interfície)', () => {
	it( 'llegeix els ids visibles del motor', () => {
		expect( idsVisibles( { visibles: { a: true, b: false } } ) ).toEqual( [
			'a',
		] );
		expect( idsVisibles( {} ) ).toEqual( [] );
		expect( idsVisibles( null ) ).toEqual( [] );
	} );

	it( 'formata el preu en euros', () => {
		expect( formataPreu( 120 ) ).toBe( '120 €' );
		expect( formataPreu( 12.5 ) ).toBe( '12,50 €' );
		expect( formataPreu( 'x' ) ).toBe( '' );
	} );

	it( "treu el text pla d'un missatge", () => {
		expect(
			textMissatge( {
				cos: [
					{ t: 'Paga aquí: ' },
					{ enllac: { text: 'cobra', url: 'https://x.test' } },
				],
			} )
		).toBe( 'Paga aquí: cobra' );
		expect( textMissatge( null ) ).toBe( '' );
	} );

	it( 'porta la notificació a la pestanya Xats i al xat', () => {
		expect( destiRevenda( { app: 'revenda', xat: 'x1' } ) ).toEqual( [
			'revenda',
			{ pestanya: 'xats', xat: 'x1' },
		] );
		expect( destiRevenda( { app: 'revenda' } ) ).toEqual( [
			'revenda',
			{ pestanya: 'xats' },
		] );
	} );
} );
