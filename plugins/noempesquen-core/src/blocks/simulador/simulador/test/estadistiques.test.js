import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { construeixResultat, enviaResultat } from '../estadistiques.js';
import { estatInicial } from '../../nucli/motor.js';

const factura = JSON.parse(
	readFileSync(
		new URL(
			'../../../../../missions/llissa-01-factura.json',
			import.meta.url
		),
		'utf8'
	)
);

const ambOpcio = ( id ) => ( { ...estatInicial( factura ), opcio: id } );

afterEach( () => {
	vi.unstubAllGlobals();
} );

describe( 'construeixResultat', () => {
	it( 'porta exactament missio, estrelles i decisio', () => {
		const estat = {
			...ambOpcio( 'c' ),
			formulari: { cvv: '123' },
			escrit: 'secret',
		};
		expect(
			construeixResultat( factura, estat, { estrelles: 3, punts: 9 } )
		).toStrictEqual( {
			missio: 'llissa-01-factura',
			estrelles: 3,
			decisio: 'c',
		} );
	} );

	it( 'sense decisió no porta la clau decisio', () => {
		const cos = construeixResultat( factura, estatInicial( factura ), {
			estrelles: 1,
		} );
		expect( cos ).toStrictEqual( {
			missio: 'llissa-01-factura',
			estrelles: 1,
		} );
		expect( Object.keys( cos ) ).toEqual( [ 'missio', 'estrelles' ] );
	} );

	it( 'una opció que no és de la missió no compta', () => {
		expect(
			construeixResultat( factura, ambOpcio( 'zz' ), { estrelles: 2 } )
		).not.toHaveProperty( 'decisio' );
	} );

	it( 'previsualització o sense missió: no envia', () => {
		const prova = {
			...factura,
			id: 'llissa-01-factura--prova',
			previsualitzacio: true,
		};
		expect(
			construeixResultat( prova, ambOpcio( 'c' ), { estrelles: 3 } )
		).toBeNull();
		expect( construeixResultat( null, {}, { estrelles: 3 } ) ).toBeNull();
	} );
} );

describe( 'enviaResultat', () => {
	const cos = { missio: 'm', estrelles: 2, decisio: 'a' };

	it( 'POST anònim amb keepalive i només els tres camps', () => {
		const fetch = vi.fn( () => Promise.resolve( { ok: true } ) );
		vi.stubGlobal( 'fetch', fetch );
		enviaResultat( '/wp-json/noempesquen/v1/', { ...cos, extra: 'x' } );
		expect( fetch ).toHaveBeenCalledTimes( 1 );
		const [ url, opcions ] = fetch.mock.calls[ 0 ];
		expect( url ).toBe( '/wp-json/noempesquen/v1/resultat' );
		expect( opcions ).toMatchObject( {
			method: 'POST',
			keepalive: true,
			credentials: 'omit',
		} );
		expect( opcions.headers ).not.toHaveProperty( 'X-WP-Nonce' );
		expect( JSON.parse( opcions.body ) ).toStrictEqual( cos );
	} );

	it( 'sense api o sense cos no fa cap petició', () => {
		const fetch = vi.fn();
		vi.stubGlobal( 'fetch', fetch );
		enviaResultat( '', cos );
		enviaResultat( undefined, cos );
		enviaResultat( '/api/', null );
		expect( fetch ).not.toHaveBeenCalled();
	} );

	it( 'falla en silenci si fetch llença o rebutja', async () => {
		const rebuig = vi.fn();
		process.on( 'unhandledRejection', rebuig );
		vi.stubGlobal( 'fetch', () => {
			throw new Error( 'sense xarxa' );
		} );
		expect( () => enviaResultat( '/api/', cos ) ).not.toThrow();
		vi.stubGlobal( 'fetch', () => Promise.reject( new Error( '429' ) ) );
		expect( () => enviaResultat( '/api/', cos ) ).not.toThrow();
		await new Promise( ( r ) => setTimeout( r, 10 ) );
		process.off( 'unhandledRejection', rebuig );
		expect( rebuig ).not.toHaveBeenCalled();
	} );
} );
