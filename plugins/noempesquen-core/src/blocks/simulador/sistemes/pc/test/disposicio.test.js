import { describe, it, expect } from 'vitest';
import { disposicioInicial, mitatLliure } from '../disposicio.js';
import { finestresReductor, ESTAT_FINESTRES } from '../finestres.js';

const NAV = { id: 'navegador' };
const PARLA = { id: 'parla' };
const AREES = [
	{ amplada: 1280, alcada: 672 },
	{ amplada: 1024, alcada: 576 },
	{ amplada: 800, alcada: 500 },
];

/* Solapament en x (les dues ocupen la mateixa franja vertical). */
const interseccio = ( a, b ) =>
	Math.max(
		0,
		Math.min( a.x + a.amplada, b.x + b.amplada ) - Math.max( a.x, b.x )
	);

describe( 'disposicioInicial', () => {
	it( 'sense finestres, res', () => {
		expect( disposicioInicial( { ...AREES[ 0 ], finestres: [] } ) ).toEqual(
			{}
		);
	} );

	it( 'una finestra: mida i posició per defecte, centrada', () => {
		const d = disposicioInicial( { ...AREES[ 0 ], finestres: [ NAV ] } );
		expect( d.navegador ).toEqual( {
			x: 80,
			y: 48,
			amplada: 1120,
			alcada: 576,
		} );
		const p = disposicioInicial( { ...AREES[ 0 ], finestres: [ PARLA ] } );
		expect( p.parla.amplada ).toBe( 860 );
		expect( p.parla.alcada ).toBe( 552 );
	} );

	it.each( AREES )( 'dues finestres sense solapar a %o', ( area ) => {
		const d = disposicioInicial( {
			...area,
			finestres: [ NAV, PARLA ],
		} );
		const { navegador: n, parla: p } = d;
		expect( interseccio( n, p ) ).toBeLessThanOrEqual( 4 );
		expect( n.x + n.amplada + 8 ).toBeLessThanOrEqual( p.x );
		expect( p.x + p.amplada + 8 ).toBeLessThanOrEqual( area.amplada );
		expect( p.amplada ).toBeGreaterThanOrEqual( 420 );
		expect( n.alcada ).toBe( area.alcada - 16 );
		expect( n.x ).toBe( 8 );
	} );

	it( 'a 1280 el navegador fa ~60 % i Parla ~40 %', () => {
		const { navegador: n, parla: p } = disposicioInicial( {
			...AREES[ 0 ],
			finestres: [ NAV, PARLA ],
		} );
		expect( p.amplada ).toBe( 502 );
		expect( n.amplada ).toBe( 754 );
	} );

	it( 'a 1024 Parla pren 420 i el navegador el que queda', () => {
		const { navegador: n, parla: p } = disposicioInicial( {
			...AREES[ 1 ],
			finestres: [ NAV, PARLA ],
		} );
		expect( p.amplada ).toBe( 420 );
		expect( n.amplada ).toBe( 580 );
	} );

	it( 'maximitzades i minimitzades no compten', () => {
		const area = AREES[ 0 ];
		const d = disposicioInicial( {
			...area,
			finestres: [ NAV, { ...PARLA, minimitzada: true } ],
		} );
		expect( Object.keys( d ) ).toEqual( [ 'navegador' ] );
		expect(
			disposicioInicial( {
				...area,
				finestres: [
					{ ...NAV, maximitzada: true },
					{ ...PARLA, minimitzada: true },
				],
			} )
		).toEqual( {} );
	} );

	it( 'les finestres extra no tenen entrada (cascada)', () => {
		const d = disposicioInicial( {
			...AREES[ 0 ],
			finestres: [ NAV, PARLA, { id: 'altra' } ],
		} );
		expect( Object.keys( d ).sort() ).toEqual( [ 'navegador', 'parla' ] );
	} );
} );

describe( 'mitatLliure', () => {
	it( 'dreta si hi cap, esquerra si no, null si no', () => {
		const area = AREES[ 0 ];
		const r = { x: 8, y: 8, amplada: 600, alcada: 656 };
		expect( mitatLliure( area, [ r ] ).x ).toBe( 616 );
		const dreta = { x: 700, y: 8, amplada: 572, alcada: 656 };
		expect( mitatLliure( area, [ dreta ] ).x ).toBe( 8 );
		expect( mitatLliure( area, [ { ...r, amplada: 1200 } ] ) ).toBeNull();
	} );
} );

describe( 'finestres: disposició i manual', () => {
	const area = AREES[ 0 ];
	const obre = ( e, app ) =>
		finestresReductor( e, { tipus: 'OBRE', app, area } );

	it( 'una sola finestra no rep rect', () => {
		const e = obre( ESTAT_FINESTRES, 'navegador' );
		expect( e.finestres[ 0 ].rect ).toBeNull();
		expect( e.finestres[ 0 ].manual ).toBe( false );
	} );

	it( 'la segona reparteix les dues', () => {
		const e = obre( obre( ESTAT_FINESTRES, 'navegador' ), 'parla' );
		const [ n, p ] = e.finestres;
		expect( n.rect.x + n.rect.amplada + 8 ).toBeLessThanOrEqual( p.rect.x );
	} );

	it( 'arrossegar marca manual i obrir una altra no la recol·loca', () => {
		let e = obre( ESTAT_FINESTRES, 'navegador' );
		const rect = { x: 40, y: 20, amplada: 600, alcada: 500 };
		e = finestresReductor( e, { tipus: 'MOU', id: 'navegador', rect } );
		expect( e.finestres[ 0 ].manual ).toBe( true );
		e = obre( e, 'parla' );
		expect( e.finestres[ 0 ].rect ).toEqual( rect );
		expect( e.finestres[ 1 ].rect.x ).toBe( 648 );
	} );

	it( 'si no hi ha mitat lliure, la nova va en cascada (sense rect)', () => {
		let e = obre( ESTAT_FINESTRES, 'navegador' );
		const rect = { x: 8, y: 8, amplada: 1200, alcada: 600 };
		e = finestresReductor( e, { tipus: 'MOU', id: 'navegador', rect } );
		e = obre( e, 'parla' );
		expect( e.finestres[ 0 ].rect ).toEqual( rect );
		expect( e.finestres[ 1 ].rect ).toBeNull();
	} );
} );
