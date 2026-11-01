// Lògica pura de la UI de la lupa (comptador i xip). Sense textos: les
// cadenes traduïdes van als components.

/**
 * Text curt del comptador: «n/N».
 *
 * @param {{trobats:number, total:number}} ind Resultat de `indicis()`.
 * @return {string} Comptador.
 */
export function textComptador( ind ) {
	return `${ ind?.trobats ?? 0 }/${ ind?.total ?? 0 }`;
}

const XIPS = {
	nova: 'nova',
	normal: 'normal',
	repetida: 'repetida',
};

/**
 * Clau del xip que es mostra després d'inspeccionar.
 *
 * @param {string|null} tipus   `ultimaInspeccio.tipus`.
 * @param {boolean}     complet Ja s'han trobat tots els indicis.
 * @return {string|null} 'nova' | 'normal' | 'repetida' | 'totes' | null.
 */
export function clauXip( tipus, complet = false ) {
	const clau = XIPS[ tipus ] ?? null;
	if ( clau === 'repetida' && complet ) {
		return 'totes';
	}
	return clau;
}
