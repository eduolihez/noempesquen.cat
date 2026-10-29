import { describe, it, expect } from 'vitest';
import { teclaDesbloqueig } from '../tecles.js';

const tecla = ( key, mods = {} ) => ( {
	key,
	ctrlKey: false,
	metaKey: false,
	altKey: false,
	...mods,
} );

describe( 'teclaDesbloqueig', () => {
	it( 'Retorn, espai i tecles imprimibles desbloquegen i es consumeixen', () => {
		for ( const key of [ 'Enter', ' ', 'a', 'Z', '7', 'ç' ] ) {
			expect( teclaDesbloqueig( tecla( key ) ) ).toBe( 'consumeix' );
		}
	} );

	it( 'les tecles de funció no fan res (F5, F11, F12...)', () => {
		for ( const key of [ 'F1', 'F5', 'F11', 'F12' ] ) {
			expect( teclaDesbloqueig( tecla( key ) ) ).toBeNull();
		}
	} );

	it( 'les combinacions amb Ctrl, Meta o Alt no fan res', () => {
		expect(
			teclaDesbloqueig( tecla( 'r', { ctrlKey: true } ) )
		).toBeNull();
		expect(
			teclaDesbloqueig( tecla( 'r', { metaKey: true } ) )
		).toBeNull();
		expect( teclaDesbloqueig( tecla( 'l', { altKey: true } ) ) ).toBeNull();
	} );

	it( 'Esc, Tab i els modificadors sols no fan res', () => {
		for ( const key of [
			'Escape',
			'Tab',
			'Shift',
			'Control',
			'Alt',
			'Meta',
		] ) {
			expect( teclaDesbloqueig( tecla( key ) ) ).toBeNull();
		}
	} );

	it( 'altres tecles desbloquegen sense consumir-se', () => {
		for ( const key of [ 'ArrowDown', 'Backspace', 'PageDown' ] ) {
			expect( teclaDesbloqueig( tecla( key ) ) ).toBe( 'deixa' );
		}
	} );
} );
