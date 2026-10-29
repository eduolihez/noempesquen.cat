import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { combinaMissions } from '../missions.js';

const ruta = new URL(
	'../../../../../missions/llissa-01-factura.json',
	import.meta.url
);
const factura = JSON.parse( readFileSync( ruta, 'utf8' ) );
const v2 = ( id, extra = {} ) => ( {
	...structuredClone( factura ),
	id,
	...extra,
} );
const v1 = { id: 'antiga', versio: 1, titol: 'Antiga' };

describe( 'combinaMissions', () => {
	it( 'una remota v1 o invàlida no fa desaparèixer les incloses', () => {
		const incloses = [ v2( 'a' ), v1 ];
		const res = combinaMissions( incloses, [
			v1,
			{ id: 'a', versio: 2 },
			null,
			undefined,
			'x',
		] );
		expect( res ).toEqual( incloses );
	} );

	it( 'una remota v2 vàlida amb el mateix id substitueix la inclosa', () => {
		const incloses = [ v2( 'a' ), v2( 'b' ) ];
		const remota = v2( 'a', { titol: 'Nou títol' } );
		const res = combinaMissions( incloses, [ remota ] );
		expect( res.map( ( m ) => m.id ) ).toEqual( [ 'a', 'b' ] );
		expect( res[ 0 ].titol ).toBe( 'Nou títol' );
	} );

	it( "una remota nova s'afegeix al final", () => {
		const incloses = [ v2( 'a' ) ];
		const res = combinaMissions( incloses, [ v2( 'n1' ), v2( 'n2' ) ] );
		expect( res.map( ( m ) => m.id ) ).toEqual( [ 'a', 'n1', 'n2' ] );
	} );

	it( 'no muta les entrades i tolera remotes no array', () => {
		const incloses = [ v2( 'a' ) ];
		const copia = structuredClone( incloses );
		combinaMissions( incloses, [ v2( 'n' ) ] );
		expect( incloses ).toEqual( copia );
		expect( combinaMissions( incloses, null ) ).toEqual( incloses );
	} );
} );
