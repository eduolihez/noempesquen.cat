import { describe, expect, it } from 'vitest';
import { agrupaPerData, vei } from '../agrupa.js';

const ara = new Date( 2026, 9, 30, 12 );
const fotos = [
	{ id: 'a', titol: 'A', data: '2026-10-11', il: 'gat' },
	{ id: 'b', titol: 'B', data: '2026-10-30', il: 'gos' },
	{ id: 'c', titol: 'C', data: '2026-10-11', il: 'plat' },
	{ id: 'd', titol: 'D', data: '2026-10-29', il: 'carrer' },
	{ id: 'e', titol: 'E', data: '2026-07-02', il: 'muntanya' },
];

describe( 'agrupaPerData', () => {
	it( 'ordena els dies de més recent a més antic', () => {
		expect( agrupaPerData( fotos, ara ).map( ( g ) => g.data ) ).toEqual( [
			'2026-10-30',
			'2026-10-29',
			'2026-10-11',
			'2026-07-02',
		] );
	} );

	it( 'agrupa les fotos del mateix dia', () => {
		const g = agrupaPerData( fotos, ara ).find(
			( x ) => x.data === '2026-10-11'
		);
		expect( g.fotos.map( ( f ) => f.id ).sort() ).toEqual( [ 'a', 'c' ] );
	} );

	it( 'etiqueta Avui i Ahir', () => {
		const g = agrupaPerData( fotos, ara );
		expect( g[ 0 ].etiqueta ).toBe( 'Avui' );
		expect( g[ 1 ].etiqueta ).toBe( 'Ahir' );
	} );

	it( 'etiqueta la resta amb dia, mes i any', () => {
		const e = agrupaPerData( fotos, ara )[ 2 ].etiqueta;
		expect( e ).toMatch( /^11 d'octubre de 2026$/ );
		expect( agrupaPerData( fotos, ara )[ 3 ].etiqueta ).toBe(
			'2 de juliol de 2026'
		);
	} );

	it( 'no falla amb una llista buida', () => {
		expect( agrupaPerData( [], ara ) ).toEqual( [] );
	} );
} );

describe( 'vei', () => {
	const ordre = agrupaPerData( fotos ).flatMap( ( g ) => g.fotos );

	it( 'dóna l’anterior i la següent en l’ordre de la quadrícula', () => {
		expect( vei( fotos, ordre[ 1 ].id, -1 ).id ).toBe( ordre[ 0 ].id );
		expect( vei( fotos, ordre[ 1 ].id, 1 ).id ).toBe( ordre[ 2 ].id );
	} );

	it( 'no surt de rang', () => {
		expect( vei( fotos, ordre[ 0 ].id, -1 ) ).toBeNull();
		expect( vei( fotos, ordre[ 4 ].id, 1 ) ).toBeNull();
	} );

	it( 'torna null si la foto no existeix', () => {
		expect( vei( fotos, 'zz', 1 ) ).toBeNull();
	} );
} );
