import { describe, expect, it } from 'vitest';
import { coincideixCodi, extreuCodis } from '../codi.js';

describe( 'coincideixCodi', () => {
	it( 'accepta el codi exacte', () => {
		expect( coincideixCodi( '482913', '482913' ) ).toBe( true );
	} );

	it( 'ignora espais', () => {
		expect( coincideixCodi( '482 913', '482913' ) ).toBe( true );
		expect( coincideixCodi( '4 8 2 9 1 3', '482 913' ) ).toBe( true );
	} );

	it( 'ignora guions i punts', () => {
		expect( coincideixCodi( '482-913', '482913' ) ).toBe( true );
		expect( coincideixCodi( '48.29.13', '482913' ) ).toBe( true );
	} );

	it( 'el troba dins d’una frase', () => {
		expect(
			coincideixCodi( 'Té, el codi és 482 913. Gràcies!', '482913' )
		).toBe( true );
	} );

	it( 'no accepta un codi parcial', () => {
		expect( coincideixCodi( '4829', '482913' ) ).toBe( false );
		expect( coincideixCodi( 'el codi és 482', '482913' ) ).toBe( false );
	} );

	it( 'no accepta text buit ni valors absents', () => {
		expect( coincideixCodi( '', '482913' ) ).toBe( false );
		expect( coincideixCodi( undefined, '482913' ) ).toBe( false );
		expect( coincideixCodi( '482913', '' ) ).toBe( false );
	} );

	it( 'no accepta un codi diferent', () => {
		expect( coincideixCodi( '123456', '482913' ) ).toBe( false );
	} );

	it( 'exigeix com a mínim 4 xifres al codi', () => {
		expect( coincideixCodi( '123', '123' ) ).toBe( false );
		expect( coincideixCodi( '1234', '1234' ) ).toBe( true );
	} );
} );

describe( 'extreuCodis', () => {
	it( 'treu codis del text, agrupats o no', () => {
		expect(
			extreuCodis( [
				{ text: 'El teu codi és 482 913. No el comparteixis.' },
				{ text: 'Codi: 7788' },
				{ text: 'Clau 12-34-56' },
			] )
		).toEqual( [ '482913', '7788', '123456' ] );
	} );

	it( 'llegeix el cos per segments', () => {
		expect(
			extreuCodis( [
				{
					cos: [
						[ { t: 'Codi ' }, { t: '5566', senyal: 's1' } ],
						[ { enllac: { text: 'enllaç', url: 'x.top' } } ],
					],
				},
			] )
		).toEqual( [ '5566' ] );
	} );

	it( 'ignora números curts, llargs (telèfons) i repetits', () => {
		expect(
			extreuCodis( [
				{ text: 'Truca al 612 345 678 abans de les 18' },
				{ text: 'Codi 482913' },
				{ text: 'Repeteixo: 482913' },
			] )
		).toEqual( [ '482913' ] );
	} );

	it( 'accepta espais no separables i no barreja lletres', () => {
		expect( extreuCodis( [ { text: 'Codi 482 913' } ] ) ).toEqual( [
			'482913',
		] );
		expect( extreuCodis( [ { text: 'Ref 12a0a34' } ] ) ).toEqual( [] );
	} );

	it( 'tolera entrades buides', () => {
		expect( extreuCodis( undefined ) ).toEqual( [] );
		expect( extreuCodis( [ null, {} ] ) ).toEqual( [] );
	} );
} );
