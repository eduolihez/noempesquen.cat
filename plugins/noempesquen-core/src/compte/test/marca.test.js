import { describe, it, expect } from 'vitest';
import {
	CLAU_SESSIO,
	hiHaMarcaSessio,
	posaMarcaSessio,
	treuMarcaSessio,
} from '../marca.js';

const magatzemFals = () => {
	const dades = new Map();
	return {
		dades,
		getItem: ( k ) => ( dades.has( k ) ? dades.get( k ) : null ),
		setItem: ( k, v ) => dades.set( k, String( v ) ),
		removeItem: ( k ) => dades.delete( k ),
	};
};

const trencat = {
	getItem() {
		throw new Error( 'bloquejat' );
	},
	setItem() {
		throw new Error( 'bloquejat' );
	},
	removeItem() {
		throw new Error( 'bloquejat' );
	},
};

describe( 'session marker', () => {
	it( 'stores only the value 1 under its key and removes it', () => {
		const m = magatzemFals();
		expect( hiHaMarcaSessio( m ) ).toBe( false );
		posaMarcaSessio( m );
		expect( [ ...m.dades ] ).toEqual( [ [ CLAU_SESSIO, '1' ] ] );
		expect( hiHaMarcaSessio( m ) ).toBe( true );
		treuMarcaSessio( m );
		expect( hiHaMarcaSessio( m ) ).toBe( false );
	} );

	it( 'never throws when storage is blocked or missing', () => {
		expect( () => posaMarcaSessio( trencat ) ).not.toThrow();
		expect( () => treuMarcaSessio( trencat ) ).not.toThrow();
		expect( hiHaMarcaSessio( trencat ) ).toBe( false );
		expect( hiHaMarcaSessio( null ) ).toBe( false );
		expect( hiHaMarcaSessio() ).toBe( false );
	} );
} );
