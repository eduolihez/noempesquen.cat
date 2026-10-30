import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { estatInicial, reductor } from '../../nucli/motor.js';
import {
	compteEnrere,
	datesEnviades,
	esdevenimentDe,
	ESDEVENIMENTS_FORMULARI,
	importDe,
	opcionsCamp,
	textosFormulari,
	referencia,
	seccioOficial,
} from '../comu/formulari.js';

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

describe( 'formulari fals: opcions per camp', () => {
	it( 'sense res declarat, els ids de targeta es comporten com abans', () => {
		expect( opcionsCamp( { id: 'titular' } ) ).toEqual( {
			curt: false,
			amagat: false,
			numeric: false,
			maxLength: undefined,
			autocomplete: true,
		} );
		expect( opcionsCamp( { id: 'numero' } ) ).toMatchObject( {
			curt: false,
			amagat: false,
			numeric: true,
		} );
		expect( opcionsCamp( { id: 'caducitat' } ) ).toMatchObject( {
			curt: true,
			amagat: false,
			numeric: true,
		} );
		expect( opcionsCamp( { id: 'cvv' } ) ).toMatchObject( {
			curt: true,
			amagat: true,
			numeric: true,
		} );
		expect( opcionsCamp( { id: 'pin' } ) ).toMatchObject( {
			curt: false,
			amagat: true,
			numeric: true,
		} );
	} );

	it( 'els camps de les missions actuals no canvien', () => {
		const opcions = Object.fromEntries(
			formulari.camps.map( ( c ) => [ c.id, opcionsCamp( c ) ] )
		);
		expect( opcions.cvv.amagat ).toBe( true );
		expect( opcions.pin.amagat ).toBe( true );
		expect( opcions.caducitat.curt ).toBe( true );
		expect( opcions.titular.numeric ).toBe( false );
		Object.values( opcions ).forEach( ( o ) =>
			expect( o.autocomplete ).toBe( true )
		);
	} );

	it( 'el JSON mana sobre els valors per defecte', () => {
		expect(
			opcionsCamp( {
				id: 'cvv',
				curt: false,
				amagat: false,
				numeric: false,
			} )
		).toMatchObject( { curt: false, amagat: false, numeric: false } );
		expect(
			opcionsCamp( {
				id: 'contrasenya',
				amagat: true,
				maxLength: 20,
				autocomplete: false,
			} )
		).toEqual( {
			curt: false,
			amagat: true,
			numeric: false,
			maxLength: 20,
			autocomplete: false,
		} );
	} );

	it( 'el camp de codi és numèric, de 6 xifres i sense suggeriment', () => {
		expect( opcionsCamp( { id: 'codi' } ) ).toEqual( {
			curt: true,
			amagat: false,
			numeric: true,
			maxLength: 6,
			autocomplete: false,
		} );
	} );

	it( 'maxLength no vàlid queda sense límit', () => {
		[ 0, -3, 2.5, '6', null ].forEach( ( v ) =>
			expect(
				opcionsCamp( { id: 'iban', maxLength: v } ).maxLength
			).toBeUndefined()
		);
	} );

	it( 'opcions no booleanes es descarten', () => {
		expect( opcionsCamp( { id: 'pin', amagat: 'no' } ).amagat ).toBe(
			true
		);
		expect( opcionsCamp( undefined ) ).toMatchObject( {
			amagat: false,
			autocomplete: true,
		} );
	} );
} );

describe( 'formulari fals: esdeveniment', () => {
	it( 'per defecte és formulari.envia', () => {
		expect( esdevenimentDe( formulari ) ).toBe( 'formulari.envia' );
		expect( esdevenimentDe( {} ) ).toBe( 'formulari.envia' );
		expect( esdevenimentDe( undefined ) ).toBe( 'formulari.envia' );
	} );

	it( 'accepta només els esdeveniments permesos', () => {
		expect( ESDEVENIMENTS_FORMULARI ).toEqual( [
			'formulari.envia',
			'codi.envia',
			'pagament.fes',
		] );
		ESDEVENIMENTS_FORMULARI.forEach( ( ev ) =>
			expect( esdevenimentDe( { esdeveniment: ev } ) ).toBe( ev )
		);
	} );

	it( 'un esdeveniment no permès torna al segur per defecte', () => {
		[ 'missatge.envia', 'inici', '', 42, null ].forEach( ( ev ) =>
			expect( esdevenimentDe( { esdeveniment: ev } ) ).toBe(
				'formulari.envia'
			)
		);
	} );

	it( 'datesEnviades no porta valors escrits per a cap esdeveniment', () => {
		const codi = {
			id: 'codi-sms',
			esdeveniment: 'codi.envia',
			camps: [ { id: 'codi', autoompli: '482913' } ],
		};
		const dades = datesEnviades( {
			url: 'https://bancsolid-verifica.com/',
			formulari: codi,
			valors: { codi: '482913' },
		} );
		expect( dades ).toEqual( {
			url: 'https://bancsolid-verifica.com/',
			formulari: 'codi-sms',
		} );
		expect( JSON.stringify( dades ) ).not.toContain( '482913' );
	} );
} );

describe( 'formulari fals: textos', () => {
	const defectes = {
		processant: 'Processant el pagament…',
		nota: 'Pagament segur i verificat',
	};

	it( 'sense res declarat, manté els textos de pagament', () => {
		expect( textosFormulari( formulari, defectes ) ).toEqual( defectes );
		expect( textosFormulari( {}, defectes ) ).toEqual( defectes );
		expect( textosFormulari( undefined, defectes ) ).toEqual( defectes );
	} );

	it( 'el JSON pot declarar processant i nota', () => {
		expect(
			textosFormulari(
				{
					processant: 'Verificant el codi…',
					nota: 'Connexió segura amb Banc Sòlid',
				},
				defectes
			)
		).toEqual( {
			processant: 'Verificant el codi…',
			nota: 'Connexió segura amb Banc Sòlid',
		} );
		expect( textosFormulari( { nota: 'Accés segur' }, defectes ) ).toEqual(
			{ processant: defectes.processant, nota: 'Accés segur' }
		);
	} );

	it( 'valors buits o que no són text tornen al per defecte', () => {
		[ '', '   ', 42, null, {} ].forEach( ( v ) =>
			expect(
				textosFormulari( { processant: v, nota: v }, defectes )
			).toEqual( defectes )
		);
	} );
} );
