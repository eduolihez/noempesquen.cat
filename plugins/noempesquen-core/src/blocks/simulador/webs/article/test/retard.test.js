import { describe, it, expect } from 'vitest';
import { avancaVisible, avisToca, segonsRetard } from '../retard.js';

describe( 'segonsRetard', () => {
	it( 'arrodoneix amunt a segons sencers', () => {
		expect( segonsRetard( 0 ) ).toBe( 0 );
		expect( segonsRetard( 1 ) ).toBe( 1 );
		expect( segonsRetard( 3000 ) ).toBe( 3 );
		expect( segonsRetard( 3001 ) ).toBe( 4 );
	} );

	it( 'valors no vàlids o negatius compten com a 0', () => {
		expect( segonsRetard( -500 ) ).toBe( 0 );
		expect( segonsRetard( undefined ) ).toBe( 0 );
		expect( segonsRetard( 'abc' ) ).toBe( 0 );
	} );
} );

describe( 'avisToca', () => {
	it( 'amb retard 0 surt de seguida', () => {
		expect( avisToca( 0, 10, 10 ) ).toBe( true );
	} );

	it( 'espera els segons de joc des de la càrrega', () => {
		expect( avisToca( 3000, 10, 12 ) ).toBe( false );
		expect( avisToca( 3000, 10, 13 ) ).toBe( true );
	} );

	it( 'si el temps no avança (pausa), no surt', () => {
		expect( avisToca( 2000, 5, 5 ) ).toBe( false );
	} );
} );

describe( 'avancaVisible', () => {
	it( 'només compta el temps amb la pestanya visible', () => {
		let c = { ultim: 0, visible: 0 };
		c = avancaVisible( c, 2, true );
		expect( c ).toEqual( { ultim: 2, visible: 2 } );
		c = avancaVisible( c, 10, false );
		expect( c ).toEqual( { ultim: 10, visible: 2 } );
		c = avancaVisible( c, 11, true );
		expect( c ).toEqual( { ultim: 11, visible: 3 } );
	} );

	it( 'el temps que recula no resta', () => {
		expect( avancaVisible( { ultim: 5, visible: 1 }, 3, true ) ).toEqual( {
			ultim: 3,
			visible: 1,
		} );
	} );
} );
