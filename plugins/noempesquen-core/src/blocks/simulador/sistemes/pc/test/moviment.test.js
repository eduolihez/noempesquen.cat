import { describe, it, expect } from 'vitest';
import { delta } from '../moviment.js';

describe( 'delta', () => {
	it( 'sense escala no canvia res', () => {
		expect( delta( 10, -4 ) ).toEqual( { dx: 10, dy: -4 } );
		expect( delta( 10, -4, 1 ) ).toEqual( { dx: 10, dy: -4 } );
	} );
	it( 'divideix per l’escala', () => {
		expect( delta( 50, 25, 0.5 ) ).toEqual( { dx: 100, dy: 50 } );
		const d = delta( 57.2, -114.4, 0.572 );
		expect( d.dx ).toBeCloseTo( 100 );
		expect( d.dy ).toBeCloseTo( -200 );
	} );
	it( 'escales invàlides es tracten com a 1', () => {
		[ 0, -1, NaN, Infinity, undefined ].forEach( ( e ) =>
			expect( delta( 8, 6, e ) ).toEqual( { dx: 8, dy: 6 } )
		);
	} );
} );
