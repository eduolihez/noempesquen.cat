import { describe, it, expect } from 'vitest';
import { esdevenimentEnvia } from '../anuncis.js';

describe( 'Revenda: privacitat de missatge.envia', () => {
	it( 'només porta { contacte }', () => {
		const [ nom, dades ] = esdevenimentEnvia( 'comprador' );
		expect( nom ).toBe( 'missatge.envia' );
		expect( dades ).toEqual( { contacte: 'comprador' } );
		expect( Object.keys( dades ) ).toEqual( [ 'contacte' ] );
	} );

	it( 'ignora qualsevol argument de més (p. ex. el text escrit)', () => {
		const [ , dades ] = esdevenimentEnvia( 'comprador', 'la meva targeta' );
		expect( dades ).toEqual( { contacte: 'comprador' } );
		expect( JSON.stringify( dades ) ).not.toContain( 'targeta' );
	} );
} );
