import { describe, it, expect } from 'vitest';
import {
	esDesconegut,
	missatgesVisibles,
	xatsVisibles,
	ultimMissatge,
} from '../anuncis.js';

const xat = {
	id: 'x1',
	missatges: [
		{ id: 'a', de: 'ells', cos: [ { t: 'Hola' } ] },
		{ id: 'b', de: 'ells', ocult: true, cos: [ { t: 'Enllaç' } ] },
	],
};
const ocult = { id: 'x2', missatges: [ { id: 'c', ocult: true } ] };

describe( 'revenda/anuncis', () => {
	it( 'detecta el contacte desconegut', () => {
		expect( esDesconegut( { rol: 'desconegut' } ) ).toBe( true );
		expect( esDesconegut( { rol: 'amiga' } ) ).toBe( false );
		expect( esDesconegut( undefined ) ).toBe( false );
	} );

	it( 'amaga els missatges ocults fins que es mostren', () => {
		expect( missatgesVisibles( xat ).map( ( x ) => x.id ) ).toEqual( [
			'a',
		] );
		expect(
			missatgesVisibles( xat, new Set( [ 'b' ] ) ).map( ( x ) => x.id )
		).toEqual( [ 'a', 'b' ] );
	} );

	it( 'filtra els xats sense cap missatge visible', () => {
		expect( xatsVisibles( [ xat, ocult ] ) ).toEqual( [ xat ] );
		expect( xatsVisibles( [ xat, ocult ], [ 'c' ] ) ).toHaveLength( 2 );
		expect( xatsVisibles( undefined ) ).toEqual( [] );
	} );

	it( "torna l'últim missatge visible", () => {
		expect( ultimMissatge( xat ).id ).toBe( 'a' );
		expect( ultimMissatge( xat, [ 'b' ] ).id ).toBe( 'b' );
		expect( ultimMissatge( ocult ) ).toBeNull();
		expect( ultimMissatge( null ) ).toBeNull();
	} );
} );
