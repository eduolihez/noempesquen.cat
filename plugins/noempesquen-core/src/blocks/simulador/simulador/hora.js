const MINUTS_DIA = 24 * 60;

/**
 * Hora simulada: rellotge base + segons de joc, com a 'HH:MM'.
 *
 * @param {string} rellotge Hora inicial 'HH:MM'.
 * @param {number} segons   Segons de joc transcorreguts.
 * @return {string} Hora 'HH:MM' (dona la volta passada la mitjanit).
 */
export function horaDeJoc( rellotge, segons ) {
	const [ h, m ] = String( rellotge ?? '' )
		.split( ':' )
		.map( ( n ) => Number.parseInt( n, 10 ) );
	const base =
		( Number.isFinite( h ) ? h : 0 ) * 60 +
		( Number.isFinite( m ) ? m : 0 );
	const total =
		( ( ( base + Math.floor( ( segons || 0 ) / 60 ) ) % MINUTS_DIA ) +
			MINUTS_DIA ) %
		MINUTS_DIA;
	const dos = ( n ) => String( n ).padStart( 2, '0' );
	return `${ dos( Math.floor( total / 60 ) ) }:${ dos( total % 60 ) }`;
}
