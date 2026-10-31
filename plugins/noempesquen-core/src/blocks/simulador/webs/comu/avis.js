/**
 * Lògica pura dels avisos falsos (overlay d'alerta, barra d'actualització i
 * diàleg de baixada): sense JSX ni DOM, per poder-la provar amb Vitest.
 */

/** Selector dels elements que poden rebre el focus dins d'un diàleg. */
export const SELECTOR_FOCUSABLES =
	'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accepta un cos com a llista de segments (un sol paràgraf) o com a llista de
 * paràgrafs i el retorna sempre com a paràgrafs, que és el que espera `Cos`.
 *
 * @param {*} cos Segments `{ t, senyal? }` o paràgrafs (arrays de segments).
 * @return {Array<Array<Object>>} Paràgrafs.
 */
export function normalitzaParagrafs( cos ) {
	if ( ! Array.isArray( cos ) || cos.length === 0 ) {
		return [];
	}
	if ( cos.every( Array.isArray ) ) {
		return cos;
	}
	return [ cos.filter( ( seg ) => seg && typeof seg === 'object' ) ];
}

/**
 * Índex on ha d'anar el focus en prémer Tab dins d'un diàleg amb el focus
 * atrapat, o -1 si cal deixar fer el navegador (no s'és a cap extrem).
 *
 * @param {number}  actual Índex de l'element actiu (-1 si és fora).
 * @param {number}  total  Nombre d'elements focusables.
 * @param {boolean} enrere Si és Maj+Tab.
 * @return {number} Índex de destí o -1.
 */
export function indexFocusAtrapat( actual, total, enrere ) {
	if ( total <= 0 ) {
		return -1;
	}
	if ( actual < 0 ) {
		return enrere ? total - 1 : 0;
	}
	if ( enrere && actual === 0 ) {
		return total - 1;
	}
	if ( ! enrere && actual === total - 1 ) {
		return 0;
	}
	return -1;
}

/**
 * Gestor de Tab per a un diàleg: manté el focus a dins.
 *
 * @param {KeyboardEvent} e          Esdeveniment de teclat.
 * @param {Element}       contenidor Element arrel del diàleg.
 */
export function atrapaFocus( e, contenidor ) {
	if ( e.key !== 'Tab' || ! contenidor ) {
		return;
	}
	const focusables = [
		...contenidor.querySelectorAll( SELECTOR_FOCUSABLES ),
	];
	if ( focusables.length === 0 ) {
		e.preventDefault();
		return;
	}
	const desti = indexFocusAtrapat(
		focusables.indexOf( contenidor.ownerDocument.activeElement ),
		focusables.length,
		e.shiftKey
	);
	if ( desti >= 0 ) {
		e.preventDefault();
		focusables[ desti ].focus();
	}
}

/** Temps (ms) que es veu l'avís «No s'ha pogut tancar». */
export { DURADA_AVIS_TANCA } from '../../nucli/temps.js';
