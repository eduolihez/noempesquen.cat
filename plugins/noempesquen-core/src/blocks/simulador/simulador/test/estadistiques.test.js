import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import {
	construeixResultat,
	demanaResum,
	enviaResultat,
	llegeixResum,
} from '../estadistiques.js';
import { estatInicial } from '../../nucli/motor.js';

const factura = JSON.parse(
	readFileSync(
		new URL(
			'../../../../../missions/ca/llissa-01-factura.json',
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

describe( 'demanaResum', () => {
	const resum = {
		n_banda: '20-49',
		decisions: [ { id: 'a', banda: '40-49 %' } ],
	};
	const resposta = ( dades, ok = true ) =>
		Promise.resolve( { ok, json: () => Promise.resolve( dades ) } );

	it( 'GET anònim a resultat/resum amb la missió codificada', async () => {
		const fetch = vi.fn( () => resposta( resum ) );
		vi.stubGlobal( 'fetch', fetch );
		await expect(
			demanaResum( '/wp-json/noempesquen/v1/', 'llissa-01' )
		).resolves.toStrictEqual( resum );
		const [ url, opcions ] = fetch.mock.calls[ 0 ];
		expect( url ).toBe(
			'/wp-json/noempesquen/v1/resultat/resum?missio=llissa-01'
		);
		expect( opcions ).toStrictEqual( {
			method: 'GET',
			credentials: 'omit',
			headers: { 'X-Nep-Lang': expect.stringMatching( /^(es|ca)$/ ) },
		} );
	} );

	it( 'amb una api de rest_route afegeix el paràmetre amb &', async () => {
		const fetch = vi.fn( () => resposta( resum ) );
		vi.stubGlobal( 'fetch', fetch );
		await demanaResum( '/?rest_route=/noempesquen/v1/', 'm' );
		expect( fetch.mock.calls[ 0 ][ 0 ] ).toBe(
			'/?rest_route=/noempesquen/v1/resultat/resum&missio=m'
		);
	} );

	it( 'sense api ni missió no fa cap petició i torna null', async () => {
		const fetch = vi.fn();
		vi.stubGlobal( 'fetch', fetch );
		await expect( demanaResum( '', 'm' ) ).resolves.toBeNull();
		await expect( demanaResum( '/api/', '' ) ).resolves.toBeNull();
		expect( fetch ).not.toHaveBeenCalled();
	} );

	it( 'torna null amb prou:false, error HTTP, JSON dolent o sense xarxa (mai llença)', async () => {
		vi.stubGlobal( 'fetch', () => resposta( { prou: false } ) );
		await expect( demanaResum( '/api/', 'm' ) ).resolves.toBeNull();
		vi.stubGlobal( 'fetch', () => resposta( resum, false ) );
		await expect( demanaResum( '/api/', 'm' ) ).resolves.toBeNull();
		vi.stubGlobal( 'fetch', () =>
			Promise.resolve( {
				ok: true,
				json: () => Promise.reject( new SyntaxError( 'x' ) ),
			} )
		);
		await expect( demanaResum( '/api/', 'm' ) ).resolves.toBeNull();
		vi.stubGlobal( 'fetch', () => Promise.reject( new Error( 'xarxa' ) ) );
		await expect( demanaResum( '/api/', 'm' ) ).resolves.toBeNull();
		vi.stubGlobal( 'fetch', () => {
			throw new Error( 'sense fetch' );
		} );
		await expect( demanaResum( '/api/', 'm' ) ).resolves.toBeNull();
	} );
} );

describe( 'llegeixResum', () => {
	const resum = {
		n_banda: '50+',
		decisions: [
			{ id: 'a', banda: '20-29 %' },
			{ id: 'b', banda: '60-69 %' },
		],
	};

	it( 'la franja de la mateixa opció que el jugador', () => {
		expect( llegeixResum( resum, 'a' ) ).toStrictEqual( {
			min: 20,
			max: 29,
			mateixa: true,
		} );
	} );

	it( 'si la seva opció no surt, la més triada com a «una altra opció»', () => {
		expect( llegeixResum( resum, 'c' ) ).toStrictEqual( {
			min: 60,
			max: 69,
			mateixa: false,
		} );
	} );

	it( 'la franja de dalt va fins al 100 %', () => {
		expect(
			llegeixResum(
				{
					n_banda: '50+',
					decisions: [ { id: 'a', banda: '90-100 %' } ],
				},
				'a'
			)
		).toStrictEqual( { min: 90, max: 100, mateixa: true } );
	} );

	it( 'sense resum, sense decisió o sense franges vàlides: null', () => {
		expect( llegeixResum( null, 'a' ) ).toBeNull();
		expect( llegeixResum( resum, null ) ).toBeNull();
		expect(
			llegeixResum( { n_banda: '50+', decisions: [] }, 'a' )
		).toBeNull();
		expect(
			llegeixResum(
				{ n_banda: '50+', decisions: [ { id: 'a', banda: '40 %' } ] },
				'a'
			)
		).toBeNull();
	} );
} );
