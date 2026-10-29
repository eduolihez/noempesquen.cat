import { describe, it, expect } from 'vitest';
import { horaDeJoc } from '../hora.js';

describe( 'horaDeJoc', () => {
	it( 'returns the base time at zero seconds', () => {
		expect( horaDeJoc( '09:12', 0 ) ).toBe( '09:12' );
	} );

	it( 'adds whole minutes and drops leftover seconds', () => {
		expect( horaDeJoc( '09:12', 125 ) ).toBe( '09:14' );
		expect( horaDeJoc( '09:12', 59 ) ).toBe( '09:12' );
	} );

	it( 'wraps past midnight', () => {
		expect( horaDeJoc( '23:58', 180 ) ).toBe( '00:01' );
	} );

	it( 'pads hours and minutes', () => {
		expect( horaDeJoc( '00:00', 61 ) ).toBe( '00:01' );
	} );

	it( 'falls back to 00:00 on a malformed base', () => {
		expect( horaDeJoc( 'xx', 60 ) ).toBe( '00:01' );
		expect( horaDeJoc( undefined, 0 ) ).toBe( '00:00' );
	} );
} );
