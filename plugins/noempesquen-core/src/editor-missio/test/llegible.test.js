import { describe, it, expect } from 'vitest';
import {
	mapaPosicions,
	posicioDeRuta,
	posicioErrorSintaxi,
} from '../localitza.js';
import { errorLlegible, etiquetaRuta } from '../llegible.js';
import { diagnosticGuio } from '../diagnostic.js';
import mon from '../../../missions/ca/mon.json';
import factura from '../../../missions/ca/llissa-01-factura.json';

const TEXT = `{
	"id": "x",
	"webs": { "llum.cat": { "plantilla": "posta" } },
	"decisio": { "opcions": [ { "id": "a" }, { "id": "b", "text": "Obre l'enllaç" } ] },
	"clau \\"rara\\"": [ 1, [ 2, 3 ] ]
}`;

describe( 'ruta → posició', () => {
	it( 'troba claus, elements de llista i claus amb punts', () => {
		const mapa = mapaPosicions( TEXT );
		expect( TEXT.slice( mapa.get( 'id' ) ) ).toMatch( /^"id"/ );
		expect(
			TEXT.slice(
				posicioDeRuta( TEXT, [ 'webs', 'llum.cat', 'plantilla' ] )
			)
		).toMatch( /^"plantilla"/ );
		expect(
			TEXT.slice( posicioDeRuta( TEXT, [ 'decisio', 'opcions', 1 ] ) )
		).toMatch( /^\{ "id": "b"/ );
		expect( TEXT.slice( mapa.get( 'clau "rara"[1][0]' ) ) ).toMatch( /^2/ );
	} );

	it( 'si la clau no hi és, torna l’avantpassat més proper', () => {
		expect(
			TEXT.slice( posicioDeRuta( TEXT, [ 'decisio', 'opcions', 5 ] ) )
		).toMatch( /^"opcions"/ );
		expect( posicioDeRuta( TEXT, [ 'res' ] ) ).toBeNull();
		expect( posicioDeRuta( TEXT, [] ) ).toBeNull();
	} );

	it( 'amb claus repetides guanya la darrera, com JSON.parse', () => {
		const t = '{"a":1,"a":2}';
		expect( posicioDeRuta( t, [ 'a' ] ) ).toBe( 7 );
	} );

	it( 'situa els errors de sintaxi', () => {
		const t = '{\n  "id": x\n}';
		let missatge = '';
		try {
			JSON.parse( t );
		} catch ( e ) {
			missatge = e.message;
		}
		expect( posicioErrorSintaxi( t, missatge ) ).toBe( t.indexOf( 'x' ) );
		expect( posicioErrorSintaxi( t, 'line 2 column 9' ) ).toBe(
			t.indexOf( 'x' )
		);
		// Sense posició al missatge, on s'atura l'escàner.
		expect( posicioErrorSintaxi( t, 'res' ) ).toBe( t.indexOf( 'x' ) );
		expect( posicioErrorSintaxi( '{"a":1,}', '' ) ).toBe( 7 );
		expect( posicioErrorSintaxi( '{"a": "b', '' ) ).toBe( 8 );
		expect( posicioErrorSintaxi( '{"a":1}', '' ) ).toBeNull();
		expect( mapaPosicions( TEXT ).error ).toBeNull();
	} );
} );

describe( 'missatges llegibles', () => {
	const guio = JSON.parse( TEXT );

	it( 'etiqueta la ruta amb el text de l’opció', () => {
		expect( etiquetaRuta( [ 'decisio', 'opcions', 1 ], guio ) ).toBe(
			"Decisió › Opció 2 “Obre l'enllaç”"
		);
		expect(
			etiquetaRuta( [ 'webs', 'llum.cat', 'plantilla' ], guio )
		).toBe( 'Webs › Web «llum.cat» › «plantilla»' );
	} );

	it( 'tradueix els errors més comuns i en manté el codi', () => {
		const versio = errorLlegible( 'versio no suportada', guio );
		expect( versio ).toMatchObject( {
			codi: 'versio no suportada',
			ruta: [ 'versio' ],
		} );
		expect( versio.text ).toMatch( /ha de ser 2/ );

		expect( errorLlegible( 'id invàlid', guio ).text ).toMatch(
			/minúscules/
		);
		expect( errorLlegible( 'cap opció correcta', guio ).on ).toBe(
			'Decisió'
		);
		expect(
			errorLlegible( 'plantilla desconeguda: posta', guio ).ruta
		).toEqual( [ 'webs', 'llum.cat', 'plantilla' ] );
	} );

	it( 'llegeix les referències del validador', () => {
		const e = errorLlegible(
			'revenda.xats[2]: camp «contacte» buit o absent',
			{}
		);
		expect( e.ruta ).toEqual( [
			'apps',
			'revenda',
			'xats',
			2,
			'contacte',
		] );
		expect( e.text ).toMatch( /Falta el camp «contacte»/ );
		expect(
			errorLlegible(
				'article diari.cat.seccions[1]: ha de ser un objecte',
				{}
			).ruta
		).toEqual( [ 'webs', 'diari.cat', 'seccions', 1 ] );
	} );

	it( 'un missatge desconegut queda tal qual i sense ruta', () => {
		expect( errorLlegible( 'cosa estranya', guio ) ).toMatchObject( {
			text: 'Cosa estranya.',
			ruta: null,
			on: null,
		} );
	} );
} );

describe( 'diagnosticGuio', () => {
	it( 'una missió real no té errors', () => {
		expect(
			diagnosticGuio( JSON.stringify( factura ), {
				mon,
				dispositiu: 'pc',
				personatge: 'llissa',
			} )
		).toEqual( [] );
	} );

	it( 'cada error d’un guió amb versió 1 es pot localitzar', () => {
		const text = JSON.stringify( { ...factura, versio: 1 }, null, '\t' );
		const [ error ] = diagnosticGuio( text, { mon } );
		expect( error.codi ).toBe( 'versio no suportada' );
		expect( text.slice( posicioDeRuta( text, error.ruta ) ) ).toMatch(
			/^"versio"/
		);
	} );

	it( 'un JSON il·legible dona la posició de l’error', () => {
		const [ error ] = diagnosticGuio( '{ "id": x }', { mon } );
		expect( error.posicio ).toBe( 8 );
	} );
} );

describe( 'missatges d’efectes, disparadors, Parla i formularis', () => {
	const guio = {
		disparadors: [
			{
				esdeveniment: 'x',
				efectes: [
					{ tipus: 'guia-diu', text: 'Hola' },
					{ tipus: 'guia-diu' },
					{ tipus: 'notifica', app: 'parla', xat: 'xat-9' },
				],
			},
			{ esdeveniment: 'y', quan: { fitxer: 3 }, efectes: [] },
		],
		apps: {
			parla: {
				xats: [
					{ id: 'a', missatges: [ { id: 'm1', text: 'x' } ] },
					{ id: 'b', missatges: [ { id: 'm2', text: 'y' } ] },
				],
			},
		},
	};

	const ruta = ( codi ) => errorLlegible( codi, guio ).ruta;
	const text = ( codi ) => errorLlegible( codi, guio ).text;

	it( 'localitza els efectes i en dona un text planer', () => {
		expect( ruta( 'guia-diu sense text ni frase' ) ).toEqual( [
			'disparadors',
			0,
			'efectes',
			1,
		] );
		expect( ruta( 'notifica: xat inexistent a parla: xat-9' ) ).toEqual( [
			'disparadors',
			0,
			'efectes',
			2,
			'xat',
		] );
		expect( text( 'notifica: font invàlida: pc' ) ).toMatch( /mobil/ );
	} );

	it( 'localitza «fitxer» i la web dels formularis', () => {
		expect( ruta( 'fitxer ha de ser text' ) ).toEqual( [
			'disparadors',
			1,
			'quan',
			'fitxer',
		] );
		expect( ruta( 'formulari: nota ha de ser text a x.cat' ) ).toEqual( [
			'webs',
			'x.cat',
		] );
		expect( text( 'telefon.truca: la web x.cat no té avís' ) ).toMatch(
			/«x\.cat» no té avís/
		);
	} );

	it( 'situa els errors de Parla al xat que toca', () => {
		expect( ruta( 'parla: missatge duplicat: m2' ) ).toEqual( [
			'apps',
			'parla',
			'xats',
			1,
		] );
		expect( ruta( 'parla: xat sense missatges: a' ) ).toEqual( [
			'apps',
			'parla',
			'xats',
			0,
		] );
		expect( ruta( 'parla: xats ha de ser una llista' ) ).toEqual( [
			'apps',
			'parla',
			'xats',
		] );
	} );

	it( 'cap d’aquests errors cau al text genèric', () => {
		[
			'mostra: element inexistent: z',
			'bloqueja: contacte inexistent: z',
			'denuncia: publicació inexistent: z',
			'visible: element inexistent: z',
			'parla: contacte inexistent: z',
		].forEach( ( codi ) => {
			expect( text( codi ) ).toMatch( /«z»/ );
		} );
	} );
} );
