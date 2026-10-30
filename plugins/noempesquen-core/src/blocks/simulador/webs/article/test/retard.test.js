import { describe, it, expect } from 'vitest';
import { avisToca, segonsRetard } from '../retard.js';

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
