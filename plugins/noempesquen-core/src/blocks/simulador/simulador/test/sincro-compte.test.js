import { describe, it, expect, vi } from 'vitest';
import { progresAPujar, sincroInicial, sincronitza } from '../sincro-compte.js';

const clientFals = ( { estat, desa } = {} ) => ( {
	estat: vi.fn( estat ?? ( async () => ( { connectat: false } ) ) ),
	desaProgres: vi.fn( desa ?? ( async () => ( { ok: false } ) ) ),
} );

describe( 'sincroInicial', () => {
	it( 'without a session keeps the local progress and does not upload', async () => {
		const client = clientFals( {
			estat: async () => ( {
				connectat: false,
				nonce: null,
				progres: {},
			} ),
		} );
		const progresLocal = { 'llissa-01-factura': 2 };
		expect( await sincroInicial( { client, progresLocal } ) ).toEqual( {
			connectat: false,
			progres: progresLocal,
			calPujar: false,
		} );
		expect( client.desaProgres ).not.toHaveBeenCalled();
	} );

	it( 'with a session merges local and server keeping the maximum', async () => {
		const client = clientFals( {
			estat: async () => ( {
				connectat: true,
				nonce: 'abc',
				progres: { 'llissa-01-factura': 3, 'remei-01-paquet': 1 },
			} ),
		} );
		const r = await sincroInicial( {
			client,
			progresLocal: { 'llissa-01-factura': 1, 'llissa-02-banc': 2 },
		} );
		expect( r.connectat ).toBe( true );
		expect( r.progres ).toEqual( {
			'llissa-01-factura': 3,
			'llissa-02-banc': 2,
			'remei-01-paquet': 1,
		} );
		expect( r.calPujar ).toBe( true );
	} );

	it( 'does not ask to upload when the server already has everything', async () => {
		const client = clientFals( {
			estat: async () => ( {
				connectat: true,
				progres: { 'llissa-01-factura': 3, 'remei-01-paquet': 1 },
			} ),
		} );
		const r = await sincroInicial( {
			client,
			progresLocal: { 'llissa-01-factura': 2 },
		} );
		expect( r.progres ).toEqual( {
			'llissa-01-factura': 3,
			'remei-01-paquet': 1,
		} );
		expect( r.calPujar ).toBe( false );
	} );

	it( 'falls back to local mode without throwing on a network error', async () => {
		const client = clientFals( {
			estat: async () => {
				throw new TypeError( 'Failed to fetch' );
			},
		} );
		const progresLocal = { 'remei-02-canviat': 3 };
		await expect(
			sincroInicial( { client, progresLocal } )
		).resolves.toEqual( {
			connectat: false,
			progres: progresLocal,
			calPujar: false,
		} );
	} );
} );

describe( 'sincronitza', () => {
	it( 'sends only the progress and returns the merged server progress', async () => {
		const client = clientFals( {
			desa: async () => ( {
				ok: true,
				dades: { progres: { a: 3, b: 1 } },
			} ),
		} );
		expect( await sincronitza( { client, progres: { a: 3 } } ) ).toEqual( {
			a: 3,
			b: 1,
		} );
		expect( client.desaProgres ).toHaveBeenCalledWith( { a: 3 } );
	} );

	it( 'returns null when the PUT fails', async () => {
		const client = clientFals( {
			desa: async () => ( { ok: false, estat: 401, codi: 'x' } ),
		} );
		expect( await sincronitza( { client, progres: { a: 1 } } ) ).toBe(
			null
		);
	} );

	it( 'returns null without throwing when the network throws', async () => {
		const client = clientFals( {
			desa: async () => {
				throw new TypeError( 'Failed to fetch' );
			},
		} );
		await expect(
			sincronitza( { client, progres: { a: 1 } } )
		).resolves.toBe( null );
	} );
} );

describe( 'progresAPujar', () => {
	it( 'uploads a mission finished while the initial sync was pending', () => {
		const sincro = {
			connectat: true,
			progres: { 'remei-01-paquet': 2 },
			calPujar: false,
		};
		expect(
			progresAPujar( {
				sincro,
				vigent: { 'llissa-01-factura': 3 },
			} )
		).toEqual( { 'remei-01-paquet': 2, 'llissa-01-factura': 3 } );
	} );

	it( 'returns null when nothing is new for the server', () => {
		const sincro = {
			connectat: true,
			progres: { 'remei-01-paquet': 2 },
			calPujar: false,
		};
		expect(
			progresAPujar( { sincro, vigent: { 'remei-01-paquet': 1 } } )
		).toBe( null );
	} );

	it( 'uploads the current progress when the sync already needed it', () => {
		const sincro = {
			connectat: true,
			progres: { a: 1 },
			calPujar: true,
		};
		expect( progresAPujar( { sincro, vigent: { b: 2 } } ) ).toEqual( {
			a: 1,
			b: 2,
		} );
	} );
} );
