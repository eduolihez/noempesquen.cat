/**
 * Lògica pura de l'app Revenda (sense JSX): filtrat de xats i missatges.
 */

/**
 * Indica si un contacte és desconegut (rol «desconegut»).
 *
 * @param {?Object} contacte Contacte de `mon.contactes`.
 * @return {boolean} Cert si és desconegut.
 */
export const esDesconegut = ( contacte ) => contacte?.rol === 'desconegut';

/**
 * Missatges d'un xat que el jugador ja pot veure: els no ocults i els ocults
 * que algun disparador ja ha mostrat.
 *
 * @param {?Object}               xat      Xat de la missió.
 * @param {Set<string>|string[]=} visibles Ids d'elements ja mostrats.
 * @return {Object[]} Missatges visibles, en ordre.
 */
export function missatgesVisibles( xat, visibles = [] ) {
	const mostrats = new Set( visibles );
	return ( Array.isArray( xat?.missatges ) ? xat.missatges : [] ).filter(
		( msg ) => ! msg?.ocult || mostrats.has( msg.id )
	);
}

/**
 * Xats amb algun missatge visible (un xat amb tots els missatges ocults encara
 * no existeix per al jugador).
 *
 * @param {Object[]}              xats     Xats de la missió.
 * @param {Set<string>|string[]=} visibles Ids d'elements ja mostrats.
 * @return {Object[]} Xats visibles.
 */
export function xatsVisibles( xats, visibles = [] ) {
	return ( Array.isArray( xats ) ? xats : [] ).filter(
		( x ) => missatgesVisibles( x, visibles ).length > 0
	);
}

/**
 * Últim missatge visible d'un xat (per a la llista de xats).
 *
 * @param {?Object}               xat      Xat.
 * @param {Set<string>|string[]=} visibles Ids d'elements ja mostrats.
 * @return {?Object} Missatge o null.
 */
export function ultimMissatge( xat, visibles = [] ) {
	const v = missatgesVisibles( xat, visibles );
	return v.length ? v[ v.length - 1 ] : null;
}
