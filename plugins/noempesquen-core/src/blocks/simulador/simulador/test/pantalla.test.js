import { describe, it, expect } from 'vitest';
import { calculaPantalla, MINIM } from '../pantalla.js';

const pc = ( w, h ) => calculaPantalla( { w, h, dispositiu: 'pc' } );

describe( 'calculaPantalla', () => {
	it( 'MINIM és 1280×720', () => {
		expect( MINIM ).toEqual( { w: 1280, h: 720 } );
	} );
	it( '1440×900 i 1280×720 són normal', () => {
		expect( pc( 1440, 900 ).mode ).toBe( 'normal' );
		expect( pc( 1280, 720 ).mode ).toBe( 'normal' );
	} );
	it( '1024×768 escalat 0,8 i centrat', () => {
		const r = pc( 1024, 768 );
		expect( r.mode ).toBe( 'escalat' );
		expect( r.escala ).toBe( 0.8 );
		expect( r.desplX ).toBe( 0 );
		expect( r.desplY ).toBe( 96 );
	} );
	it( '915×412 escalat ~0,572', () => {
		const r = pc( 915, 412 );
		expect( r.mode ).toBe( 'escalat' );
		expect( r.escala ).toBe( 0.572 );
	} );
	it( 'centra el contingut escalat', () => {
		const a = pc( 915, 412 );
		expect( a.desplX ).toBe( 91 );
		expect( a.desplY ).toBe( 0 );
		const b = pc( 1920, 600 );
		expect( b.mode ).toBe( 'escalat' );
		expect( b.escala ).toBe( 0.833 );
		expect( b.desplX ).toBe( 427 );
		expect( b.desplY ).toBe( 0 );
	} );
	it( 'vertical estret demana girar', () => {
		expect( pc( 412, 915 ).mode ).toBe( 'girar' );
		expect( pc( 400, 800 ).mode ).toBe( 'girar' );
	} );
	it( 'el mòbil sempre és normal', () => {
		expect(
			calculaPantalla( {
				w: 400,
				h: 800,
				dispositiu: 'mobil',
			} ).mode
		).toBe( 'normal' );
	} );
	it( 'valors invàlids → normal', () => {
		[
			[ 0, 0 ],
			[ NaN, 800 ],
			[ -5, 700 ],
			[ 1000, -1 ],
			[ undefined, undefined ],
			[ Infinity, 5 ],
		].forEach( ( [ w, h ] ) => expect( pc( w, h ).mode ).toBe( 'normal' ) );
		expect( calculaPantalla().mode ).toBe( 'normal' );
	} );
} );
