import { describe, it, expect } from 'vitest';
import {
	forat,
	panells,
	posicioTargeta,
	relatiu,
	triaAncora,
	haCanviat,
} from '../guia-tutorial-geometria.js';

const CONT = { amplada: 1000, alcada: 600 };
const TARGETA = { amplada: 300, alcada: 150 };
const area = ( r ) => r.amplada * r.alcada;
const solapa = ( a, b ) =>
	a.x < b.x + b.amplada &&
	b.x < a.x + a.amplada &&
	a.y < b.y + b.alcada &&
	b.y < a.y + a.alcada;

describe( 'relatiu', () => {
	it( 'resta l’origen del contenidor', () => {
		expect(
			relatiu(
				{ left: 110, top: 70, width: 40, height: 20 },
				{ left: 100, top: 50 }
			)
		).toEqual( { x: 10, y: 20, amplada: 40, alcada: 20 } );
	} );
} );

describe( 'forat', () => {
	it( 'afegeix el marge a cada costat', () => {
		expect(
			forat( { x: 100, y: 100, amplada: 50, alcada: 20 }, CONT, 8 )
		).toEqual( { x: 92, y: 92, amplada: 66, alcada: 36 } );
	} );

	it( 'retalla al contenidor', () => {
		expect(
			forat( { x: -20, y: 590, amplada: 100, alcada: 40 }, CONT, 8 )
		).toEqual( { x: 0, y: 582, amplada: 88, alcada: 18 } );
	} );

	it( 'àncora nul·la, buida o fora: sense forat', () => {
		expect( forat( null, CONT ) ).toBeNull();
		expect(
			forat( { x: 10, y: 10, amplada: 0, alcada: 10 }, CONT )
		).toBeNull();
		expect(
			forat( { x: 2000, y: 10, amplada: 50, alcada: 10 }, CONT )
		).toBeNull();
	} );
} );

describe( 'panells', () => {
	it( 'sense forat: un sol panell que ho cobreix tot', () => {
		expect( panells( null, CONT ) ).toEqual( [
			{ x: 0, y: 0, amplada: 1000, alcada: 600 },
		] );
	} );

	it.each( [
		[ 'al mig', { x: 400, y: 250, amplada: 200, alcada: 100 } ],
		[ 'a la cantonada', { x: 0, y: 0, amplada: 120, alcada: 60 } ],
		[ 'a baix a la dreta', { x: 900, y: 560, amplada: 100, alcada: 40 } ],
		[ 'tot el contenidor', { x: 0, y: 0, amplada: 1000, alcada: 600 } ],
	] )(
		'quatre panells sense solapar que cobreixen tot menys el forat (%s)',
		( _, f ) => {
			const ps = panells( f, CONT );
			expect( ps ).toHaveLength( 4 );
			ps.forEach( ( p ) => {
				expect( p.amplada ).toBeGreaterThanOrEqual( 0 );
				expect( p.alcada ).toBeGreaterThanOrEqual( 0 );
				expect( solapa( p, f ) ).toBe( false );
			} );
			for ( let i = 0; i < ps.length; i++ ) {
				for ( let j = i + 1; j < ps.length; j++ ) {
					expect( solapa( ps[ i ], ps[ j ] ) ).toBe( false );
				}
			}
			const total = ps.reduce( ( s, p ) => s + area( p ), 0 );
			expect( total + area( f ) ).toBe( area( CONT ) );
		}
	);
} );

describe( 'posicioTargeta', () => {
	const dins = ( p ) => {
		expect( p.x ).toBeGreaterThanOrEqual( 8 );
		expect( p.y ).toBeGreaterThanOrEqual( 8 );
		expect( p.x + TARGETA.amplada ).toBeLessThanOrEqual( CONT.amplada - 8 );
		expect( p.y + TARGETA.alcada ).toBeLessThanOrEqual( CONT.alcada - 8 );
	};

	it( 'a dalt: sota el forat', () => {
		const f = { x: 400, y: 20, amplada: 200, alcada: 60 };
		const p = posicioTargeta( f, CONT, TARGETA );
		expect( p.costat ).toBe( 'sota' );
		expect( p.y ).toBe( 92 );
		expect( p.x ).toBe( 350 );
		dins( p );
	} );

	it( 'a baix (barra): a sobre del forat', () => {
		const f = { x: 0, y: 552, amplada: 1000, alcada: 48 };
		const p = posicioTargeta( f, CONT, TARGETA );
		expect( p.costat ).toBe( 'sobre' );
		expect( p.y ).toBe( 552 - 12 - 150 );
		dins( p );
	} );

	it( 'alt a l’esquerra: al costat dret', () => {
		const f = { x: 20, y: 0, amplada: 200, alcada: 600 };
		const p = posicioTargeta( f, CONT, TARGETA );
		expect( p.costat ).toBe( 'dreta' );
		expect( p.x ).toBe( 232 );
		dins( p );
	} );

	it( 'alt a la dreta: al costat esquerre', () => {
		const f = { x: 700, y: 0, amplada: 300, alcada: 600 };
		const p = posicioTargeta( f, CONT, TARGETA );
		expect( p.costat ).toBe( 'esquerra' );
		expect( p.x ).toBe( 700 - 12 - 300 );
		dins( p );
	} );

	it( 'forat a la vora: la targeta no surt del contenidor', () => {
		const f = { x: 960, y: 20, amplada: 40, alcada: 40 };
		const p = posicioTargeta( f, CONT, TARGETA );
		expect( p.costat ).toBe( 'sota' );
		dins( p );
	} );

	it( 'sense forat o sense lloc: centrada', () => {
		expect( posicioTargeta( null, CONT, TARGETA ) ).toEqual( {
			costat: 'centre',
			x: 350,
			y: 225,
		} );
		const tot = { x: 0, y: 0, amplada: 1000, alcada: 600 };
		expect( posicioTargeta( tot, CONT, TARGETA ).costat ).toBe( 'centre' );
	} );

	it( 'apaïsat baix (863×360): retallada a la franja gran, mai sobre el forat', () => {
		const cont = { amplada: 863, alcada: 360 };
		const t = { amplada: 360, alcada: 220 };
		const f = { x: 300, y: 60, amplada: 500, alcada: 150 };
		const p = posicioTargeta( f, cont, t );
		expect( p.costat ).toBe( 'sota' );
		expect( p.y ).toBeGreaterThanOrEqual( f.y + f.alcada );
		expect( p.y + p.maxAlcada ).toBeLessThanOrEqual( 360 - 8 );
		const alt = { x: 300, y: 190, amplada: 500, alcada: 120 };
		const q = posicioTargeta( alt, cont, t );
		expect( q.costat ).toBe( 'sobre' );
		expect( q.y ).toBe( 8 );
		expect( q.y + q.maxAlcada ).toBeLessThanOrEqual( alt.y );
	} );

	it( 'contenidor petit (mòbil 320 px): dins i sense coordenades negatives', () => {
		const petit = { amplada: 320, alcada: 480 };
		const t = { amplada: 304, alcada: 200 };
		const f = { x: 100, y: 200, amplada: 120, alcada: 80 };
		const p = posicioTargeta( f, petit, t );
		// No hi cap sencera: sota, retallada, sense tapar el forat.
		expect( p.costat ).toBe( 'sota' );
		expect( p.x ).toBe( 8 );
		expect( p.y ).toBe( 292 );
		expect( p.maxAlcada ).toBe( 180 );
		const p2 = posicioTargeta(
			{ x: 0, y: 420, amplada: 320, alcada: 60 },
			petit,
			t
		);
		expect( p2.costat ).toBe( 'sobre' );
		expect( p2.y ).toBe( 420 - 12 - 200 );
	} );
} );

describe( 'triaAncora', () => {
	it( 'el primer visible', () => {
		expect(
			triaAncora(
				[
					{ visible: false, foc: false },
					{ visible: true, foc: false },
					{ visible: true, foc: false },
				],
				'enllacos'
			)
		).toBe( 1 );
	} );

	it( 'botons-finestra: el de la finestra amb focus o, si no, l’últim', () => {
		expect(
			triaAncora(
				[
					{ visible: true, foc: true },
					{ visible: true, foc: false },
				],
				'botons-finestra'
			)
		).toBe( 0 );
		expect(
			triaAncora(
				[
					{ visible: true, foc: false },
					{ visible: true, foc: false },
					{ visible: false, foc: false },
				],
				'botons-finestra'
			)
		).toBe( 1 );
	} );

	it( 'cap visible: -1', () => {
		expect( triaAncora( [], 'barra' ) ).toBe( -1 );
		expect(
			triaAncora( [ { visible: false, foc: true } ], 'botons-finestra' )
		).toBe( -1 );
	} );
} );

describe( 'haCanviat', () => {
	it( 'només per sobre de 0,5 px', () => {
		const a = { x: 10, y: 10, amplada: 50, alcada: 20 };
		expect( haCanviat( a, { ...a, x: 10.4 } ) ).toBe( false );
		expect( haCanviat( a, { ...a, x: 10.6 } ) ).toBe( true );
		expect( haCanviat( null, null ) ).toBe( false );
		expect( haCanviat( a, null ) ).toBe( true );
	} );
} );
