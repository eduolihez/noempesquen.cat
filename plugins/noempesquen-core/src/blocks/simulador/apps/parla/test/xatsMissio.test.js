import { describe, it, expect } from 'vitest';
import { destiParla, xatEscriptible, xatsVisibles } from '../xatsMissio.js';

const mon = {
	contactes: [
		{ id: 'pau', nom: 'Pau', rol: 'fill' },
		{ id: 'remei', nom: 'Remei', rol: 'guia' },
		{ id: 'desc', nom: '+44 7700 900461', rol: 'desconegut' },
	],
	parla: {
		xats: [
			{
				id: 'pau',
				nom: 'Pau',
				missatges: [ { de: 'ella', text: 'Hola', hora: 'ahir 10:00' } ],
			},
		],
	},
};
const missio = {
	apps: {
		parla: {
			xats: [
				{
					id: 'nou',
					contacte: 'desc',
					missatges: [
						{ id: 'a', de: 'ells', text: 'Hola mama', ocult: true },
						{
							id: 'b',
							de: 'ells',
							text: 'Nou número',
							hora: '10:05',
						},
					],
				},
				{
					id: 'pau',
					missatges: [
						{ id: 'c', de: 'ells', text: 'Ei', ocult: true },
					],
				},
			],
		},
	},
};

describe( 'xatsVisibles', () => {
	it( 'amaga els missatges ocults i els xats sense cap missatge visible', () => {
		const xats = xatsVisibles( { visibles: {} }, mon, missio );
		expect( xats.map( ( x ) => x.id ) ).toEqual( [ 'pau', 'nou' ] );
		expect( xats[ 1 ].missatges.map( ( m ) => m.id ) ).toEqual( [ 'b' ] );
		expect( xats[ 0 ].missatges ).toHaveLength( 1 );
	} );

	it( 'mostra els ocults quan `mostra` els fa visibles i usa el nom del contacte', () => {
		const xats = xatsVisibles( { visibles: { a: true } }, mon, missio );
		const nou = xats.find( ( x ) => x.id === 'nou' );
		expect( nou.nom ).toBe( '+44 7700 900461' );
		expect( nou.contacte ).toBe( 'desc' );
		expect( nou.missatges.map( ( m ) => m.id ) ).toEqual( [ 'a', 'b' ] );
	} );

	it( 'afegeix els missatges de missió al xat del món amb el mateix id', () => {
		const xats = xatsVisibles( { visibles: { c: true } }, mon, missio );
		const pau = xats.find( ( x ) => x.id === 'pau' );
		expect( pau.missatges.map( ( m ) => m.text ) ).toEqual( [
			'Hola',
			'Ei',
		] );
		expect( mon.parla.xats[ 0 ].missatges ).toHaveLength( 1 );
	} );

	it( 'funciona sense apps.parla', () => {
		expect( xatsVisibles( {}, mon, {} ) ).toHaveLength( 1 );
	} );
} );

describe( 'xatEscriptible', () => {
	const c = mon.contactes;
	it( 'permet escriure a contactes coneguts', () => {
		expect( xatEscriptible( { id: 'pau' }, c ) ).toBe( true );
	} );
	it( 'no permet escriure a desconeguts, guies, xats sense contacte ni bloquejats', () => {
		expect( xatEscriptible( { id: 'x', contacte: 'desc' }, c ) ).toBe(
			false
		);
		expect( xatEscriptible( { id: 'remei' }, c ) ).toBe( false );
		expect( xatEscriptible( { id: 'familia' }, c ) ).toBe( false );
		expect( xatEscriptible( { id: 'pau' }, c, new Set( [ 'pau' ] ) ) ).toBe(
			false
		);
	} );
} );

describe( 'senyals i destí de notificació', () => {
	it( 'propaga senyal i senyal_avis', () => {
		const m = {
			apps: {
				parla: {
					xats: [
						{
							id: 'n',
							senyal_avis: 's2',
							missatges: [
								{
									id: 'a',
									de: 'ells',
									text: 'x',
									senyal: 's1',
								},
							],
						},
					],
				},
			},
		};
		const x = xatsVisibles( {}, {}, m )[ 0 ];
		expect( x.senyalAvis ).toBe( 's2' );
		expect( x.missatges[ 0 ].senyal ).toBe( 's1' );
	} );

	it( 'obre el xat indicat o, si no, el del guia', () => {
		expect( destiParla( { app: 'parla', xat: 'nou' } ) ).toEqual( [
			'parla',
			{ xat: 'nou' },
		] );
		expect( destiParla( { app: 'parla' } )[ 1 ].xat ).toBe( 'guia' );
	} );
} );
