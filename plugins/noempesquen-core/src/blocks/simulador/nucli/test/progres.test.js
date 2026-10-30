import { describe, it, expect } from 'vitest';
import { llegeixProgres, desaProgres } from '../progres.js';

const memoria = ( inicial = {} ) => {
	const dades = { ...inicial };
	return {
		dades,
		getItem: ( k ) => ( k in dades ? dades[ k ] : null ),
		setItem: ( k, v ) => {
			dades[ k ] = String( v );
		},
	};
};
const trenca = {
	getItem: () => {
		throw new Error( 'bloquejat' );
	},
	setItem: () => {
		throw new Error( 'bloquejat' );
	},
};

describe( 'progres', () => {
	it( 'descarta les entrades que no són números', () => {
		const s = memoria( {
			'noempesquen-progres-v2': JSON.stringify( {
				a: 3,
				b: 'x',
				c: null,
				d: [ 1 ],
				e: 0,
			} ),
		} );
		expect( llegeixProgres( s ) ).toEqual( { a: 3, e: 0 } );
	} );

	it( 'torna {} si el que hi ha guardat no és un objecte', () => {
		[ 'null', '5', '"x"', '[1]', 'true' ].forEach( ( v ) => {
			const s = memoria( { 'noempesquen-progres-v2': v } );
			expect( llegeixProgres( s ) ).toEqual( {} );
		} );
		const antic = memoria( { 'noempesquen-progres-v1': '[1]' } );
		expect( llegeixProgres( antic ) ).toEqual( {} );
	} );

	it( 'llegeix el progrés v2', () => {
		const s = memoria( { 'noempesquen-progres-v2': '{"a":2}' } );
		expect( llegeixProgres( s ) ).toEqual( { a: 2 } );
	} );

	it( 'migra les estrelles de v1 a v2', () => {
		const s = memoria( { 'noempesquen-progres-v1': '{"a":3}' } );
		expect( llegeixProgres( s ) ).toEqual( { a: 3 } );
		expect( s.dades[ 'noempesquen-progres-v2' ] ).toBe( '{"a":3}' );
	} );

	it( 'JSON malformat retorna {}', () => {
		const s = memoria( { 'noempesquen-progres-v2': '{x' } );
		expect( llegeixProgres( s ) ).toEqual( {} );
	} );

	it( 'un storage que llança errors retorna {} i no peta', () => {
		expect( llegeixProgres( trenca ) ).toEqual( {} );
		expect( llegeixProgres( null ) ).toEqual( {} );
		expect( llegeixProgres( undefined ) ).toEqual( {} );
		expect( () => desaProgres( trenca, { a: 1 } ) ).not.toThrow();
		expect( () => desaProgres( null, { a: 1 } ) ).not.toThrow();
	} );

	it( 'desa el progrés a la clau v2', () => {
		const s = memoria();
		desaProgres( s, { a: 1 } );
		expect( s.dades[ 'noempesquen-progres-v2' ] ).toBe( '{"a":1}' );
	} );
} );
