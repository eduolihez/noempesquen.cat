import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { estatInicial, reductor } from '../motor.js';
import { desplacaPendents, segonsDeMs } from '../disparadors.js';
import { validaMissio } from '../valida.js';
import { MS_TRAS_INTRO } from '../temps.js';

const carrega = ( fitxer ) =>
	JSON.parse(
		readFileSync(
			new URL( `../../../../../missions/${ fitxer }`, import.meta.url ),
			'utf8'
		)
	);
const mon = carrega( 'mon.json' );
const errors = ( m ) => validaMissio( m, mon );
const factura = () => carrega( 'llissa-01-factura.json' );
const canviat = () => carrega( 'remei-02-canviat.json' );
const disp = ( m, id ) => m.disparadors.find( ( d ) => d.id === id );
const MARGE = segonsDeMs( MS_TRAS_INTRO );

describe( 'retard_ms al validador', () => {
	it( 'les missions i tutorials amb retards passen', () => {
		[
			'llissa-01-factura.json',
			'llissa-02-banc.json',
			'llissa-04-suport.json',
			'remei-01-paquet.json',
			'remei-02-canviat.json',
			'remei-04-codi.json',
			'remei-05-comprador.json',
			'tutorial-pc.json',
			'tutorial-mobil.json',
		].forEach( ( f ) => expect( errors( carrega( f ) ) ).toEqual( [] ) );
	} );

	it( 'rebutja el camp vell retard amb «usa retard_ms»', () => {
		const m = factura();
		const d = disp( m, 'arriba-trampa' );
		d.retard = 8;
		delete d.retard_ms;
		expect( errors( m ) ).toContain(
			"disparador arriba-trampa: «retard» ja no s'accepta: usa retard_ms (mil·lisegons)"
		);
	} );

	it( 'retard_ms ha de ser un enter ≥ 0', () => {
		[ -1, 1.5, '8000' ].forEach( ( v ) => {
			const m = factura();
			disp( m, 'arriba-trampa' ).retard_ms = v;
			expect( errors( m ) ).toContain(
				'disparador arriba-trampa: «retard_ms» ha de ser un enter ≥ 0'
			);
		} );
	} );

	it( "un avís d'inici sense retard_ms també es rebutja", () => {
		const m = factura();
		delete disp( m, 'arriba-trampa' ).retard_ms;
		expect( errors( m ).join( '\n' ) ).toContain(
			"disparador arriba-trampa: un avís d'inici necessita retard_ms"
		);
	} );

	it( "un avís d'inici no pot sortir abans de MS_TRAS_INTRO", () => {
		const m = factura();
		disp( m, 'arriba-trampa' ).retard_ms = MS_TRAS_INTRO - 1;
		expect( errors( m ) ).toContain(
			`disparador arriba-trampa: un avís d'inici necessita retard_ms ≥ ${ MS_TRAS_INTRO } (després de la intro)`
		);
		disp( m, 'arriba-trampa' ).retard_ms = MS_TRAS_INTRO;
		expect( errors( m ) ).toEqual( [] );
	} );

	it( 'nivell 2-3: mínim 2500 ms entre avisos del mateix origen', () => {
		const m = canviat();
		disp( m, 'arriba-2' ).retard_ms = 8000 + 2499;
		expect( errors( m ) ).toContain(
			'disparador arriba-2: només 2499 ms després de arriba-1 (mínim del nivell 2: 2500 ms)'
		);
		disp( m, 'arriba-2' ).retard_ms = 8000 + 2500;
		expect( errors( m ) ).toEqual( [] );
	} );

	it( 'nivell 1: mínim 4000 ms entre avisos del mateix origen', () => {
		const m = canviat();
		m.nivell = 1;
		disp( m, 'arriba-2' ).retard_ms = 8000 + 3999;
		expect( errors( m ) ).toContain(
			'disparador arriba-2: només 3999 ms després de arriba-1 (mínim del nivell 1: 4000 ms)'
		);
		disp( m, 'arriba-2' ).retard_ms = 8000 + 4000;
		expect( errors( m ) ).toEqual( [] );
	} );

	it( 'el so de notifica només pot ser missatge o alerta', () => {
		const m = factura();
		const e = disp( m, 'arriba-trampa' ).efectes.find(
			( x ) => x.tipus === 'notifica'
		);
		e.so = 'sirena';
		expect( errors( m ) ).toContain( 'notifica: so invàlid: sirena' );
	} );
} );

describe( "moment d'un avís", () => {
	it( 'segonsDeMs arrodoneix amunt a segons de joc', () => {
		expect( segonsDeMs( 8000 ) ).toBe( 8 );
		expect( segonsDeMs( 1 ) ).toBe( 1 );
		expect( segonsDeMs( 1500 ) ).toBe( 2 );
		expect( segonsDeMs( 0 ) ).toBe( 0 );
		expect( segonsDeMs( -5 ) ).toBe( 0 );
	} );

	it( 'desplacaPendents endarrereix tots els pendents el mateix', () => {
		const e = desplacaPendents( {
			temps: 30,
			pendents: [
				{ id: 'a', quan: 8, inici: true },
				{ id: 'b', quan: 22, inici: true },
				{ id: 'c', quan: 38, inici: true },
				{ id: 'd', quan: 31 },
			],
		} );
		expect( e.pendents.map( ( p ) => p.quan ) ).toEqual( [
			30 + MARGE,
			44 + MARGE,
			60 + MARGE,
			31,
		] );
	} );

	it( 'si ja surten prou tard, no els toca', () => {
		const e = { temps: 1, pendents: [ { id: 'a', quan: 8, inici: true } ] };
		expect( desplacaPendents( e ) ).toBe( e );
	} );
} );

// Partida cronometrada per tipus de missió: el jugador es queda a la intro
// `segonsIntro` segons i després la salta; el primer avís (notificació que no
// és de la guia) ha de sortir com a mínim a fi d'intro + MS_TRAS_INTRO.
const TIPUS = [
	[ 'correu PC', 'llissa-01-factura.json', 'posta' ],
	[ 'SMS mòbil', 'remei-01-paquet.json', 'missatges' ],
	[ 'Parla', 'remei-02-canviat.json', 'parla' ],
	[ 'web falsa (correu del banc)', 'llissa-02-banc.json', 'posta' ],
];

function primerAvis( m, app, segonsIntro ) {
	const pas = ( e, a ) => reductor( m, e, a );
	const avisos = ( x ) =>
		x.notificacions.filter(
			( n ) => n.app === app && n.titol !== m.personatge
		);
	let e = pas( estatInicial( m ), { tipus: 'DESBLOQUEJA' } );
	for ( let i = 0; i < segonsIntro; i++ ) {
		e = pas( e, { tipus: 'TICK' } );
	}
	expect( avisos( e ) ).toHaveLength( 0 );
	e = pas( e, { tipus: 'RESPOSTA', id: 'intro:salta' } );
	const fiIntro = e.temps;
	for ( let i = 0; i < 120 && ! avisos( e ).length; i++ ) {
		e = pas( e, { tipus: 'TICK' } );
	}
	return { fiIntro, temps: e.temps, avisos: avisos( e ) };
}

describe( 'partida cronometrada: primer avís ≥ intro + MS_TRAS_INTRO', () => {
	TIPUS.forEach( ( [ nom, fitxer, app ] ) => {
		it( `${ nom }: amb una intro llarga espera el marge`, () => {
			const r = primerAvis( carrega( fitxer ), app, 40 );
			expect( r.avisos.length ).toBeGreaterThan( 0 );
			expect( r.temps ).toBe( r.fiIntro + MARGE );
		} );

		it( `${ nom }: amb una intro curta manté el retard original`, () => {
			const m = carrega( fitxer );
			const r = primerAvis( m, app, 0 );
			const retard = Math.min(
				...m.disparadors
					.filter( ( d ) => d.quan.esdeveniment === 'inici' )
					.map( ( d ) => d.retard_ms )
			);
			expect( r.avisos.length ).toBeGreaterThan( 0 );
			expect( r.temps ).toBe( segonsDeMs( retard ) );
			expect( r.temps ).toBeGreaterThanOrEqual( r.fiIntro + MARGE );
		} );
	} );

	it( 'Parla: el ritme entre avisos es conserva després de la intro', () => {
		const m = canviat();
		const pas = ( e, a ) => reductor( m, e, a );
		let e = pas( estatInicial( m ), { tipus: 'DESBLOQUEJA' } );
		for ( let i = 0; i < 50; i++ ) {
			e = pas( e, { tipus: 'TICK' } );
		}
		e = pas( e, { tipus: 'RESPOSTA', id: 'intro:salta' } );
		const quan = e.pendents.map( ( p ) => p.quan - e.temps );
		expect( quan ).toEqual( [ MARGE, MARGE + 14, MARGE + 30 ] );
	} );
} );
