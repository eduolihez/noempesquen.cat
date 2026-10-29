import { describe, expect, it } from 'vitest';
import { ESTAT_PILA, appActiva, pilaReductor } from '../pila';

const fes = ( ...accions ) => accions.reduce( pilaReductor, ESTAT_PILA );

describe( 'pila del mòbil', () => {
	it( 'comença a la pantalla d’inici', () => {
		expect( appActiva( ESTAT_PILA ) ).toBeNull();
	} );

	it( 'obre apps a dalt de la pila amb claus diferents', () => {
		const p = fes(
			{ tipus: 'OBRE', app: 'parla' },
			{ tipus: 'OBRE', app: 'navegador', dades: { url: 'x' } }
		);
		expect( p.apps.map( ( a ) => a.app ) ).toEqual( [
			'parla',
			'navegador',
		] );
		expect( appActiva( p ) ).toMatchObject( {
			app: 'navegador',
			dades: { url: 'x' },
		} );
		expect( p.apps[ 0 ].clau ).not.toBe( p.apps[ 1 ].clau );
	} );

	it( 'reobrir una app la porta a dalt sense duplicar-la ni perdre la clau', () => {
		const abans = fes(
			{ tipus: 'OBRE', app: 'parla' },
			{ tipus: 'OBRE', app: 'navegador' }
		);
		const clau = abans.apps[ 0 ].clau;
		const p = pilaReductor( abans, { tipus: 'OBRE', app: 'parla' } );
		expect( p.apps.map( ( a ) => a.app ) ).toEqual( [
			'navegador',
			'parla',
		] );
		expect( appActiva( p ).clau ).toBe( clau );
	} );

	it( 'reobrir amb dades noves les actualitza', () => {
		const p = fes(
			{ tipus: 'OBRE', app: 'navegador', dades: { url: 'a' } },
			{ tipus: 'OBRE', app: 'navegador', dades: { url: 'b' } }
		);
		expect( p.apps ).toHaveLength( 1 );
		expect( appActiva( p ).dades ).toEqual( { url: 'b' } );
	} );

	it( 'ignora OBRE sense app', () => {
		expect( pilaReductor( ESTAT_PILA, { tipus: 'OBRE' } ) ).toBe(
			ESTAT_PILA
		);
	} );

	it( 'enrere treu l’app de dalt', () => {
		const p = fes(
			{ tipus: 'OBRE', app: 'parla' },
			{ tipus: 'OBRE', app: 'navegador' },
			{ tipus: 'ENRERE' }
		);
		expect( appActiva( p ).app ).toBe( 'parla' );
		expect( appActiva( pilaReductor( p, { tipus: 'ENRERE' } ) ) ).toBe(
			null
		);
	} );

	it( 'enrere amb la pila buida no fa res', () => {
		expect( pilaReductor( ESTAT_PILA, { tipus: 'ENRERE' } ) ).toBe(
			ESTAT_PILA
		);
	} );

	it( 'inici mostra la pantalla d’inici sense tancar apps', () => {
		const p = fes(
			{ tipus: 'OBRE', app: 'parla' },
			{ tipus: 'OBRE', app: 'navegador' },
			{ tipus: 'INICI' }
		);
		expect( p.inici ).toBe( true );
		expect( appActiva( p ) ).toBeNull();
		expect( p.apps.map( ( a ) => a.app ) ).toEqual( [
			'parla',
			'navegador',
		] );
		expect( pilaReductor( ESTAT_PILA, { tipus: 'INICI' } ) ).toBe(
			ESTAT_PILA
		);
		expect( pilaReductor( p, { tipus: 'INICI' } ) ).toBe( p );
	} );

	it( 'enrere a l’inici no fa res', () => {
		const p = fes( { tipus: 'OBRE', app: 'parla' }, { tipus: 'INICI' } );
		expect( pilaReductor( p, { tipus: 'ENRERE' } ) ).toBe( p );
	} );

	it( 'obrir des de l’inici recupera l’app amb la mateixa clau', () => {
		const abans = fes(
			{ tipus: 'OBRE', app: 'parla' },
			{ tipus: 'OBRE', app: 'navegador' },
			{ tipus: 'INICI' }
		);
		const clau = abans.apps[ 0 ].clau;
		const p = pilaReductor( abans, { tipus: 'OBRE', app: 'parla' } );
		expect( p.inici ).toBe( false );
		expect( appActiva( p ) ).toMatchObject( { app: 'parla', clau } );
		expect( p.apps ).toHaveLength( 2 );
	} );

	it( 'reinicia buida la pila encara que sigui a l’inici', () => {
		const p = fes(
			{ tipus: 'OBRE', app: 'parla' },
			{ tipus: 'INICI' },
			{ tipus: 'REINICIA' }
		);
		expect( p ).toBe( ESTAT_PILA );
		expect( p.apps ).toEqual( [] );
	} );

	it( 'reinicia torna a l’estat inicial', () => {
		const p = fes( { tipus: 'OBRE', app: 'parla' }, { tipus: 'REINICIA' } );
		expect( p ).toBe( ESTAT_PILA );
	} );

	it( 'les claus no es repeteixen després de tancar', () => {
		const p = fes(
			{ tipus: 'OBRE', app: 'parla' },
			{ tipus: 'ENRERE' },
			{ tipus: 'OBRE', app: 'parla' }
		);
		expect( appActiva( p ).clau ).toBe( 'a1' );
	} );

	it( 'accions desconegudes no canvien res', () => {
		expect( pilaReductor( ESTAT_PILA, { tipus: 'X' } ) ).toBe( ESTAT_PILA );
	} );
} );
