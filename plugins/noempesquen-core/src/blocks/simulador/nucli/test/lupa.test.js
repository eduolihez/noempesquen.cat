import { describe, expect, it } from 'vitest';
import { clauXip, textComptador } from '../lupa';

describe( 'textComptador', () => {
	it( 'formata «n/N»', () => {
		expect( textComptador( { trobats: 2, total: 5 } ) ).toBe( '2/5' );
	} );

	it( 'tolera un resultat buit', () => {
		expect( textComptador( undefined ) ).toBe( '0/0' );
	} );
} );

describe( 'clauXip', () => {
	it( 'tria el xip segons el tipus', () => {
		expect( clauXip( 'nova' ) ).toBe( 'nova' );
		expect( clauXip( 'normal' ) ).toBe( 'normal' );
		expect( clauXip( 'repetida' ) ).toBe( 'repetida' );
	} );

	it( 'sense inspecció o tipus desconegut no hi ha xip', () => {
		expect( clauXip( null ) ).toBeNull();
		expect( clauXip( 'altre' ) ).toBeNull();
	} );

	it( 'amb tots els indicis, la repetida ho diu', () => {
		expect( clauXip( 'repetida', true ) ).toBe( 'totes' );
		expect( clauXip( 'nova', true ) ).toBe( 'nova' );
		expect( clauXip( 'normal', true ) ).toBe( 'normal' );
	} );
} );
