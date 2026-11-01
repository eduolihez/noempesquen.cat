import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
	FASE,
	estatInicial,
	reductor,
	respostesRapides,
	puntuacio,
	opcioTriada,
	visible,
	afegeixGuia,
	indicis,
} from '../motor.js';

const ruta = new URL(
	'../../../../../missions/llissa-01-factura.json',
	import.meta.url
);
const m = JSON.parse( readFileSync( ruta, 'utf8' ) );

const aplica = ( estat, ...accions ) =>
	accions.reduce( ( e, a ) => reductor( m, e, a ), estat );
const joc = () => aplica( estatInicial( m ), { tipus: 'DESBLOQUEJA' } );
const finalIntro = () => {
	let e = joc();
	for ( let i = 0; i < m.intro.length; i++ ) {
		e = aplica( e, { tipus: 'RESPOSTA', id: 'intro:seguent' } );
	}
	return e;
};
const ultimGuia = ( e ) =>
	[ ...e.xat ].reverse().find( ( x ) => x.de === 'guia' );

describe( 'motor v2', () => {
	it( 'comença bloquejat i desbloquejar porta el primer missatge de la intro al xat', () => {
		const e0 = estatInicial( m );
		expect( e0.fase ).toBe( FASE.BLOQUEIG );
		expect( e0.xat ).toEqual( [] );
		const e = aplica( e0, { tipus: 'DESBLOQUEJA' } );
		expect( e.fase ).toBe( 'joc' );
		expect( e.xat[ 0 ] ).toMatchObject( {
			de: 'guia',
			text: m.intro[ 0 ],
		} );
		expect( e.notificacions ).toHaveLength( 1 );
		expect( e.notificacions[ 0 ] ).toMatchObject( {
			app: 'parla',
			titol: m.personatge,
			text: m.intro[ 0 ],
			llegida: false,
		} );
		expect( e0.xat ).toEqual( [] );
	} );

	it( 'les respostes ràpides avancen la intro i al final ofereixen «Ja ho tinc clar»', () => {
		let e = joc();
		expect( respostesRapides( m, e ) ).toEqual( [
			{ id: 'intro:seguent', text: 'Següent' },
			{ id: 'intro:salta', text: 'Salta la presentació' },
		] );
		for ( let i = 0; i < m.intro.length - 1; i++ ) {
			e = aplica( e, { tipus: 'RESPOSTA', id: 'intro:seguent' } );
		}
		expect( respostesRapides( m, e )[ 0 ].text ).toBe( 'Som-hi!' );
		e = aplica( e, { tipus: 'RESPOSTA', id: 'intro:seguent' } );
		expect( e.introAcabada ).toBe( true );
		expect( ultimGuia( e ).text ).toBe( m.instruccions );
		expect( respostesRapides( m, e ) ).toEqual( [
			{ id: 'decidir', text: 'Ja ho tinc clar' },
		] );
	} );

	it( 'saltar la presentació acaba la intro', () => {
		const e = aplica( joc(), { tipus: 'RESPOSTA', id: 'intro:salta' } );
		expect( e.introAcabada ).toBe( true );
		expect( ultimGuia( e ).text ).toBe( m.instruccions );
		expect( e.xat.some( ( x ) => x.de === 'jo' ) ).toBe( true );
	} );

	it( 'decidir obre les opcions com a respostes ràpides i tornar les tanca', () => {
		let e = aplica( finalIntro(), { tipus: 'LUPA' } );
		expect( e.lupa ).toBe( true );
		e = aplica( e, { tipus: 'RESPOSTA', id: 'decidir' } );
		expect( e.decisioOberta ).toBe( true );
		expect( e.lupa ).toBe( false );
		expect( ultimGuia( e ).text ).toBe( m.decisio.pregunta );
		const r = respostesRapides( m, e );
		expect( r.map( ( x ) => x.id ) ).toEqual( [
			...m.decisio.opcions.map( ( o ) => `decisio:${ o.id }` ),
			'decisio:tornar',
		] );
		expect( r[ 0 ].text ).toBe( m.decisio.opcions[ 0 ].text );
		expect( r.at( -1 ).text ).toBe( 'Encara vull mirar' );
		e = aplica( e, { tipus: 'RESPOSTA', id: 'decisio:tornar' } );
		expect( e.decisioOberta ).toBe( false );
		expect( respostesRapides( m, e ) ).toEqual( [
			{ id: 'decidir', text: 'Ja ho tinc clar' },
		] );
	} );

	it( 'triar una opció afegeix el meu missatge i la resposta, i passa a consequencia', () => {
		let e = aplica(
			finalIntro(),
			{ tipus: 'RESPOSTA', id: 'decidir' },
			{ tipus: 'RESPOSTA', id: 'decisio:c' }
		);
		const opc = m.decisio.opcions.find( ( o ) => o.id === 'c' );
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.opcio ).toBe( 'c' );
		expect( opcioTriada( m, e ).id ).toBe( 'c' );
		const n = e.xat.length;
		expect( e.xat[ n - 2 ] ).toMatchObject( { de: 'jo', text: opc.text } );
		expect( e.xat[ n - 1 ] ).toMatchObject( {
			de: 'guia',
			text: opc.resposta,
		} );
		expect( e.notificacions.some( ( x ) => x.text === opc.text ) ).toBe(
			false
		);
		expect( respostesRapides( m, e ) ).toEqual( [] );
		e = aplica( e, { tipus: 'VEURE_RESULTAT' } );
		expect( e.fase ).toBe( FASE.RESULTAT );
	} );

	it( 'VEURE_RESULTAT només funciona des de consequencia', () => {
		expect( aplica( joc(), { tipus: 'VEURE_RESULTAT' } ).fase ).toBe(
			'joc'
		);
	} );

	it( 'inspeccionar un senyal nou suma, la nota diu «Indicis: 1 de 7» i es marca avanç', () => {
		let e = { ...finalIntro(), temps: 42 };
		e = aplica( e, { tipus: 'INSPECCIONA', senyal: 'urgencia' } );
		const s = m.senyals.find( ( x ) => x.id === 'urgencia' );
		expect( e.trobats ).toEqual( [ 'urgencia' ] );
		expect( ultimGuia( e ) ).toMatchObject( {
			text: s.reaccio,
			nota: 'Indicis: 1 de 7',
		} );
		expect( e.ultimAvanc ).toBe( 42 );
	} );

	it( 'un senyal repetit no suma dues vegades', () => {
		let e = aplica( finalIntro(), {
			tipus: 'INSPECCIONA',
			senyal: 'urgencia',
		} );
		const punts = puntuacio( m, e ).punts;
		const xat = e.xat.length;
		e = aplica( e, { tipus: 'INSPECCIONA', senyal: 'urgencia' } );
		expect( e.trobats ).toEqual( [ 'urgencia' ] );
		expect( puntuacio( m, e ).punts ).toBe( punts );
		// Repetida: ja no hi ha missatge de guia nou (la UI mostra un xip).
		expect( e.xat ).toHaveLength( xat );
	} );

	it( 'inspeccionar res és «normal»: sense missatge de guia nou i amb clau creixent', () => {
		let e = finalIntro();
		const xat = e.xat.length;
		const claus = [];
		for ( let i = 0; i < 4; i++ ) {
			e = aplica( e, { tipus: 'INSPECCIONA', senyal: null } );
			claus.push( e.ultimaInspeccio.clau );
			expect( e.ultimaInspeccio.tipus ).toBe( 'normal' );
		}
		expect( claus ).toEqual( [ 1, 2, 3, 4 ] );
		expect( e.xat ).toHaveLength( xat );
		expect( e.falsos ).toBe( 4 );
		expect( e.trobats ).toEqual( [] );
	} );

	it( 'ultimaInspeccio distingeix nova i repetida i no guarda text', () => {
		let e = aplica( finalIntro(), {
			tipus: 'INSPECCIONA',
			senyal: 'urgencia',
		} );
		expect( e.ultimaInspeccio ).toEqual( { clau: 1, tipus: 'nova' } );
		const xat = e.xat.length;
		e = aplica( e, { tipus: 'INSPECCIONA', senyal: 'urgencia' } );
		expect( e.ultimaInspeccio ).toEqual( { clau: 2, tipus: 'repetida' } );
		expect( e.xat ).toHaveLength( xat );
		e = aplica( e, { tipus: 'INSPECCIONA', senyal: 'urgencia' } );
		expect( e.ultimaInspeccio.clau ).toBe( 3 );
	} );

	it( 'indicis() compta 0, parcial i complet; sense senyals no trenca', () => {
		let e = finalIntro();
		expect( indicis( m, e ) ).toEqual( {
			trobats: 0,
			total: 7,
			complet: false,
		} );
		e = aplica( e, { tipus: 'INSPECCIONA', senyal: 'urgencia' } );
		expect( indicis( m, e ) ).toMatchObject( {
			trobats: 1,
			complet: false,
		} );
		for ( const s of m.senyals ) {
			e = aplica( e, { tipus: 'INSPECCIONA', senyal: s.id } );
		}
		expect( indicis( m, e ) ).toEqual( {
			trobats: 7,
			total: 7,
			complet: true,
		} );
		expect( indicis( { senyals: [] }, e ) ).toEqual( {
			trobats: 7,
			total: 0,
			complet: false,
		} );
		expect( indicis( {}, estatInicial( {} ) ) ).toEqual( {
			trobats: 0,
			total: 0,
			complet: false,
		} );
	} );

	it( 'lupa.activa es dispara només el primer cop que s’encén la lupa', () => {
		const mis = {
			...m,
			disparadors: [
				{
					id: 'tut-lupa',
					quan: { esdeveniment: 'lupa.activa' },
					efectes: [ { tipus: 'guia-diu', text: 'Lupa!' } ],
				},
			],
		};
		const ap = ( e, a ) => reductor( mis, e, a );
		let e = ap( ap( estatInicial( mis ), { tipus: 'DESBLOQUEJA' } ), {
			tipus: 'LUPA',
		} );
		const dita = ( x ) =>
			x.xat.filter( ( q ) => q.text === 'Lupa!' ).length;
		expect( e.lupaUsada ).toBe( true );
		expect( dita( e ) ).toBe( 1 );
		e = ap( ap( e, { tipus: 'LUPA' } ), { tipus: 'LUPA' } );
		expect( e.lupa ).toBe( true );
		expect( dita( e ) ).toBe( 1 );
	} );

	it( "la lupa no s'activa en pausa ni fora de joc", () => {
		expect( aplica( estatInicial( m ), { tipus: 'LUPA' } ).lupa ).toBe(
			false
		);
		const p = aplica( joc(), { tipus: 'PAUSA' } );
		expect( p.pausa ).toBe( true );
		expect( aplica( p, { tipus: 'LUPA' } ).lupa ).toBe( false );
		const r = aplica( p, { tipus: 'REPREN' } );
		expect( r.pausa ).toBe( false );
		expect( aplica( r, { tipus: 'LUPA' } ).lupa ).toBe( true );
	} );

	it( 'NOTIFICACIONS_LLEGIDES marca llegides, opcionalment per app', () => {
		const e = afegeixGuia( joc(), 'hola' );
		const perApp = aplica( e, {
			tipus: 'NOTIFICACIONS_LLEGIDES',
			app: 'posta',
		} );
		expect( perApp.notificacions.every( ( n ) => ! n.llegida ) ).toBe(
			true
		);
		const totes = aplica( e, { tipus: 'NOTIFICACIONS_LLEGIDES' } );
		expect( totes.notificacions.every( ( n ) => n.llegida ) ).toBe( true );
	} );

	it( "REINICIA torna a l'estat inicial", () => {
		const e = aplica( finalIntro(), { tipus: 'REINICIA' } );
		expect( e ).toEqual( estatInicial( m ) );
	} );

	it( 'ids de missatges i notificacions són únics', () => {
		const e = finalIntro();
		const ids = [ ...e.xat, ...e.notificacions ].map( ( x ) => x.id );
		expect( new Set( ids ).size ).toBe( ids.length );
	} );

	it( 'afegeixGuia és immutable i admet nota', () => {
		const e0 = joc();
		const e = afegeixGuia( e0, 'x', 'nota' );
		expect( e0.xat ).toHaveLength( 1 );
		expect( e.xat.at( -1 ) ).toMatchObject( {
			de: 'guia',
			text: 'x',
			nota: 'nota',
		} );
	} );

	it( 'visible respecta ocult i visibles', () => {
		expect( visible( {}, { id: 'a' } ) ).toBe( true );
		expect( visible( { visibles: {} }, { id: 'a', ocult: true } ) ).toBe(
			false
		);
		expect(
			visible( { visibles: { a: true } }, { id: 'a', ocult: true } )
		).toBe( true );
	} );

	it( 'partida perfecta = 3 estrelles i puntuació màxima', () => {
		let e = finalIntro();
		for ( const s of m.senyals ) {
			e = aplica( e, { tipus: 'INSPECCIONA', senyal: s.id } );
		}
		e = aplica(
			e,
			{ tipus: 'RESPOSTA', id: 'decidir' },
			{ tipus: 'RESPOSTA', id: 'decisio:c' }
		);
		expect( puntuacio( m, e ) ).toEqual( {
			punts: 120,
			maxim: 120,
			estrelles: 3,
		} );
	} );

	it( 'pescat sense indicis = 0 punts i 1 estrella', () => {
		const e = { ...joc(), pescat: true };
		expect( puntuacio( m, e ) ).toEqual( {
			punts: 0,
			maxim: 120,
			estrelles: 1,
		} );
	} );

	it( 'cada pista usada resta 5 punts, sense baixar de 0', () => {
		let e = finalIntro();
		e = aplica(
			e,
			{ tipus: 'INSPECCIONA', senyal: 'urgencia' },
			{ tipus: 'INSPECCIONA', senyal: 'enllac' }
		);
		const base = puntuacio( m, e ).punts;
		expect( puntuacio( m, { ...e, pistesDonades: 2 } ).punts ).toBe(
			base - 10
		);
		expect( puntuacio( m, { ...e, pistesDonades: 99 } ).punts ).toBe( 0 );
	} );
} );
