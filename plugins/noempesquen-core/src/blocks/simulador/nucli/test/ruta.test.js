import { describe, it, expect } from 'vitest';
import { construeixRuta, seguentDe, dispositiusAmbRuta } from '../ruta.js';

const M = [
	{ id: 'p1', dispositiu: 'pc', titol: 'P1' },
	{ id: 'm1', dispositiu: 'mobil', titol: 'M1' },
	{ id: 'tp', dispositiu: 'pc', tutorial: true, titol: 'TP' },
	{ id: 'p2', dispositiu: 'pc', titol: 'P2' },
	{ id: 'tm', dispositiu: 'mobil', tutorial: true, titol: 'TM' },
	{ id: 'p3', dispositiu: 'pc', titol: 'P3' },
	{ id: 'm2', dispositiu: 'mobil', titol: 'M2' },
];
const ids = ( r ) => r.nodes.map( ( n ) => n.id );
const estats = ( r ) => r.nodes.map( ( n ) => n.estat );

describe( 'construeixRuta', () => {
	it( 'posa el tutorial primer i manté l’ordre de la resta', () => {
		const r = construeixRuta( M, 'pc', {} );
		expect( ids( r ) ).toEqual( [ 'tp', 'p1', 'p2', 'p3' ] );
		expect( r.nodes.map( ( n ) => n.indes ) ).toEqual( [ 1, 2, 3, 4 ] );
		expect( r.nodes[ 0 ].tutorial ).toBe( true );
		expect( r.dispositiu ).toBe( 'pc' );
	} );
	it( 'varis tutorials del mateix dispositiu, en ordre de l’array', () => {
		const t = [
			{ id: 'a', dispositiu: 'pc' },
			{ id: 't2', dispositiu: 'pc', tutorial: true },
			{ id: 't1', dispositiu: 'pc', tutorial: true },
		];
		expect( ids( construeixRuta( t, 'pc', {} ) ) ).toEqual( [
			't2',
			't1',
			'a',
		] );
	} );
	it( 'progrés buit: només la primera disponible', () => {
		const r = construeixRuta( M, 'pc', {} );
		expect( estats( r ) ).toEqual( [
			'disponible',
			'bloquejada',
			'bloquejada',
			'bloquejada',
		] );
		expect( r.seguent ).toBe( 'tp' );
		expect( r.feta ).toBe( 0 );
		expect( r.total ).toBe( 4 );
		expect( r.nodes.map( ( n ) => n.motiu ) ).toEqual( [
			null,
			'tp',
			'p1',
			'p2',
		] );
	} );
	it( 'progrés parcial', () => {
		const r = construeixRuta( M, 'pc', { tp: 1, p1: 2 } );
		expect( estats( r ) ).toEqual( [
			'feta',
			'feta',
			'disponible',
			'bloquejada',
		] );
		expect( r.seguent ).toBe( 'p2' );
		expect( r.feta ).toBe( 2 );
		expect( r.nodes[ 3 ].motiu ).toBe( 'p2' );
		expect( r.nodes[ 1 ].motiu ).toBeNull();
	} );
	it( 'progrés complet: seguent null', () => {
		const r = construeixRuta( M, 'pc', { tp: 1, p1: 3, p2: 1, p3: 2 } );
		expect( estats( r ) ).toEqual( [ 'feta', 'feta', 'feta', 'feta' ] );
		expect( r.seguent ).toBeNull();
		expect( r.feta ).toBe( 4 );
	} );
	it( 'forat: una missió feta compta com a feta sense bloquejar', () => {
		const r = construeixRuta( M, 'pc', { tp: 1, p2: 2 } );
		expect( estats( r ) ).toEqual( [
			'feta',
			'disponible',
			'feta',
			'bloquejada',
		] );
		expect( r.seguent ).toBe( 'p1' );
		expect( r.nodes[ 3 ].motiu ).toBe( 'p1' );
	} );
	it( 'les remotes (al final de l’array) queden al final del dispositiu', () => {
		const ambRemota = [ ...M, { id: 'rem', dispositiu: 'pc' } ];
		const r = construeixRuta( ambRemota, 'pc', {} );
		expect( ids( r ).at( -1 ) ).toBe( 'rem' );
	} );
	it( 'sense tutorial', () => {
		const r = construeixRuta(
			M.filter( ( m ) => ! m.tutorial ),
			'mobil',
			{
				m1: 1,
			}
		);
		expect( ids( r ) ).toEqual( [ 'm1', 'm2' ] );
		expect( estats( r ) ).toEqual( [ 'feta', 'disponible' ] );
	} );
	it( 'dispositiu sense missions: ruta buida', () => {
		const r = construeixRuta( [ M[ 0 ] ], 'mobil', {} );
		expect( r.nodes ).toEqual( [] );
		expect( r.total ).toBe( 0 );
		expect( r.seguent ).toBeNull();
		expect( r.max ).toBe( 0 );
	} );
	it( 'estrelles i max exclouen tutorials; tutorial fet val 1', () => {
		const r = construeixRuta( M, 'pc', { tp: 1, p1: 2, p2: 3 } );
		expect( r.max ).toBe( 9 );
		expect( r.estrelles ).toBe( 5 );
		expect( r.nodes[ 0 ].estrelles ).toBe( 1 );
		expect( r.nodes[ 1 ].estrelles ).toBe( 2 );
		const sense = construeixRuta( M, 'pc', {} );
		expect( sense.nodes[ 0 ].estrelles ).toBe( 0 );
	} );
	it( 'tolera progrés corrupte', () => {
		for ( const p of [ null, undefined, 'x', 5, [], { tp: NaN } ] ) {
			const r = construeixRuta( M, 'pc', p );
			expect( r.feta ).toBe( 0 );
			expect( r.seguent ).toBe( 'tp' );
		}
		const r = construeixRuta( M, 'pc', {
			tp: 'si',
			p1: -2,
			p2: 99,
			p3: Infinity,
		} );
		expect( r.nodes.map( ( n ) => n.estrelles ) ).toEqual( [ 0, 0, 3, 0 ] );
		expect( r.estrelles ).toBe( 3 );
		expect( r.nodes[ 2 ].estat ).toBe( 'feta' );
	} );
	it( 'tolera missions no array o amb nuls, i no muta les entrades', () => {
		expect( construeixRuta( null, 'pc', {} ).nodes ).toEqual( [] );
		const m = [ null, ...M ];
		const p = { tp: 1 };
		const copiaM = JSON.parse( JSON.stringify( m ) );
		construeixRuta( m, 'pc', p );
		expect( m ).toEqual( copiaM );
		expect( p ).toEqual( { tp: 1 } );
	} );
} );

describe( 'seguentDe', () => {
	it( 'dona la següent de la ruta del mateix dispositiu', () => {
		expect( seguentDe( M, 'tp' ) ).toBe( 'p1' );
		expect( seguentDe( M, 'p1' ) ).toBe( 'p2' );
		expect( seguentDe( M, 'tm' ) ).toBe( 'm1' );
	} );
	it( 'null a l’última o si l’id no existeix', () => {
		expect( seguentDe( M, 'p3' ) ).toBeNull();
		expect( seguentDe( M, 'm2' ) ).toBeNull();
		expect( seguentDe( M, 'nope' ) ).toBeNull();
		expect( seguentDe( null, 'p1' ) ).toBeNull();
	} );
} );

describe( 'dispositiusAmbRuta', () => {
	it( 'filtra i ordena pc, mobil', () => {
		expect( dispositiusAmbRuta( M ) ).toEqual( [ 'pc', 'mobil' ] );
		expect( dispositiusAmbRuta( [ M[ 1 ], M[ 0 ] ] ) ).toEqual( [
			'pc',
			'mobil',
		] );
		expect( dispositiusAmbRuta( [ M[ 1 ] ] ) ).toEqual( [ 'mobil' ] );
		expect( dispositiusAmbRuta( [] ) ).toEqual( [] );
		expect( dispositiusAmbRuta( undefined ) ).toEqual( [] );
	} );
} );
