import { describe, it, expect } from 'vitest';
import { afegeixAnunci, filtraCua, podaRestes, restaTemps } from '../avisos.js';

describe( 'restaTemps', () => {
	it( 'descompta el temps corregut i no baixa de zero', () => {
		expect( restaTemps( 5000, 1000, 3000 ) ).toBe( 3000 );
		expect( restaTemps( 5000, 1000, 9000 ) ).toBe( 0 );
	} );
	it( 'un rellotge que va enrere no afegeix temps', () => {
		expect( restaTemps( 5000, 3000, 1000 ) ).toBe( 5000 );
	} );
} );

describe( 'filtraCua', () => {
	const notis = [
		{ id: 'a', app: 'parla' },
		{ id: 'b', app: 'posta', llegida: true },
		{ id: 'c', app: 'posta' },
	];
	it( 'treu les llegides i les que ja no existeixen, en ordre', () => {
		expect( filtraCua( [ 'c', 'x', 'b', 'a' ], notis ) ).toEqual( [
			'c',
			'a',
		] );
	} );
	it( "treu les que amaga el filtre (app d'origen oberta)", () => {
		expect(
			filtraCua( [ 'a', 'c' ], notis, ( n ) => n.app === 'parla' )
		).toEqual( [ 'c' ] );
	} );
	it( 'entrades no vàlides donen llista buida', () => {
		expect( filtraCua( undefined, notis ) ).toEqual( [] );
		expect( filtraCua( [ 'a' ], undefined ) ).toEqual( [] );
	} );
} );

describe( 'podaRestes', () => {
	it( 'només conserva els ids vius', () => {
		const r = podaRestes(
			new Map( [
				[ 'a', 1 ],
				[ 'b', 2 ],
			] ),
			[ 'b' ]
		);
		expect( [ ...r ] ).toEqual( [ [ 'b', 2 ] ] );
	} );
} );

describe( 'afegeixAnunci', () => {
	it( "acumula els d'una mateixa tanda", () => {
		let a = afegeixAnunci( [], 'U', { novaTanda: true, clau: 1 } );
		a = afegeixAnunci( a, 'Dos', { clau: 2 } );
		expect( a.map( ( x ) => x.text ) ).toEqual( [ 'U', 'Dos' ] );
	} );
	it( 'una tanda nova buida les anteriors', () => {
		const a = afegeixAnunci( [ { clau: 1, text: 'U' } ], 'Dos', {
			novaTanda: true,
			clau: 2,
		} );
		expect( a ).toEqual( [ { clau: 2, text: 'Dos' } ] );
	} );
	it( 'dos textos iguals seguits tenen claus diferents', () => {
		const a = afegeixAnunci(
			afegeixAnunci( [], 'Igual', { novaTanda: true, clau: 1 } ),
			'Igual',
			{ clau: 2 }
		);
		expect( a.map( ( x ) => x.clau ) ).toEqual( [ 1, 2 ] );
	} );
} );
