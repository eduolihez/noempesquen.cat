import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validaMissio } from '../valida.js';
import { ANCORES, ancoraDelPas } from '../ancores.js';
import { estatInicial, reductor, respostesRapides, FASE } from '../motor.js';

const MISSIONS = new URL( '../../../../../missions/', import.meta.url );
const crua = ( f ) => readFileSync( new URL( f, MISSIONS ), 'utf8' );
const llegeix = ( f ) => JSON.parse( crua( f ) );
const mon = llegeix( 'mon.json' );

// Àncores que existeixen al DOM de cada dispositiu (subconjunts d'ANCORES).
const COMUNES = [
	'lupa',
	'parla-xat',
	'parla-respostes',
	'decisio',
	'llista-correus',
	'correu-obert',
	'remitent',
	'enllacos',
	'adreca',
];
const DOM = {
	pc: [
		...COMUNES,
		'pantalla',
		'escriptori',
		'barra',
		'inici',
		'rellotge',
		'app-navegador',
		'app-parla',
		'finestra-navegador',
		'finestra-parla',
		'botons-finestra',
		'avis',
	],
	mobil: [
		...COMUNES,
		'bloqueig',
		'dock',
		'app-missatges',
		'app-parla-mobil',
		'banner',
		'centre-control',
		'nav-enrere',
		'nav-inici',
		'conversa',
		'barra-estat',
		'llista-sms',
	],
};

// Conceptes de la rúbrica U8: cada un ha de tenir un pas (per id o àncora).
const CONCEPTES = {
	pc: [
		'escriptori',
		'barra',
		'finestra',
		'botons-finestra',
		'parla',
		'respostes',
		'avis',
		'campana',
		'correu-nou',
		'assumpte',
		'remitent',
		'enllac',
		'adreca',
		'lupa',
		'indici-remitent',
		'indici-premi',
		'indici-enllac',
		'tanca',
		'obre',
		'decisio',
	],
	mobil: [
		'bloqueig',
		'inici',
		'dock',
		'banner',
		'centre-control',
		'missatges',
		'parla',
		'nav-enrere',
		'nav-inici',
		'lupa',
		'decisio',
	],
};

const MARQUES = [
	'Windows',
	'Microsoft',
	'Gmail',
	'Google',
	'Outlook',
	'WhatsApp',
	'Instagram',
	'Facebook',
	'Telegram',
	'Amazon',
	'Wallapop',
	'Bizum',
	'Santander',
	'BBVA',
	'CaixaBank',
	'Sabadell',
	'PayPal',
	'Apple',
	'iPhone',
	'Android',
	'Samsung',
	'Correos',
	'TikTok',
];

const FITXERS = { pc: 'tutorial-pc.json', mobil: 'tutorial-mobil.json' };

const obre = ( m ) =>
	reductor( m, estatInicial( m ), { tipus: 'DESBLOQUEJA' } );
const ev = ( m, e, nom, dades = {} ) =>
	reductor( m, e, { tipus: 'ESDEVENIMENT', nom, dades } );
const idPas = ( m, e ) => m.passos[ e.pas ]?.id;

/**
 * Avança amb «Entès» fins a arribar al pas indicat.
 *
 * @param {Object} m  Missió.
 * @param {Object} e  Estat.
 * @param {string} id Id del pas on s'ha d'aturar.
 * @return {Object} Estat al pas.
 */
function finsA( m, e, id ) {
	let actual = e;
	while ( idPas( m, actual ) !== id ) {
		const seg = reductor( m, actual, { tipus: 'PAS_SEGUENT' } );
		expect( seg.pas ).toBe( actual.pas + 1 );
		actual = seg;
	}
	return actual;
}

for ( const [ dispositiu, fitxer ] of Object.entries( FITXERS ) ) {
	describe( `${ fitxer }: contingut dels passos`, () => {
		const m = llegeix( fitxer );

		it( 'valida i no té intro', () => {
			expect( validaMissio( m, mon ) ).toEqual( [] );
			expect( m.intro ).toBeUndefined();
		} );

		it( 'cada àncora existeix al DOM del dispositiu', () => {
			const ancores = m.passos
				.map( ( p ) => p.ancora )
				.filter( ( a ) => a !== null );
			expect(
				ancores.filter( ( a ) => ! ANCORES.includes( a ) )
			).toEqual( [] );
			expect(
				ancores.filter( ( a ) => ! DOM[ dispositiu ].includes( a ) )
			).toEqual( [] );
		} );

		it( 'cobreix tots els conceptes de la rúbrica U8', () => {
			const claus = new Set(
				m.passos.flatMap( ( p ) => [ p.id, p.ancora ] )
			);
			expect(
				CONCEPTES[ dispositiu ].filter( ( c ) => ! claus.has( c ) )
			).toEqual( [] );
		} );

		it( 'títols ≤ 60 i textos ≤ 280 caràcters', () => {
			m.passos.forEach( ( p ) => {
				expect( p.titol.length ).toBeLessThanOrEqual( 60 );
				expect( p.text.length ).toBeLessThanOrEqual( 280 );
			} );
		} );

		it( 'cap disparador amb retard_ms ni guia-diu', () => {
			m.disparadors.forEach( ( d ) => {
				expect( d.retard_ms ).toBeUndefined();
				expect( d.quan.esdeveniment ).toBe( 'pas.entra' );
				d.efectes.forEach( ( f ) =>
					expect( f.tipus ).not.toBe( 'guia-diu' )
				);
			} );
		} );

		it( 'sense emojis ni marques reals', () => {
			const text = crua( fitxer );
			expect( /\p{Extended_Pictographic}/u.test( text ) ).toBe( false );
			expect(
				MARQUES.filter( ( k ) =>
					new RegExp( `\\b${ k }\\b`, 'i' ).test( text )
				)
			).toEqual( [] );
		} );

		it( 'PAS_SALTA des del pas 0 deixa la missió jugable i acabable', () => {
			let e = reductor( m, obre( m ), { tipus: 'PAS_SALTA' } );
			expect( e.pas ).toBe( m.passos.length );
			expect( e.fase ).toBe( FASE.JOC );
			const objectiu = dispositiu === 'pc' ? 'c1' : 's1';
			expect( e.visibles[ objectiu ] ).toBe( true );
			expect( e.notificacions.length ).toBe( 2 );
			for ( const s of m.senyals ) {
				e = reductor( m, e, { tipus: 'INSPECCIONA', senyal: s.id } );
			}
			expect( e.trobats ).toHaveLength( m.senyals.length );
			expect( respostesRapides( m, e ).map( ( r ) => r.id ) ).toEqual( [
				'decidir',
			] );
			e = reductor( m, e, { tipus: 'RESPOSTA', id: 'decidir' } );
			e = reductor( m, e, { tipus: 'RESPOSTA', id: 'decisio:a' } );
			expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		} );
	} );
}

const troba = ( m, e, senyal ) =>
	reductor( m, e, { tipus: 'INSPECCIONA', senyal } );
const decideix = ( m, e ) =>
	reductor( m, reductor( m, e, { tipus: 'RESPOSTA', id: 'decidir' } ), {
		tipus: 'RESPOSTA',
		id: 'decisio:a',
	} );

// Cap pas d'acció amb àncora `pantalla` (tot clicable, focus inútil).
describe( 'passos d’acció', () => {
	it.each( Object.values( FITXERS ) )( '%s: sense àncora pantalla', ( f ) => {
		const m = llegeix( f );
		expect(
			m.passos.filter(
				( p ) => p.continua !== 'boto' && p.ancora === 'pantalla'
			)
		).toEqual( [] );
	} );
} );

describe( 'tutorial-pc.json: recorregut amb el reductor', () => {
	const m = llegeix( 'tutorial-pc.json' );

	it( 'arriba al final amb «Entès» i els esdeveniments reals', () => {
		let e = obre( m );
		expect( e.notificacions ).toEqual( [] );
		e = finsA( m, e, 'tanca' );
		e = ev( m, e, 'finestra.tanca', { app: 'parla' } );
		expect( idPas( m, e ) ).toBe( 'tanca' );
		e = ev( m, e, 'finestra.tanca', { app: 'navegador' } );
		expect( idPas( m, e ) ).toBe( 'obre' );
		expect( e.notificacions ).toEqual( [] );
		e = ev( m, e, 'app.obre', { app: 'navegador' } );
		// L'avís de la guia surt en entrar al pas que el demana.
		expect( idPas( m, e ) ).toBe( 'avis' );
		expect( e.notificacions.map( ( n ) => n.app ) ).toEqual( [ 'parla' ] );
		e = ev( m, e, 'app.obre', { app: 'parla' } );
		e = finsA( m, e, 'correu-nou' );
		expect( e.visibles.c1 ).toBe( true );
		expect( e.notificacions.at( -1 ).app ).toBe( 'posta' );
		e = ev( m, e, 'app.obre', { app: 'navegador' } );
		e = finsA( m, e, 'obre-correu' );
		e = ev( m, e, 'missatge.obre', { app: 'posta', id: 'c1' } );
		e = finsA( m, e, 'lupa' );
		e = reductor( m, e, { tipus: 'LUPA' } );
		expect( idPas( m, e ) ).toBe( 'indici-remitent' );
		// Un indici fora d'ordre no avança el pas.
		e = troba( m, e, 'premi' );
		expect( idPas( m, e ) ).toBe( 'indici-remitent' );
		e = troba( m, e, 'remitent' );
		// El premi ja trobat: el seu pas queda fet i passa a l'enllaç.
		expect( idPas( m, e ) ).toBe( 'indici-enllac' );
		e = troba( m, e, 'enllac' );
		expect( idPas( m, e ) ).toBe( 'decisio' );
		e = decideix( m, e );
		expect( e.pas ).toBe( m.passos.length );
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
	} );

	it( 'si la lupa ja era encesa, el pas de la lupa queda fet', () => {
		let e = obre( m );
		e = reductor( m, e, { tipus: 'LUPA' } );
		e = { ...e, pas: m.passos.findIndex( ( p ) => p.id === 'adreca' ) };
		e = reductor( m, e, { tipus: 'PAS_SEGUENT' } );
		expect( idPas( m, e ) ).toBe( 'indici-remitent' );
	} );
} );

describe( 'tutorial-mobil.json: recorregut amb el reductor', () => {
	const m = llegeix( 'tutorial-mobil.json' );

	it( 'arriba al final amb «Entès» i els esdeveniments reals', () => {
		let e = obre( m );
		e = finsA( m, e, 'dock' );
		e = ev( m, e, 'app.obre', { app: 'navegador' } );
		e = ev( m, e, 'nav.inici' );
		expect( idPas( m, e ) ).toBe( 'nav-enrere' );
		e = ev( m, e, 'nav.enrere' );
		e = ev( m, e, 'nav.inici' );
		e = finsA( m, e, 'parla' );
		// L'avís de la Remei fa que Parla s'obri al seu xat.
		expect( e.notificacions.map( ( n ) => n.app ) ).toEqual( [ 'parla' ] );
		e = ev( m, e, 'app.obre', { app: 'parla' } );
		expect( e.visibles.s1 ).toBeUndefined();
		e = finsA( m, e, 'banner' );
		expect( e.visibles.s1 ).toBe( true );
		expect( e.notificacions.at( -1 ).app ).toBe( 'missatges' );
		e = ev( m, e, 'app.obre', { app: 'missatges' } );
		e = ev( m, e, 'missatge.obre', { app: 'missatges', id: 's1' } );
		e = reductor( m, e, { tipus: 'LUPA' } );
		e = troba( m, e, 'remitent' );
		e = troba( m, e, 'premi' );
		expect( idPas( m, e ) ).toBe( 'obre-centre' );
		e = ev( m, e, 'centre.obre' );
		e = ev( m, e, 'app.obre', { app: 'parla' } );
		expect( idPas( m, e ) ).toBe( 'decisio' );
		e = decideix( m, e );
		expect( e.pas ).toBe( m.passos.length );
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
	} );
} );

// Els avisos no caduquen mentre el pas en curs hi apunta (Toast i Banner
// aturen el comptador quan ancoraDelPas retorna la seva clau).
describe( 'ancoraDelPas', () => {
	it.each( [
		[ 'tutorial-pc.json', [ 'avis', 'correu-nou' ], 'avis' ],
		[ 'tutorial-mobil.json', [ 'banner' ], 'banner' ],
	] )( '%s: els passos d’avís hi apunten', ( f, ids, clau ) => {
		const m = llegeix( f );
		for ( const id of ids ) {
			const pas = m.passos.findIndex( ( p ) => p.id === id );
			expect( ancoraDelPas( m, { pas } ) ).toBe( clau );
		}
	} );

	it( 'null fora del tutorial o quan s’ha acabat', () => {
		const m = llegeix( 'tutorial-pc.json' );
		expect( ancoraDelPas( m, { pas: m.passos.length } ) ).toBeNull();
		expect( ancoraDelPas( { senyals: [] }, { pas: 0 } ) ).toBeNull();
		expect( ancoraDelPas( m, { pas: 0 } ) ).toBeNull();
	} );
} );
