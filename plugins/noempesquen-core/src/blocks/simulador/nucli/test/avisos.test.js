import { describe, it, expect } from 'vitest';
import { duradaAvis, planificaAvisos } from '../avisos.js';

describe( 'duradaAvis', () => {
	it( 'texto vacío o no string da la base', () => {
		expect( duradaAvis( '' ) ).toBe( 4000 );
		expect( duradaAvis( undefined ) ).toBe( 4000 );
	} );
	it( 'crece con la longitud', () => {
		expect( duradaAvis( 'a'.repeat( 10 ) ) ).toBe( 4600 );
	} );
	it( 'límites: 83 aún no topa, 84 topa', () => {
		expect( duradaAvis( 'a'.repeat( 83 ) ) ).toBe( 8980 );
		expect( duradaAvis( 'a'.repeat( 84 ) ) ).toBe( 9000 );
		expect( duradaAvis( 'a'.repeat( 5000 ) ) ).toBe( 9000 );
	} );
} );

describe( 'planificaAvisos', () => {
	const o = { entre: 700 };
	it( 'cola vacía', () => {
		expect( planificaAvisos( [], 0, null, o ) ).toEqual( {
			mostra: [],
			espera: [],
			properaEntrada: null,
		} );
	} );
	it( 'sin entrada previa entra el primero y el resto espera en orden', () => {
		const r = planificaAvisos( [ 'a', 'b', 'c' ], 1000, null, o );
		expect( r.mostra ).toEqual( [ 'a' ] );
		expect( r.espera ).toEqual( [ 'b', 'c' ] );
		expect( r.properaEntrada ).toBe( 1700 );
	} );
	it( 'dentro del intervalo no entra ninguno y no se pierde nada', () => {
		const r = planificaAvisos( [ 'a', 'b' ], 1300, 1000, o );
		expect( r.mostra ).toEqual( [] );
		expect( r.espera ).toEqual( [ 'a', 'b' ] );
		expect( r.properaEntrada ).toBe( 1700 );
	} );
	it( 'justo en el límite entra', () => {
		const r = planificaAvisos( [ 'a' ], 1700, 1000, o );
		expect( r.mostra ).toEqual( [ 'a' ] );
		expect( r.properaEntrada ).toBeNull();
	} );
	it( 'sin pérdida: mostra + espera conserva todo y el orden', () => {
		const cua = [ 1, 2, 3, 4 ];
		const r = planificaAvisos( cua, 5000, 0, o );
		expect( [ ...r.mostra, ...r.espera ] ).toEqual( cua );
	} );
	it( 'no muta la cola', () => {
		const cua = [ 'a', 'b' ];
		planificaAvisos( cua, 0, 0, o );
		expect( cua ).toEqual( [ 'a', 'b' ] );
	} );
} );
