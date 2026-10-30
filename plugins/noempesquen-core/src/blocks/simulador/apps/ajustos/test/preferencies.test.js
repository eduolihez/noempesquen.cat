import { describe, expect, it } from 'vitest';
import { CLAU_SONS, desaSons, llegeixSons } from '../preferencies.js';

function falsa( inicial = {} ) {
	const dades = { ...inicial };
	return {
		dades,
		getItem: ( k ) => ( k in dades ? dades[ k ] : null ),
		setItem: ( k, v ) => {
			dades[ k ] = String( v );
		},
	};
}

const queLlança = {
	getItem: () => {
		throw new Error( 'bloquejat' );
	},
	setItem: () => {
		throw new Error( 'bloquejat' );
	},
};

describe( 'preferencies de sons', () => {
	it( 'llegeix true per defecte', () => {
		expect( llegeixSons( falsa() ) ).toBe( true );
		expect( llegeixSons( undefined ) ).toBe( true );
	} );

	it( 'desa i torna a llegir', () => {
		const e = falsa();
		expect( desaSons( e, false ) ).toBe( true );
		expect( e.dades[ CLAU_SONS ] ).toBe( 'false' );
		expect( llegeixSons( e ) ).toBe( false );
		desaSons( e, true );
		expect( llegeixSons( e ) ).toBe( true );
	} );

	it( "no peta si l'emmagatzematge llança", () => {
		expect( llegeixSons( queLlança ) ).toBe( true );
		expect( desaSons( queLlança, false ) ).toBe( false );
		expect( desaSons( undefined, false ) ).toBe( false );
	} );

	it( 'un valor corrupte dóna el valor per defecte', () => {
		expect( llegeixSons( falsa( { [ CLAU_SONS ]: '{x' } ) ) ).toBe( true );
		expect( llegeixSons( falsa( { [ CLAU_SONS ]: '' } ) ) ).toBe( true );
	} );
} );
