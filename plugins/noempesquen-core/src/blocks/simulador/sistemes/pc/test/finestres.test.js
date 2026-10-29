import { describe, it, expect } from 'vitest';
import { finestresReductor, ESTAT_FINESTRES } from '../finestres.js';

const aplica = ( accions, estat = ESTAT_FINESTRES ) =>
	accions.reduce( ( e, a ) => finestresReductor( e, a ), estat );

describe( 'finestresReductor', () => {
	it( 'obrir una app la crea enfocada i per sobre de les altres', () => {
		const e = aplica( [
			{
				tipus: 'OBRE',
				app: 'navegador',
				dades: { url: 'https://posta.cat/' },
			},
			{ tipus: 'OBRE', app: 'parla' },
		] );
		expect( e.finestres.map( ( f ) => f.app ) ).toEqual( [
			'navegador',
			'parla',
		] );
		expect( e.focus ).toBe( 'parla' );
		const [ nav, parla ] = e.finestres;
		expect( parla.z ).toBeGreaterThan( nav.z );
		expect( nav.dades ).toEqual( { url: 'https://posta.cat/' } );
		expect( nav.minimitzada ).toBe( false );
		expect( nav.maximitzada ).toBe( false );
	} );

	it( "obrir una app ja oberta l'enfoca i no la duplica", () => {
		const dades = { url: 'https://llumclara.cat/' };
		const e = aplica( [
			{ tipus: 'OBRE', app: 'navegador' },
			{ tipus: 'OBRE', app: 'parla' },
			{ tipus: 'MINIMITZA', id: 'navegador' },
			{ tipus: 'OBRE', app: 'navegador', dades },
		] );
		expect( e.finestres ).toHaveLength( 2 );
		expect( e.focus ).toBe( 'navegador' );
		const nav = e.finestres.find( ( f ) => f.app === 'navegador' );
		expect( nav.minimitzada ).toBe( false );
		expect( nav.dades ).toBe( dades );
		expect( nav.z ).toBe( Math.max( ...e.finestres.map( ( f ) => f.z ) ) );
	} );

	it( 'reobrir sense dades conserva les dades anteriors', () => {
		const dades = { url: 'https://posta.cat/' };
		const e = aplica( [
			{ tipus: 'OBRE', app: 'navegador', dades },
			{ tipus: 'OBRE', app: 'navegador' },
		] );
		expect( e.finestres[ 0 ].dades ).toBe( dades );
	} );

	it( "tancar l'enfocada passa el focus a la de z més alt", () => {
		const e = aplica( [
			{ tipus: 'OBRE', app: 'a' },
			{ tipus: 'OBRE', app: 'b' },
			{ tipus: 'OBRE', app: 'c' },
			{ tipus: 'ENFOCA', id: 'a' },
			{ tipus: 'TANCA', id: 'a' },
		] );
		expect( e.finestres.map( ( f ) => f.id ) ).toEqual( [ 'b', 'c' ] );
		expect( e.focus ).toBe( 'c' );
	} );

	it( "tancar l'última deixa el focus buit", () => {
		const e = aplica( [
			{ tipus: 'OBRE', app: 'a' },
			{ tipus: 'TANCA', id: 'a' },
		] );
		expect( e.finestres ).toEqual( [] );
		expect( e.focus ).toBeNull();
	} );

	it( 'tancar una no enfocada no mou el focus', () => {
		const e = aplica( [
			{ tipus: 'OBRE', app: 'a' },
			{ tipus: 'OBRE', app: 'b' },
			{ tipus: 'TANCA', id: 'a' },
		] );
		expect( e.focus ).toBe( 'b' );
	} );

	it( 'minimitzar treu el focus', () => {
		const e = aplica( [
			{ tipus: 'OBRE', app: 'a' },
			{ tipus: 'OBRE', app: 'b' },
			{ tipus: 'MINIMITZA', id: 'b' },
		] );
		expect( e.focus ).not.toBe( 'b' );
		expect( e.focus ).toBe( 'a' );
		expect( e.finestres.find( ( f ) => f.id === 'b' ).minimitzada ).toBe(
			true
		);
	} );

	it( 'minimitzar-les totes deixa el focus buit', () => {
		const e = aplica( [
			{ tipus: 'OBRE', app: 'a' },
			{ tipus: 'MINIMITZA', id: 'a' },
		] );
		expect( e.focus ).toBeNull();
	} );

	it( 'enfocar una minimitzada la restaura i la posa a dalt', () => {
		const e = aplica( [
			{ tipus: 'OBRE', app: 'a' },
			{ tipus: 'OBRE', app: 'b' },
			{ tipus: 'MINIMITZA', id: 'a' },
			{ tipus: 'ENFOCA', id: 'a' },
		] );
		const a = e.finestres.find( ( f ) => f.id === 'a' );
		expect( a.minimitzada ).toBe( false );
		expect( e.focus ).toBe( 'a' );
		expect( a.z ).toBeGreaterThan(
			e.finestres.find( ( f ) => f.id === 'b' ).z
		);
	} );

	it( 'maximitzar alterna i enfoca', () => {
		const un = aplica( [
			{ tipus: 'OBRE', app: 'a' },
			{ tipus: 'OBRE', app: 'b' },
			{ tipus: 'MAXIMITZA', id: 'a' },
		] );
		expect( un.finestres[ 0 ].maximitzada ).toBe( true );
		expect( un.focus ).toBe( 'a' );
		const dos = finestresReductor( un, { tipus: 'MAXIMITZA', id: 'a' } );
		expect( dos.finestres[ 0 ].maximitzada ).toBe( false );
	} );

	it( 'les accions sobre una finestra inexistent no canvien res', () => {
		const e = aplica( [ { tipus: 'OBRE', app: 'a' } ] );
		for ( const tipus of [ 'TANCA', 'ENFOCA', 'MINIMITZA', 'MAXIMITZA' ] ) {
			expect( finestresReductor( e, { tipus, id: 'x' } ) ).toBe( e );
		}
	} );

	it( "no muta l'estat anterior", () => {
		const e = aplica( [ { tipus: 'OBRE', app: 'a' } ] );
		const copia = JSON.parse( JSON.stringify( e ) );
		aplica(
			[
				{ tipus: 'OBRE', app: 'b' },
				{ tipus: 'MINIMITZA', id: 'a' },
				{ tipus: 'MAXIMITZA', id: 'a' },
				{ tipus: 'TANCA', id: 'a' },
			],
			e
		);
		expect( e ).toEqual( copia );
	} );

	it( "REINICIA torna a l'escriptori buit", () => {
		const e = aplica( [
			{ tipus: 'OBRE', app: 'a' },
			{ tipus: 'REINICIA' },
		] );
		expect( e ).toEqual( ESTAT_FINESTRES );
	} );
} );
