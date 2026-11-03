import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
	FASE,
	estatInicial,
	reductor,
	puntuacio,
	clauWeb,
	clauTancat,
} from '../motor.js';
import { validaMissio } from '../valida.js';

const carrega = ( nom ) =>
	JSON.parse(
		readFileSync(
			new URL( `../../../../../missions/ca/${ nom }.json`, import.meta.url ),
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

	it( 'la guia només parla de l’avís quan l’avís surt', () => {
		const frase = expect.objectContaining( {
			de: 'guia',
			text: p.frases.avis_surt,
		} );
		const quiet = aplica(
			joc(),
			...Array.from( { length: 30 }, () => ( { tipus: 'TICK' } ) )
		);
		expect( quiet.xat ).not.toContainEqual( frase );
		expect( quiet.pendents ).toEqual( [] );
		const altra = aplica(
			quiet,
			evt( 'avis.apareix', { url: 'https://diaridelbarri.cat/' } )
		);
		expect( altra.xat ).not.toContainEqual( frase );
		const e = aplica(
			quiet,
			evt( 'avis.apareix', { url: 'https://www.cuinaravui.cat/' } )
		);
		const noves = e.xat.slice( quiet.xat.length );
		expect( noves ).toContainEqual( frase );
		expect( e.avisosVistos ).toEqual( [ 'cuinaravui.cat' ] );
		const dos = aplica( e, evt( 'avis.apareix', { url: URL_WEB } ) );
		expect(
			dos.xat.filter( ( x ) => x.text === p.frases.avis_surt )
		).toHaveLength( 1 );
		expect( dos.avisosVistos ).toEqual( [ 'cuinaravui.cat' ] );
	} );
} );

describe( 'motor: el que es tanca en una web article', () => {
	const p = carrega( 'llissa-04-suport' );
	const joc = () =>
		reductor( p, estatInicial( p ), { tipus: 'DESBLOQUEJA' } );
	const tanca = ( e, url, element ) =>
		reductor( p, e, { tipus: 'TANCA_WEB', url, element } );

	it( 'la clau és el host sense www. (o el valor si no és URL)', () => {
		expect( clauWeb( 'https://www.cuinaravui.cat/recepta?x=1' ) ).toBe(
			'cuinaravui.cat'
		);
		expect( clauWeb( 'cuinaravui.cat' ) ).toBe( 'cuinaravui.cat' );
		expect( clauWeb( undefined ) ).toBeNull();
		expect( clauTancat( 'https://cuinaravui.cat/', 'avis' ) ).toBe(
			'cuinaravui.cat:avis'
		);
	} );

	it( 'TANCA_WEB anota l’avís i la barra un sol cop per web', () => {
		let e = tanca( joc(), 'https://cuinaravui.cat/', 'avis' );
		e = tanca( e, 'https://www.cuinaravui.cat/una-altra', 'avis' );
		e = tanca( e, 'https://tempsavui.cat/', 'barra' );
		expect( e.tancats ).toEqual( [
			'cuinaravui.cat:avis',
			'tempsavui.cat:barra',
		] );
	} );

	it( 'TANCA_WEB ignora elements desconeguts i URL buides', () => {
		const e = joc();
		expect( tanca( e, 'https://cuinaravui.cat/', 'baixada' ) ).toBe( e );
		expect( tanca( e, '', 'avis' ) ).toBe( e );
	} );

	it( 'REINICIA ho buida', () => {
		const e = tanca( joc(), 'https://cuinaravui.cat/', 'avis' );
		const r = reductor( p, e, { tipus: 'REINICIA' } );
		expect( r.tancats ).toEqual( [] );
		expect( r.avisosVistos ).toEqual( [] );
	} );
} );
