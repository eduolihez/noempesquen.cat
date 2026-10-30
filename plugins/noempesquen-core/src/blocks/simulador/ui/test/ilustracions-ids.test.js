import { describe, it, expect } from 'vitest';
import { IDS_ILUSTRACIO, existeixIlustracio } from '../ilustracions-ids.js';

describe( 'ids d’il·lustració', () => {
	it( 'no té duplicats ni buits', () => {
		expect( new Set( IDS_ILUSTRACIO ).size ).toBe( IDS_ILUSTRACIO.length );
		expect( IDS_ILUSTRACIO.every( ( id ) => id.length > 0 ) ).toBe( true );
		expect( IDS_ILUSTRACIO.length ).toBeGreaterThanOrEqual( 16 );
	} );

	it( 'existeixIlustracio distingeix ids coneguts i desconeguts', () => {
		expect( existeixIlustracio( 'platja' ) ).toBe( true );
		expect( existeixIlustracio( 'no-hi-es' ) ).toBe( false );
		expect( existeixIlustracio( undefined ) ).toBe( false );
	} );
} );
