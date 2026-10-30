/**
 * Lògica pura de la Galeria: agrupació per dia i navegació del visor.
 */

import { __ } from '@wordpress/i18n';

/** «Avui» del món simulat (no la data real del jugador). */
export const DATA_MON = '2026-10-29';

const partsData = ( iso ) => {
	const [ a, m, d ] = String( iso ).split( '-' ).map( Number );
	return { a, m, d };
};

const diaAbsolut = ( iso ) => {
	const { a, m, d } = partsData( iso );
	return Date.UTC( a, m - 1, d ) / 86400000;
};

const isoDeData = ( data ) =>
	typeof data === 'string'
		? data
		: `${ data.getFullYear() }-${ String( data.getMonth() + 1 ).padStart(
				2,
				'0'
			) }-${ String( data.getDate() ).padStart( 2, '0' ) }`;

/**
 * Etiqueta llegible d'una data ISO (AAAA-MM-DD) respecte a `ara`.
 *
 * @param {string}      iso Data ISO.
 * @param {Date|string} ara Avui del món: data o ISO (per defecte `DATA_MON`).
 * @return {string} «Avui», «Ahir» o «12 d'octubre de 2026».
 */
export function etiquetaData( iso, ara = DATA_MON ) {
	const dif = diaAbsolut( isoDeData( ara ) ) - diaAbsolut( iso );
	if ( dif === 0 ) {
		return __( 'Avui', 'noempesquen' );
	}
	if ( dif === 1 ) {
		return __( 'Ahir', 'noempesquen' );
	}
	const { a, m, d } = partsData( iso );
	// Només el nom del mes ve d'Intl: el locale «ca» diu «del 2026».
	const mes = new Intl.DateTimeFormat( 'ca', {
		month: 'long',
		timeZone: 'UTC',
	} ).format( new Date( Date.UTC( a, m - 1, d ) ) );
	const de = /^[aeiouh]/i.test( mes ) ? "d'" : 'de ';
	return `${ d } ${ de }${ mes } de ${ a }`;
}

/**
 * Agrupa les fotos per dia, del més recent al més antic.
 *
 * @param {Array}       fotos `{ id, titol, data, il }`.
 * @param {Date|string} ara   Avui del món (per a Avui/Ahir).
 * @return {Array} `[ { data, etiqueta, fotos } ]`.
 */
export function agrupaPerData( fotos, ara = DATA_MON ) {
	const perDia = new Map();
	[ ...( fotos ?? [] ) ]
		.sort( ( x, y ) => y.data.localeCompare( x.data ) )
		.forEach( ( f ) => {
			if ( ! perDia.has( f.data ) ) {
				perDia.set( f.data, [] );
			}
			perDia.get( f.data ).push( f );
		} );
	return [ ...perDia ].map( ( [ data, llista ] ) => ( {
		data,
		etiqueta: etiquetaData( data, ara ),
		fotos: llista,
	} ) );
}

/**
 * Foto veïna dins l'ordre de la quadrícula (de més recent a més antiga).
 * `delta` -1 = anterior, +1 = següent; fora de rang torna null.
 *
 * @param {Array}  fotos           Fotos.
 * @param {string} id              Foto actual.
 * @param {number} delta           Desplaçament.
 * @param {Array}  [ordreCalculat] Ordre ja calculat (opcional, evita recalcular).
 * @return {Object|null} La foto veïna.
 */
export function vei( fotos, id, delta, ordreCalculat ) {
	const ordre =
		ordreCalculat ?? agrupaPerData( fotos ).flatMap( ( g ) => g.fotos );
	const i = ordre.findIndex( ( f ) => f.id === id );
	if ( i < 0 ) {
		return null;
	}
	return ordre[ i + delta ] ?? null;
}
