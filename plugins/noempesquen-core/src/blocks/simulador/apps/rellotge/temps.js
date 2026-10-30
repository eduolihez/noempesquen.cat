/**
 * Lògica pura del Rellotge: format de temps, voltes, ciutats i temporitzador.
 */

const MINUT = 1440;

function dosDigits( n ) {
	return String( n ).padStart( 2, '0' );
}

/**
 * Cronòmetre: 'mm:ss,cc' (centèsimes). Els minuts poden passar de 59.
 *
 * @param {number} ms Mil·lisegons.
 * @return {string} Text 'mm:ss,cc'.
 */
export function formata( ms ) {
	const total = Math.max( 0, Math.floor( Number( ms ) || 0 ) );
	const cs = Math.floor( ( total % 1000 ) / 10 );
	const s = Math.floor( total / 1000 ) % 60;
	const m = Math.floor( total / 60000 );
	return `${ dosDigits( m ) }:${ dosDigits( s ) },${ dosDigits( cs ) }`;
}

/**
 * Temporitzador: 'mm:ss', arrodonint cap amunt al segon (com un compte
 * enrere real: 100 ms restants encara mostren 00:01).
 *
 * @param {number} ms Mil·lisegons restants.
 * @return {string} Text 'mm:ss'.
 */
export function formataTemporitzador( ms ) {
	const total = Math.max( 0, Math.ceil( ( Number( ms ) || 0 ) / 1000 ) );
	return `${ dosDigits( Math.floor( total / 60 ) ) }:${ dosDigits(
		total % 60
	) }`;
}

/**
 * Afegeix una volta (sense mutar). Cada volta: número, temps total i
 * parcial respecte a la volta anterior.
 *
 * @param {Array<{num:number,total:number,parcial:number}>} voltes Voltes.
 * @param {number}                                          ms     Temps total.
 * @return {Array} Voltes noves.
 */
export function afegeixVolta( voltes, ms ) {
	const total = Math.max( 0, Math.floor( Number( ms ) || 0 ) );
	const anterior = voltes.length ? voltes[ voltes.length - 1 ].total : 0;
	return [
		...voltes,
		{
			num: voltes.length + 1,
			total,
			parcial: Math.max( 0, total - anterior ),
		},
	];
}

/**
 * Hora d'una ciutat a partir de l'hora base 'HH:MM' i un desfasament en
 * hores (pot ser negatiu). Dona la volta a mitjanit.
 *
 * @param {string} horaBase     Hora 'HH:MM'.
 * @param {number} desfaseHores Desfasament en hores.
 * @return {string} Hora 'HH:MM'.
 */
export function horaCiutat( horaBase, desfaseHores ) {
	const m = /^(\d{1,2}):(\d{2})$/.exec( horaBase ?? '' );
	const base = m ? ( Number( m[ 1 ] ) % 24 ) * 60 + Number( m[ 2 ] ) : 0;
	const min = Math.round( ( Number( desfaseHores ) || 0 ) * 60 );
	const t = ( ( ( base + min ) % MINUT ) + MINUT ) % MINUT;
	return `${ dosDigits( Math.floor( t / 60 ) ) }:${ dosDigits( t % 60 ) }`;
}

/**
 * Temps restant d'un temporitzador (mai negatiu).
 *
 * @param {number} totalMs       Durada.
 * @param {number} transcorregut Temps consumit.
 * @return {number} Mil·lisegons restants.
 */
export function restant( totalMs, transcorregut ) {
	return Math.max( 0, totalMs - transcorregut );
}
