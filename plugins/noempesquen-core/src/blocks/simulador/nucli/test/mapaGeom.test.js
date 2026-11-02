import { describe, it, expect } from 'vitest';
import { posicionsNodes, caminSvg, midaVista } from '../mapaGeom.js';

const MODES = [ 'ample', 'estret' ];

describe( 'posicionsNodes', () => {
	it( 'torna tants punts com nodes, i cap amb n buit o invàlid', () => {
		expect( posicionsNodes( 0, 'ample' ) ).toEqual( [] );
		expect( posicionsNodes( -2, 'estret' ) ).toEqual( [] );
		expect( posicionsNodes( NaN, 'ample' ) ).toEqual( [] );
		expect( posicionsNodes( 7, 'ample' ) ).toHaveLength( 7 );
		expect( posicionsNodes( 7, 'estret' ) ).toHaveLength( 7 );
	} );

	it( 'tots els punts queden dins del viewBox amb marge per al node', () => {
		for ( const mode of MODES ) {
			for ( let n = 1; n <= 10; n++ ) {
				const { w, h } = midaVista( n, mode );
				for ( const { x, y } of posicionsNodes( n, mode ) ) {
					expect( x ).toBeGreaterThanOrEqual( 40 );
					expect( x ).toBeLessThanOrEqual( w - 40 );
					expect( y ).toBeGreaterThanOrEqual( 40 );
					expect( y ).toBeLessThanOrEqual( h - 40 );
				}
			}
		}
	} );

	it( 'ample avança cap a la dreta i alterna amunt i avall', () => {
		const p = posicionsNodes( 5, 'ample' );
		for ( let i = 1; i < p.length; i++ ) {
			expect( p[ i ].x ).toBeGreaterThan( p[ i - 1 ].x );
			expect( p[ i ].y ).not.toBe( p[ i - 1 ].y );
		}
	} );

	it( 'estret baixa sempre i alterna esquerra i dreta', () => {
		const p = posicionsNodes( 6, 'estret' );
		for ( let i = 1; i < p.length; i++ ) {
			expect( p[ i ].y ).toBeGreaterThan( p[ i - 1 ].y );
			expect( p[ i ].x ).not.toBe( p[ i - 1 ].x );
		}
	} );
} );

describe( 'midaVista', () => {
	it( 'l’ample creix en amplada i l’estret en alçada', () => {
		expect( midaVista( 8, 'ample' ).w ).toBeGreaterThan(
			midaVista( 4, 'ample' ).w
		);
		expect( midaVista( 8, 'ample' ).h ).toBe( midaVista( 4, 'ample' ).h );
		expect( midaVista( 8, 'estret' ).h ).toBeGreaterThan(
			midaVista( 4, 'estret' ).h
		);
		expect( midaVista( 0, 'estret' ) ).toEqual( midaVista( 1, 'estret' ) );
	} );
} );

describe( 'caminSvg', () => {
	it( 'buit sense punts i només M amb un punt', () => {
		expect( caminSvg( [] ) ).toBe( '' );
		expect( caminSvg( null ) ).toBe( '' );
		expect( caminSvg( [ { x: 10, y: 20 } ] ) ).toBe( 'M10 20' );
	} );

	it( 'fa servir corbes i arrodoneix a un decimal', () => {
		const d = caminSvg( [
			{ x: 0, y: 0 },
			{ x: 100.123, y: 33.333 },
		] );
		expect( d ).toBe( 'M0 0 C50.1 0 50.1 33.3 100.1 33.3' );
		for ( const mode of MODES ) {
			const cami = caminSvg( posicionsNodes( 4, mode ) );
			expect( cami.startsWith( 'M' ) ).toBe( true );
			expect( cami.match( /C/g ) ).toHaveLength( 3 );
		}
	} );

	it( 'el tram recorregut és un prefix exacte del camí sencer', () => {
		for ( const mode of MODES ) {
			const p = posicionsNodes( 7, mode );
			const sencer = caminSvg( p );
			for ( let k = 1; k <= p.length; k++ ) {
				expect( sencer.startsWith( caminSvg( p.slice( 0, k ) ) ) ).toBe(
					true
				);
			}
		}
	} );
} );
