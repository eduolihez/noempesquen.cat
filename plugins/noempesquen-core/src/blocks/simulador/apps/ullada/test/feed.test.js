import { describe, expect, it } from 'vitest';
import { construeixFeed, formataLikes, primerNom, usuariDe } from '../feed.js';

const mon = {
	ullada: {
		perfils: [ { id: 'p1', nom: 'Núria', usuari: 'nuria', il: 'gat' } ],
		publicacions: [
			{ id: 'a', autor: 'p1', text: 'Hola', il: 'gat', likes: 3 },
			{ id: 'b', autor: 'fantasma', text: 'Ei', il: 'gos', likes: 1 },
		],
	},
};

describe( 'construeixFeed', () => {
	it( 'resol el perfil de cada publicació', () => {
		const feed = construeixFeed( mon );
		expect( feed[ 0 ].perfil.nom ).toBe( 'Núria' );
		expect( feed ).toHaveLength( 2 );
	} );

	it( 'posa les extres al principi', () => {
		const feed = construeixFeed( mon, [
			{ id: 'x', autor: 'p1', text: 'Extra', il: 'gat', likes: 0 },
		] );
		expect( feed.map( ( p ) => p.id ) ).toEqual( [ 'x', 'a', 'b' ] );
		expect( feed[ 0 ].perfil.usuari ).toBe( 'nuria' );
	} );

	it( 'un perfil inexistent no trenca', () => {
		const feed = construeixFeed( mon );
		expect( feed[ 1 ].perfil ).toEqual( {
			id: 'fantasma',
			nom: '',
			usuari: '',
			il: null,
		} );
	} );

	it( 'tolera món buit o nul', () => {
		expect( construeixFeed( null ) ).toEqual( [] );
		expect( construeixFeed( {}, null ) ).toEqual( [] );
	} );
} );

describe( 'formataLikes', () => {
	it( 'formata 0, 1 i milers', () => {
		expect( formataLikes( 0 ) ).toBe( "0 m'agrada" );
		expect( formataLikes( 1 ) ).toBe( "1 m'agrada" );
		expect( formataLikes( 1234 ) ).toBe( "1.234 m'agrada" );
		expect( formataLikes( 1234567 ) ).toBe( "1.234.567 m'agrada" );
	} );
} );

describe( 'primerNom i usuariDe', () => {
	it( 'primerNom no peta amb valors que no són text', () => {
		expect( primerNom( 'Núria Pons' ) ).toBe( 'Núria' );
		expect( primerNom( '' ) ).toBe( '' );
		[ undefined, null, 5, {} ].forEach( ( v ) =>
			expect( primerNom( v ) ).toBe( '' )
		);
	} );

	it( 'usuariDe treu accents i posa punts', () => {
		expect( usuariDe( 'Àlex Puig' ) ).toBe( 'alex.puig' );
		expect( usuariDe( undefined ) ).toBe( '' );
	} );
} );
