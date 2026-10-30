import { describe, it, expect } from 'vitest';
import { indexFocusAtrapat, normalitzaParagrafs } from '../avis.js';

describe( 'normalitzaParagrafs', () => {
	it( 'converteix una llista de segments en un sol paràgraf', () => {
		const cos = [ { t: 'Hola ' }, { t: 'virus', senyal: 'a' } ];
		expect( normalitzaParagrafs( cos ) ).toEqual( [ cos ] );
	} );

	it( 'deixa igual una llista de paràgrafs', () => {
		const cos = [ [ { t: 'Un' } ], [ { t: 'Dos' } ] ];
		expect( normalitzaParagrafs( cos ) ).toBe( cos );
	} );

	it( 'admet valors buits o incorrectes', () => {
		expect( normalitzaParagrafs( undefined ) ).toEqual( [] );
		expect( normalitzaParagrafs( [] ) ).toEqual( [] );
		expect( normalitzaParagrafs( 'text' ) ).toEqual( [] );
	} );
} );

describe( 'indexFocusAtrapat', () => {
	it( 'del darrer passa al primer amb Tab', () => {
		expect( indexFocusAtrapat( 2, 3, false ) ).toBe( 0 );
	} );

	it( 'del primer passa al darrer amb Maj+Tab', () => {
		expect( indexFocusAtrapat( 0, 3, true ) ).toBe( 2 );
	} );

	it( 'al mig deixa fer el navegador', () => {
		expect( indexFocusAtrapat( 1, 3, false ) ).toBe( -1 );
		expect( indexFocusAtrapat( 1, 3, true ) ).toBe( -1 );
	} );

	it( 'si el focus és fora, el torna a dins', () => {
		expect( indexFocusAtrapat( -1, 3, false ) ).toBe( 0 );
		expect( indexFocusAtrapat( -1, 3, true ) ).toBe( 2 );
	} );

	it( 'sense focusables no fa res', () => {
		expect( indexFocusAtrapat( -1, 0, false ) ).toBe( -1 );
	} );
} );
