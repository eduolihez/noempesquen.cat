import { describe, it, expect } from 'vitest';
import {
	parteixHora,
	ordenaXats,
	filtraPerNom,
	agrupaPerDia,
	properPas,
} from '../xats.js';

const xat = ( id, ...hores ) => ( {
	id,
	nom: id,
	missatges: hores.map( ( hora, i ) => ( {
		de: i % 2 ? 'jo' : 'ella',
		text: `t${ i }`,
		hora,
	} ) ),
} );

describe( 'parteixHora', () => {
	it( 'separa el dia i l’hora', () => {
		expect( parteixHora( 'ahir 18:40' ) ).toEqual( {
			dia: 'ahir',
			hora: '18:40',
		} );
		expect( parteixHora( 'dl. 20:15' ) ).toEqual( {
			dia: 'dl.',
			hora: '20:15',
		} );
	} );

	it( 'sense dia, és d’avui', () => {
		expect( parteixHora( '08:05' ) ).toEqual( { dia: '', hora: '08:05' } );
		expect( parteixHora( undefined ) ).toEqual( { dia: '', hora: '' } );
	} );
} );

describe( 'ordenaXats', () => {
	it( 'posa primer els xats amb el missatge més recent', () => {
		const xats = [
			xat( 'marta', 'ahir 18:40', 'ahir 18:53' ),
			xat( 'familia', 'dl. 20:15' ),
			xat( 'pau', '08:05', '08:07' ),
			xat( 'ana', '07:10' ),
		];
		expect( ordenaXats( xats ).map( ( x ) => x.id ) ).toEqual( [
			'pau',
			'ana',
			'marta',
			'familia',
		] );
	} );

	it( 'no muta la llista original', () => {
		const xats = [ xat( 'a', 'ahir 10:00' ), xat( 'b', '09:00' ) ];
		ordenaXats( xats );
		expect( xats.map( ( x ) => x.id ) ).toEqual( [ 'a', 'b' ] );
	} );

	it( 'un xat buit va al final', () => {
		const xats = [ xat( 'buit' ), xat( 'b', 'dg. 09:00' ) ];
		expect( ordenaXats( xats ).map( ( x ) => x.id ) ).toEqual( [
			'b',
			'buit',
		] );
	} );
} );

describe( 'filtraPerNom', () => {
	const items = [ { nom: 'Família' }, { nom: 'Marta' }, { nom: 'Pau' } ];

	it( 'ignora majúscules i accents', () => {
		expect( filtraPerNom( items, 'FAMILIA' ) ).toEqual( [
			{ nom: 'Família' },
		] );
		expect( filtraPerNom( items, 'mar' ) ).toEqual( [ { nom: 'Marta' } ] );
	} );

	it( 'sense cerca, ho retorna tot', () => {
		expect( filtraPerNom( items, '  ' ) ).toEqual( items );
	} );
} );

describe( 'agrupaPerDia', () => {
	it( 'agrupa els missatges consecutius del mateix dia', () => {
		const m = [
			{ hora: 'ahir 18:40' },
			{ hora: 'ahir 18:52' },
			{ hora: '08:05' },
		];
		expect( agrupaPerDia( m ) ).toEqual( [
			{ dia: 'ahir', missatges: [ m[ 0 ], m[ 1 ] ] },
			{ dia: '', missatges: [ m[ 2 ] ] },
		] );
	} );
} );

describe( 'properPas', () => {
	const g = { de: 'guia' };
	const j = { de: 'jo' };

	it( 'mostra de cop els missatges propis i s’atura al del guia', () => {
		expect( properPas( [ g, j, g ], 1, true ) ).toEqual( {
			mostrats: 2,
			escriu: true,
		} );
	} );

	it( 'sense animació ho mostra tot', () => {
		expect( properPas( [ g, j, g ], 1, false ) ).toEqual( {
			mostrats: 3,
			escriu: false,
		} );
	} );

	it( 'si tot és visible no escriu', () => {
		expect( properPas( [ g, j ], 2, true ) ).toEqual( {
			mostrats: 2,
			escriu: false,
		} );
	} );

	it( 'després d’un reinici, el xat més curt es mostra sencer', () => {
		expect( properPas( [ g ], 5, true ) ).toEqual( {
			mostrats: 1,
			escriu: false,
		} );
	} );
} );
