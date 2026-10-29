/**
 * Cert si l'usuari ha demanat menys moviment: les animacions no s'executen
 * i cal saltar-se'n el final (animationend no arribaria mai).
 *
 * @return {boolean} Menys moviment.
 */
export function menysMoviment() {
	return !! window.matchMedia?.( '(prefers-reduced-motion: reduce)' ).matches;
}
