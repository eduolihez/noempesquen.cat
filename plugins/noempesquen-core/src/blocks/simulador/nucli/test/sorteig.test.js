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

describe( 'missió «Has guanyat un sorteig!» (v2)', () => {
	const p = carrega( 'remei-03-sorteig' );
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
	const dePublicacio = [
		'compte_imitat',
		'premi',
		'urgencia',
		'no_has_participat',
	];
	const deWeb = p.senyals
		.filter( ( s ) => s.requereix === 'web-falsa' )
		.map( ( s ) => s.id );
	const URL_FALSA = 'https://sorteig-calroig.top/premi';

	it( 'és vàlida (amb el món)', () => {
		expect( validaMissio( p, mon ) ).toEqual( [] );
		expect( p.dispositiu ).toBe( 'mobil' );
	} );

	it( 'camí perfecte: indicis de la publicació i denúncia donen 3 estrelles', () => {
		const e = aplica(
			ambTot(),
			{ tipus: 'LUPA' },
			...inspeccionaLes( dePublicacio ),
			evt( 'publicacio.denuncia', { id: 'sorteig-fals' } )
		);
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.opcio ).toBe( 'a' );
		expect( e.pescat ).toBe( false );
		expect( puntuacio( p, e ).estrelles ).toBe( 3 );
	} );

	it( 'pescat: carregar la web falsa i pagar', () => {
		const e = aplica(
			ambTot(),
			evt( 'web.carrega', { url: URL_FALSA } ),
			evt( 'pagament.fes', { url: URL_FALSA, formulari: 'premi' } )
		);
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.pescat ).toBe( true );
		expect( e.opcio ).toBeNull();
		expect( puntuacio( p, e ).estrelles ).toBe( 1 );
	} );

	it( 'denunciar la botiga de veritat no decideix res', () => {
		const e = aplica(
			ambTot(),
			evt( 'publicacio.denuncia', { id: 'botiga-real' } )
		);
		expect( e.fase ).toBe( FASE.JOC );
		expect( e.opcio ).toBeNull();
		expect( e.pescat ).toBe( false );
	} );

	it( 'les senyals de la web falsa no compten fins que es visita', () => {
		const sensePassar = aplica(
			ambTot(),
			{ tipus: 'LUPA' },
			...inspeccionaLes( dePublicacio ),
			evt( 'publicacio.denuncia', { id: 'sorteig-fals' } )
		);
		const { maxim, estrelles } = puntuacio( p, sensePassar );
		expect( maxim ).toBe( dePublicacio.length * 10 + 50 );
		expect( estrelles ).toBe( 3 );
	} );

	it( 'visitar la web i no inspeccionar-ne les 3 senyals dona 2 estrelles', () => {
		expect( deWeb ).toHaveLength( 3 );
		const e = aplica(
			ambTot(),
			evt( 'web.carrega', { url: URL_FALSA } ),
			{ tipus: 'LUPA' },
			...inspeccionaLes( dePublicacio ),
			evt( 'publicacio.denuncia', { id: 'sorteig-fals' } )
		);
		expect( e.opcio ).toBe( 'a' );
		expect( e.pescat ).toBe( false );
		expect( puntuacio( p, e ).maxim ).toBe(
			( dePublicacio.length + deWeb.length ) * 10 + 50
		);
		expect( puntuacio( p, e ).estrelles ).toBe( 2 );
	} );

	it( 'visitar la web i inspeccionar-ho tot torna a donar 3 estrelles', () => {
		const e = aplica(
			ambTot(),
			evt( 'web.carrega', { url: URL_FALSA } ),
			{ tipus: 'LUPA' },
			...inspeccionaLes( [ ...dePublicacio, ...deWeb ] ),
			evt( 'publicacio.denuncia', { id: 'sorteig-fals' } )
		);
		expect( puntuacio( p, e ).estrelles ).toBe( 3 );
	} );
} );
