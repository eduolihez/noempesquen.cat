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

describe( 'missió «Compro la teva bici» (v2)', () => {
	const p = carrega( 'remei-05-comprador' );
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
	const inspeccionaLes = ( ids ) =>
		ids.map( ( senyal ) => ( { tipus: 'INSPECCIONA', senyal } ) );
	const delXat = [ 'no_vol_veure', 'cobra_fora', 'pressa' ];
	const deWeb = p.senyals
		.filter( ( s ) => s.requereix === 'web-falsa' )
		.map( ( s ) => s.id );
	const URL_FALSA = 'https://revenda-cobra.com/cobrament';

	it( 'és vàlida (amb el món)', () => {
		expect( validaMissio( p, mon ) ).toEqual( [] );
		expect( p.dispositiu ).toBe( 'mobil' );
	} );

	it( 'llissa-03-inversio també és vàlida (amb el món)', () => {
		expect( validaMissio( carrega( 'llissa-03-inversio' ), mon ) ).toEqual(
			[]
		);
	} );

	it( 'els missatges arriben amb el temps', () => {
		const e = ambTot();
		for ( const id of [ 'venda-0', 'venda-1', 'venda-2', 'venda-3' ] ) {
			expect( e.visibles[ id ] ).toBeTruthy();
		}
	} );

	it( 'camí segur: indicis del xat i bloquejar el comprador donen 3 estrelles', () => {
		const e = aplica(
			ambTot(),
			{ tipus: 'LUPA' },
			...inspeccionaLes( delXat ),
			evt( 'contacte.bloqueja', { id: 'comprador' } )
		);
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.opcio ).toBe( 'a' );
		expect( e.pescat ).toBe( false );
		const { maxim, estrelles } = puntuacio( p, e );
		expect( maxim ).toBe( delXat.length * 10 + 50 );
		expect( estrelles ).toBe( 3 );
	} );

	it( 'pescat: carregar la web falsa i «cobrar»', () => {
		const e = aplica(
			ambTot(),
			evt( 'web.carrega', { url: URL_FALSA } ),
			evt( 'pagament.fes', { url: URL_FALSA, formulari: 'cobrament' } )
		);
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.pescat ).toBe( true );
		expect( e.opcio ).toBeNull();
		expect( puntuacio( p, e ).estrelles ).toBe( 1 );
	} );

	it( 'triar l’opció c és la resposta incorrecta', () => {
		const e = aplica(
			ambTot(),
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

	it( 'pagar en una altra web no pesca', () => {
		const e = aplica(
			ambTot(),
			evt( 'pagament.fes', {
				url: 'https://revenda.cat/pagament',
				formulari: 'cobrament',
			} )
		);
		expect( e.fase ).toBe( FASE.JOC );
		expect( e.pescat ).toBe( false );
	} );

	it( 'bloquejar un altre contacte no decideix res', () => {
		const e = aplica(
			ambTot(),
			evt( 'contacte.bloqueja', { id: 'algu-altre' } )
		);
		expect( e.fase ).toBe( FASE.JOC );
		expect( e.opcio ).toBeNull();
		expect( e.pescat ).toBe( false );
	} );

	it( 'carregar revenda-cobra.com fa parlar la guia (web_falsa)', () => {
		const abans = ambTot();
		const e = aplica( abans, evt( 'web.carrega', { url: URL_FALSA } ) );
		expect( e.executats ).toContain( 'web-falsa' );
		expect( e.xat.slice( abans.xat.length ) ).toContainEqual(
			expect.objectContaining( { de: 'guia', text: p.frases.web_falsa } )
		);
	} );

	it( 'visitar la web i inspeccionar-ho tot dona 3 estrelles', () => {
		expect( deWeb ).toHaveLength( 3 );
		const e = aplica(
			ambTot(),
			evt( 'web.carrega', { url: URL_FALSA } ),
			{ tipus: 'LUPA' },
			...inspeccionaLes( [ ...delXat, ...deWeb ] ),
			evt( 'contacte.bloqueja', { id: 'comprador' } )
		);
		expect( e.opcio ).toBe( 'a' );
		expect( puntuacio( p, e ).maxim ).toBe(
			( delXat.length + deWeb.length ) * 10 + 50
		);
		expect( puntuacio( p, e ).estrelles ).toBe( 3 );
	} );
} );
