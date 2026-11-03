/**
 * Data fixa del món de joc: dimarts, 3 de novembre de 2026.
 */
import { __ } from '@wordpress/i18n';

export const DIA = 3;
export const DATA_LLARGA = __( 'dimarts, 3 de novembre', 'noempesquen' );
export const DATA_CURTA = __( '3/11/2026', 'noempesquen' );
export const MES = __( 'novembre de 2026', 'noempesquen' );
export const DIES_SETMANA = [
	__( 'dl', 'noempesquen' ),
	__( 'dt', 'noempesquen' ),
	__( 'dc', 'noempesquen' ),
	__( 'dj', 'noempesquen' ),
	__( 'dv', 'noempesquen' ),
	__( 'ds', 'noempesquen' ),
	__( 'dg', 'noempesquen' ),
];

/* L'1 de novembre de 2026 és diumenge: 6 caselles buides (setmana de dilluns). */
const BUITS_INICI = 6;
const DIES_MES = 30;

/**
 * Caselles del mes (null per als buits) en files de set.
 *
 * @return {(number|null)[][]} Setmanes.
 */
export function setmanes() {
	const caselles = [
		...Array( BUITS_INICI ).fill( null ),
		...Array.from( { length: DIES_MES }, ( _, i ) => i + 1 ),
	];
	const files = [];
	for ( let i = 0; i < caselles.length; i += 7 ) {
		const fila = caselles.slice( i, i + 7 );
		files.push( [ ...fila, ...Array( 7 - fila.length ).fill( null ) ] );
	}
	return files;
}
