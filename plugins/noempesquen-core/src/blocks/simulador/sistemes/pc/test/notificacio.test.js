import { describe, it, expect } from 'vitest';
import { clauGrup, etiquetaMobil, nomCurt, presenta } from '../notificacio.js';

const ctx = {
	mon: {
		jugador: { nom: 'Àlex Puig' },
		contactes: [ { id: 'llissa', nom: 'Llissa' } ],
	},
	nomGuia: 'Llissa',
	nomsAppsPc: { navegador: 'Navegador' },
	nomsAppsMobil: { missatges: 'Missatges' },
};

describe( 'presenta', () => {
	it( "amb font mobil mostra l'origen amb dispositiu i app", () => {
		const p = presenta(
			{ app: 'missatges', titol: 'Banc', text: 'x', font: 'mobil' },
			ctx
		);
		expect( p.tipus ).toBe( 'mobil' );
		expect( p.app ).toBe( "Mòbil d'Àlex · Missatges" );
		expect( p.iconaApp ).toBe( 'missatges' );
	} );

	it( 'app mòbil desconeguda cau a la icona de mòbil sola', () => {
		const p = presenta( { app: 'xyz', titol: 't', font: 'mobil' }, ctx );
		expect( p.app ).toBe( "Mòbil d'Àlex" );
		expect( p.iconaApp ).toBeNull();
	} );

	it( 'sense font manté el comportament de PC', () => {
		expect( presenta( { app: 'posta', titol: 'A' }, ctx ) ).toMatchObject( {
			tipus: 'posta',
			app: 'Posta',
			titol: 'A',
		} );
		expect(
			presenta( { app: 'parla', titol: 'llissa' }, ctx )
		).toMatchObject( { tipus: 'parla', titol: 'Llissa' } );
		expect(
			presenta( { app: 'parla', titol: 'desconegut' }, ctx ).titol
		).toBe( 'Llissa' );
		expect( presenta( { app: 'navegador', titol: 'T' }, ctx ).app ).toBe(
			'Navegador'
		);
		expect( presenta( { app: 'altra', titol: 'T' }, ctx ).app ).toBe(
			'altra'
		);
	} );

	it( 'una app homònima sense font mobil no es confon amb la del mòbil', () => {
		expect( presenta( { app: 'missatges', titol: 'T' }, ctx ).tipus ).toBe(
			'app'
		);
	} );
} );

describe( 'helpers', () => {
	it( 'nomCurt i etiquetaMobil', () => {
		expect( nomCurt( 'Àlex Puig' ) ).toBe( 'Àlex' );
		expect( nomCurt( undefined ) ).toBe( 'Àlex' );
		expect( etiquetaMobil( 'Àlex Puig', '' ) ).toBe( "Mòbil d'Àlex" );
	} );
	it( 'clauGrup separa mòbil i PC', () => {
		expect( clauGrup( { app: 'parla', font: 'mobil' } ) ).not.toBe(
			clauGrup( { app: 'parla' } )
		);
	} );
} );
