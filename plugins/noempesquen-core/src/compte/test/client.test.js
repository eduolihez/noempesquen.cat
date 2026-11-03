import { describe, it, expect } from 'vitest';
import { creaClient } from '../client.js';

const API = 'http://exemple.test/wp-json/noempesquen/v1/';
const AJAX = 'http://exemple.test/wp-admin/admin-ajax.php';

/**
 * Resposta falsa mínima (status, text, headers.get).
 *
 * @param {number}        status     Codi HTTP.
 * @param {Object|string} cos        Cos (objecte → JSON, text tal qual).
 * @param {Object}        capcaleres Capçaleres.
 */
const resposta = ( status, cos, capcaleres = {} ) => ( {
	ok: status >= 200 && status < 300,
	status,
	text: async () => ( typeof cos === 'string' ? cos : JSON.stringify( cos ) ),
	headers: { get: ( nom ) => capcaleres[ nom ] ?? null },
} );

/**
 * `fetch` fals: respon amb la cua donada i desa les crides.
 *
 * @param {Array} cua Respostes en ordre.
 */
function fetchFals( cua ) {
	const crides = [];
	const fn = async ( url, opcions = {} ) => {
		crides.push( { url, opcions } );
		const r = cua.shift();
		if ( r instanceof Error ) {
			throw r;
		}
		return r;
	};
	return { fn, crides };
}

describe( 'client de comptes', () => {
	it( 'sense sessió, rest-nonce torna 0/400 i l’estat és desconnectat', async () => {
		const { fn, crides } = fetchFals( [ resposta( 400, '0' ) ] );
		const client = creaClient( { api: API, ajaxUrl: AJAX, fetchFn: fn } );
		expect( await client.estat() ).toEqual( {
			connectat: false,
			nonce: null,
			progres: {},
		} );
		expect( crides ).toHaveLength( 1 );
		expect( crides[ 0 ].url ).toBe( `${ AJAX }?action=rest-nonce` );
		expect( crides[ 0 ].opcions.credentials ).toBe( 'same-origin' );
	} );

	it( 'un 200 amb «0» o una fallada de xarxa també és desconnectat', async () => {
		const { fn } = fetchFals( [
			resposta( 200, '0' ),
			new Error( 'xarxa' ),
		] );
		const client = creaClient( { api: API, ajaxUrl: AJAX, fetchFn: fn } );
		expect( await client.obtenNonce() ).toBeNull();
		expect( await client.obtenNonce() ).toBeNull();
	} );

	it( 'amb sessió, estat fa servir el nonce per llegir el progrés', async () => {
		const { fn, crides } = fetchFals( [
			resposta( 200, 'abc123' ),
			resposta( 200, { progres: { 'llissa-01': 2 } } ),
		] );
		const client = creaClient( { api: API, ajaxUrl: AJAX, fetchFn: fn } );
		expect( await client.estat() ).toEqual( {
			connectat: true,
			nonce: 'abc123',
			progres: { 'llissa-01': 2 },
			verificat: false,
		} );
		expect( crides[ 1 ].url ).toBe( `${ API }compte/progres` );
		expect( crides[ 1 ].opcions.headers[ 'X-WP-Nonce' ] ).toBe( 'abc123' );
	} );

	it( 'entra envia JSON sense contrasenya a la URL i desa el nonce nou', async () => {
		const { fn, crides } = fetchFals( [
			resposta( 200, { connectat: true, nonce: 'nou1', progres: {} } ),
			resposta( 200, { progres: {} } ),
		] );
		const client = creaClient( { api: API, ajaxUrl: AJAX, fetchFn: fn } );
		const r = await client.entra( {
			email: 'prova@example.com',
			contrasenya: 'secreta-1234',
		} );
		expect( r.ok ).toBe( true );
		const { url, opcions } = crides[ 0 ];
		expect( url ).toBe( `${ API }compte/entra` );
		expect( url ).not.toContain( 'secreta' );
		expect( opcions.method ).toBe( 'POST' );
		expect( opcions.credentials ).toBe( 'same-origin' );
		expect( opcions.headers[ 'Content-Type' ] ).toBe( 'application/json' );
		// Sense nonce previ no s'envia la capçalera (un nonce caducat donaria 403).
		expect( opcions.headers[ 'X-WP-Nonce' ] ).toBeUndefined();
		expect( JSON.parse( opcions.body ) ).toEqual( {
			email: 'prova@example.com',
			contrasenya: 'secreta-1234',
		} );
		expect( client.nonceActual() ).toBe( 'nou1' );

		await client.desaProgres( { 'llissa-01': 3 } );
		expect( crides[ 1 ].opcions.method ).toBe( 'PUT' );
		expect( crides[ 1 ].opcions.headers[ 'X-WP-Nonce' ] ).toBe( 'nou1' );
	} );

	it( 'registra envia les dues caselles com a booleans', async () => {
		const { fn, crides } = fetchFals( [
			resposta( 200, { connectat: true, nonce: 'r1', progres: {} } ),
		] );
		const client = creaClient( { api: API, ajaxUrl: AJAX, fetchFn: fn } );
		await client.registra( {
			email: 'a@example.com',
			contrasenya: '0123456789',
			acepta: true,
			majoria_edat: true,
		} );
		expect( JSON.parse( crides[ 0 ].opcions.body ) ).toEqual( {
			email: 'a@example.com',
			contrasenya: '0123456789',
			acepta: true,
			majoria_edat: true,
		} );
		expect( client.nonceActual() ).toBe( 'r1' );
	} );

	it( 'tradueix els errors 401 i 429 amb el missatge del servidor', async () => {
		const { fn } = fetchFals( [
			resposta( 401, {
				code: 'nep_credencials',
				message: 'Correu o contrasenya incorrectes.',
				data: { status: 401 },
			} ),
			resposta( 429, {
				code: 'nep_massa_intents',
				message: 'Massa intents. Torna-ho a provar més tard.',
				data: { status: 429 },
			} ),
			resposta( 500, '<html>' ),
		] );
		const client = creaClient( { api: API, ajaxUrl: AJAX, fetchFn: fn } );
		const dades = { email: 'a@example.com', contrasenya: 'x' };
		expect( await client.entra( dades ) ).toEqual( {
			ok: false,
			estat: 401,
			codi: 'nep_credencials',
			missatge: 'Correu o contrasenya incorrectes.',
		} );
		expect( await client.entra( dades ) ).toMatchObject( {
			ok: false,
			estat: 429,
			codi: 'nep_massa_intents',
		} );
		expect( await client.entra( dades ) ).toMatchObject( {
			ok: false,
			estat: 500,
			codi: 'nep_error',
		} );
		expect( client.nonceActual() ).toBeNull();
	} );

	it( 'actualitza el nonce amb la capçalera X-WP-Nonce de la resposta', async () => {
		const { fn } = fetchFals( [
			resposta( 200, 'n1' ),
			resposta( 200, { email: 'a@example.com' }, { 'X-WP-Nonce': 'n2' } ),
		] );
		const client = creaClient( { api: API, ajaxUrl: AJAX, fetchFn: fn } );
		await client.obtenNonce();
		await client.exporta();
		expect( client.nonceActual() ).toBe( 'n2' );
	} );

	it( 'esborra envia DELETE amb la contrasenya al cos i oblida el nonce', async () => {
		const { fn, crides } = fetchFals( [
			resposta( 200, 'n1' ),
			resposta( 200, { esborrat: true }, { 'X-WP-Nonce': 'vell' } ),
		] );
		const client = creaClient( { api: API, ajaxUrl: AJAX, fetchFn: fn } );
		await client.obtenNonce();
		const r = await client.esborra( 'secreta-1234' );
		expect( r.ok ).toBe( true );
		expect( crides[ 1 ].url ).toBe( `${ API }compte` );
		expect( crides[ 1 ].url ).not.toContain( 'secreta' );
		expect( crides[ 1 ].opcions.method ).toBe( 'DELETE' );
		expect( JSON.parse( crides[ 1 ].opcions.body ) ).toEqual( {
			contrasenya: 'secreta-1234',
		} );
		expect( client.nonceActual() ).toBeNull();
	} );

	it( 'una fallada de xarxa torna un error estàndard', async () => {
		const { fn } = fetchFals( [ new Error( 'xarxa' ) ] );
		const client = creaClient( { api: API, ajaxUrl: AJAX, fetchFn: fn } );
		expect( await client.surt() ).toMatchObject( {
			ok: false,
			estat: 0,
			codi: 'nep_xarxa',
		} );
	} );
} );

describe( 'client de comptes · verificació i recuperació', () => {
	const cosDe = ( crida ) => JSON.parse( crida.opcions.body );

	it( 'verifica envia el token al cos, mai a la URL', async () => {
		const { fn, crides } = fetchFals( [
			resposta( 200, { verificat: true } ),
		] );
		const client = creaClient( { api: API, ajaxUrl: AJAX, fetchFn: fn } );
		const r = await client.verifica( '1.abc' );
		expect( r ).toEqual( { ok: true, dades: { verificat: true } } );
		expect( crides[ 0 ].url ).toBe( `${ API }compte/verifica` );
		expect( crides[ 0 ].opcions.method ).toBe( 'POST' );
		expect( cosDe( crides[ 0 ] ) ).toEqual( { token: '1.abc' } );
	} );

	it( 'un token invàlid torna l’error genèric del servidor', async () => {
		const { fn } = fetchFals( [
			resposta( 400, { code: 'nep_token_invalid', message: 'No val.' } ),
		] );
		const client = creaClient( { api: API, ajaxUrl: AJAX, fetchFn: fn } );
		expect( await client.verifica( '1.abc' ) ).toMatchObject( {
			ok: false,
			estat: 400,
			codi: 'nep_token_invalid',
			missatge: 'No val.',
		} );
	} );

	it( 'recupera i restableix envien només el que toca', async () => {
		const { fn, crides } = fetchFals( [
			resposta( 200, { enviat: true } ),
			resposta( 200, { restablert: true } ),
		] );
		const client = creaClient( { api: API, ajaxUrl: AJAX, fetchFn: fn } );
		await client.recupera( 'a@b.cat' );
		await client.restableix( {
			token: '1.abc',
			contrasenya: 'x'.repeat( 12 ),
		} );
		expect( crides[ 0 ].url ).toBe( `${ API }compte/recupera` );
		expect( cosDe( crides[ 0 ] ) ).toEqual( { email: 'a@b.cat' } );
		expect( crides[ 1 ].url ).toBe( `${ API }compte/restableix` );
		expect( Object.keys( cosDe( crides[ 1 ] ) ).sort() ).toEqual( [
			'contrasenya',
			'token',
		] );
	} );

	it( 'reenviaVerificacio usa POST amb el nonce de la sessió', async () => {
		const { fn, crides } = fetchFals( [
			resposta( 200, 'N0NCE' ),
			resposta( 200, { progres: {}, verificat: false } ),
			resposta( 200, { verificat: false, enviat: true } ),
		] );
		const client = creaClient( { api: API, ajaxUrl: AJAX, fetchFn: fn } );
		const e = await client.estat();
		expect( e.verificat ).toBe( false );
		await client.reenviaVerificacio();
		expect( crides[ 2 ].url ).toBe( `${ API }compte/reenvia-verificacio` );
		expect( crides[ 2 ].opcions.headers[ 'X-WP-Nonce' ] ).toBe( 'N0NCE' );
	} );
} );
