import { describe, it, expect } from 'vitest';
import { errorsGuio } from '../diagnostic.js';
import mon from '../../../missions/mon.json';
import factura from '../../../missions/llissa-01-factura.json';

const text = ( m ) => JSON.stringify( m );

describe( 'errorsGuio', () => {
	it( 'una missió real no té errors', () => {
		expect(
			errorsGuio( text( factura ), {
				mon,
				dispositiu: 'pc',
				personatge: 'llissa',
			} )
		).toEqual( [] );
	} );

	it( 'avisa si el JSON no es pot llegir', () => {
		const errors = errorsGuio( '{ "id": ', { mon } );
		expect( errors ).toHaveLength( 1 );
		expect( errors[ 0 ] ).toMatch( /no és un JSON vàlid/ );
	} );

	it( 'rebutja el que no és un objecte', () => {
		expect( errorsGuio( '[]', { mon } ) ).toHaveLength( 1 );
		expect( errorsGuio( 'null', { mon } ) ).toHaveLength( 1 );
	} );

	it( 'inclou els errors de validaMissio', () => {
		const errors = errorsGuio( text( { ...factura, versio: 1 } ), { mon } );
		expect( errors ).toContain( 'versio no suportada' );
	} );

	it( 'avisa si dispositiu o personatge no coincideixen amb els de la missió', () => {
		const errors = errorsGuio( text( factura ), {
			mon,
			dispositiu: 'mobil',
			personatge: 'remei',
		} );
		expect( errors ).toHaveLength( 2 );
		expect( errors[ 0 ] ).toMatch( /dispositiu del guió/ );
		expect( errors[ 1 ] ).toMatch( /personatge del guió/ );
	} );

	it( 'avisa si l’id ja és d’una altra missió', () => {
		const errors = errorsGuio( text( factura ), {
			mon,
			idsExistents: [ 'llissa-01-factura' ],
		} );
		expect( errors ).toEqual( [
			"Ja hi ha una altra missió amb l'id «llissa-01-factura».",
		] );
	} );
} );
