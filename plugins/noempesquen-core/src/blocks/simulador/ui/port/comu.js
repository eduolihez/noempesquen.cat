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
