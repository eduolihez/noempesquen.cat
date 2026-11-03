import { describe, it, expect, vi } from 'vitest';
import { extreuToken, consumeixTokenUrl } from '../enllac.js';

const HEX = 'a'.repeat( 64 );
const TOKEN = `12.${ HEX }`;

describe( 'extreuToken', () => {
	it( 'reconeix verifica i restableix', () => {
		expect( extreuToken( `?verifica=${ TOKEN }` ) ).toEqual( {
			tipus: 'verifica',
			token: TOKEN,
			cerca: '',
		} );
		expect( extreuToken( `?restableix=${ TOKEN }` ) ).toMatchObject( {
			tipus: 'restableix',
			token: TOKEN,
		} );
	} );

	it( 'conserva els altres paràmetres', () => {
		expect( extreuToken( `?a=1&verifica=${ TOKEN }&b=2` ).cerca ).toBe(
			'?a=1&b=2'
		);
	} );

	it( 'un valor sense forma de token s’ignora però s’esborra de la URL', () => {
		expect( extreuToken( '?verifica=hola&x=1' ) ).toEqual( {
			tipus: null,
			token: null,
			cerca: '?x=1',
		} );
		expect(
			extreuToken( `?verifica=12.${ 'g'.repeat( 64 ) }` ).token
		).toBe( null );
	} );

	it( 'entrades estranyes no llancen', () => {
		expect( extreuToken( undefined ) ).toEqual( {
			tipus: null,
			token: null,
			cerca: '',
		} );
		expect( extreuToken( '' ).tipus ).toBeNull();
	} );

	it( 'si n’hi ha dos, guanya el primer tipus i tots dos es treuen', () => {
		const r = extreuToken( `?restableix=${ TOKEN }&verifica=${ TOKEN }` );
		expect( r.tipus ).toBe( 'verifica' );
		expect( r.cerca ).toBe( '' );
	} );
} );

describe( 'consumeixTokenUrl', () => {
	const finestra = ( search, hash = '' ) => ( {
		location: { search, pathname: '/compte/', hash },
		history: { state: null, replaceState: vi.fn() },
	} );

	it( 'llegeix el token i neteja la URL amb replaceState', () => {
		const w = finestra( `?restableix=${ TOKEN }`, '#x' );
		expect( consumeixTokenUrl( w ) ).toEqual( {
			tipus: 'restableix',
			token: TOKEN,
		} );
		expect( w.history.replaceState ).toHaveBeenCalledWith(
			null,
			'',
			'/compte/#x'
		);
	} );

	it( 'sense paràmetres no toca l’historial', () => {
		const w = finestra( '?a=1' );
		expect( consumeixTokenUrl( w ) ).toEqual( {
			tipus: null,
			token: null,
		} );
		expect( w.history.replaceState ).not.toHaveBeenCalled();
	} );

	it( 'amb un paràmetre invàlid també neteja', () => {
		const w = finestra( '?verifica=zzz' );
		expect( consumeixTokenUrl( w ).token ).toBeNull();
		expect( w.history.replaceState ).toHaveBeenCalledWith(
			null,
			'',
			'/compte/'
		);
	} );
} );
