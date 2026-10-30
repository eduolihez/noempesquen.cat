import { describe, it, expect } from 'vitest';
import { nomJugador, nomPila } from '../jugador.js';

describe( 'nom del jugador', () => {
	it( 'usa el del món', () => {
		const mon = { jugador: { nom: 'Marta Soler Vila' } };
		expect( nomJugador( mon ) ).toBe( 'Marta Soler Vila' );
		expect( nomPila( mon ) ).toBe( 'Marta' );
	} );
	it( 'cau al valor per defecte', () => {
		for ( const mon of [ undefined, {}, { jugador: { nom: '  ' } } ] ) {
			expect( nomJugador( mon ) ).toBe( 'Àlex Puig' );
			expect( nomPila( mon ) ).toBe( 'Àlex' );
		}
	} );
} );
