import { describe, it, expect } from 'vitest';
import { resolWeb } from '../historial.js';

const DIARI = {
	plantilla: 'diari',
	https: true,
	titol: 'El Diari del Barri',
};

describe( 'resolWeb: El Diari del Barri', () => {
	it( 'resol diaridelbarri.cat i www. per defecte', () => {
		for ( const u of [
			'https://diaridelbarri.cat/',
			'https://www.diaridelbarri.cat/noticia/x',
			'http://diaridelbarri.cat/',
		] ) {
			expect( resolWeb( u, {} ) ).toEqual( {
				plantilla: 'diari',
				dades: DIARI,
			} );
		}
	} );
	it( 'una missió pot sobreescriure-la', () => {
		const missio = {
			webs: { 'diaridelbarri.cat': { plantilla: 'enviat', x: 1 } },
		};
		expect(
			resolWeb( 'https://diaridelbarri.cat/', missio ).plantilla
		).toBe( 'enviat' );
	} );
	it( 'no resol altres dominis', () => {
		expect( resolWeb( 'https://diaridelbarri.com/', {} ) ).toBeNull();
	} );
} );
