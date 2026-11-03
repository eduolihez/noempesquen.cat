import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { parsePo } from '../../../scripts/i18n-po.mjs';

/*
 * Falla silenciosa a l'idioma equivocat: si el JSON d'un handle falta, és buit
 * o no té una cadena del .pot, el castellà surt en català sense cap error.
 * Política: canviar un msgid obliga a `i18n:pot` → `i18n:merge` → `i18n:json`.
 */
const LANG = new URL( '../languages/', import.meta.url );
const HANDLES = [
	'noempesquen-simulador-view-script',
	'noempesquen-compte-view-script',
	'noempesquen-contacte-view-script',
];

const llegeix = ( nom ) => readFileSync( new URL( nom, LANG ), 'utf8' );
const clauJed = ( e ) =>
	e.msgctxt ? `${ e.msgctxt }\u0004${ e.msgid }` : e.msgid;
const pot = parsePo( llegeix( 'noempesquen.pot' ) ).entrades.filter(
	( e ) => e.msgid !== ''
);

describe( 'traduccions JSON dels handles', () => {
	it( 'el .pot té cadenes', () => {
		expect( pot.length ).toBeGreaterThan( 100 );
	} );

	HANDLES.forEach( ( handle ) => {
		const nom = `noempesquen-es_ES-${ handle }.json`;

		it( `${ nom } existeix, no és buit i cobreix tot el .pot`, () => {
			expect( existsSync( new URL( nom, LANG ) ) ).toBe( true );
			const json = JSON.parse( llegeix( nom ) );
			expect( json.domain ).toBe( 'messages' );
			const missatges = json.locale_data.messages;
			const claus = Object.keys( missatges ).filter( ( k ) => k !== '' );
			expect( claus.length ).toBeGreaterThan( 0 );
			const falten = pot
				.map( clauJed )
				.filter(
					( k ) =>
						! missatges[ k ] ||
						! missatges[ k ].some( ( t ) => t !== '' )
				);
			expect( falten ).toEqual( [] );
		} );
	} );
} );
