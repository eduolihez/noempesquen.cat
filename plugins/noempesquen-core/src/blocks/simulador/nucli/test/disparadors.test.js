import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { FASE, estatInicial, reductor, visible } from '../motor.js';
import { coincideix, processaEsdeveniment } from '../disparadors.js';

const ruta = new URL(
	'../../../../../missions/llissa-01-factura.json',
	import.meta.url
);
const m = JSON.parse( readFileSync( ruta, 'utf8' ) );
const m2 = m.apps.posta.correus.find( ( c ) => c.id === 'm2' );

const aplica = ( estat, ...accions ) =>
	accions.reduce( ( e, a ) => reductor( m, e, a ), estat );
const joc = () => aplica( estatInicial( m ), { tipus: 'DESBLOQUEJA' } );
const jocSenseIntro = () =>
	aplica( joc(), { tipus: 'RESPOSTA', id: 'intro:salta' } );
const ticks = ( estat, n ) =>
	aplica( estat, ...Array( n ).fill( { tipus: 'TICK' } ) );
const esdev = ( nom, dades ) => ( { tipus: 'ESDEVENIMENT', nom, dades } );
const marca = ( com ) => esdev( 'correu.marca', { id: 'm2', com } );
const envia = () =>
	esdev( 'formulari.envia', {
		url: 'http://llumclara-pagaments.com/pagament?ref=88213',
		formulari: 'targeta',
	} );

describe( 'disparadors', () => {
	it( 'el correu trampa apareix als 8 segons amb notificació de Posta', () => {
		const e7 = ticks( joc(), 7 );
		expect( visible( e7, m2 ) ).toBe( false );
		const e8 = ticks( e7, 1 );
		expect( visible( e8, m2 ) ).toBe( true );
		expect( e8.notificacions ).toContainEqual(
			expect.objectContaining( {
				app: 'posta',
				titol: 'Llum Clara',
				llegida: false,
			} )
		);
		expect( visible( ticks( e8, 20 ), m2 ) ).toBe( true );
		expect(
			ticks( e8, 20 ).notificacions.filter( ( n ) => n.app === 'posta' )
		).toHaveLength( 1 );
	} );

	it( 'en pausa no arriba res ni salten pistes', () => {
		let e = ticks( jocSenseIntro(), 5 );
		e = aplica( e, { tipus: 'PAUSA' } );
		e = ticks( e, 120 );
		e = aplica( e, { tipus: 'REPREN' } );
		expect( visible( e, m2 ) ).toBe( false );
		expect( e.pistesDonades ).toBe( 0 );
		expect( visible( ticks( e, 3 ), m2 ) ).toBe( true );
	} );

	it( 'enviar el formulari fals és pescat', () => {
		const e = aplica( jocSenseIntro(), envia() );
		expect( e.pescat ).toBe( true );
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.lupa ).toBe( false );
		expect( e.xat.at( -1 ).text ).toBe( m.frases.pescat );
	} );

	it( 'marcar m2 com a phishing decideix c', () => {
		const e = aplica( jocSenseIntro(), marca( 'phishing' ) );
		expect( e.opcio ).toBe( 'c' );
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		const opcio = m.decisio.opcions.find( ( o ) => o.id === 'c' );
		expect( e.xat.at( -1 ).text ).toBe( opcio.resposta );
	} );

	it( 'marcar m2 com a esborra decideix d', () => {
		expect( aplica( jocSenseIntro(), marca( 'esborra' ) ).opcio ).toBe(
			'd'
		);
	} );

	it( 'després de pescat, marcar phishing no canvia res', () => {
		const e = aplica( jocSenseIntro(), envia() );
		expect( aplica( e, marca( 'phishing' ) ) ).toEqual( e );
	} );

	it( 'dos formulari.envia seguits només compten un cop', () => {
		const e = aplica( jocSenseIntro(), envia() );
		const dos = aplica( e, envia() );
		expect( dos.xat ).toHaveLength( e.xat.length );
		expect( dos ).toEqual( e );
	} );

	it( 'web falsa fa parlar el guia amb la frase', () => {
		const e = aplica(
			jocSenseIntro(),
			esdev( 'web.carrega', {
				url: 'https://llumclara-pagaments.com/pagament',
			} )
		);
		expect( e.xat.at( -1 ).text ).toBe( m.frases.web_falsa );
		expect( e.fase ).toBe( FASE.JOC );
	} );

	it( '60 segons sense avanç envien la primera pista; trobar un senyal reinicia el compte', () => {
		const a = ticks( jocSenseIntro(), 60 );
		expect( a.pistesDonades ).toBe( 1 );
		expect( a.xat.at( -1 ).text ).toBe( m.pistes[ 0 ] );

		let b = ticks( jocSenseIntro(), 59 );
		b = aplica( b, { tipus: 'INSPECCIONA', senyal: 'remitent' } );
		b = ticks( b, 59 );
		expect( b.pistesDonades ).toBe( 0 );
		expect( ticks( b, 1 ).pistesDonades ).toBe( 1 );
	} );

	it( 'obrir el correu objectiu compta com a avanç; un altre no', () => {
		const obre = ( id ) => esdev( 'missatge.obre', { app: 'posta', id } );
		let a = ticks( jocSenseIntro(), 50 );
		a = aplica( a, obre( 'm2' ) );
		expect( a.ultimAvanc ).toBe( 50 );
		a = ticks( a, 59 );
		expect( a.pistesDonades ).toBe( 0 );
		expect( ticks( a, 1 ).pistesDonades ).toBe( 1 );

		const b = aplica( ticks( jocSenseIntro(), 50 ), obre( 'm1' ) );
		expect( b.ultimAvanc ).toBe( 0 );
	} );

	it( "no hi ha pistes abans d'acabar la intro", () => {
		expect( ticks( joc(), 200 ).pistesDonades ).toBe( 0 );
	} );

	it( 'no passen més pistes de les que hi ha', () => {
		expect( ticks( jocSenseIntro(), 600 ).pistesDonades ).toBe(
			m.pistes.length
		);
	} );
} );

describe( 'coincideix', () => {
	it( 'coincideix per domini i per url exacta', () => {
		const url = 'http://llumclara-pagaments.com/pagament?ref=1';
		expect(
			coincideix(
				{ esdeveniment: 'web.carrega', url: 'llumclara-pagaments.com' },
				'web.carrega',
				{ url }
			)
		).toBe( true );
		expect(
			coincideix( { esdeveniment: 'web.carrega', url }, 'web.carrega', {
				url,
			} )
		).toBe( true );
		expect(
			coincideix(
				{ esdeveniment: 'web.carrega', url: 'llumclara.cat' },
				'web.carrega',
				{ url }
			)
		).toBe( false );
		expect(
			coincideix( { esdeveniment: 'inici' }, 'web.carrega', {} )
		).toBe( false );
		expect(
			coincideix(
				{ esdeveniment: 'correu.marca', com: 'a' },
				'correu.marca',
				{
					com: 'b',
				}
			)
		).toBe( false );
	} );
} );

describe( 'disparadors del vocabulari mòbil', () => {
	const mobil = {
		id: 't',
		frases: { pescat: 'Pescat' },
		decisio: {
			opcions: [
				{ id: 'c', valor: 'correcta', resposta: 'Bloquejat' },
				{ id: 'd', valor: 'parcial', resposta: 'Reenviat' },
			],
		},
		disparadors: [
			{
				id: 'bloqueja',
				quan: { esdeveniment: 'contacte.bloqueja' },
				efectes: [ { tipus: 'decideix', opcio: 'c' } ],
			},
			{
				id: 'reenvia',
				quan: { esdeveniment: 'missatge.reenvia', a: 'familia' },
				efectes: [ { tipus: 'decideix', opcio: 'd' } ],
			},
		],
	};
	const inici = () => ( { ...estatInicial( m ), fase: FASE.JOC } );

	it( 'contacte.bloqueja decideix c', () => {
		const e = processaEsdeveniment( mobil, inici(), 'contacte.bloqueja', {
			id: 'x',
		} );
		expect( e.opcio ).toBe( 'c' );
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
	} );

	it( 'missatge.reenvia a familia decideix d una sola vegada', () => {
		const altre = processaEsdeveniment(
			mobil,
			inici(),
			'missatge.reenvia',
			{
				a: 'pau',
			}
		);
		expect( altre.opcio ).toBeFalsy();
		const e = processaEsdeveniment( mobil, inici(), 'missatge.reenvia', {
			a: 'familia',
		} );
		expect( e.opcio ).toBe( 'd' );
		expect( e.executats.filter( ( x ) => x === 'reenvia' ) ).toHaveLength(
			1
		);
		const bis = processaEsdeveniment( mobil, e, 'missatge.reenvia', {
			a: 'familia',
		} );
		expect( bis ).toBe( e );
	} );
} );
