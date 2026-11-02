import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validaMissio } from '../valida.js';
import { ANCORES } from '../ancores.js';
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
		'indicis',
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

describe( 'tutorial-pc.json: recorregut amb el reductor', () => {
	const m = llegeix( 'tutorial-pc.json' );

	it( 'arriba al final amb «Entès» i els esdeveniments reals', () => {
		let e = obre( m );
		expect( e.pas ).toBe( 0 );
		expect( e.notificacions ).toEqual( [] );
		e = finsA( m, e, 'tanca-obre' );
		// L'obertura automàtica no compta: cal el clic a la barra.
		e = ev( m, e, 'app.obre', { app: 'parla' } );
		expect( idPas( m, e ) ).toBe( 'tanca-obre' );
		e = ev( m, e, 'app.obre', { app: 'navegador' } );
		// L'avís de la guia surt en entrar al pas, no abans.
		expect( idPas( m, e ) ).toBe( 'avis' );
		expect( e.notificacions.map( ( n ) => n.app ) ).toEqual( [ 'parla' ] );
		expect( e.visibles.c1 ).toBeUndefined();
		e = finsA( m, e, 'obre-avis' );
		e = ev( m, e, 'app.obre', { app: 'parla' } );
		e = finsA( m, e, 'correu-nou' );
		expect( e.visibles.c1 ).toBe( true );
		expect(
			e.notificacions.some(
				( n ) => n.app === 'posta' && n.titol === 'Premis Fantasia'
			)
		).toBe( true );
		e = ev( m, e, 'app.obre', { app: 'navegador' } );
		expect( idPas( m, e ) ).toBe( 'obre-correu' );
		e = ev( m, e, 'missatge.obre', { app: 'posta', id: 'c1' } );
		e = finsA( m, e, 'lupa' );
		e = reductor( m, e, { tipus: 'LUPA' } );
		e = finsA( m, e, 'decisio' );
		e = reductor( m, e, { tipus: 'PAS_SEGUENT' } );
		expect( e.pas ).toBe( m.passos.length );
		expect( e.xat ).toEqual( [] );
	} );
} );

describe( 'tutorial-mobil.json: recorregut amb el reductor', () => {
	const m = llegeix( 'tutorial-mobil.json' );

	it( 'arriba al final amb «Entès» i els esdeveniments reals', () => {
		let e = obre( m );
		e = finsA( m, e, 'obre-parla' );
		// L'avís de la Remei fa que Parla s'obri al seu xat.
		expect( e.notificacions.map( ( n ) => n.app ) ).toEqual( [ 'parla' ] );
		e = ev( m, e, 'app.obre', { app: 'missatges' } );
		expect( idPas( m, e ) ).toBe( 'obre-parla' );
		e = ev( m, e, 'app.obre', { app: 'parla' } );
		expect( e.visibles.s1 ).toBeUndefined();
		e = finsA( m, e, 'banner' );
		expect( e.visibles.s1 ).toBe( true );
		expect(
			e.notificacions.some(
				( n ) => n.app === 'missatges' && n.titol === 'Premis Fantasia'
			)
		).toBe( true );
		e = finsA( m, e, 'decisio' );
		e = reductor( m, e, { tipus: 'PAS_SEGUENT' } );
		expect( e.pas ).toBe( m.passos.length );
		// Després de la guia: SMS, lupa, indicis i decisió.
		e = ev( m, e, 'missatge.obre', { app: 'missatges', id: 's1' } );
		e = reductor( m, e, { tipus: 'LUPA' } );
		for ( const s of m.senyals ) {
			e = reductor( m, e, { tipus: 'INSPECCIONA', senyal: s.id } );
		}
		e = reductor( m, e, { tipus: 'RESPOSTA', id: 'decidir' } );
		e = reductor( m, e, { tipus: 'RESPOSTA', id: 'decisio:a' } );
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
	} );
} );
