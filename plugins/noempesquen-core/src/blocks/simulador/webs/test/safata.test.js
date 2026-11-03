import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { estatInicial } from '../../nucli/motor.js';
import {
	CARPETA_ACCIO,
	carpetaDe,
	comptadors,
	correusVisibles,
	esLlegit,
	etiquetaData,
	extracte,
	filtra,
	marca,
	perCarpeta,
} from '../posta/safata.js';

const llegeix = ( nom ) =>
	JSON.parse(
		readFileSync(
			new URL( `../../../../../missions/ca/${ nom }`, import.meta.url ),
			'utf8'
		)
	);
const m = llegeix( 'llissa-01-factura.json' );
const mon = llegeix( 'mon.json' );
const ids = ( llista ) => llista.map( ( c ) => c.id );

describe( 'safata de Posta', () => {
	it( 'amaga els correus ocults fins que el motor els mostra', () => {
		const e = estatInicial( m );
		expect( ids( correusVisibles( e, mon, m ) ) ).not.toContain( 'm2' );
		const mostrat = { ...e, visibles: { m2: true } };
		expect( ids( correusVisibles( mostrat, mon, m ) )[ 0 ] ).toBe( 'm2' );
	} );

	it( 'ordena: avui per hora descendent, després ahir i els dies anteriors', () => {
		const e = { ...estatInicial( m ), visibles: { m2: true } };
		expect( ids( correusVisibles( e, mon, m ) ) ).toEqual( [
			'm2',
			'f1',
			'f2',
			'f3',
			'f4',
			'f5',
			'f6',
		] );
	} );

	it( 'funciona sense món ni correus de missió', () => {
		expect( correusVisibles( estatInicial( {} ), undefined, {} ) ).toEqual(
			[]
		);
	} );

	it( 'les marques mouen correus de carpeta sense mutar res', () => {
		const correus = correusVisibles(
			{ ...estatInicial( m ), visibles: { m2: true } },
			mon,
			m
		);
		const buides = {};
		const marques = marca( buides, 'm2', {
			carpeta: CARPETA_ACCIO.phishing,
		} );
		expect( buides ).toEqual( {} );
		expect( carpetaDe( correus[ 0 ], marques ) ).toBe( 'brossa' );
		expect( ids( perCarpeta( correus, marques, 'brossa' ) ) ).toEqual( [
			'm2',
		] );
		expect(
			ids( perCarpeta( correus, marques, 'entrada' ) )
		).not.toContain( 'm2' );
		const amb = marca( marques, 'm2', { llegit: true } );
		expect( amb.m2 ).toEqual( { carpeta: 'brossa', llegit: true } );
	} );

	it( 'cada acció porta a la seva carpeta', () => {
		expect( CARPETA_ACCIO ).toEqual( {
			phishing: 'brossa',
			brossa: 'brossa',
			esborra: 'paperera',
			arxiva: 'arxivats',
		} );
	} );

	it( 'destacats inclou els correus destacats de qualsevol carpeta excepte la paperera', () => {
		const correus = correusVisibles( estatInicial( m ), mon, m );
		let marques = marca( {}, 'f3', { destacat: true } );
		marques = marca( marques, 'f4', {
			destacat: true,
			carpeta: 'paperera',
		} );
		expect( ids( perCarpeta( correus, marques, 'destacats' ) ) ).toEqual( [
			'f3',
		] );
		expect( perCarpeta( correus, marques, 'enviats' ) ).toEqual( [] );
	} );

	it( 'llegit: la marca local guanya a les dades', () => {
		const [ m2 ] = m.apps.posta.correus;
		expect( esLlegit( m2, {} ) ).toBe( false );
		expect( esLlegit( m2, { m2: { llegit: true } } ) ).toBe( true );
	} );

	it( 'comptadors: no llegits a Entrada i total a Brossa', () => {
		const correus = correusVisibles(
			{ ...estatInicial( m ), visibles: { m2: true } },
			mon,
			m
		);
		expect( comptadors( correus, {} ) ).toMatchObject( {
			entrada: 1,
			brossa: 0,
		} );
		const marques = marca( {}, 'm2', { carpeta: 'brossa' } );
		expect( comptadors( correus, marques ) ).toMatchObject( {
			entrada: 0,
			brossa: 1,
		} );
	} );

	it( 'extracte uneix el text del cos (també el dels enllaços)', () => {
		const [ m2 ] = m.apps.posta.correus;
		const text = extracte( m2.cos );
		expect( text.startsWith( 'Benvolgut client, No hem pogut' ) ).toBe(
			true
		);
		expect( text ).toContain( 'Paga ara a llumclara.cat' );
		expect( extracte( undefined ) ).toBe( '' );
	} );

	it( 'filtra per remitent, adreça o assumpte sense distingir majúscules ni accents', () => {
		const correus = correusVisibles( estatInicial( m ), mon, m );
		expect( ids( filtra( correus, 'reunio' ) ) ).toEqual( [ 'f3' ] );
		expect( ids( filtra( correus, 'BOTIGAVERDA' ) ) ).toEqual( [ 'f4' ] );
		expect( filtra( correus, '  ' ) ).toEqual( correus );
	} );

	it( 'etiquetaData posa majúscula als dies i deixa les hores', () => {
		expect( etiquetaData( '09:14' ) ).toBe( '09:14' );
		expect( etiquetaData( 'ahir' ) ).toBe( 'Ahir' );
		expect( etiquetaData( 'dl.' ) ).toBe( 'Dl.' );
	} );
} );
