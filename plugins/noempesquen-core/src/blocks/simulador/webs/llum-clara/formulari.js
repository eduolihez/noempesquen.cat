/**
 * Ajudes pures de Llum Clara (sense JSX).
 *
 * Privadesa: el que s'escriu als formularis falsos no surt mai del camp.
 * `datesEnviades` és l'única sortida cap al motor i només porta la URL i
 * l'id del formulari.
 */

/**
 * Dades de l'esdeveniment `formulari.envia`.
 *
 * @param {Object} form           Formulari enviat.
 * @param {string} form.url       URL de la pàgina.
 * @param {Object} form.formulari Definició del formulari ({ id, ... }).
 * @return {{url:string, formulari:string}} Dades sense cap valor escrit.
 */
export function datesEnviades( { url, formulari } ) {
	return { url, formulari: formulari.id };
}

const dos = ( n ) => String( n ).padStart( 2, '0' );

/**
 * Compte enrere «HH:MM:SS» (mai negatiu).
 *
 * @param {number} segons Segons que queden.
 * @return {string} Text.
 */
export function compteEnrere( segons ) {
	const s = Math.max( 0, Math.floor( segons ) );
	return `${ dos( Math.floor( s / 3600 ) ) }:${ dos(
		Math.floor( ( s % 3600 ) / 60 )
	) }:${ dos( s % 60 ) }`;
}

/**
 * Import del text del botó («Paga 87,40 €» → «87,40 €»).
 *
 * @param {string} boto Text del botó.
 * @return {string} Import o ''.
 */
export function importDe( boto ) {
	return String( boto ?? '' ).match( /\d[\d.,]*\s?€/ )?.[ 0 ] ?? '';
}

/**
 * Paràmetre `ref` d'una URL.
 *
 * @param {string} url URL.
 * @return {string} Referència o ''.
 */
export function referencia( url ) {
	try {
		return new URL( url ).searchParams.get( 'ref' ) ?? '';
	} catch {
		return '';
	}
}

export const SECCIONS_OFICIALS = [
	'inici',
	'area-client',
	'tarifes',
	'ajuda',
	'avis-legal',
	'privacitat',
	'cookies',
	'accessibilitat',
];

/**
 * Secció de la web oficial segons el camí; si no existeix, l'inici.
 *
 * @param {string} url URL.
 * @return {string} Secció.
 */
export function seccioOficial( url ) {
	let cami = '';
	try {
		cami = new URL( url ).pathname.replace( /^\/+|\/+$/g, '' );
	} catch {
		return 'inici';
	}
	return SECCIONS_OFICIALS.includes( cami ) ? cami : 'inici';
}
