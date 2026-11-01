import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { estatInicial, reductor } from '../motor.js';
import { clauXip, potInspeccionar, textComptador, textXip } from '../lupa';

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

describe( 'textXip', () => {
	it( 'dona el text de cada xip', () => {
		expect( textXip( 'nova' ) ).toBe( 'Pista trobada' );
		expect( textXip( 'normal' ) ).toBe( 'Sembla normal' );
		expect( textXip( 'repetida' ) ).toBe( 'Ja la tenies' );
		expect( textXip( 'totes' ) ).toBe( 'Ja els tens tots' );
	} );

	it( 'sense clau, text buit', () => {
		expect( textXip( null ) ).toBe( '' );
		expect( textXip( 'altre' ) ).toBe( '' );
	} );
} );

describe( 'potInspeccionar', () => {
	const ruta = new URL(
		'../../../../../missions/llissa-01-factura.json',
		import.meta.url
	);
	const m = JSON.parse( readFileSync( ruta, 'utf8' ) );
	const aplica = ( estat, ...accions ) =>
		accions.reduce( ( e, a ) => reductor( m, e, a ), estat );
	const joc = aplica( estatInicial( m ), { tipus: 'DESBLOQUEJA' } );
	const casos = {
		joc,
		pausa: aplica( joc, { tipus: 'PAUSA' } ),
		bloqueig: estatInicial( m ),
	};

	it( 'coincideix amb el que accepta el reductor', () => {
		for ( const e of Object.values( casos ) ) {
			const despres = reductor( m, e, {
				tipus: 'INSPECCIONA',
				senyal: null,
			} );
			expect( potInspeccionar( e ) ).toBe(
				despres.ultimaInspeccio !== e.ultimaInspeccio
			);
		}
		expect( potInspeccionar( casos.joc ) ).toBe( true );
		expect( potInspeccionar( casos.pausa ) ).toBe( false );
		expect( potInspeccionar( casos.bloqueig ) ).toBe( false );
	} );
} );
