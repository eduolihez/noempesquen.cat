import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { FASE, estatInicial, reductor, puntuacio } from '../motor.js';

const carrega = ( nom ) =>
	JSON.parse(
		readFileSync(
			new URL( `../../../../../missions/ca/${ nom }.json`, import.meta.url ),
			'utf8'
		)
	);

describe( 'missió «El truc d’inversió» (v2)', () => {
	const p = carrega( 'llissa-03-inversio' );
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
	const inspeccionaLes = ( ids ) =>
		ids.map( ( senyal ) => ( { tipus: 'INSPECCIONA', senyal } ) );
	const delAnunci = [
		'sense_font',
		'famosa_recomana',
		'video_manipulat',
		'rendiment_garantit',
		'pressa',
	];
	const URL_FALSA = 'https://invest-rapid.top/carla';
	const denuncia = ( id = 'anunci-carla' ) =>
		evt( 'publicacio.denuncia', { id } );

	it( 'és una missió de PC', () => {
		expect( p.dispositiu ).toBe( 'pc' );
	} );

	it( 'camí segur: indicis de l’anunci i denunciar-lo donen 3 estrelles', () => {
		const e = aplica(
			joc(),
			{ tipus: 'LUPA' },
			...inspeccionaLes( delAnunci ),
			denuncia()
		);
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.opcio ).toBe( 'a' );
		expect( e.pescat ).toBe( false );
		const { maxim, estrelles } = puntuacio( p, e );
		expect( maxim ).toBe( delAnunci.length * 10 + 50 );
		expect( estrelles ).toBe( 3 );
	} );

	it( 'denunciar sense inspeccionar cap indici dona 1 estrella (comportament documentat)', () => {
		const e = aplica( joc(), denuncia() );
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.opcio ).toBe( 'a' );
		expect( e.pescat ).toBe( false );
		expect( puntuacio( p, e ).estrelles ).toBe( 1 );
	} );

	it( 'pescat: carregar invest-rapid.top i dipositar', () => {
		const e = aplica(
			joc(),
			evt( 'web.carrega', { url: URL_FALSA } ),
			evt( 'pagament.fes', { url: URL_FALSA, formulari: 'diposit' } )
		);
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.pescat ).toBe( true );
		expect( e.opcio ).toBeNull();
		expect( puntuacio( p, e ).estrelles ).toBe( 1 );
	} );

	it( 'triar l’opció c és la resposta incorrecta', () => {
		const e = aplica(
			joc(),
			{ tipus: 'RESPOSTA', id: 'decidir' },
			{ tipus: 'RESPOSTA', id: 'decisio:c' }
		);
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.opcio ).toBe( 'c' );
		expect( p.decisio.opcions.find( ( o ) => o.id === 'c' ).valor ).toBe(
			'incorrecta'
		);
		expect( puntuacio( p, e ).estrelles ).toBe( 1 );
	} );

	it( 'denunciar una altra publicació no decideix res', () => {
		const e = aplica( joc(), denuncia( 'una-altra' ) );
		expect( e.fase ).toBe( FASE.JOC );
		expect( e.opcio ).toBeNull();
		expect( e.pescat ).toBe( false );
	} );

	it( 'pagar en una altra web no pesca', () => {
		const e = aplica(
			joc(),
			evt( 'pagament.fes', {
				url: 'https://diaridelbarri.cat/',
				formulari: 'diposit',
			} )
		);
		expect( e.fase ).toBe( FASE.JOC );
		expect( e.pescat ).toBe( false );
	} );

	it( 'carregar invest-rapid.top fa parlar la guia (web_falsa)', () => {
		const abans = joc();
		const e = aplica( abans, evt( 'web.carrega', { url: URL_FALSA } ) );
		expect( e.executats ).toContain( 'web-falsa' );
		expect( e.xat.slice( abans.xat.length ) ).toContainEqual(
			expect.objectContaining( { de: 'guia', text: p.frases.web_falsa } )
		);
	} );
} );
