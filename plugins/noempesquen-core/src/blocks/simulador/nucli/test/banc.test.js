import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validaMissio } from '../valida.js';
import { FASE, estatInicial, reductor, puntuacio } from '../motor.js';

const carrega = ( nom ) =>
	JSON.parse(
		readFileSync(
			new URL( `../../../../../missions/${ nom }.json`, import.meta.url ),
			'utf8'
		)
	);

describe( 'missió «El banc et bloqueja el compte» (v2)', () => {
	const p = carrega( 'llissa-02-banc' );
	const FALSA = 'https://bancsolid-acces.top/entrada';
	const aplica = ( estat, ...accions ) =>
		accions.reduce( ( e, a ) => reductor( p, e, a ), estat );
	const evt = ( nom, dades = {} ) => ( {
		tipus: 'ESDEVENIMENT',
		nom,
		dades,
	} );
	const ambCorreu = () =>
		aplica(
			estatInicial( p ),
			{ tipus: 'DESBLOQUEJA' },
			{ tipus: 'RESPOSTA', id: 'intro:salta' },
			{ tipus: 'TICK', segons: 10 }
		);

	it( 'és vàlida i té com a mínim 6 indicis', () => {
		expect( validaMissio( p ) ).toEqual( [] );
		expect( p.dispositiu ).toBe( 'pc' );
		expect( p.senyals.length ).toBeGreaterThanOrEqual( 6 );
	} );

	it( 'el correu arriba amb retard i notificació', () => {
		const abans = aplica( estatInicial( p ), { tipus: 'DESBLOQUEJA' } );
		expect( abans.visibles.m2 ).toBeUndefined();
		const e = ambCorreu();
		expect( e.visibles.m2 ).toBe( true );
		expect( e.notificacions.some( ( n ) => n.app === 'posta' ) ).toBe(
			true
		);
	} );

	it( 'marcar com a phishing és la via correcta principal', () => {
		const e = aplica(
			ambCorreu(),
			{ tipus: 'LUPA' },
			...p.senyals.map( ( s ) => ( {
				tipus: 'INSPECCIONA',
				senyal: s.id,
			} ) ),
			evt( 'correu.marca', { id: 'm2', com: 'phishing' } )
		);
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.opcio ).toBe( 'c' );
		expect( puntuacio( p, e ).estrelles ).toBe( 3 );
	} );

	it( 'esborrar és parcial', () => {
		const e = aplica(
			ambCorreu(),
			evt( 'correu.marca', { id: 'm2', com: 'esborra' } )
		);
		expect( e.opcio ).toBe( 'b' );
	} );

	it( 'entrar a la web oficial és una via correcta equivalent', () => {
		const e = aplica(
			ambCorreu(),
			evt( 'web.carrega', { url: 'https://bancsolid.cat/' } )
		);
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.opcio ).toBe( 'd' );
		expect( p.decisio.opcions.find( ( o ) => o.id === 'd' ).valor ).toBe(
			'correcta'
		);
	} );

	it( 'obrir la web falsa només avisa', () => {
		const e = aplica( ambCorreu(), evt( 'web.carrega', { url: FALSA } ) );
		expect( e.fase ).toBe( FASE.JOC );
		expect( e.pescat ).toBeFalsy();
		expect( e.xat.at( -1 ).text ).toBe( p.frases.web_falsa );
	} );

	it( 'pas 1: avís de la guia i codi 482913 al mòbil; el codi és el pescat', () => {
		let e = aplica(
			ambCorreu(),
			evt( 'formulari.envia', { url: FALSA, formulari: 'acces' } )
		);
		expect( e.fase ).toBe( FASE.JOC );
		expect( e.xat.at( -1 ).text ).toBe( p.frases.dades_donades );
		expect( e.notificacions.some( ( n ) => n.font === 'mobil' ) ).toBe(
			false
		);
		e = aplica( e, { tipus: 'TICK', segons: 4 } );
		const sms = e.notificacions.find( ( n ) => n.font === 'mobil' );
		expect( sms.app ).toBe( 'missatges' );
		expect( sms.text ).toContain( '482913' );
		e = aplica( e, evt( 'codi.envia', { url: FALSA, formulari: 'codi' } ) );
		expect( e.pescat ).toBe( true );
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
	} );
} );
