/**
 * Tria el conjunt de missions incloses (missions + món) segons l'idioma del
 * bloc (`config.lang`). Mòdul pur: els conjunts els rep de fora.
 */

/** Idioma per defecte del lloc (l'arrel és en castellà). */
export const IDIOMA_PER_DEFECTE = 'es';

/**
 * Conjunt de missions d'un idioma; amb un idioma desconegut, el castellà.
 *
 * @param {Object<string, {missions: Array, mon: Object}>} conjunts Conjunts per idioma.
 * @param {string}                                         lang     Idioma demanat.
 * @return {{missions: Array, mon: Object}} Conjunt triat.
 */
export function triaConjunt( conjunts, lang ) {
	if (
		typeof lang === 'string' &&
		Object.prototype.hasOwnProperty.call( conjunts, lang )
	) {
		return conjunts[ lang ];
	}
	return conjunts[ IDIOMA_PER_DEFECTE ];
}

/**
 * URL de la llista de missions remotes amb `lang` (també amb `?rest_route=`).
 *
 * @param {string} api  Arrel de l'API.
 * @param {string} lang Idioma.
 * @return {string} URL.
 */
export function urlMissions( api, lang ) {
	const sep = api.includes( '?' ) ? '&' : '?';
	return `${ api }missions${ sep }lang=${ encodeURIComponent(
		lang || IDIOMA_PER_DEFECTE
	) }`;
}
