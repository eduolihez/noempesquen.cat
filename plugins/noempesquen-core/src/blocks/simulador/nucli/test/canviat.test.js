import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validaMissio } from '../valida.js';
import { FASE, estatInicial, reductor, puntuacio } from '../motor.js';

const carrega = ( nom ) =>
	JSON.parse(
		readFileSync(
			new URL( `../../../../../missions/ca/${ nom }.json`, import.meta.url ),
			'utf8'
		)
	);

describe( 'missió «Hola, he canviat de mòbil» (v2)', () => {
	const p = carrega( 'remei-02-canviat' );
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
	const ambTot = () => aplica( joc(), { tipus: 'TICK', segons: 60 } );

	it( 'és vàlida (amb el món) i té com a mínim 6 indicis', () => {
		expect( validaMissio( p, mon ) ).toEqual( [] );
		expect( p.dispositiu ).toBe( 'mobil' );
		expect( p.senyals.length ).toBeGreaterThanOrEqual( 6 );
		expect( p.apps.parla.xats[ 0 ].contacte ).toBe( 'numero_desconegut' );
	} );

	it( 'els missatges del desconegut arriben escalonats amb retard', () => {
		let e = joc();
		expect( e.visibles.p1 ).toBeUndefined();
		e = aplica( e, { tipus: 'TICK', segons: 10 } );
		expect( e.visibles.p1 ).toBe( true );
		expect( e.visibles.p3 ).toBeUndefined();
		expect( e.notificacions.some( ( n ) => n.app === 'parla' ) ).toBe(
			true
		);
		e = aplica( e, { tipus: 'TICK', segons: 15 } );
		expect( e.visibles.p3 ).toBe( true );
		expect( e.visibles.p5 ).toBeUndefined();
		e = aplica( e, { tipus: 'TICK', segons: 20 } );
		expect( e.visibles.p5 ).toBe( true );
	} );

	it( 'bloquejar el número és la via correcta principal', () => {
		const e = aplica(
			ambTot(),
			{ tipus: 'LUPA' },
			...p.senyals.map( ( s ) => ( {
				tipus: 'INSPECCIONA',
				senyal: s.id,
			} ) ),
			evt( 'contacte.bloqueja', { id: 'numero_desconegut' } )
		);
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.opcio ).toBe( 'c' );
		expect( puntuacio( p, e ).estrelles ).toBe( 3 );
	} );

	it( 'escriure al Pau és una via correcta equivalent', () => {
		const e = aplica(
			ambTot(),
			evt( 'missatge.envia', { contacte: 'pau' } )
		);
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.opcio ).toBe( 'd' );
		expect( p.decisio.opcions.find( ( o ) => o.id === 'd' ).valor ).toBe(
			'correcta'
		);
	} );

	it( 'escriure al Pau abans que arribi l’engany no tanca la missió; després sí, i el Pau respon', () => {
		let e = aplica( joc(), evt( 'missatge.envia', { contacte: 'pau' } ) );
		expect( e.fase ).toBe( FASE.JOC );
		e = aplica( e, { tipus: 'TICK', segons: 10 } );
		e = aplica( e, evt( 'missatge.envia', { contacte: 'pau' } ) );
		expect( e.opcio ).toBe( 'd' );
		expect( e.visibles.pau1 ).toBe( true );
	} );

	it( 'camí segur net: bloquejar amb els indicis disponibles dóna 3 estrelles', () => {
		const buscaTot = ( e ) =>
			aplica(
				e,
				{ tipus: 'LUPA' },
				...p.senyals
					.filter(
						( s ) => ! s.requereix || e.visibles[ s.requereix ]
					)
					.map( ( s ) => ( { tipus: 'INSPECCIONA', senyal: s.id } ) )
			);
		// Bloqueja just en arribar el primer missatge.
		let e = buscaTot( aplica( joc(), { tipus: 'TICK', segons: 10 } ) );
		e = aplica(
			e,
			evt( 'contacte.bloqueja', { id: 'numero_desconegut' } )
		);
		expect( e.opcio ).toBe( 'c' );
		expect( puntuacio( p, e ).estrelles ).toBe( 3 );
		// Sense buscar res, en canvi, no.
		const pobre = aplica(
			aplica( joc(), { tipus: 'TICK', segons: 10 } ),
			evt( 'contacte.bloqueja', { id: 'numero_desconegut' } )
		);
		expect( puntuacio( p, pobre ).estrelles ).toBeLessThan( 3 );
	} );

	it( 'amb pescat segueix penalitzant', () => {
		const e = aplica(
			ambTot(),
			{ tipus: 'LUPA' },
			...p.senyals.map( ( s ) => ( {
				tipus: 'INSPECCIONA',
				senyal: s.id,
			} ) ),
			evt( 'pagament.fes', {
				url: 'app://bancsolid',
				formulari: 'transferencia',
			} )
		);
		expect( puntuacio( p, e ).estrelles ).toBeLessThan( 3 );
	} );

	it( 'escriure a un altre contacte no tanca la missió', () => {
		const e = aplica(
			ambTot(),
			evt( 'missatge.envia', { contacte: 'marta' } )
		);
		expect( e.fase ).toBe( FASE.JOC );
	} );

	it( 'fer la transferència és el pescat', () => {
		const e = aplica(
			ambTot(),
			evt( 'pagament.fes', {
				url: 'app://bancsolid',
				formulari: 'transferencia',
			} )
		);
		expect( e.pescat ).toBe( true );
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
	} );

	it( 'ignorar-ho és parcial', () => {
		const parcial = p.decisio.opcions.find(
			( o ) => o.valor === 'parcial'
		);
		expect( parcial.id ).toBe( 'b' );
		const e = aplica(
			ambTot(),
			{ tipus: 'RESPOSTA', id: 'decidir' },
			{ tipus: 'RESPOSTA', id: 'decisio:b' }
		);
		expect( e.opcio ).toBe( 'b' );
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
	} );

	it( 'cada indici és inspeccionable a un missatge del desconegut o a l’avís', () => {
		const xat = p.apps.parla.xats[ 0 ];
		const llocs = [
			xat.senyal_avis,
			...xat.missatges.map( ( m ) => m.senyal ),
		].filter( Boolean );
		expect( new Set( llocs ) ).toEqual(
			new Set( p.senyals.map( ( s ) => s.id ) )
		);
		xat.missatges.forEach( ( m ) => {
			expect( m.senyal ).toBeDefined();
		} );
	} );

	it( 'les notificacions de Parla apunten al xat de la missió', () => {
		const notis = p.disparadors
			.flatMap( ( d ) => d.efectes )
			.filter( ( e ) => e.tipus === 'notifica' );
		expect( notis.length ).toBeGreaterThan( 0 );
		notis.forEach( ( n ) =>
			expect( n.xat ).toBe( p.apps.parla.xats[ 0 ].id )
		);
	} );
} );
