import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { FASE, estatInicial, reductor, puntuacio } from '../motor.js';
import { validaMissio } from '../valida.js';

const carrega = ( nom ) =>
	JSON.parse(
		readFileSync(
			new URL(
				`../../../../../missions/ca/${ nom }.json`,
				import.meta.url
			),
			'utf8'
		)
	);

describe( 'missió «Actualitza el navegador» (v2)', () => {
	const p = carrega( 'llissa-05-actualitzacio' );
	const mon = carrega( 'mon' );
	const aplica = ( estat, ...accions ) =>
		accions.reduce( ( e, a ) => reductor( p, e, a ), estat );
	const evt = ( nom, dades = {} ) => ( {
		tipus: 'ESDEVENIMENT',
		nom,
		dades,
	} );
	const joc = () =>
		aplica(
			estatInicial( p ),
			{ tipus: 'DESBLOQUEJA' },
			{ tipus: 'RESPOSTA', id: 'intro:salta' }
		);
	const inspeccionaLes = ( ids ) =>
		ids.map( ( senyal ) => ( { tipus: 'INSPECCIONA', senyal } ) );
	const decideix = ( id ) => [
		{ tipus: 'RESPOSTA', id: 'decidir' },
		{ tipus: 'RESPOSTA', id: `decisio:${ id }` },
	];
	// Senyals de la barra (exe_top requereix descarregat).
	const delaBarra = [ 'web_no_actualitza', 'urgencia', 'barra_dins_pagina' ];
	const URL_WEB = 'https://tempsavui.cat/';
	const FITXER = 'actualitzacio-navegador.exe';
	const valor = ( id ) =>
		p.decisio.opcions.find( ( o ) => o.id === id ).valor;
	const ambIndicis = ( id ) =>
		aplica(
			joc(),
			{ tipus: 'LUPA' },
			...inspeccionaLes( delaBarra ),
			...decideix( id )
		);

	it( 'és vàlida i de PC', () => {
		expect( validaMissio( p, mon ) ).toEqual( [] );
		expect( p.dispositiu ).toBe( 'pc' );
	} );

	it( 'camí correcte: indicis de la barra i triar «a» donen 3 estrelles', () => {
		const e = ambIndicis( 'a' );
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.opcio ).toBe( 'a' );
		expect( e.pescat ).toBe( false );
		expect( e.pistesDonades ).toBe( 0 );
		expect( valor( 'a' ) ).toBe( 'correcta' );
		expect( puntuacio( p, e ) ).toMatchObject( {
			punts: 80,
			maxim: delaBarra.length * 10 + 50,
			estrelles: 3,
		} );
	} );

	it( 'triar «a» sense cap indici dona 2 estrelles', () => {
		const e = aplica( joc(), ...decideix( 'a' ) );
		expect( e.opcio ).toBe( 'a' );
		expect( puntuacio( p, e ) ).toMatchObject( {
			punts: 50,
			maxim: 80,
			estrelles: 2,
		} );
	} );

	it( 'l’opció «b» és parcial', () => {
		const e = ambIndicis( 'b' );
		expect( e.opcio ).toBe( 'b' );
		expect( valor( 'b' ) ).toBe( 'parcial' );
		expect( puntuacio( p, e ) ).toMatchObject( {
			punts: 50,
			maxim: 80,
			estrelles: 2,
		} );
	} );

	it( 'l’opció «c» és la incorrecta', () => {
		const e = ambIndicis( 'c' );
		expect( e.opcio ).toBe( 'c' );
		expect( valor( 'c' ) ).toBe( 'incorrecta' );
		expect( puntuacio( p, e ).estrelles ).toBe( 1 );
	} );

	it( 'pescat: obrir l’.exe desbloqueja exe_top', () => {
		const e = aplica(
			joc(),
			evt( 'descarrega.fes', { url: URL_WEB, fitxer: FITXER } )
		);
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.pescat ).toBe( true );
		expect( e.opcio ).toBeNull();
		expect( e.executats ).toContain( 'descarregat' );
		expect( puntuacio( p, e ) ).toMatchObject( {
			maxim: 90,
			estrelles: 1,
		} );
	} );

	it( 'un altre fitxer al mateix lloc no pesca', () => {
		for ( const fitxer of [ 'previsio.pdf', 'suport-remot.exe' ] ) {
			const e = aplica(
				joc(),
				evt( 'descarrega.fes', { url: URL_WEB, fitxer } )
			);
			expect( e.fase ).toBe( FASE.JOC );
			expect( e.pescat ).toBe( false );
		}
	} );

	it( 'el mateix fitxer des d’una altra web no pesca', () => {
		const e = aplica(
			joc(),
			evt( 'descarrega.fes', {
				url: 'https://cuinaravui.cat/',
				fitxer: FITXER,
			} )
		);
		expect( e.fase ).toBe( FASE.JOC );
		expect( e.pescat ).toBe( false );
	} );

	it( 'trucar no fa res en aquesta missió', () => {
		const e = aplica( joc(), evt( 'telefon.truca', { url: URL_WEB } ) );
		expect( e.fase ).toBe( FASE.JOC );
		expect( e.pescat ).toBe( false );
	} );
} );
