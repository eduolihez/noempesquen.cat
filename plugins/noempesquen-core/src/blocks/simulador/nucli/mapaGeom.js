/**
 * Geometria del mapa de ruta (camí sinuós i posició dels nodes). Mòdul pur.
 *
 * Unitats del viewBox de cada mode:
 * - 'ample':  camí en S horitzontal (nodes alternant amunt i avall).
 * - 'estret': serpentina vertical (nodes alternant esquerra i dreta).
 * L'alçada de l'estret i l'amplada de l'ample creixen amb el nombre de nodes.
 */
const AMPLE = { marge: 90, pas: 170, alt: 420, dalt: 150, baix: 270 };
const ESTRET = { ample: 360, esq: 100, dre: 260, marge: 90, pas: 160 };

const arrodoneix = ( v ) => Math.round( v * 10 ) / 10;
const quants = ( n ) => ( Number.isFinite( n ) && n > 0 ? Math.floor( n ) : 0 );

/**
 * Mida del viewBox per a `n` nodes.
 *
 * @param {number} n    Nombre de nodes.
 * @param {string} mode 'ample' o 'estret'.
 * @return {{w:number,h:number}} Amplada i alçada.
 */
export function midaVista( n, mode ) {
	const k = Math.max( 1, quants( n ) );
	if ( mode === 'estret' ) {
		return {
			w: ESTRET.ample,
			h: ESTRET.marge * 2 + ( k - 1 ) * ESTRET.pas,
		};
	}
	return { w: AMPLE.marge * 2 + ( k - 1 ) * AMPLE.pas, h: AMPLE.alt };
}

/**
 * Posició del centre de cada node.
 *
 * @param {number} n    Nombre de nodes.
 * @param {string} mode 'ample' o 'estret'.
 * @return {Array<{x:number,y:number}>} Punts en unitats del viewBox.
 */
export function posicionsNodes( n, mode ) {
	return Array.from( { length: quants( n ) }, ( _, i ) => {
		const parell = i % 2 === 0;
		if ( mode === 'estret' ) {
			return {
				x: parell ? ESTRET.esq : ESTRET.dre,
				y: ESTRET.marge + i * ESTRET.pas,
			};
		}
		return {
			x: AMPLE.marge + i * AMPLE.pas,
			y: parell ? AMPLE.baix : AMPLE.dalt,
		};
	} );
}

/**
 * Atribut `d` d'un camí suau que passa per tots els punts. Cada tram és una
 * corba cúbica que només depèn dels seus dos extrems (controls al punt mitjà
 * de l'eix dominant), així el camí de `punts.slice(0, k)` és un prefix exacte
 * del camí sencer.
 *
 * @param {Array<{x:number,y:number}>} punts Punts.
 * @return {string} Camí SVG ('' si no hi ha punts).
 */
export function caminSvg( punts ) {
	const p = Array.isArray( punts ) ? punts : [];
	if ( ! p.length ) {
		return '';
	}
	const f = ( v ) => String( arrodoneix( v ) );
	let d = `M${ f( p[ 0 ].x ) } ${ f( p[ 0 ].y ) }`;
	for ( let i = 1; i < p.length; i++ ) {
		const a = p[ i - 1 ];
		const b = p[ i ];
		const horitzontal = Math.abs( b.x - a.x ) >= Math.abs( b.y - a.y );
		const c1 = horitzontal
			? { x: ( a.x + b.x ) / 2, y: a.y }
			: { x: a.x, y: ( a.y + b.y ) / 2 };
		const c2 = horitzontal
			? { x: ( a.x + b.x ) / 2, y: b.y }
			: { x: b.x, y: ( a.y + b.y ) / 2 };
		d += ` C${ f( c1.x ) } ${ f( c1.y ) } ${ f( c2.x ) } ${ f( c2.y ) } ${ f(
			b.x
		) } ${ f( b.y ) }`;
	}
	return d;
}
