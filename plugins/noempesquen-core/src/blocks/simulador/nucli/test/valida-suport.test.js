import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validaMissio } from '../valida.js';
import { FASE, estatInicial, reductor } from '../motor.js';

const llegeix = ( nom ) =>
	JSON.parse(
		readFileSync(
			new URL( `../../../../../missions/${ nom }`, import.meta.url ),
			'utf8'
		)
	);
const mon = llegeix( 'mon.json' );
const URL_WEB = 'https://llumclara-pagaments.com/suport';

const fixture = () => {
	const m = llegeix( 'llissa-01-factura.json' );
	m.disparadors.push(
		{
			quan: { esdeveniment: 'telefon.truca', url: URL_WEB },
			efectes: [ { tipus: 'pescat' } ],
		},
		{
			quan: {
				esdeveniment: 'descarrega.fes',
				url: URL_WEB,
				fitxer: 'ajuda.exe',
			},
			efectes: [ { tipus: 'guia-diu', text: 'Compte.' } ],
		}
	);
	return m;
};
const errors = ( m ) => validaMissio( m, mon );
const aplica = ( m, ...accions ) =>
	accions.reduce(
		( e, a ) => reductor( m, e, a ),
		reductor( m, estatInicial( m ), { tipus: 'DESBLOQUEJA' } )
	);
const esdev = ( nom, dades ) => ( { tipus: 'ESDEVENIMENT', nom, dades } );

describe( 'validaMissio: telefon.truca i descarrega.fes', () => {
	it( 'accepta disparadors amb els dos esdeveniments', () => {
		expect( errors( fixture() ) ).toEqual( [] );
	} );

	it( 'segueix rebutjant esdeveniments desconeguts', () => {
		const m = fixture();
		m.disparadors.at( -1 ).quan.esdeveniment = 'telefon.inventat';
		expect( errors( m ) ).toContain(
			'esdeveniment desconegut: telefon.inventat'
		);
	} );

	it( 'rebutja un fitxer que no és text', () => {
		const m = fixture();
		m.disparadors.at( -1 ).quan.fitxer = 5;
		expect( errors( m ) ).toContain( 'fitxer ha de ser text' );
	} );
} );

describe( 'motor: telefon.truca i descarrega.fes', () => {
	it( 'telefon.truca emet pescat', () => {
		const m = fixture();
		const e = aplica( m, esdev( 'telefon.truca', { url: URL_WEB } ) );
		expect( e.pescat ).toBe( true );
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
	} );

	it( 'descarrega.fes filtra per fitxer i per url', () => {
		const m = fixture();
		const guies = ( e ) => e.xat.length;
		const base = guies( aplica( m ) );
		const altre = aplica(
			m,
			esdev( 'descarrega.fes', { url: URL_WEB, fitxer: 'altre.pdf' } )
		);
		expect( guies( altre ) ).toBe( base );
		const bo = aplica(
			m,
			esdev( 'descarrega.fes', { url: URL_WEB, fitxer: 'ajuda.exe' } )
		);
		expect( guies( bo ) ).toBe( base + 1 );
	} );
} );
