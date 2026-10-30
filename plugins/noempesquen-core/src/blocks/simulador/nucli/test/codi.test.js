import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validaMissio } from '../valida.js';
import { FASE, estatInicial, reductor, puntuacio } from '../motor.js';
import { extreuCodis } from '../../apps/parla/codi.js';

const carrega = ( nom ) =>
	JSON.parse(
		readFileSync(
			new URL( `../../../../../missions/${ nom }.json`, import.meta.url ),
			'utf8'
		)
	);

describe( 'missió «Em passes el codi?» (v2)', () => {
	const p = carrega( 'remei-04-codi' );
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
	const tick = ( segons ) => ( { tipus: 'TICK', segons } );
	const ambSms = () => aplica( joc(), tick( 18 ) );
	const ambTot = () => aplica( joc(), tick( 30 ) );
	const reenvia = () =>
		evt( 'missatge.reenvia', {
			app: 'missatges',
			id: 'sms-codi',
			a: 'marta',
		} );

	it( 'és vàlida (amb el món)', () => {
		expect( validaMissio( p, mon ) ).toEqual( [] );
		expect( p.dispositiu ).toBe( 'mobil' );
	} );

	it( 'extreuCodis troba el codi de l’SMS real', () => {
		expect( extreuCodis( p.apps.missatges.missatges ) ).toEqual( [
			'482913',
		] );
	} );

	it( 'els missatges arriben escalonats: xat a 8 s, SMS a 18 s, petició a 30 s', () => {
		let e = joc();
		expect( e.visibles[ 'codi-1' ] ).toBeUndefined();
		e = aplica( e, tick( 8 ) );
		expect( e.visibles[ 'codi-1' ] ).toBe( true );
		expect( e.visibles[ 'sms-codi' ] ).toBeUndefined();
		e = aplica( e, tick( 10 ) );
		expect( e.visibles[ 'sms-codi' ] ).toBe( true );
		expect( e.visibles[ 'codi-2' ] ).toBeUndefined();
		e = aplica( e, tick( 12 ) );
		expect( e.visibles[ 'codi-2' ] ).toBe( true );
		expect(
			e.notificacions.filter( ( n ) => n.app === 'parla' && n.xat )
		).toHaveLength( 2 );
		expect(
			e.notificacions.filter( ( n ) => n.app === 'missatges' )
		).toHaveLength( 1 );
	} );

	it( 'camí perfecte: totes les senyals i l’opció a donen 3 estrelles', () => {
		const e = aplica(
			ambTot(),
			{ tipus: 'LUPA' },
			...p.senyals.map( ( s ) => ( {
				tipus: 'INSPECCIONA',
				senyal: s.id,
			} ) ),
			{ tipus: 'RESPOSTA', id: 'decidir' },
			{ tipus: 'RESPOSTA', id: 'decisio:a' }
		);
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.opcio ).toBe( 'a' );
		expect( e.pescat ).toBe( false );
		expect( puntuacio( p, e ).estrelles ).toBe( 3 );
	} );

	it( 'pescat: reenviar l’SMS a la Marta un cop visible', () => {
		const e = aplica( ambSms(), reenvia() );
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.pescat ).toBe( true );
		expect( puntuacio( p, e ).estrelles ).toBe( 1 );
	} );

	it( 'pescat: passar el codi a la Marta pel xat un cop visible', () => {
		const e = aplica(
			ambSms(),
			evt( 'codi.comparteix', { contacte: 'marta' } )
		);
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.pescat ).toBe( true );
		expect( puntuacio( p, e ).estrelles ).toBe( 1 );
	} );

	it( 'reenviar o compartir abans que l’SMS sigui visible no puntua', () => {
		let e = aplica(
			joc(),
			tick( 10 ),
			reenvia(),
			evt( 'codi.comparteix', { contacte: 'marta' } )
		);
		expect( e.fase ).toBe( FASE.JOC );
		expect( e.pescat ).toBe( false );
		expect( e.executats ).not.toContain( 'reenviat' );
		expect( e.executats ).not.toContain( 'compartit' );
		// Un cop visible, la mateixa acció ja sí que compta.
		e = aplica( e, tick( 10 ), reenvia() );
		expect( e.pescat ).toBe( true );
	} );

	it( 'compartir el codi amb un altre contacte no fa res', () => {
		const e = aplica(
			ambSms(),
			evt( 'codi.comparteix', { contacte: 'pau' } )
		);
		expect( e.fase ).toBe( FASE.JOC );
		expect( e.pescat ).toBe( false );
		expect( e.executats ).not.toContain( 'compartit' );
	} );

	it( 'esborrar l’SMS no canvia la fase ni puntua', () => {
		const abans = ambSms();
		const e = aplica(
			abans,
			evt( 'missatge.esborra', { app: 'missatges', id: 'sms-codi' } )
		);
		expect( e.fase ).toBe( FASE.JOC );
		expect( e.pescat ).toBe( false );
		expect( e.opcio ).toBeNull();
		expect( puntuacio( p, e ).punts ).toBe( puntuacio( p, abans ).punts );
	} );
} );
