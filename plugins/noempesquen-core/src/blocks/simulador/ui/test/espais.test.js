import { describe, it, expect } from 'vitest';
import { separaEspais } from '../espais.js';

describe( 'separaEspais', () => {
	it( 'separa els espais del principi i del final', () => {
		expect( separaEspais( ' i introdueix les dades. ' ) ).toEqual( {
			abans: ' ',
			nucli: 'i introdueix les dades.',
			despres: ' ',
		} );
	} );

	it( 'deixa intacte un text sense espais als extrems', () => {
		expect( separaEspais( 'Benvolgut client,' ) ).toEqual( {
			abans: '',
			nucli: 'Benvolgut client,',
			despres: '',
		} );
	} );

	it( 'conserva els espais de dins i qualsevol blanc dels extrems', () => {
		expect( separaEspais( '\n\tde 87,40 €.  ' ) ).toEqual( {
			abans: '\n\t',
			nucli: 'de 87,40 €.',
			despres: '  ',
		} );
	} );

	it( 'un text només de blancs queda tot a «abans»', () => {
		expect( separaEspais( '   ' ) ).toEqual( {
			abans: '   ',
			nucli: '',
			despres: '',
		} );
	} );

	it( 'admet valors buits', () => {
		expect( separaEspais( undefined ) ).toEqual( {
			abans: '',
			nucli: '',
			despres: '',
		} );
	} );
} );
