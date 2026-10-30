import { describe, it, expect } from 'vitest';
import {
	dadesTransferencia,
	formataImport,
	interpretaImport,
	mascaraIban,
	moviments,
	nomPilaJugador,
	validaTransferencia,
	IBAN_COMPTE,
} from '../compte.js';

describe( 'compte', () => {
	it( 'formata imports en català', () => {
		expect( formataImport( 2348.62 ) ).toBe( '2.348,62 €' );
		expect( formataImport( -24.9 ) ).toBe( '-24,90 €' );
		expect( formataImport( 1640, true ) ).toBe( '+1.640,00 €' );
		expect( formataImport( 0 ) ).toBe( '0,00 €' );
	} );

	it( "emmascara l'IBAN deixant país i quatre darrers", () => {
		const m = mascaraIban( IBAN_COMPTE );
		expect( m ).toBe( 'ES12 •••• •••• •••• •••• 4821' );
		expect( m ).not.toContain( '0512' );
		expect( mascaraIban( '' ) ).toBe( '••••' );
	} );

	it( 'nom de pila amb fallback', () => {
		expect( nomPilaJugador( { jugador: { nom: 'Marta Soler' } } ) ).toBe(
			'Marta'
		);
		expect( nomPilaJugador( undefined ) ).toBe( 'Àlex' );
		expect( nomPilaJugador( { jugador: { nom: '  ' } } ) ).toBe( 'Àlex' );
	} );

	it( 'té entre 6 i 8 moviments amb ids únics', () => {
		const l = moviments();
		expect( l.length ).toBeGreaterThanOrEqual( 6 );
		expect( l.length ).toBeLessThanOrEqual( 8 );
		expect( new Set( l.map( ( x ) => x.id ) ).size ).toBe( l.length );
	} );

	it( 'interpreta imports', () => {
		expect( interpretaImport( '12,50' ) ).toBe( 12.5 );
		expect( interpretaImport( '1.200,5 €' ) ).toBe( 1200.5 );
		expect( interpretaImport( '12.5' ) ).toBe( 12.5 );
		expect( interpretaImport( 'abc' ) ).toBeNaN();
		expect( interpretaImport( '-3' ) ).toBeNaN();
	} );

	it( 'valida la transferència', () => {
		const bona = {
			beneficiari: 'Pau Ferrer',
			iban: 'ES91 2100 0418 4502 0005 1332',
			import: '25,00',
			concepte: 'Sopar',
		};
		expect( validaTransferencia( bona ) ).toEqual( {} );
		expect( Object.keys( validaTransferencia( {} ) ) ).toHaveLength( 4 );
		expect( validaTransferencia( { ...bona, iban: '1234' } ).iban ).toBe(
			'invalid'
		);
		expect( validaTransferencia( { ...bona, import: '0' } ).import ).toBe(
			'invalid'
		);
		expect(
			validaTransferencia( { ...bona, import: '9999' } ).import
		).toBe( 'saldo' );
	} );

	it( 'els errors no contenen els valors escrits', () => {
		const e = validaTransferencia( { iban: 'SECRET', import: 'SECRET' } );
		expect( JSON.stringify( e ) ).not.toContain( 'SECRET' );
	} );

	it( "l'esdeveniment només porta url i formulari", () => {
		expect( dadesTransferencia() ).toEqual( {
			url: 'app://bancsolid',
			formulari: 'transferencia',
		} );
	} );
} );
