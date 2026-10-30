import { describe, it, expect } from 'vitest';
import {
	formata,
	formataTemporitzador,
	afegeixVolta,
	horaCiutat,
	restant,
	correTemps,
} from '../temps.js';
import { FASE } from '../../../nucli/motor.js';

describe( 'formata', () => {
	it( 'mm:ss,cc', () => {
		expect( formata( 0 ) ).toBe( '00:00,00' );
		expect( formata( 61230 ) ).toBe( '01:01,23' );
		expect( formata( 3599990 ) ).toBe( '59:59,99' );
	} );
	it( 'els minuts passen de 59 i els invàlids són 0', () => {
		expect( formata( 3600000 ) ).toBe( '60:00,00' );
		expect( formata( -5 ) ).toBe( '00:00,00' );
		expect( formata( NaN ) ).toBe( '00:00,00' );
	} );
} );

describe( 'formataTemporitzador', () => {
	it( 'mm:ss arrodonint cap amunt', () => {
		expect( formataTemporitzador( 60000 ) ).toBe( '01:00' );
		expect( formataTemporitzador( 59100 ) ).toBe( '01:00' );
		expect( formataTemporitzador( 100 ) ).toBe( '00:01' );
	} );
	it( 'a 0 (o negatiu) mostra 00:00', () => {
		expect( formataTemporitzador( 0 ) ).toBe( '00:00' );
		expect( formataTemporitzador( -300 ) ).toBe( '00:00' );
	} );
} );

describe( 'afegeixVolta', () => {
	it( 'numera i calcula el parcial sense mutar', () => {
		const a = afegeixVolta( [], 1500 );
		const b = afegeixVolta( a, 4000 );
		expect( a ).toHaveLength( 1 );
		expect( b ).toEqual( [
			{ num: 1, total: 1500, parcial: 1500 },
			{ num: 2, total: 4000, parcial: 2500 },
		] );
	} );
} );

describe( 'horaCiutat', () => {
	it( 'aplica el desfasament', () => {
		expect( horaCiutat( '09:12', 0 ) ).toBe( '09:12' );
		expect( horaCiutat( '09:12', -1 ) ).toBe( '08:12' );
		expect( horaCiutat( '09:12', -6 ) ).toBe( '03:12' );
	} );
	it( 'dona la volta a mitjanit', () => {
		expect( horaCiutat( '23:30', 2 ) ).toBe( '01:30' );
		expect( horaCiutat( '01:00', -6 ) ).toBe( '19:00' );
	} );
	it( 'hora invàlida compta com 00:00', () => {
		expect( horaCiutat( 'xx', 1 ) ).toBe( '01:00' );
	} );
} );

describe( 'restant', () => {
	it( 'arriba a 0 i no baixa de 0', () => {
		expect( restant( 60000, 20000 ) ).toBe( 40000 );
		expect( restant( 60000, 60000 ) ).toBe( 0 );
		expect( restant( 60000, 90000 ) ).toBe( 0 );
	} );
} );

describe( 'correTemps', () => {
	it( 'només en fase de joc i sense pausa', () => {
		expect( correTemps( { fase: FASE.JOC, pausa: false } ) ).toBe( true );
		expect( correTemps( { fase: FASE.JOC, pausa: true } ) ).toBe( false );
		expect( correTemps( { fase: FASE.CONSEQUENCIA, pausa: false } ) ).toBe(
			false
		);
		expect( correTemps( undefined ) ).toBe( false );
	} );
} );
