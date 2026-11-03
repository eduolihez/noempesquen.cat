/**
 * Fixtures compartits amb PHPUnit (`tests/php/ValidacioMissioTest.php`): les
 * regles mínimes del servidor (`nep_valida_guio`) no han de derivar de les de JS.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { validaMissio } from '../valida.js';

const MISSIONS = new URL( '../../../../../missions/', import.meta.url );
const INVALIDES = new URL( 'test-fixtures/invalides/', MISSIONS );
const VALIDES = new URL( 'test-fixtures/valides/', MISSIONS );

const llegeix = ( url ) => JSON.parse( readFileSync( url, 'utf8' ) );
const jsons = ( dir ) =>
	readdirSync( dir )
		.filter( ( f ) => f.endsWith( '.json' ) )
		.sort();

// Les missions reals són a `ca/` (i la seva pareja a `es/`); la plantilla, a l'arrel.
const mon = llegeix( new URL( 'ca/mon.json', MISSIONS ) );
const reals = [
	...jsons( new URL( 'ca/', MISSIONS ) )
		.filter( ( f ) => f !== 'mon.json' )
		.map( ( f ) => `ca/${ f }` ),
	...jsons( MISSIONS ),
];
const invalides = jsons( INVALIDES );
const valides = jsons( VALIDES );

// Úniques regles que JS no pot aplicar: necessiten dades de l'entrada al servidor.
const NOMES_SERVIDOR = [
	'dispositiu-no-coincideix.json',
	'id-duplicat.json',
	'personatge-no-coincideix.json',
];

// Treu les claus de metadades del fixture (`_esperat`, `_meta`...).
const guio = ( fixture ) =>
	Object.fromEntries(
		Object.entries( fixture ).filter( ( [ k ] ) => ! k.startsWith( '_' ) )
	);

describe( 'fixtures compartits amb PHP', () => {
	it( 'hi ha prou casos', () => {
		expect( reals.length ).toBeGreaterThan( 0 );
		expect( invalides.length ).toBeGreaterThanOrEqual( 8 );
	} );

	it.each( reals )( 'la missió real %s és vàlida a JS', ( f ) => {
		const missio = llegeix( new URL( f, MISSIONS ) );
		expect( validaMissio( missio, mon ) ).toEqual( [] );
	} );

	const fixtures = invalides.map( ( f ) => [
		f,
		llegeix( new URL( f, INVALIDES ) ),
	] );
	const compartits = fixtures.filter( ( [ , x ] ) => ! x._nomes_servidor );
	const nomesServidor = fixtures.filter( ( [ , x ] ) => x._nomes_servidor );

	it.each( valides )( 'el fixture vàlid %s és vàlid a JS', ( f ) => {
		const fixture = llegeix( new URL( f, VALIDES ) );
		expect( validaMissio( guio( fixture ), mon ) ).toEqual( [] );
	} );

	it( "només són del servidor l'id duplicat i la meta diferent", () => {
		expect( nomesServidor.map( ( [ f ] ) => f ) ).toEqual( NOMES_SERVIDOR );
	} );

	it.each( fixtures )( '%s té metadades per a PHP', ( f, fixture ) => {
		expect( typeof fixture._esperat ).toBe( 'string' );
		expect( fixture._meta ).toBeTruthy();
	} );

	it.each( compartits )( '%s també falla a JS', ( f, fixture ) => {
		expect( validaMissio( guio( fixture ), mon ) ).toContain(
			fixture._esperat_js
		);
	} );

	// Regla només del servidor: JS no la detecta i el guió és vàlid per a JS.
	it.each( nomesServidor )(
		'%s és vàlid a JS (regla del servidor)',
		( f, x ) => {
			expect( typeof x._motiu ).toBe( 'string' );
			expect( validaMissio( guio( x ), mon ) ).toEqual( [] );
		}
	);
} );
