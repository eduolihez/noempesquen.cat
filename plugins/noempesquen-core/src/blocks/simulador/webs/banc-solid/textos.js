/**
 * Ajudes pures de Banc Sòlid (sense JSX ni i18n).
 *
 * Els textos inspeccionables de la còpia falsa es declaren al JSON per clau
 * (`dades.textos.<clau> = { senyal, t? }`). La clau `senyal` és la que el
 * validador recull per comprovar que el senyal existeix.
 */

/**
 * Segment inspeccionable d'una clau de text: el text del JSON (`t`) o el
 * per defecte, i el senyal si n'hi ha.
 *
 * @param {Object} textos  Mapa `dades.textos`.
 * @param {string} clau    Clau del text.
 * @param {string} defecte Text per defecte.
 * @return {{t:string, senyal:(string|undefined)}} Segment.
 */
export function segment( textos, clau, defecte ) {
	const v = textos?.[ clau ];
	const t = typeof v?.t === 'string' && v.t.trim() ? v.t : defecte;
	const senyal =
		typeof v?.senyal === 'string' && v.senyal ? v.senyal : undefined;
	return { t, senyal };
}

/**
 * Formulari amb els valors per defecte del banc; el JSON mana.
 *
 * @param {?Object} formulari Definició del JSON.
 * @param {Object}  defectes  Valors per defecte (id, esdeveniment, nota...).
 * @return {Object} Definició completa (sempre amb `camps`).
 */
export function ambDefectes( formulari, defectes ) {
	const f = { ...defectes, ...( formulari ?? {} ) };
	return { ...f, camps: Array.isArray( f.camps ) ? f.camps : [] };
}

export const SECCIONS_BANC = [ 'inici', 'area-clients' ];

/**
 * Secció de la web oficial segons el camí; si no existeix, l'inici.
 *
 * @param {string} url URL.
 * @return {string} Secció.
 */
export function seccioBanc( url ) {
	let cami = '';
	try {
		cami = new URL( url ).pathname.replace( /^\/+|\/+$/g, '' );
	} catch {
		return 'inici';
	}
	return SECCIONS_BANC.includes( cami ) ? cami : 'inici';
}
