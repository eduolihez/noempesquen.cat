import { describe, it, expect } from 'vitest';
import { patroTo, idsNous, deuSonar } from '../so-notificacio.js';

describe( 'patroTo', () => {
	[ 'missatge', 'alerta', 'desconegut', undefined ].forEach( ( t ) => {
		it( `patró ${ t } dins dels límits`, () => {
			const notes = patroTo( t );
			expect( notes.length ).toBeGreaterThan( 0 );
			notes.forEach( ( n ) => {
				expect( n.freq ).toBeGreaterThanOrEqual( 300 );
				expect( n.freq ).toBeLessThanOrEqual( 4000 );
				expect( n.pic ).toBeGreaterThan( 0 );
				expect( n.pic ).toBeLessThanOrEqual( 0.12 );
				expect( n.inici + n.durada ).toBeLessThanOrEqual( 0.6 );
			} );
		} );
	} );
	it( 'no comparteix estat entre crides', () => {
		patroTo( 'missatge' )[ 0 ].freq = 1;
		expect( patroTo( 'missatge' )[ 0 ].freq ).not.toBe( 1 );
	} );
} );

describe( 'idsNous', () => {
	it( 'retorna només els no vistos', () => {
		expect( idsNous( [ 'a' ], [ { id: 'a' }, { id: 'b' } ] ) ).toEqual( [
			'b',
		] );
		expect( idsNous( new Set( [ 'a' ] ), [ { id: 'c' } ] ) ).toEqual( [
			'c',
		] );
	} );
	it( 'no repeteix ids', () => {
		expect(
			idsNous( [], [ { id: 'a' }, { id: 'a' }, { id: 'b' } ] )
		).toEqual( [ 'a', 'b' ] );
	} );
	it( 'tolera entrades invàlides', () => {
		expect( idsNous( null, null ) ).toEqual( [] );
		expect( idsNous( [], [ null, {}, { id: 'x' } ] ) ).toEqual( [ 'x' ] );
	} );
} );

describe( 'deuSonar', () => {
	const base = {
		soActivat: true,
		interaccio: true,
		pausa: false,
		enJoc: true,
		noves: [ 'a' ],
	};
	it( 'sona quan tot és favorable', () => {
		expect( deuSonar( base ) ).toBe( true );
	} );
	it( 'no sona en pausa, fora del joc, sense interacció, amb el so apagat o sense noves', () => {
		expect( deuSonar( { ...base, pausa: true } ) ).toBe( false );
		expect( deuSonar( { ...base, enJoc: false } ) ).toBe( false );
		expect( deuSonar( { ...base, interaccio: false } ) ).toBe( false );
		expect( deuSonar( { ...base, soActivat: false } ) ).toBe( false );
		expect( deuSonar( { ...base, noves: [] } ) ).toBe( false );
		expect( deuSonar() ).toBe( false );
	} );
} );
