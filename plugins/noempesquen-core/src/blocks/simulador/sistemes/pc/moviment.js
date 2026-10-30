/**
 * Cert si l'usuari ha demanat menys moviment: les animacions no s'executen
 * i cal saltar-se'n el final (animationend no arribaria mai).
 *
 * @return {boolean} Menys moviment.
 */
export function menysMoviment() {
	return !! window.matchMedia?.( '(prefers-reduced-motion: reduce)' ).matches;
}

/**
 * Desplaçament del punter (píxels de pantalla) convertit a píxels lògics
 * del sistema simulat, que pot estar escalat.
 *
 * @param {number} dx     Desplaçament horitzontal en pantalla.
 * @param {number} dy     Desplaçament vertical en pantalla.
 * @param {number} escala Escala del sistema (1 = sense escalar).
 * @return {{dx:number, dy:number}} Desplaçament lògic.
 */
export function delta( dx, dy, escala = 1 ) {
	const e = Number.isFinite( escala ) && escala > 0 ? escala : 1;
	return { dx: dx / e, dy: dy / e };
}
