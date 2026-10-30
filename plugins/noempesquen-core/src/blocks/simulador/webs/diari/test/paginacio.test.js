import { describe, it, expect } from 'vitest';
import { formataData, rutaDeUrl, seccions, urlNoticia } from '../paginacio.js';

describe( 'rutaDeUrl', () => {
	it( 'reconeix la portada', () => {
		expect( rutaDeUrl( 'https://diaridelbarri.cat/' ) ).toEqual( {
			tipus: 'portada',
		} );
		expect( rutaDeUrl( 'https://diaridelbarri.cat' ) ).toEqual( {
			tipus: 'portada',
		} );
	} );
	it( 'reconeix una notícia', () => {
		expect(
			rutaDeUrl( 'https://diaridelbarri.cat/noticia/mercat-1?x=1#a' )
		).toEqual( { tipus: 'noticia', id: 'mercat-1' } );
	} );
	it( 'la resta és desconeguda', () => {
		for ( const u of [
			'https://diaridelbarri.cat/altre',
			'https://diaridelbarri.cat/noticia/',
			'https://diaridelbarri.cat/noticia/a/b',
			'no-es-url',
			null,
		] ) {
			expect( rutaDeUrl( u ).tipus ).toBe( 'desconeguda' );
		}
	} );
	it( 'urlNoticia i rutaDeUrl són inversos', () => {
		expect( rutaDeUrl( urlNoticia( 'a b' ) ) ).toEqual( {
			tipus: 'noticia',
			id: 'a b',
		} );
	} );
} );

describe( 'seccions', () => {
	it( 'treu seccions úniques en ordre', () => {
		expect(
			seccions( [
				{ seccio: 'Barri' },
				{ seccio: 'Esports' },
				{ seccio: 'Barri' },
				{},
			] )
		).toEqual( [ 'Barri', 'Esports' ] );
	} );
	it( 'tolera entrades invàlides', () => {
		expect( seccions( null ) ).toEqual( [] );
	} );
} );

describe( 'formataData', () => {
	it( 'formata a mà amb elisió', () => {
		expect( formataData( '2026-10-12' ) ).toBe( "12 d'octubre de 2026" );
		expect( formataData( '2026-03-01' ) ).toBe( '1 de març de 2026' );
		expect( formataData( '2026-04-30' ) ).toBe( "30 d'abril de 2026" );
	} );
	it( 'torna l’original si no és vàlida', () => {
		expect( formataData( '2026-02-31' ) ).toBe( '2026-02-31' );
		expect( formataData( 'x' ) ).toBe( 'x' );
	} );
} );
