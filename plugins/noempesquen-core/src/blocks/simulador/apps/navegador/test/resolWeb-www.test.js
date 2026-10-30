import { describe, it, expect } from 'vitest';
import { resolWeb, senseWww } from '../historial.js';

describe( 'senseWww', () => {
	it( 'treu només el prefix www.', () => {
		expect( senseWww( 'www.diaridelbarri.cat' ) ).toBe(
			'diaridelbarri.cat'
		);
		expect( senseWww( 'diaridelbarri.cat' ) ).toBe( 'diaridelbarri.cat' );
		expect( senseWww( 'wwwx.cat' ) ).toBe( 'wwwx.cat' );
	} );
} );

describe( 'resolWeb: www. fa servir la mateixa entrada', () => {
	const web = { plantilla: 'diari', https: true, anunci: { id: 'a' } };
	const missio = { webs: { 'diaridelbarri.cat': web } };
	it( 'www. resol la web de la missió sense www.', () => {
		expect( resolWeb( 'https://www.diaridelbarri.cat/', missio ) ).toEqual(
			{ plantilla: 'diari', dades: web }
		);
	} );
	it( 'el host exacte té prioritat', () => {
		const www = { plantilla: 'sorteig', variant: 'falsa' };
		const m = { webs: { ...missio.webs, 'www.diaridelbarri.cat': www } };
		expect( resolWeb( 'https://www.diaridelbarri.cat/', m ).dades ).toBe(
			www
		);
	} );
	it( 'sense missió, www. continua sent el Diari per defecte', () => {
		expect(
			resolWeb( 'https://www.diaridelbarri.cat/', {} ).dades.anunci
		).toBeUndefined();
	} );
} );
