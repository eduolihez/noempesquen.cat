import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import {
	preparaPrevisualitzacio,
	registraResultat,
	SUFIX_PROVA,
} from '../previsualitzacio.js';

const llegeix = ( nom ) =>
	JSON.parse(
		readFileSync(
			new URL( `../../../../../missions/${ nom }.json`, import.meta.url ),
			'utf8'
		)
	);
const factura = llegeix( 'llissa-01-factura' );
const mon = llegeix( 'mon' );

const espia = () => ( {
	getItem: vi.fn( () => null ),
	setItem: vi.fn(),
} );

describe( 'preparaPrevisualitzacio', () => {
	it( 'marca la de prova amb id propi, «esborrany» i la bandera', () => {
		const p = preparaPrevisualitzacio( structuredClone( factura ), mon );
		expect( p.id ).toBe( `${ factura.id }${ SUFIX_PROVA }` );
		expect( p.id ).not.toBe( factura.id );
		expect( p.titol ).toBe( `${ factura.titol } · esborrany` );
		expect( p.previsualitzacio ).toBe( true );
	} );

	it( 'torna null si el guió no és vàlid', () => {
		expect( preparaPrevisualitzacio( null, mon ) ).toBeNull();
		expect( preparaPrevisualitzacio( {}, mon ) ).toBeNull();
		expect(
			preparaPrevisualitzacio( { ...factura, versio: 1 }, mon )
		).toBeNull();
	} );
} );

describe( 'registraResultat', () => {
	it( 'jugar una previsualització no escriu a l’emmagatzematge', () => {
		const storage = espia();
		const prova = preparaPrevisualitzacio(
			structuredClone( factura ),
			mon
		);
		const progres = { 'llissa-02-banc': 2 };
		const nou = registraResultat( storage, progres, prova, 3 );
		expect( nou ).toBe( progres );
		expect( storage.setItem ).not.toHaveBeenCalled();
	} );

	it( 'una missió normal sí que desa el millor resultat', () => {
		const storage = espia();
		const nou = registraResultat(
			storage,
			{ [ factura.id ]: 3 },
			factura,
			1
		);
		expect( nou[ factura.id ] ).toBe( 3 );
		expect( storage.setItem ).toHaveBeenCalledTimes( 1 );
	} );
} );
