import { describe, it, expect } from 'vitest';
import { errorsGuio } from '../diagnostic.js';
import { diagnostica } from '../../blocks/simulador/nucli/missions.js';
import { validaMissio } from '../../blocks/simulador/nucli/valida.js';
import {
	PATRO_ID,
	guioDesDePlantilla,
	plantilla,
	proposaId,
	slugId,
} from '../plantilla.js';
import mon from '../../../missions/mon.json';

describe( 'plantilla de missió', () => {
	it( 'és una missió v2 vàlida', () => {
		expect( validaMissio( plantilla, mon ) ).toEqual( [] );
		expect( diagnostica( [ plantilla ], mon ) ).toEqual( [] );
	} );

	it( 'el guió proposat no té errors al diagnòstic del panell', () => {
		const guio = guioDesDePlantilla( 'Una prova', [ 'llissa-01-factura' ] );
		expect(
			errorsGuio( JSON.stringify( guio ), {
				mon,
				dispositiu: plantilla.dispositiu,
				personatge: plantilla.personatge,
				idsExistents: [ 'llissa-01-factura' ],
			} )
		).toEqual( [] );
		expect( guio.titol ).toBe( 'Una prova' );
		expect( guio.id ).toBe( 'una-prova' );
	} );

	it( 'no modifica la plantilla original', () => {
		guioDesDePlantilla( 'Una altra' );
		expect( plantilla.id ).toBe( 'plantilla-missio' );
		expect( plantilla.titol ).toBe( 'Missió nova' );
	} );
} );

describe( 'proposaId', () => {
	it( 'treu accents i símbols del títol', () => {
		expect( slugId( 'L’estafa de l·la Caça!' ) ).toBe(
			'l-estafa-de-l-la-caca'
		);
		expect( PATRO_ID.test( proposaId( '  Àlex --- i   Llissa ' ) ) ).toBe(
			true
		);
	} );

	it( 'té un id per defecte si el títol no en dona', () => {
		expect( proposaId( '' ) ).toBe( 'missio-nova' );
		expect( proposaId( '¿¡!' ) ).toBe( 'missio-nova' );
	} );

	it( 'no col·lideix amb els ids ocupats', () => {
		expect( proposaId( 'Prova', [ 'prova', 'prova-2' ] ) ).toBe(
			'prova-3'
		);
		expect( proposaId( 'Prova', [ 'prova-2' ] ) ).toBe( 'prova' );
	} );
} );
