import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { ANCORES } from '../ancores.js';

const ARREL = new URL( '../../', import.meta.url );

/**
 * Fonts JS de SIM/ (sense tests).
 *
 * @param {URL} dir Carpeta.
 * @return {string[]} Textos dels fitxers.
 */
function fonts( dir = ARREL ) {
	return readdirSync( dir, { withFileTypes: true } ).flatMap( ( e ) => {
		const url = new URL( e.name + ( e.isDirectory() ? '/' : '' ), dir );
		if ( e.isDirectory() ) {
			return e.name === 'test' ? [] : fonts( url );
		}
		return e.name.endsWith( '.js' ) ? [ readFileSync( url, 'utf8' ) ] : [];
	} );
}

/**
 * Claus posades al DOM: literals `data-tut="x"` i, dins d'una expressió
 * `data-tut={ ... }` o en un objecte `const TUT_X = { ... }`, cada literal
 * entre cometes simples.
 */
function clausAlCodi() {
	const claus = new Set();
	for ( const text of fonts() ) {
		for ( const m of text.matchAll( /data-tut="([^"]+)"/g ) ) {
			claus.add( m[ 1 ] );
		}
		for ( const m of text.matchAll(
			/data-tut=\{([^}]*)\}|const TUT_\w+ = \{([^}]*)\}/g
		) ) {
			for ( const l of ( m[ 1 ] ?? m[ 2 ] ).matchAll( /'([^']+)'/g ) ) {
				claus.add( l[ 1 ] );
			}
		}
	}
	return claus;
}

describe( 'àncores data-tut al codi', () => {
	const claus = clausAlCodi();

	it.each( ANCORES )( '«%s» és al codi de la interfície', ( clau ) => {
		expect( claus.has( clau ) ).toBe( true );
	} );

	it( 'no hi ha cap clau fora de ANCORES', () => {
		expect(
			[ ...claus ].filter( ( c ) => ! ANCORES.includes( c ) )
		).toEqual( [] );
	} );
} );
