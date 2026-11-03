/**
 * Lògica pura d'El Diari del Barri: rutes, URL de notícia, seccions i dates.
 */
import { formataDataLlarga } from '../../nucli/idioma.js';

export const URL_PORTADA = 'https://diaridelbarri.cat/';

/**
 * Ruta d'una URL del diari.
 *
 * @param {string} url URL.
 * @return {{tipus:string, id?:string}} `portada`, `noticia` (amb id) o `desconeguda`.
 */
export function rutaDeUrl( url ) {
	let cami;
	try {
		cami = new URL( url ).pathname;
	} catch {
		return { tipus: 'desconeguda' };
	}
	if ( cami === '/' || cami === '' ) {
		return { tipus: 'portada' };
	}
	const m = /^\/noticia\/([^/]+)\/?$/.exec( cami );
	if ( m ) {
		try {
			return { tipus: 'noticia', id: decodeURIComponent( m[ 1 ] ) };
		} catch {
			return { tipus: 'desconeguda' };
		}
	}
	return { tipus: 'desconeguda' };
}

/**
 * URL d'una notícia.
 *
 * @param {string} id Identificador.
 * @return {string} URL.
 */
export const urlNoticia = ( id ) =>
	`https://diaridelbarri.cat/noticia/${ encodeURIComponent( id ) }`;

/**
 * Seccions úniques, en ordre d'aparició.
 *
 * @param {Array} diari Notícies.
 * @return {string[]} Seccions.
 */
export function seccions( diari ) {
	if ( ! Array.isArray( diari ) ) {
		return [];
	}
	return [ ...new Set( diari.map( ( n ) => n?.seccio ).filter( Boolean ) ) ];
}

/**
 * Data ISO (AAAA-MM-DD) segons l'idioma: «12 d'octubre de 2026» / «12 de octubre de 2026».
 *
 * @param {string} iso Data ISO.
 * @return {string} Text; l'original si no és una data vàlida.
 */
export function formataData( iso ) {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec( iso ?? '' );
	if ( ! m ) {
		return iso ?? '';
	}
	const [ , a, me, d ] = m.map( Number );
	const data = new Date( Date.UTC( a, me - 1, d ) );
	if (
		data.getUTCFullYear() !== a ||
		data.getUTCMonth() !== me - 1 ||
		data.getUTCDate() !== d
	) {
		return iso;
	}
	return formataDataLlarga( a, me, d );
}
