/**
 * Nom del jugador a partir del món de la missió, amb valor per defecte.
 * Mòdul pur, sense interfície.
 */

export const NOM_PER_DEFECTE = 'Àlex Puig';

/**
 * @param {?Object} mon Món ({ jugador: { nom } }).
 * @return {string} Nom complet, o el per defecte si és buit o no existeix.
 */
export function nomJugador( mon ) {
	const nom = mon?.jugador?.nom;
	return typeof nom === 'string' && nom.trim() ? nom : NOM_PER_DEFECTE;
}

/**
 * @param {?Object} mon Món ({ jugador: { nom } }).
 * @return {string} Primer mot del nom.
 */
export function nomPila( mon ) {
	return nomJugador( mon ).trim().split( /\s+/ )[ 0 ];
}
