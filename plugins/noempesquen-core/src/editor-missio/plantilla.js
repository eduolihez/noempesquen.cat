/**
 * Plantilla de missió nova i proposta d'id. Mòdul pur (sense DOM).
 */
import plantilla from '../../missions/plantilla-missio.json';

/** Mateix patró que `nep_valida_guio` (PHP) i `validaMissio` (JS). */
export const PATRO_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Id quan el títol no dona cap lletra ni xifra. */
const ID_PER_DEFECTE = 'missio-nova';

/**
 * Id en minúscules, sense accents ni símbols, a partir d'un títol.
 *
 * @param {string} titol Títol de la missió.
 * @return {string} Id que compleix PATRO_ID (o '' si no en queda res).
 */
export function slugId( titol ) {
	return String( titol ?? '' )
		.normalize( 'NFD' )
		.replace( /[̀-ͯ]/g, '' )
		.toLowerCase()
		.replace( /[^a-z0-9]+/g, '-' )
		.replace( /^-+|-+$/g, '' );
}

/**
 * Id únic proposat a partir del títol: afegeix -2, -3... si ja és ocupat.
 *
 * @param {string}   titol   Títol de la missió.
 * @param {string[]} ocupats Ids de les missions incloses i de les del panell.
 * @return {string}
 */
export function proposaId( titol, ocupats = [] ) {
	const base = slugId( titol ) || ID_PER_DEFECTE;
	const usats = new Set( ocupats );
	let id = base;
	for ( let n = 2; usats.has( id ); n++ ) {
		id = `${ base }-${ n }`;
	}
	return id;
}

/**
 * Guió de la plantilla amb l'id proposat i el títol (si n'hi ha).
 *
 * @param {string}   titol   Títol de la missió.
 * @param {string[]} ocupats Ids ocupats.
 * @return {Object}
 */
export function guioDesDePlantilla( titol, ocupats = [] ) {
	const guio = structuredClone( plantilla );
	guio.id = proposaId( titol, ocupats );
	if ( String( titol ?? '' ).trim() ) {
		guio.titol = String( titol ).trim();
	}
	return guio;
}

export { plantilla };
