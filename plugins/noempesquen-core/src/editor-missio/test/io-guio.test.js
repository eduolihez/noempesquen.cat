import { describe, it, expect } from 'vitest';
import {
	MIDA_MAXIMA,
	llegeixImportat,
	nomFitxer,
	textExportat,
} from '../io-guio.js';

describe( 'exportar el guió', () => {
	it( 'anomena el fitxer amb l’id si és vàlid', () => {
		expect( nomFitxer( '{"id":"llissa-09-prova"}' ) ).toBe(
			'llissa-09-prova.json'
		);
		expect( nomFitxer( '{"id":"Mal Id"}' ) ).toBe( 'guio.json' );
		expect( nomFitxer( '{ trencat' ) ).toBe( 'guio.json' );
	} );

	it( 'normalitza a LF amb salt final', () => {
		expect( textExportat( '{\r\n"a": 1\r\n}' ) ).toBe( '{\n"a": 1\n}\n' );
		expect( textExportat( '{}\n' ) ).toBe( '{}\n' );
	} );
} );

describe( 'importar el guió', () => {
	it( 'accepta un objecte JSON i treu el BOM', () => {
		expect(
			llegeixImportat(
				`${ String.fromCharCode( 0xfeff ) }{"id":"x"}\r\n`
			)
		).toEqual( {
			ok: true,
			text: '{"id":"x"}\n',
		} );
	} );

	it( 'rebutja JSON il·legible, llistes i valors solts', () => {
		expect( llegeixImportat( '{ "id": ' ).ok ).toBe( false );
		expect( llegeixImportat( '[1, 2]' ).ok ).toBe( false );
		expect( llegeixImportat( '"text"' ).ok ).toBe( false );
		expect( llegeixImportat( 'null' ).ok ).toBe( false );
	} );

	it( 'rebutja fitxers més grans que el límit del servidor', () => {
		const gran = `{"a":"${ 'x'.repeat( MIDA_MAXIMA ) }"}`;
		const r = llegeixImportat( gran );
		expect( r.ok ).toBe( false );
		expect( r.motiu ).toMatch( /512 KB/ );
	} );

	it( 'compta bytes UTF-8, no caràcters', () => {
		const just = `{"a":"${ 'à'.repeat( MIDA_MAXIMA / 2 ) }"}`;
		expect( llegeixImportat( just ).ok ).toBe( false );
	} );
} );
