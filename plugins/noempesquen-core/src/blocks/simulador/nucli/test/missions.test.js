import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { combinaMissions, diagnostica } from '../missions.js';
import { validaMissio } from '../valida.js';
import {
	FASE,
	estatInicial,
	reductor,
	respostesRapides,
	puntuacio,
} from '../motor.js';

const ruta = new URL(
	'../../../../../missions/ca/llissa-01-factura.json',
	import.meta.url
);
const factura = JSON.parse( readFileSync( ruta, 'utf8' ) );
const v2 = ( id, extra = {} ) => ( {
	...structuredClone( factura ),
	id,
	...extra,
} );
it.each( [ 'ca', 'es' ] )(
	'totes les missions incloses (%s) validen amb el seu mon',
	( idioma ) => {
		const dir = new URL(
			`../../../../../missions/${ idioma }/`,
			import.meta.url
		);
		const mon = JSON.parse(
			readFileSync( new URL( 'mon.json', dir ), 'utf8' )
		);
		const fitxers = readdirSync( dir ).filter(
			( f ) => f.endsWith( '.json' ) && f !== 'mon.json'
		);
		expect( fitxers.length ).toBe( 12 );
		const errors = [];
		for ( const f of fitxers ) {
			const m = JSON.parse( readFileSync( new URL( f, dir ), 'utf8' ) );
			errors.push(
				...validaMissio( m, mon ).map( ( e ) => `${ f }: ${ e }` )
			);
		}
		expect( errors ).toEqual( [] );
	}
);
const v1 = { id: 'antiga', versio: 1, titol: 'Antiga' };

describe( 'combinaMissions', () => {
	it( 'una remota v1 o invàlida no fa desaparèixer les incloses', () => {
		const incloses = [ v2( 'a' ), v1 ];
		const res = combinaMissions( incloses, [
			v1,
			{ id: 'a', versio: 2 },
			null,
			undefined,
			'x',
		] );
		expect( res ).toEqual( incloses );
	} );

	it( 'una remota v2 vàlida amb el mateix id substitueix la inclosa', () => {
		const incloses = [ v2( 'a' ), v2( 'b' ) ];
		const remota = v2( 'a', { titol: 'Nou títol' } );
		const res = combinaMissions( incloses, [ remota ] );
		expect( res.map( ( m ) => m.id ) ).toEqual( [ 'a', 'b' ] );
		expect( res[ 0 ].titol ).toBe( 'Nou títol' );
	} );

	it( "una remota nova s'afegeix al final", () => {
		const incloses = [ v2( 'a' ) ];
		const res = combinaMissions( incloses, [ v2( 'n1' ), v2( 'n2' ) ] );
		expect( res.map( ( m ) => m.id ) ).toEqual( [ 'a', 'n1', 'n2' ] );
	} );

	it( 'no muta les entrades i tolera remotes no array', () => {
		const incloses = [ v2( 'a' ) ];
		const copia = structuredClone( incloses );
		combinaMissions( incloses, [ v2( 'n' ) ] );
		expect( incloses ).toEqual( copia );
		expect( combinaMissions( incloses, null ) ).toEqual( incloses );
	} );
} );

const carrega = ( nom ) =>
	JSON.parse(
		readFileSync(
			new URL( `../../../../../missions/ca/${ nom }.json`, import.meta.url ),
			'utf8'
		)
	);

describe( 'missió «El paquet retingut» (v2)', () => {
	const p = carrega( 'remei-01-paquet' );
	const mon = carrega( 'mon' );
	const aplica = ( estat, ...accions ) =>
		accions.reduce( ( e, a ) => reductor( p, e, a ), estat );
	const evt = ( nom, dades = {} ) => ( {
		tipus: 'ESDEVENIMENT',
		nom,
		dades,
	} );
	// Desbloqueja, salta la intro i deixa passar el retard del SMS trampa.
	const ambTrampa = () =>
		aplica(
			estatInicial( p ),
			{ tipus: 'DESBLOQUEJA' },
			{ tipus: 'RESPOSTA', id: 'intro:salta' },
			{ tipus: 'TICK', segons: 10 }
		);

	it( 'és vàlida', () => {
		expect( validaMissio( p ) ).toEqual( [] );
		expect( p.dispositiu ).toBe( 'mobil' );
	} );

	it( 'el SMS trampa és ocult i arriba amb notificació després del desbloqueig', () => {
		const abans = aplica( estatInicial( p ), { tipus: 'DESBLOQUEJA' } );
		expect( abans.visibles.s2 ).toBeUndefined();
		const e = ambTrampa();
		expect( e.visibles.s2 ).toBe( true );
		expect( e.notificacions.some( ( n ) => n.app === 'missatges' ) ).toBe(
			true
		);
	} );

	it( 'mon.json té els contactes i els fils que la missió necessita', () => {
		const ids = mon.contactes.map( ( c ) => c.id );
		expect( ids ).toEqual(
			expect.arrayContaining( [ 'remei', 'numero_desconegut' ] )
		);
		expect( mon.missatges.fils.length ).toBeGreaterThanOrEqual( 4 );
		const xats = mon.parla.xats.map( ( x ) => x.nom );
		expect( xats ).toContain( 'Pau' );
	} );

	it( 'partida perfecta: tots els indicis i bloquejar el número = 3 estrelles', () => {
		let e = ambTrampa();
		e = aplica(
			e,
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

	it( 'esborrar i bloquejar, en qualsevol ordre, arriba a c', () => {
		const esborra = evt( 'missatge.esborra', {
			app: 'missatges',
			id: 's2',
		} );
		const bloqueja = evt( 'contacte.bloqueja', {
			id: 'numero_desconegut',
		} );
		const primer = aplica( ambTrampa(), esborra );
		expect( primer.fase ).toBe( FASE.JOC );
		expect( primer.xat.at( -1 ).text ).toBe( p.frases.esborra_sol );
		expect( aplica( primer, bloqueja ).opcio ).toBe( 'c' );
		expect( aplica( ambTrampa(), bloqueja, esborra ).opcio ).toBe( 'c' );
	} );

	it( 'camí de pescat: obrir la web és avís; enviar el formulari és pescat', () => {
		let e = aplica(
			ambTrampa(),
			evt( 'enllac.obre', { url: 'https://enviat-entrega.top/c/4471' } ),
			evt( 'web.carrega', { url: 'https://enviat-entrega.top/c/4471' } )
		);
		expect( e.fase ).toBe( FASE.JOC );
		expect( e.xat.at( -1 ).text ).toBe( p.frases.web_falsa );
		e = aplica(
			e,
			evt( 'formulari.envia', {
				url: 'https://enviat-entrega.top/c/4471',
				formulari: 'targeta',
			} )
		);
		expect( e.pescat ).toBe( true );
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( puntuacio( p, e ).estrelles ).toBe( 1 );
	} );

	it( 'cap opció és inabastable: el món i el xat porten a cada una', () => {
		const perEsdeveniment = {
			b: evt( 'missatge.respon', { app: 'missatges', id: 's2' } ),
			c: evt( 'contacte.bloqueja', { id: 'numero_desconegut' } ),
			d: evt( 'missatge.reenvia', {
				app: 'missatges',
				id: 's2',
				a: 'familia',
			} ),
		};
		// «a» és el pescat: el motor la tria en pescar, no per decideix.
		const pescat = aplica(
			ambTrampa(),
			evt( 'formulari.envia', { url: 'enviat-entrega.top' } )
		);
		expect( pescat.pescat ).toBe( true );
		Object.entries( perEsdeveniment ).forEach( ( [ id, esdeveniment ] ) => {
			expect( aplica( ambTrampa(), esdeveniment ).opcio ).toBe( id );
		} );
		p.decisio.opcions.forEach( ( o ) => {
			// Via xat: també es pot triar qualsevol opció.
			let e = aplica( ambTrampa(), { tipus: 'RESPOSTA', id: 'decidir' } );
			expect( respostesRapides( p, e ).map( ( r ) => r.id ) ).toContain(
				`decisio:${ o.id }`
			);
			e = aplica( e, { tipus: 'RESPOSTA', id: `decisio:${ o.id }` } );
			expect( e.opcio ).toBe( o.id );
		} );
	} );
} );

describe( 'diagnostica', () => {
	it( 'llista les remotes descartades amb els seus errors', () => {
		const res = diagnostica( [ v2( 'bona' ), v1, null, 5 ] );
		expect( res.map( ( d ) => d.id ) ).toEqual( [ 'antiga', null, null ] );
		expect( res[ 0 ].errors ).toContain( 'versio no suportada' );
		expect( res[ 1 ].errors ).toEqual( [ 'no és un objecte' ] );
	} );

	it( 'no llança amb remotes que fan petar el validador', () => {
		const trencada = v2( 'trencada' );
		Object.defineProperty( trencada, 'intro', {
			get() {
				throw new Error( 'x' );
			},
		} );
		expect( diagnostica( [ trencada ] ) ).toEqual( [
			{ id: 'trencada', errors: [ 'estructura no vàlida' ] },
		] );
		const base = [ v2( 'a' ) ];
		expect( combinaMissions( base, [ trencada ] ) ).toEqual( base );
	} );

	it( 'torna [] si tot és vàlid o no hi ha remotes', () => {
		expect( diagnostica( [ v2( 'bona' ) ] ) ).toEqual( [] );
		expect( diagnostica( null ) ).toEqual( [] );
	} );
} );
