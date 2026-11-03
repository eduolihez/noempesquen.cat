/**
 * Peces comunes de l'escena del port (sense JSX).
 */
export const TINTA = '#0b1e3f';

export const trac = ( amplada = 4 ) => ( {
	stroke: TINTA,
	strokeWidth: amplada,
	strokeLinejoin: 'round',
	strokeLinecap: 'round',
} );

/* Colors del mar, de l'horitzó cap a primer pla. */
export const MAR = [ '#8fcfd9', '#4fa6bf', '#2384a1', '#0b5e7a' ];

/**
 * Onada periòdica tancada per sota: cresta a `y`, fons a `fons`.
 * Comença un període abans de `x0` perquè es pugui desplaçar
 * exactament `periode` unitats sense que es vegi el salt.
 *
 * @param {Object} o
 * @param {number} o.x0      Inici visible.
 * @param {number} o.x1      Final visible.
 * @param {number} o.y       Alçada mitjana de la cresta.
 * @param {number} o.amp     Amplitud.
 * @param {number} o.periode Llargada d'una onada.
 * @param {number} [o.fons]  Alçada on es tanca el camí; sense, només la cresta.
 * @return {string} Atribut `d`.
 */
export function onada( { x0, x1, y, amp, periode, fons } ) {
	const inici = x0 - periode;
	const voltes = Math.ceil( ( x1 - inici ) / periode ) + 1;
	let d = `M${ inici } ${ y }Q${ inici + periode / 4 } ${ y - amp } ${
		inici + periode / 2
	} ${ y }`;
	for ( let i = 0; i < voltes * 2 - 1; i++ ) {
		d += `T${ inici + periode / 2 + ( ( i + 1 ) * periode ) / 2 } ${ y }`;
	}
	if ( fons === undefined ) {
		return d;
	}
	const fi = inici + voltes * periode;
	return `${ d }L${ fi } ${ fons }L${ inici } ${ fons }Z`;
}

/**
 * Ondetes curtes, una per període (i una altra a mig període, més avall),
 * amb el mateix inici que `onada`: es poden desplaçar un període sense salt.
 *
 * @param {Object} o
 * @param {number} o.x0      Inici visible.
 * @param {number} o.x1      Final visible.
 * @param {number} o.y       Alçada.
 * @param {number} o.periode Llargada d'una onada.
 * @return {string} Atribut `d`.
 */
export function ondetes( { x0, x1, y, periode } ) {
	let d = '';
	const l = Math.round( periode / 5 );
	for ( let x = x0 - periode; x < x1 + periode; x += periode ) {
		d += `M${ x + periode * 0.1 } ${ y }q${ l / 2 } -4 ${ l } 0`;
		d += `M${ x + periode * 0.6 } ${ y + 14 }q${ l / 3 } -3 ${ l / 1.5 } 0`;
	}
	return d;
}

/**
 * Punts (remaches, nusos) en un sol camí: es pinten amb `stroke-linecap:
 * round` i el gruix com a diàmetre.
 *
 * @param {Array<Array<number>>} llista Parells [x, y].
 * @return {string} Atribut `d`.
 */
export const punts = ( llista ) =>
	llista.map( ( [ x, y ] ) => `M${ x } ${ y }h.1` ).join( '' );

/**
 * Banderins triangulars al llarg d'un cap, repartits en tres camins (un per
 * color, alternats).
 *
 * @param {number} x0 Inici del cap.
 * @param {number} y0
 * @param {number} x1 Final del cap.
 * @param {number} y1
 * @param {number} n  Nombre de banderins.
 * @return {Array<string>} Tres atributs `d`.
 */
export function banderins( x0, y0, x1, y1, n ) {
	const camins = [ '', '', '' ];
	const dx = ( x1 - x0 ) / ( n + 1 );
	const dy = ( y1 - y0 ) / ( n + 1 );
	for ( let i = 1; i <= n; i++ ) {
		const x = x0 + dx * i;
		const y = y0 + dy * i;
		camins[ i % 3 ] += `M${ x - dx * 0.35 } ${ y - dy * 0.35 }L${
			x + dx * 0.35
		} ${ y + dy * 0.35 }L${ x } ${ y + 16 }Z`;
	}
	return camins;
}
