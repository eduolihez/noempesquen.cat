import { afterEach, describe, expect, it } from 'vitest';
import {
	articleDe,
	clauDia,
	comparador,
	fixaIdioma,
	formataDataLlarga,
	formataImport,
	formataPreu,
	idiomaActual,
	localeDe,
	minuscules,
	nomMes,
} from '../idioma.js';
import { etiquetaData } from '../../apps/galeria/agrupa.js';
import { formataData } from '../../webs/diari/paginacio.js';
import { ordenaXats } from '../../apps/parla/xats.js';

afterEach( () => fixaIdioma( 'ca' ) );

describe( 'idioma', () => {
	it( 'localeDe i idioma actual', () => {
		expect( localeDe( 'es' ) ).toBe( 'es-ES' );
		expect( localeDe( 'ca' ) ).toBe( 'ca-ES' );
		fixaIdioma( 'ca-ES' );
		expect( idiomaActual() ).toBe( 'ca' );
		fixaIdioma( 'xx' );
		expect( idiomaActual() ).toBe( 'es' );
	} );

	it( 'formataImport', () => {
		expect( formataImport( 1234.56, false, 'es' ) ).toBe(
			'1.234,56\u00A0€'
		);
		expect( formataImport( 1234.56, false, 'ca' ) ).toBe( '1.234,56 €' );
		expect( formataImport( 1640, true, 'es' ) ).toBe( '+1.640,00\u00A0€' );
		expect( formataImport( -24.9, false, 'ca' ) ).toBe( '-24,90 €' );
	} );

	it( 'formataPreu', () => {
		expect( formataPreu( 120, 'es' ) ).toBe( '120\u00A0€' );
		expect( formataPreu( 12.5, 'ca' ) ).toBe( '12,50 €' );
		expect( formataPreu( 'x', 'es' ) ).toBe( '' );
	} );

	it( 'mesos, article i data llarga', () => {
		expect( nomMes( 3, 'ca' ) ).toBe( 'març' );
		expect( nomMes( 3, 'es' ) ).toBe( 'marzo' );
		expect( articleDe( 'octubre', 'ca' ) ).toBe( "d'" );
		expect( articleDe( 'març', 'ca' ) ).toBe( 'de ' );
		expect( articleDe( 'octubre', 'es' ) ).toBe( 'de ' );
		expect( formataDataLlarga( 2026, 10, 12, 'ca' ) ).toBe(
			"12 d'octubre de 2026"
		);
		expect( formataDataLlarga( 2026, 10, 12, 'es' ) ).toBe(
			'12 de octubre de 2026'
		);
	} );

	it( 'comparador i minúscules', () => {
		const es = [ 'Zoe', 'Ñandú', 'Nora', 'Óscar', 'Oriol' ].sort(
			comparador( 'es' )
		);
		expect( es ).toEqual( [ 'Nora', 'Ñandú', 'Oriol', 'Óscar', 'Zoe' ] );
		const ca = [ 'Zoe', 'Çuca', 'Cuba', 'Dani' ].sort( comparador( 'ca' ) );
		expect( ca ).toEqual( [ 'Cuba', 'Çuca', 'Dani', 'Zoe' ] );
		expect( minuscules( 'ÑANDÚ', 'es' ) ).toBe( 'ñandú' );
		expect( minuscules( 'ÇARA', 'ca' ) ).toBe( 'çara' );
	} );

	it( 'clauDia accepta les dues llengües', () => {
		expect( clauDia( 'ayer' ) ).toBe( 'ahir' );
		expect( clauDia( 'ahir' ) ).toBe( 'ahir' );
		expect( clauDia( 'lun.' ) ).toBe( 'dl.' );
		expect( clauDia( 'mié.' ) ).toBe( 'dc.' );
		expect( clauDia( '' ) ).toBe( '' );
	} );
} );

describe( 'mòduls refactoritzats en es', () => {
	it( 'data de galeria i diari', () => {
		fixaIdioma( 'es' );
		expect( etiquetaData( '2026-10-12', '2026-11-03' ) ).toBe(
			'12 de octubre de 2026'
		);
		expect( formataData( '2026-10-12' ) ).toBe( '12 de octubre de 2026' );
		fixaIdioma( 'ca' );
		expect( formataData( '2026-10-12' ) ).toBe( "12 d'octubre de 2026" );
	} );

	it( 'ordenaXats entén «ayer» i «ahir»', () => {
		const xat = ( id, hora ) => ( { id, missatges: [ { hora } ] } );
		const ordre = ordenaXats( [
			xat( 'a', 'lun. 10:00' ),
			xat( 'b', 'ayer 18:40' ),
			xat( 'c', '08:05' ),
		] ).map( ( x ) => x.id );
		expect( ordre ).toEqual( [ 'c', 'b', 'a' ] );
	} );
} );
