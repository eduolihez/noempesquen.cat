import { describe, it, expect } from 'vitest';
import { desenllac } from '../desenllac.js';

const missio = {
	decisio: {
		opcions: [
			{ id: 'a', valor: 'incorrecta', resposta: 'Has picat.' },
			{ id: 'c', valor: 'correcta', resposta: 'Perfecte.' },
			{ id: 'd', valor: 'parcial', resposta: 'Gairebé.' },
		],
	},
	frases: { pescat: 'Has enviat les dades.' },
};

describe( 'desenllac', () => {
	it( 'treats sending the fake form as caught, with the pescat phrase', () => {
		expect( desenllac( missio, { pescat: true, opcio: null } ) ).toEqual( {
			tipus: 'pescat',
			caigut: true,
			avatar: 'trista',
			text: 'Has enviat les dades.',
		} );
	} );

	it( 'treats a wrong decision as caught, with its answer', () => {
		expect( desenllac( missio, { pescat: false, opcio: 'a' } ) ).toEqual( {
			tipus: 'incorrecta',
			caigut: true,
			avatar: 'trista',
			text: 'Has picat.',
		} );
	} );

	it( 'celebrates the right decision', () => {
		expect( desenllac( missio, { pescat: false, opcio: 'c' } ) ).toEqual( {
			tipus: 'correcta',
			caigut: false,
			avatar: 'contenta',
			text: 'Perfecte.',
		} );
	} );

	it( 'keeps a neutral face for a partial decision', () => {
		expect( desenllac( missio, { pescat: false, opcio: 'd' } ) ).toEqual( {
			tipus: 'parcial',
			caigut: false,
			avatar: 'normal',
			text: 'Gairebé.',
		} );
	} );

	it( 'gives pescat priority over a chosen option', () => {
		expect( desenllac( missio, { pescat: true, opcio: 'c' } ).tipus ).toBe(
			'pescat'
		);
	} );

	it( 'returns null when nothing has happened yet', () => {
		expect( desenllac( missio, { pescat: false, opcio: null } ) ).toBe(
			null
		);
	} );
} );
