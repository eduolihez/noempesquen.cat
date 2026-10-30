import { describe, it, expect } from 'vitest';
import {
	ESTAT_NAVEGADOR,
	NOVA_PESTANYA,
	ajustaEsquema,
	estatInicial,
	navegadorReductor,
	normalitzaUrl,
	pestanyaActiva,
	resolWeb,
	urlActual,
} from '../historial.js';

const aplica = ( accions, estat = ESTAT_NAVEGADOR ) =>
	accions.reduce( ( e, a ) => navegadorReductor( e, a ), estat );

const MISSIO = {
	webs: {
		'llumclara.cat': { plantilla: 'llum-clara', https: true },
		'llumclara-pagaments.com': {
			plantilla: 'llum-clara',
			https: true,
			domini_senyal: 'domini',
		},
		'insegur.cat': { plantilla: 'llum-clara', https: false },
	},
};

describe( 'navegadorReductor', () => {
	it( "obrir una pestanya l'afegeix activa amb un historial d'una URL", () => {
		const e = aplica( [
			{ tipus: 'OBRE_PESTANYA', url: 'https://posta.cat/' },
			{ tipus: 'OBRE_PESTANYA' },
		] );
		expect( e.pestanyes ).toHaveLength( 2 );
		const [ primera, segona ] = e.pestanyes;
		expect( primera.historial ).toEqual( [ 'https://posta.cat/' ] );
		expect( primera.index ).toBe( 0 );
		expect( segona.historial ).toEqual( [ NOVA_PESTANYA ] );
		expect( e.activa ).toBe( segona.id );
		expect( primera.id ).not.toBe( segona.id );
	} );

	it( "navegar trunca l'historial endavant", () => {
		const e = aplica( [
			{ tipus: 'OBRE_PESTANYA', url: 'https://a.cat/' },
			{ tipus: 'NAVEGA', url: 'https://b.cat/' },
			{ tipus: 'NAVEGA', url: 'https://c.cat/' },
			{ tipus: 'ENRERE' },
			{ tipus: 'ENRERE' },
			{ tipus: 'NAVEGA', url: 'https://d.cat/' },
		] );
		const p = pestanyaActiva( e );
		expect( p.historial ).toEqual( [ 'https://a.cat/', 'https://d.cat/' ] );
		expect( p.index ).toBe( 1 );
		expect( urlActual( p ) ).toBe( 'https://d.cat/' );
	} );

	it( "enrere i endavant mouen l'índex", () => {
		const base = aplica( [
			{ tipus: 'OBRE_PESTANYA', url: 'https://a.cat/' },
			{ tipus: 'NAVEGA', url: 'https://b.cat/' },
		] );
		const enrere = navegadorReductor( base, { tipus: 'ENRERE' } );
		expect( pestanyaActiva( enrere ).index ).toBe( 0 );
		expect( navegadorReductor( enrere, { tipus: 'ENRERE' } ) ).toBe(
			enrere
		);
		const endavant = navegadorReductor( enrere, { tipus: 'ENDAVANT' } );
		expect( urlActual( pestanyaActiva( endavant ) ) ).toBe(
			'https://b.cat/'
		);
		expect( navegadorReductor( endavant, { tipus: 'ENDAVANT' } ) ).toBe(
			endavant
		);
	} );

	it( 'cada càrrega de la pestanya activa incrementa el comptador', () => {
		const e = aplica( [
			{ tipus: 'OBRE_PESTANYA', url: 'https://a.cat/' },
			{ tipus: 'NAVEGA', url: 'https://b.cat/' },
			{ tipus: 'ENRERE' },
			{ tipus: 'RECARREGA' },
		] );
		expect( e.carregues ).toBe( 4 );
		const id = e.pestanyes[ 0 ].id;
		const altra = aplica( [ { tipus: 'OBRE_PESTANYA' } ], e );
		const tornada = navegadorReductor( altra, { tipus: 'ACTIVA', id } );
		expect( tornada.activa ).toBe( id );
		expect( tornada.carregues ).toBe( altra.carregues );
	} );

	it( "tancar l'última pestanya obre la nova pestanya", () => {
		const e = aplica( [
			{ tipus: 'OBRE_PESTANYA', url: 'https://posta.cat/' },
		] );
		const tancat = navegadorReductor( e, {
			tipus: 'TANCA_PESTANYA',
			id: e.activa,
		} );
		expect( tancat.pestanyes ).toHaveLength( 1 );
		expect( urlActual( pestanyaActiva( tancat ) ) ).toBe( NOVA_PESTANYA );
	} );

	it( "tancar l'activa activa la de la dreta o, si no n'hi ha, la de l'esquerra", () => {
		const e = aplica( [
			{ tipus: 'OBRE_PESTANYA', url: 'https://a.cat/' },
			{ tipus: 'OBRE_PESTANYA', url: 'https://b.cat/' },
			{ tipus: 'OBRE_PESTANYA', url: 'https://c.cat/' },
		] );
		const [ a, b, c ] = e.pestanyes;
		const mig = navegadorReductor(
			navegadorReductor( e, { tipus: 'ACTIVA', id: b.id } ),
			{ tipus: 'TANCA_PESTANYA', id: b.id }
		);
		expect( mig.activa ).toBe( c.id );
		const ultima = navegadorReductor( mig, {
			tipus: 'TANCA_PESTANYA',
			id: c.id,
		} );
		expect( ultima.activa ).toBe( a.id );
		const inactiva = navegadorReductor( e, {
			tipus: 'TANCA_PESTANYA',
			id: a.id,
		} );
		expect( inactiva.activa ).toBe( c.id );
	} );

	it( 'ignora accions sobre pestanyes que no existeixen', () => {
		const e = aplica( [
			{ tipus: 'OBRE_PESTANYA', url: 'https://a.cat/' },
		] );
		expect( navegadorReductor( e, { tipus: 'ACTIVA', id: 99 } ) ).toBe( e );
		expect(
			navegadorReductor( e, { tipus: 'TANCA_PESTANYA', id: 99 } )
		).toBe( e );
	} );

	it( 'estatInicial obre la URL donada o la nova pestanya', () => {
		expect(
			urlActual( pestanyaActiva( estatInicial( 'https://posta.cat/' ) ) )
		).toBe( 'https://posta.cat/' );
		expect( urlActual( pestanyaActiva( estatInicial() ) ) ).toBe(
			NOVA_PESTANYA
		);
	} );
} );

describe( 'normalitzaUrl', () => {
	it( 'normalitzaUrl afegeix https i reconeix cerques', () => {
		expect( normalitzaUrl( 'llumclara.cat' ) ).toBe(
			'https://llumclara.cat/'
		);
		expect( normalitzaUrl( '  LlumClara.cat/factures ' ) ).toBe(
			'https://llumclara.cat/factures'
		);
		expect( normalitzaUrl( 'http://posta.cat' ) ).toBe(
			'http://posta.cat/'
		);
		expect( normalitzaUrl( 'factura llum' ) ).toBe(
			'cerca:factura%20llum'
		);
		expect( normalitzaUrl( 'llumclara' ) ).toBe( 'cerca:llumclara' );
		expect( normalitzaUrl( 'llum clara.cat' ) ).toBe(
			'cerca:llum%20clara.cat'
		);
		expect( normalitzaUrl( '   ' ) ).toBeNull();
	} );
} );

describe( 'resolWeb', () => {
	it( 'resol per hostname i posta.cat sempre és Posta', () => {
		expect(
			resolWeb( 'http://llumclara-pagaments.com/pagament?ref=1', MISSIO )
		).toEqual( {
			plantilla: 'llum-clara',
			dades: MISSIO.webs[ 'llumclara-pagaments.com' ],
		} );
		expect( resolWeb( 'https://posta.cat/', {} ).plantilla ).toBe(
			'posta'
		);
		expect( resolWeb( 'https://desconegut.example/', MISSIO ) ).toBeNull();
		expect( resolWeb( 'cerca:hola', MISSIO ) ).toBeNull();
		expect( resolWeb( NOVA_PESTANYA, MISSIO ) ).toBeNull();
	} );

	it( 'ajustaEsquema porta a https les webs que en tenen', () => {
		expect(
			ajustaEsquema( 'http://llumclara-pagaments.com/p?x=1', MISSIO )
		).toBe( 'https://llumclara-pagaments.com/p?x=1' );
		expect( ajustaEsquema( 'http://insegur.cat/', MISSIO ) ).toBe(
			'http://insegur.cat/'
		);
		expect( ajustaEsquema( 'http://desconegut.cat/', MISSIO ) ).toBe(
			'http://desconegut.cat/'
		);
	} );
} );

describe( 'navegar a la URL actual', () => {
	it( 'no duplica l’historial però compta una càrrega', () => {
		const abans = aplica( [
			{ tipus: 'OBRE_PESTANYA', url: 'https://a.cat/' },
			{ tipus: 'NAVEGA', url: 'https://b.cat/' },
		] );
		const despres = aplica(
			[ { tipus: 'NAVEGA', url: 'https://b.cat/' } ],
			abans
		);
		const p = pestanyaActiva( despres );
		expect( p.historial ).toEqual( [ 'https://a.cat/', 'https://b.cat/' ] );
		expect( p.index ).toBe( 1 );
		expect( despres.carregues ).toBe( abans.carregues + 1 );
	} );
} );
