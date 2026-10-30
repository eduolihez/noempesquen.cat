import { describe, it, expect } from 'vitest';
import {
	estatInicial,
	calcula,
	mostra,
	classeMida,
	ERROR_ZERO,
	ERROR_GRAN,
} from '../calc.js';

const prem = ( teclas, inicial = estatInicial() ) =>
	[ ...teclas ].reduce( calcula, inicial );

describe( 'calc', () => {
	it( 'estat inicial mostra 0', () => {
		expect( mostra( estatInicial() ) ).toBe( '0' );
	} );

	it( '7 × 6 = 42', () => {
		expect( mostra( prem( '7×6=' ) ) ).toBe( '42' );
	} );

	it( '0,1 + 0,2 = 0,3', () => {
		expect( mostra( prem( '0,1+0,2=' ) ) ).toBe( '0,3' );
	} );

	it( 'divisió per zero dona error i es recupera amb C o dígit', () => {
		const e = prem( '5÷0=' );
		expect( mostra( e ) ).toBe( ERROR_ZERO );
		expect( mostra( calcula( e, '+' ) ) ).toBe( ERROR_ZERO );
		expect( mostra( calcula( e, 'C' ) ) ).toBe( '0' );
		expect( mostra( calcula( e, '8' ) ) ).toBe( '8' );
	} );

	it( 'encadenat: 7 × 6 = i després + 1 =', () => {
		expect( mostra( prem( '+1=', prem( '7×6=' ) ) ) ).toBe( '43' );
	} );

	it( 'encadenat sense igual: 2 + 3 × 4 =', () => {
		expect( mostra( prem( '2+3×' ) ) ).toBe( '5' );
		expect( mostra( prem( '2+3×4=' ) ) ).toBe( '20' );
	} );

	it( "canviar d'operador substitueix el pendent", () => {
		expect( mostra( prem( '8+×2=' ) ) ).toBe( '16' );
	} );

	it( '± canvia el signe', () => {
		expect( mostra( prem( '5±' ) ) ).toBe( '-5' );
		expect( mostra( prem( '5±±' ) ) ).toBe( '5' );
		expect( mostra( prem( '±' ) ) ).toBe( '0' );
	} );

	it( '% divideix per cent', () => {
		expect( mostra( prem( '50%' ) ) ).toBe( '0,5' );
	} );

	it( 'màxim 12 dígits', () => {
		expect( mostra( prem( '1234567890123456' ) ) ).toBe( '123456789012' );
	} );

	it( 'coma: només una i 0, inicial', () => {
		expect( mostra( prem( ',' ) ) ).toBe( '0,' );
		expect( mostra( prem( '1,2,3' ) ) ).toBe( '1,23' );
	} );

	it( "⌫ esborra l'últim dígit", () => {
		expect( mostra( prem( '123⌫' ) ) ).toBe( '12' );
		expect( mostra( prem( '1⌫' ) ) ).toBe( '0' );
		expect( mostra( prem( '5±⌫' ) ) ).toBe( '0' );
	} );

	it( "no deixa zeros a l'esquerra", () => {
		expect( mostra( prem( '007' ) ) ).toBe( '7' );
	} );

	it( 'resultat enorme passa a exponencial', () => {
		expect( mostra( prem( '999999999999×999999999999=' ) ) ).toBe(
			'1e+24'
		);
	} );

	it( 'desbordament dona error propi i es recupera', () => {
		let e = prem( '999999999999' );
		for ( let i = 0; i < 30 && ! e.error; i++ ) {
			e = prem( '×999999999999=', e );
		}
		expect( mostra( e ) ).toBe( ERROR_GRAN );
		expect( mostra( calcula( e, '+' ) ) ).toBe( ERROR_GRAN );
		expect( mostra( calcula( e, 'C' ) ) ).toBe( '0' );
		expect( mostra( calcula( e, '4' ) ) ).toBe( '4' );
	} );

	it( '1 ÷ 3 arrodoneix a 10 xifres', () => {
		expect( mostra( prem( '1÷3=' ) ) ).toBe( '0,3333333333' );
	} );

	it( '0,5 ⌫ deixa 0,', () => {
		expect( mostra( prem( '0,5⌫' ) ) ).toBe( '0,' );
	} );

	it( 'classeMida redueix segons la longitud', () => {
		expect( classeMida( '42' ) ).toBe( 'is-mida-1' );
		expect( classeMida( '0,3333333333' ) ).toBe( 'is-mida-3' );
		expect( classeMida( '-123456789012' ) ).toBe( 'is-mida-4' );
	} );
} );
