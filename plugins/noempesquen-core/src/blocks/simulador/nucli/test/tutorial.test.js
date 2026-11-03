import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { validaMissio } from '../valida.js';
import { agrupaMissions, tutorialFet } from '../selector.js';
import { puntuacio, estatInicial } from '../motor.js';
import { fusionaProgres } from '../sincro.js';
import { llegeixProgres } from '../progres.js';
import { registraResultat } from '../previsualitzacio.js';
import { construeixResultat } from '../../simulador/estadistiques.js';

const MISSIONS = new URL( '../../../../../missions/', import.meta.url );
const llegeix = ( f ) =>
	JSON.parse( readFileSync( new URL( f, MISSIONS ), 'utf8' ) );
const mon = llegeix( 'mon.json' );

const tutorial = () => ( {
	versio: 2,
	id: 'tutorial-pc',
	tutorial: true,
	titol: 'Aprèn a jugar',
	dispositiu: 'pc',
	personatge: 'llissa',
	intro: [ 'Hola! Et mostro com funciona tot.' ],
	senyals: [],
	decisio: {
		pregunta: 'Ho tens clar?',
		opcions: [
			{
				id: 'a',
				text: 'Ja ho tinc clar',
				valor: 'correcta',
				resposta: 'Molt bé!',
			},
		],
	},
	tancament: { aprenentatges: [], consell: 'Juga una missió.' },
} );

describe( 'validació de tutorials', () => {
	it( 'un tutorial mínim és vàlid (sense camí de pescat)', () => {
		expect( validaMissio( tutorial(), mon ) ).toEqual( [] );
	} );

	it( 'sense decisió és invàlid', () => {
		const m = tutorial();
		delete m.decisio;
		const errors = validaMissio( m, mon );
		expect( errors ).toContain( 'cap opció correcta' );
		expect( errors ).toContain( 'tutorial: cal una sola opció correcta' );
	} );

	it( 'amb més d’una opció o una opció no correcta és invàlid', () => {
		const m = tutorial();
		m.decisio.opcions.push( {
			id: 'b',
			text: 'No',
			valor: 'incorrecta',
		} );
		expect( validaMissio( m, mon ) ).toContain(
			'tutorial: cal una sola opció correcta'
		);
		const n = tutorial();
		n.decisio.opcions[ 0 ].valor = 'parcial';
		expect( validaMissio( n, mon ) ).toContain(
			'tutorial: cal una sola opció correcta'
		);
	} );

	it( 'senyals ha de ser una llista', () => {
		const m = tutorial();
		delete m.senyals;
		expect( validaMissio( m, mon ) ).toContain(
			'tutorial: senyals ha de ser una llista'
		);
	} );

	it( 'tutorial ha de ser booleà', () => {
		const m = tutorial();
		m.tutorial = 'sí';
		expect( validaMissio( m, mon ) ).toContain( 'tutorial invàlid' );
	} );

	it( 'una missió normal sense pescat continua sent invàlida', () => {
		const m = tutorial();
		delete m.tutorial;
		expect( validaMissio( m, mon ) ).toContain( 'cap camí de pescat' );
		m.tutorial = false;
		expect( validaMissio( m, mon ) ).toContain( 'cap camí de pescat' );
	} );

	it( 'les missions reals no canvien', () => {
		const real = llegeix( 'llissa-01-factura.json' );
		expect( validaMissio( real, mon ) ).toEqual( [] );
	} );
} );

describe( 'un tutorial no puntua ni s’envia', () => {
	it( 'puntuacio fixa sense senyals', () => {
		const m = tutorial();
		expect( puntuacio( m, estatInicial( m ) ) ).toEqual( {
			punts: 0,
			maxim: 0,
			estrelles: 1,
		} );
	} );

	it( 'construeixResultat torna null', () => {
		const m = tutorial();
		expect(
			construeixResultat( m, estatInicial( m ), { estrelles: 1 } )
		).toBeNull();
	} );
} );

describe( 'progrés amb tutorials', () => {
	const mem = () => {
		const d = {};
		return {
			getItem: ( k ) => ( k in d ? d[ k ] : null ),
			setItem: ( k, v ) => {
				d[ k ] = v;
			},
			removeItem: ( k ) => delete d[ k ],
		};
	};

	it( 'fer el tutorial el marca com a fet i es conserva', () => {
		const s = mem();
		const nou = registraResultat( s, {}, tutorial(), 1 );
		expect( nou ).toEqual( { 'tutorial-pc': 1 } );
		expect( llegeixProgres( s ) ).toEqual( { 'tutorial-pc': 1 } );
		expect( tutorialFet( nou, 'tutorial-pc' ) ).toBe( true );
	} );

	it( 'progrés vell sense la clau: no fet', () => {
		expect( tutorialFet( { 'llissa-01': 2 }, 'tutorial-pc' ) ).toBe(
			false
		);
		expect( tutorialFet( null, 'tutorial-pc' ) ).toBe( false );
	} );

	it( 'la fusió per màxim conserva el tutorial fet', () => {
		expect(
			fusionaProgres( { 'tutorial-pc': 1 }, { 'llissa-01': 3 } )
		).toEqual( { 'tutorial-pc': 1, 'llissa-01': 3 } );
	} );
} );

describe( 'agrupaMissions amb tutorials', () => {
	const M = [
		{ id: 'a', dispositiu: 'pc' },
		{ id: 'b', dispositiu: 'mobil' },
		{ id: 'tutorial-mobil', dispositiu: 'mobil', tutorial: true },
		{ id: 'tutorial-pc', dispositiu: 'pc', tutorial: true },
	];
	const ids = ( l ) => l.map( ( m ) => m.id );

	it( 'primer ús: recomana el tutorial del dispositiu', () => {
		const g = agrupaMissions( M, 'mobil', {} );
		expect( g.recomanada.id ).toBe( 'tutorial-mobil' );
		expect( ids( g.tutorials ) ).toEqual( [
			'tutorial-mobil',
			'tutorial-pc',
		] );
		expect( ids( g.principals ) ).toEqual( [ 'b' ] );
		expect( ids( g.altres ) ).toEqual( [ 'a' ] );
		expect( agrupaMissions( M, 'pc', {} ).recomanada.id ).toBe(
			'tutorial-pc'
		);
	} );

	it( 'tutorial fet: ja no recomana tutorials', () => {
		const g = agrupaMissions( M, 'mobil', { 'tutorial-mobil': 1 } );
		expect( g.recomanada.id ).toBe( 'b' );
		// També si s'ha fet el de l'altre dispositiu.
		expect(
			agrupaMissions( M, 'mobil', { 'tutorial-pc': 1 } ).recomanada.id
		).toBe( 'b' );
	} );

	it( 'saltat: amb una missió jugada no es recomana el tutorial', () => {
		expect( agrupaMissions( M, 'mobil', { a: 2 } ).recomanada.id ).toBe(
			'b'
		);
	} );

	it( 'sense tutorial del dispositiu: comportament normal', () => {
		const sense = M.filter( ( m ) => m.id !== 'tutorial-mobil' );
		expect( agrupaMissions( sense, 'mobil', {} ).recomanada.id ).toBe(
			'b'
		);
	} );

	it( 'el resum no compta els tutorials', () => {
		expect(
			agrupaMissions( M, 'pc', { 'tutorial-pc': 1, a: 3 } ).resum
		).toEqual( { jugades: 1, total: 2, estrelles: 3, max: 6 } );
	} );
} );

describe( 'tutorials inclosos (tutorial-pc i tutorial-mobil)', () => {
	const FITXERS = {
		pc: 'tutorial-pc.json',
		mobil: 'tutorial-mobil.json',
	};

	// El recorregut pas a pas és a tutorial-passos.test.js.
	for ( const [ dispositiu, fitxer ] of Object.entries( FITXERS ) ) {
		describe( fitxer, () => {
			const m = llegeix( fitxer );

			it( 'valida, és tutorial i del seu dispositiu', () => {
				expect( validaMissio( m, mon ) ).toEqual( [] );
				expect( m.tutorial ).toBe( true );
				expect( m.dispositiu ).toBe( dispositiu );
				expect( m.id ).toBe( `tutorial-${ dispositiu }` );
				expect( m.decisio.opcions ).toHaveLength( 1 );
				expect( m.decisio.opcions[ 0 ].valor ).toBe( 'correcta' );
			} );
		} );
	}

	it( 'el selector els posa primer', () => {
		const fitxers = readdirSync( MISSIONS ).filter(
			( f ) =>
				f.endsWith( '.json' ) &&
				! [ 'mon.json', 'plantilla-missio.json' ].includes( f )
		);
		// 10 missions + 2 tutorials.
		expect( fitxers ).toHaveLength( 12 );
		const totes = fitxers.map( llegeix );
		const g = agrupaMissions( totes, 'mobil', {} );
		expect( g.recomanada.id ).toBe( 'tutorial-mobil' );
		expect( g.tutorials.map( ( t ) => t.id ) ).toEqual( [
			'tutorial-mobil',
			'tutorial-pc',
		] );
	} );
} );
