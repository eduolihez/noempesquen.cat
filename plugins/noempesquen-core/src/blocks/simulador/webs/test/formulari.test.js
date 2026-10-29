import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { estatInicial, reductor } from '../../nucli/motor.js';
import {
	compteEnrere,
	datesEnviades,
	importDe,
	referencia,
	seccioOficial,
} from '../llum-clara/formulari.js';

const ruta = new URL(
	'../../../../../missions/llissa-01-factura.json',
	import.meta.url
);
const m = JSON.parse( readFileSync( ruta, 'utf8' ) );
const URL_FALSA = 'https://llumclara-pagaments.com/pagament?ref=88213';
const formulari = m.webs[ 'llumclara-pagaments.com' ].formulari;
const valors = formulari.camps.map( ( c ) => c.autoompli );

const aplica = ( estat, ...accions ) =>
	accions.reduce( ( e, a ) => reductor( m, e, a ), estat );

describe( 'formulari fals: privadesa', () => {
	it( 'datesEnviades només porta la URL i l’id del formulari', () => {
		const dades = datesEnviades( { url: URL_FALSA, formulari } );
		expect( dades ).toEqual( { url: URL_FALSA, formulari: 'targeta' } );
		expect( Object.keys( dades ).sort() ).toEqual( [ 'formulari', 'url' ] );
	} );

	it( 'datesEnviades ignora qualsevol valor escrit que li arribi', () => {
		const dades = datesEnviades( {
			url: URL_FALSA,
			formulari,
			valors: { numero: '4000 1234 5678 9010', pin: '1234' },
		} );
		const text = JSON.stringify( dades );
		expect( text ).not.toContain( '4000 1234' );
		valors.forEach( ( v ) => expect( text ).not.toContain( v ) );
	} );

	it( 'després de formulari.envia l’estat del motor no conté cap valor del formulari', () => {
		const estat = aplica(
			estatInicial( m ),
			{ tipus: 'DESBLOQUEJA' },
			{
				tipus: 'ESDEVENIMENT',
				nom: 'formulari.envia',
				dades: datesEnviades( { url: URL_FALSA, formulari } ),
			}
		);
		expect( estat.pescat ).toBe( true );
		const text = JSON.stringify( estat );
		expect( text ).not.toContain( '4000 1234' );
		valors.forEach( ( v ) => expect( text ).not.toContain( v ) );
	} );
} );

describe( 'llum clara: ajudes', () => {
	it( 'compteEnrere formata hores, minuts i segons i no baixa de zero', () => {
		expect( compteEnrere( 3 * 3600 + 5 * 60 + 9 ) ).toBe( '03:05:09' );
		expect( compteEnrere( 86399 ) ).toBe( '23:59:59' );
		expect( compteEnrere( -4 ) ).toBe( '00:00:00' );
	} );

	it( 'importDe treu l’import del text del botó', () => {
		expect( importDe( 'Paga 87,40 €' ) ).toBe( '87,40 €' );
		expect( importDe( 'Paga' ) ).toBe( '' );
		expect( importDe( undefined ) ).toBe( '' );
	} );

	it( 'referencia llegeix el paràmetre ref de la URL', () => {
		expect( referencia( URL_FALSA ) ).toBe( '88213' );
		expect( referencia( 'https://llumclara-pagaments.com/' ) ).toBe( '' );
		expect( referencia( 'no és una url' ) ).toBe( '' );
	} );

	it( 'seccioOficial tria la secció pel camí de la URL', () => {
		expect( seccioOficial( 'https://llumclara.cat/' ) ).toBe( 'inici' );
		expect( seccioOficial( 'https://llumclara.cat/area-client' ) ).toBe(
			'area-client'
		);
		expect( seccioOficial( 'https://llumclara.cat/tarifes/' ) ).toBe(
			'tarifes'
		);
		expect( seccioOficial( 'https://llumclara.cat/avis-legal' ) ).toBe(
			'avis-legal'
		);
		expect( seccioOficial( 'https://llumclara.cat/no-existeix' ) ).toBe(
			'inici'
		);
		expect( seccioOficial( 'malament' ) ).toBe( 'inici' );
	} );
} );
