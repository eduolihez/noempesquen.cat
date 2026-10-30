import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { FASE, estatInicial, reductor, puntuacio } from '../motor.js';
import { validaMissio } from '../valida.js';

const carrega = ( nom ) =>
	JSON.parse(
		readFileSync(
			new URL( `../../../../../missions/${ nom }.json`, import.meta.url ),
			'utf8'
		)
	);

describe( 'missió «Virus detectat!» (v2)', () => {
	const p = carrega( 'llissa-04-suport' );
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
	// Senyals visibles sense instal·lar res (origen_top requereix instal-lat).
	const delAvis = [
		'web_no_detecta',
		'urgencia',
		'no_es_tanca',
		'instal_la_programa',
		'truca_telefon',
	];
	const URL_WEB = 'https://cuinaravui.cat/';
	const FITXER = 'suport-remot.exe';
	const valor = ( id ) =>
		p.decisio.opcions.find( ( o ) => o.id === id ).valor;

	it( 'és vàlida i de PC', () => {
		expect( validaMissio( p, mon ) ).toEqual( [] );
		expect( p.dispositiu ).toBe( 'pc' );
	} );

	it( 'camí correcte: indicis de l’avís i triar «a» donen 3 estrelles', () => {
		const e = aplica(
			joc(),
			{ tipus: 'LUPA' },
			...inspeccionaLes( delAvis ),
			...decideix( 'a' )
		);
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.opcio ).toBe( 'a' );
		expect( e.pescat ).toBe( false );
		expect( e.pistesDonades ).toBe( 0 );
		expect( valor( 'a' ) ).toBe( 'correcta' );
		const { maxim, estrelles } = puntuacio( p, e );
		expect( maxim ).toBe( delAvis.length * 10 + 50 );
		expect( estrelles ).toBe( 3 );
	} );

	it( 'triar «a» sense cap indici dona 1 estrella', () => {
		const e = aplica( joc(), ...decideix( 'a' ) );
		expect( e.opcio ).toBe( 'a' );
		expect( puntuacio( p, e ).estrelles ).toBe( 1 );
	} );

	it( 'l’opció «b» és parcial', () => {
		const e = aplica(
			joc(),
			{ tipus: 'LUPA' },
			...inspeccionaLes( delAvis ),
			...decideix( 'b' )
		);
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.opcio ).toBe( 'b' );
		expect( valor( 'b' ) ).toBe( 'parcial' );
		expect( puntuacio( p, e ) ).toMatchObject( {
			punts: 70,
			maxim: 100,
			estrelles: 2,
		} );
	} );

	it( 'l’opció «c» és la incorrecta', () => {
		const e = aplica(
			joc(),
			{ tipus: 'LUPA' },
			...inspeccionaLes( delAvis ),
			...decideix( 'c' )
		);
		expect( e.opcio ).toBe( 'c' );
		expect( valor( 'c' ) ).toBe( 'incorrecta' );
		expect( puntuacio( p, e ).estrelles ).toBe( 1 );
	} );

	it( 'pescat: trucar al número de l’avís', () => {
		const e = aplica( joc(), evt( 'telefon.truca', { url: URL_WEB } ) );
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.pescat ).toBe( true );
		expect( e.opcio ).toBeNull();
		expect( e.executats ).toContain( 'trucat' );
		// origen_top continua bloquejat: no s'ha instal·lat res.
		expect( puntuacio( p, e ) ).toMatchObject( {
			maxim: 100,
			estrelles: 1,
		} );
	} );

	it( 'pescat: obrir suport-remot.exe desbloqueja origen_top', () => {
		const e = aplica(
			joc(),
			evt( 'descarrega.fes', { url: URL_WEB, fitxer: FITXER } )
		);
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.pescat ).toBe( true );
		expect( e.executats ).toContain( 'instal-lat' );
		expect( puntuacio( p, e ) ).toMatchObject( {
			maxim: 110,
			estrelles: 1,
		} );
	} );

	it( 'un altre fitxer al mateix lloc no pesca', () => {
		const e = aplica(
			joc(),
			evt( 'descarrega.fes', { url: URL_WEB, fitxer: 'recepta.pdf' } )
		);
		expect( e.fase ).toBe( FASE.JOC );
		expect( e.pescat ).toBe( false );
	} );

	it( 'el mateix fitxer des d’una altra web no pesca', () => {
		const e = aplica(
			joc(),
			evt( 'descarrega.fes', {
				url: 'https://diaridelbarri.cat/',
				fitxer: FITXER,
			} )
		);
		expect( e.fase ).toBe( FASE.JOC );
		expect( e.pescat ).toBe( false );
	} );

	it( 'trucar des d’una altra web no pesca', () => {
		const e = aplica(
			joc(),
			evt( 'telefon.truca', { url: 'https://diaridelbarri.cat/' } )
		);
		expect( e.fase ).toBe( FASE.JOC );
		expect( e.pescat ).toBe( false );
	} );

	it( 'la guia avisa de l’avís al cap de 9 segons de joc', () => {
		const abans = joc();
		const quasi = aplica(
			abans,
			...Array.from( { length: 8 }, () => ( { tipus: 'TICK' } ) )
		);
		const frase = expect.objectContaining( {
			de: 'guia',
			text: p.frases.avis_surt,
		} );
		expect( quasi.pendents.map( ( x ) => x.id ) ).toContain( 'avis-surt' );
		expect( quasi.xat ).not.toContainEqual( frase );
		const e = aplica( quasi, { tipus: 'TICK' } );
		expect( e.pendents ).toEqual( [] );
		expect( e.xat.slice( abans.xat.length ) ).toContainEqual( frase );
		expect( e.xat.slice( abans.xat.length ) ).toContainEqual(
			expect.objectContaining( { de: 'guia', text: p.frases.avis_surt } )
		);
	} );
} );
