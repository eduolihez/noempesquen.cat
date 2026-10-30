import { describe, expect, it } from 'vitest';
import { ambDefectes, segment, seccioBanc } from '../textos';

describe( 'banc-solid/textos', () => {
	it( 'segment fa servir el text per defecte i el senyal del JSON', () => {
		const textos = { bloqueig: { senyal: 'urgencia' } };
		expect( segment( textos, 'bloqueig', 'Bloquejat' ) ).toEqual( {
			t: 'Bloquejat',
			senyal: 'urgencia',
		} );
	} );

	it( 'segment deixa que el JSON canviï el text', () => {
		const textos = { errata: { t: 'el conte', senyal: 'errata' } };
		expect( segment( textos, 'errata', 'el compte' ).t ).toBe( 'el conte' );
	} );

	it( 'segment sense dades o amb valors buits no té senyal', () => {
		expect( segment( undefined, 'x', 'Hola' ) ).toEqual( {
			t: 'Hola',
			senyal: undefined,
		} );
		expect(
			segment( { x: { t: '  ', senyal: '' } }, 'x', 'Hola' )
		).toEqual( { t: 'Hola', senyal: undefined } );
	} );

	it( 'ambDefectes posa els valors del banc i el JSON mana', () => {
		const f = ambDefectes(
			{ id: 'codi', nota: 'Nota JSON' },
			{ esdeveniment: 'codi.envia', nota: 'Defecte' }
		);
		expect( f ).toEqual( {
			id: 'codi',
			esdeveniment: 'codi.envia',
			nota: 'Nota JSON',
			camps: [],
		} );
		expect( ambDefectes( null, { id: 'acces' } ).camps ).toEqual( [] );
	} );

	it( 'seccioBanc reconeix les seccions i torna a l’inici', () => {
		expect( seccioBanc( 'https://bancsolid.cat/area-clients' ) ).toBe(
			'area-clients'
		);
		expect( seccioBanc( 'https://bancsolid.cat/area-clients/' ) ).toBe(
			'area-clients'
		);
		expect( seccioBanc( 'https://bancsolid.cat/' ) ).toBe( 'inici' );
		expect( seccioBanc( 'https://bancsolid.cat/res' ) ).toBe( 'inici' );
		expect( seccioBanc( 'no és una url' ) ).toBe( 'inici' );
	} );
} );
