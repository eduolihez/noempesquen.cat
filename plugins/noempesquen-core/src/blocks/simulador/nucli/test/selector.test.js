import { describe, it, expect } from 'vitest';
import { agrupaMissions } from '../selector.js';

const M = [
	{ id: 'a', dispositiu: 'pc' },
	{ id: 'b', dispositiu: 'mobil' },
	{ id: 'c', dispositiu: 'pc' },
	{ id: 'd', dispositiu: 'mobil' },
];
const ids = ( l ) => l.map( ( m ) => m.id );

describe( 'agrupaMissions', () => {
	it( 'agrupa per dispositiu amb ordre estable', () => {
		const g = agrupaMissions( M, 'mobil', {} );
		expect( ids( g.principals ) ).toEqual( [ 'b', 'd' ] );
		expect( ids( g.altres ) ).toEqual( [ 'a', 'c' ] );
	} );
	it( 'recomana la primera sense jugar, del dispositiu en ús primer', () => {
		expect( agrupaMissions( M, 'mobil', { b: 2 } ).recomanada.id ).toBe(
			'd'
		);
		expect(
			agrupaMissions( M, 'mobil', { b: 2, d: 1 } ).recomanada.id
		).toBe( 'a' );
	} );
	it( 'sense res pendent no hi ha recomanada', () => {
		const p = { a: 1, b: 1, c: 3, d: 2 };
		expect( agrupaMissions( M, 'pc', p ).recomanada ).toBeNull();
	} );
	it( 'resum', () => {
		expect( agrupaMissions( M, 'pc', { a: 3, b: 1 } ).resum ).toEqual( {
			jugades: 2,
			total: 4,
			estrelles: 4,
			max: 12,
		} );
	} );
	it( 'tolera progrés corrupte i missions no vàlides', () => {
		[
			null,
			undefined,
			'x',
			5,
			[],
			{ a: 'molt', b: NaN, c: -2, d: 99 },
		].forEach( ( p ) =>
			expect( () => agrupaMissions( M, 'pc', p ) ).not.toThrow()
		);
		expect(
			agrupaMissions( M, 'pc', { d: 99, c: -2 } ).resum.estrelles
		).toBe( 3 );
		expect( agrupaMissions( null, 'pc', null ).resum.total ).toBe( 0 );
	} );
} );
