import { describe, it, expect } from 'vitest';
import * as temps from '../temps.js';

describe( 'temps', () => {
	it( 'valores nuevos', () => {
		expect( temps.MS_ENTRE_AVISOS ).toBe( 700 );
		expect( temps.MS_AVIS_BASE ).toBe( 4000 );
		expect( temps.MS_AVIS_PER_CARACTER ).toBe( 60 );
		expect( temps.MS_AVIS_MAX ).toBe( 9000 );
		expect( temps.MS_SORTIDA ).toBe( 120 );
	} );
	it( 'valores actuales sin cambio', () => {
		expect( temps.MS_TICK ).toBe( 1000 );
		expect( temps.MS_ESCRIU ).toBe( 600 );
		expect( temps.MAX_TOASTS ).toBe( 3 );
		expect( temps.MAX_BANNERS ).toBe( 2 );
		expect( temps.SEGONS_PISTA ).toBe( 60 );
	} );
	it( 'todas son números positivos', () => {
		for ( const v of Object.values( temps ) ) {
			expect( Number.isFinite( v ) && v > 0 ).toBe( true );
		}
	} );
} );
