import { describe, it, expect } from 'vitest';
import { contacteDelXat, esDesconegut, estatAvis } from '../desconegut.js';

const contactes = [
	{ id: 'marta', nom: 'Marta', rol: 'amiga' },
	{ id: 'numero_desconegut', nom: '+44 7700 900461', rol: 'desconegut' },
];

describe( 'contacteDelXat', () => {
	it( "troba el contacte pel camp contacte o per l'id del xat", () => {
		expect( contacteDelXat( { id: 'marta' }, contactes ).nom ).toBe(
			'Marta'
		);
		expect(
			contacteDelXat(
				{ id: 'x', contacte: 'numero_desconegut' },
				contactes
			).rol
		).toBe( 'desconegut' );
	} );
	it( 'torna null si no hi ha xat ni contacte', () => {
		expect( contacteDelXat( null, contactes ) ).toBeNull();
		expect( contacteDelXat( { id: 'q' }, contactes ) ).toBeNull();
		expect( contacteDelXat( { id: 'q' }, undefined ) ).toBeNull();
	} );
} );

describe( 'esDesconegut', () => {
	it( 'només el rol desconegut', () => {
		expect( esDesconegut( contactes[ 1 ] ) ).toBe( true );
		expect( esDesconegut( contactes[ 0 ] ) ).toBe( false );
		expect( esDesconegut( null ) ).toBe( false );
	} );
} );

describe( 'estatAvis', () => {
	const d = contactes[ 1 ];
	it( 'cap avís als contactes normals', () => {
		expect(
			estatAvis( {
				contacte: contactes[ 0 ],
				bloquejat: false,
				descartat: false,
			} )
		).toBeNull();
	} );
	it( 'avís, descartat i bloquejat', () => {
		expect(
			estatAvis( { contacte: d, bloquejat: false, descartat: false } )
		).toBe( 'avis' );
		expect(
			estatAvis( { contacte: d, bloquejat: false, descartat: true } )
		).toBeNull();
		expect(
			estatAvis( { contacte: d, bloquejat: true, descartat: true } )
		).toBe( 'bloquejat' );
	} );
} );
