import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validaMon } from '../valida-mon.js';

const carrega = () =>
	JSON.parse(
		readFileSync(
			new URL( '../../../../../missions/ca/mon.json', import.meta.url ),
			'utf8'
		)
	);

const amb = ( canvi ) => {
	const mon = carrega();
	canvi( mon );
	return validaMon( mon );
};

describe( 'validaMon', () => {
	it( 'el mon.json real és vàlid', () => {
		expect( validaMon( carrega() ) ).toEqual( [] );
	} );

	it( 'detecta id duplicat', () => {
		const e = amb( ( m ) => {
			m.galeria[ 1 ].id = m.galeria[ 0 ].id;
		} );
		expect( e.join( '\n' ) ).toMatch( /id duplicat/ );
	} );

	it( 'detecta il·lustració inexistent', () => {
		const e = amb( ( m ) => {
			m.diari[ 0 ].il = 'inexistent';
		} );
		expect( e.join( '\n' ) ).toMatch( /il·lustració inexistent/ );
	} );

	it( 'detecta autor inexistent', () => {
		const e = amb( ( m ) => {
			m.ullada.publicacions[ 0 ].autor = 'ningu';
		} );
		expect( e.join( '\n' ) ).toMatch( /autor inexistent/ );
	} );

	it( 'detecta camp buit, data no ISO i cos incorrecte', () => {
		expect(
			amb( ( m ) => {
				m.galeria[ 0 ].titol = '  ';
			} ).join( '\n' )
		).toMatch( /«titol» buit/ );
		expect(
			amb( ( m ) => {
				m.galeria[ 0 ].data = '14/08/2026';
			} ).join( '\n' )
		).toMatch( /data no ISO/ );
		expect(
			amb( ( m ) => {
				m.diari[ 0 ].cos = 'text';
			} ).join( '\n' )
		).toMatch( /«cos»/ );
	} );

	it( 'detecta claus absents', () => {
		const e = amb( ( m ) => {
			delete m.galeria;
			delete m.ullada;
		} );
		expect( e.join( '\n' ) ).toMatch( /galeria/ );
		expect( e.join( '\n' ) ).toMatch( /ullada/ );
	} );

	it( 'no llança amb entrades incorrectes', () => {
		expect( validaMon( null ) ).not.toEqual( [] );
		expect( validaMon( undefined ) ).not.toEqual( [] );
		expect( validaMon( 'x' ) ).not.toEqual( [] );
		expect(
			validaMon( {
				galeria: [ null ],
				diari: 5,
				ullada: { perfils: {} },
			} ).length
		).toBeGreaterThan( 0 );
	} );
} );
