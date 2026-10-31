import { describe, it, expect } from 'vitest';
import { fusionaProgres, diferencia } from '../sincro.js';

describe( 'fusionaProgres', () => {
	it( 'buits i no objectes', () => {
		expect( fusionaProgres( {}, {} ) ).toEqual( {} );
		expect( fusionaProgres( null, 'x' ) ).toEqual( {} );
		expect( fusionaProgres( [ 1 ], undefined ) ).toEqual( {} );
	} );
	it( 'màxim per missió amb solapament', () => {
		expect(
			fusionaProgres( { a: 3, b: 1 }, { a: 2, b: 2, c: 1 } )
		).toEqual( { a: 3, b: 2, c: 1 } );
	} );
	it( 'ignora valors estranys', () => {
		expect(
			fusionaProgres(
				{ a: '3', b: NaN, c: Infinity, d: null, e: 1 },
				{ a: 1 }
			)
		).toEqual( { a: 1, e: 1 } );
	} );
	it( 'no muta les entrades', () => {
		const l = { a: 3 };
		const s = { a: 1, b: 2 };
		fusionaProgres( l, s );
		expect( l ).toEqual( { a: 3 } );
		expect( s ).toEqual( { a: 1, b: 2 } );
	} );
} );

describe( 'diferencia', () => {
	it( 'detecta missió nova o més estrelles', () => {
		expect( diferencia( { a: 1, b: 1 }, { a: 1 } ) ).toBe( true );
		expect( diferencia( { a: 3 }, { a: 2 } ) ).toBe( true );
	} );
	it( 'false si el servidor ja ho té', () => {
		expect( diferencia( { a: 2 }, { a: 3, b: 1 } ) ).toBe( false );
		expect( diferencia( {}, {} ) ).toBe( false );
		expect( diferencia( null, null ) ).toBe( false );
	} );
} );
