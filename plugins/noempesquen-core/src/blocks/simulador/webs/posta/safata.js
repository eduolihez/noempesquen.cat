/**
 * Ajudes pures de Posta (sense JSX): quins correus es veuen, en quin ordre,
 * a quina carpeta són segons les marques locals i quants n'hi ha.
 *
 * Marques locals: { [id]: { carpeta?, llegit?, destacat? } }. Són estat de
 * la interfície de Posta; el motor només rep els esdeveniments.
 */
import { clauDia } from '../../nucli/idioma.js';
import { visible } from '../../nucli/motor.js';

export const CARPETES = [
	'entrada',
	'destacats',
	'enviats',
	'arxivats',
	'brossa',
	'paperera',
];

/* On va a parar un correu després de cada acció de la barra. */
export const CARPETA_ACCIO = {
	phishing: 'brossa',
	brossa: 'brossa',
	esborra: 'paperera',
	arxiva: 'arxivats',
};

const HORA = /^\d{1,2}:\d{2}$/;

/* 0 = avui (hora), 1 = ahir, 2 = abans (es manté l'ordre de les dades). */
function rang( data ) {
	if ( HORA.test( data ?? '' ) ) {
		return 0;
	}
	return clauDia( data ) === 'ahir' ? 1 : 2;
}

function compara( a, b ) {
	const ra = rang( a.c.data );
	const rb = rang( b.c.data );
	if ( ra !== rb ) {
		return ra - rb;
	}
	if ( ra === 0 ) {
		const ha = a.c.data.padStart( 5, '0' );
		const hb = b.c.data.padStart( 5, '0' );
		if ( ha !== hb ) {
			return hb.localeCompare( ha );
		}
	}
	return a.i - b.i;
}

/**
 * Correus que es veuen ara: els de la missió (si el motor els ha mostrat)
 * i els del món, del més recent al més antic.
 *
 * @param {Object} estat  Estat del motor.
 * @param {Object} mon    Món (mon.posta.correus).
 * @param {Object} missio Missió (missio.apps.posta.correus).
 * @return {Object[]} Correus ordenats (llista nova).
 */
export function correusVisibles( estat, mon, missio ) {
	const propis = ( missio?.apps?.posta?.correus ?? [] ).filter( ( c ) =>
		visible( estat, c )
	);
	return [ ...propis, ...( mon?.posta?.correus ?? [] ) ]
		.map( ( c, i ) => ( { c, i } ) )
		.sort( compara )
		.map( ( x ) => x.c );
}

/**
 * @param {Object} correu  Correu.
 * @param {Object} marques Marques locals.
 * @return {string} Carpeta actual.
 */
export function carpetaDe( correu, marques ) {
	return marques[ correu.id ]?.carpeta ?? correu.carpeta ?? 'entrada';
}

/**
 * @param {Object} correu  Correu.
 * @param {Object} marques Marques locals.
 * @return {boolean} Si s'ha llegit.
 */
export function esLlegit( correu, marques ) {
	return marques[ correu.id ]?.llegit ?? !! correu.llegit;
}

/**
 * @param {Object} correu  Correu.
 * @param {Object} marques Marques locals.
 * @return {boolean} Si està destacat.
 */
export function esDestacat( correu, marques ) {
	return marques[ correu.id ]?.destacat ?? !! correu.destacat;
}

/**
 * Marques noves amb els canvis aplicats a un correu (no muta).
 *
 * @param {Object} marques Marques locals.
 * @param {string} id      Id del correu.
 * @param {Object} canvis  { carpeta?, llegit?, destacat? }.
 * @return {Object} Marques noves.
 */
export function marca( marques, id, canvis ) {
	return { ...marques, [ id ]: { ...marques[ id ], ...canvis } };
}

/**
 * Correus d'una carpeta. «Destacats» és una vista: els destacats que no
 * són a Brossa ni a la Paperera.
 *
 * @param {Object[]} correus Correus visibles ordenats.
 * @param {Object}   marques Marques locals.
 * @param {string}   carpeta Carpeta.
 * @return {Object[]} Correus de la carpeta.
 */
export function perCarpeta( correus, marques, carpeta ) {
	if ( carpeta === 'destacats' ) {
		return correus.filter(
			( c ) =>
				esDestacat( c, marques ) &&
				! [ 'brossa', 'paperera' ].includes( carpetaDe( c, marques ) )
		);
	}
	return correus.filter( ( c ) => carpetaDe( c, marques ) === carpeta );
}

/**
 * Comptadors del menú: no llegits a Entrada i total a Brossa.
 *
 * @param {Object[]} correus Correus visibles.
 * @param {Object}   marques Marques locals.
 * @return {Object} Nombre per carpeta.
 */
export function comptadors( correus, marques ) {
	const base = Object.fromEntries( CARPETES.map( ( c ) => [ c, 0 ] ) );
	return {
		...base,
		entrada: perCarpeta( correus, marques, 'entrada' ).filter(
			( c ) => ! esLlegit( c, marques )
		).length,
		brossa: perCarpeta( correus, marques, 'brossa' ).length,
	};
}

/**
 * Text pla del cos per a la previsualització de la fila.
 *
 * @param {Array[]} cos Paràgrafs de segments.
 * @return {string} Text.
 */
export function extracte( cos ) {
	return ( cos ?? [] )
		.map( ( p ) =>
			p
				.map( ( s ) => s.t ?? s.enllac?.text ?? '' )
				.join( '' )
				.trim()
		)
		.filter( Boolean )
		.join( ' ' );
}

const plega = ( text ) =>
	String( text ?? '' )
		.normalize( 'NFD' )
		.replace( /[̀-ͯ]/g, '' )
		.toLowerCase();

/**
 * Cerca per remitent, adreça o assumpte.
 *
 * @param {Object[]} correus Correus.
 * @param {string}   text    Text cercat.
 * @return {Object[]} Correus que hi coincideixen.
 */
export function filtra( correus, text ) {
	const q = plega( text ).trim();
	if ( ! q ) {
		return correus;
	}
	return correus.filter( ( c ) =>
		[ c.remitent?.nom, c.remitent?.adreca, c.assumpte ].some( ( v ) =>
			plega( v ).includes( q )
		)
	);
}

/**
 * Data de la fila: l'hora tal qual; els dies, amb majúscula inicial.
 *
 * @param {string} data Data de les dades («09:14», «ahir», «dl.»).
 * @return {string} Etiqueta.
 */
export function etiquetaData( data ) {
	const d = String( data ?? '' );
	return HORA.test( d ) ? d : d.charAt( 0 ).toUpperCase() + d.slice( 1 );
}
