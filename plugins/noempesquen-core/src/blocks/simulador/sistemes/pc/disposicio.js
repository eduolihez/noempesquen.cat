/**
 * Disposició inicial de les finestres de l'escriptori (funcions pures).
 * Totes les mides són en píxels lògics de l'àrea de finestres.
 */

export const MARGE = 8;
/* Columna d'icones de l'escriptori (vegeu _pc.scss: 6 + 78 px): les finestres
   col·locades per la disposició comencen a la seva dreta, perquè les icones
   quedin visibles, clicables i amb el focus sense tapar. */
export const MARGE_ESQ = 84 + MARGE;
export const PARLA_MINIM = 420;
export const NAVEGADOR_MINIM = 480;
const PART_PARLA = 0.4;

/* Mides per defecte d'una finestra sola (vegeu _pc.scss). */
const MIDES_SOLA = {
	parla: { amplada: [ 860, 96 ], alcada: [ 600, 120 ] },
	defecte: { amplada: [ 1120, 120 ], alcada: [ 760, 96 ] },
};

const compta = ( f ) => ! f.minimitzada && ! f.maximitzada;

function disposicioSola( { amplada, alcada }, id ) {
	const m = MIDES_SOLA[ id ] ?? MIDES_SOLA.defecte;
	const w = Math.min( m.amplada[ 0 ], amplada - m.amplada[ 1 ] );
	const h = Math.min( m.alcada[ 0 ], alcada - m.alcada[ 1 ] );
	return {
		x: Math.max( MARGE, Math.round( ( amplada - w ) / 2 ) ),
		y: Math.max( MARGE, Math.round( ( alcada - h ) / 2 ) ),
		amplada: w,
		alcada: h,
	};
}

/**
 * Reparteix l'àrea entre les finestres visibles. Amb navegador i Parla:
 * navegador a l'esquerra (~60 %) i Parla a la dreta (~40 %, mínim 420).
 * Les finestres comencen a la dreta de la columna d'icones. Amb àrees estretes
 * no caben Parla 420 i Navegador 480: guanya no solapar, Parla conserva 420 i
 * el navegador pren el que queda (a 800 px d'ample, 272). Amb una sola
 * finestra, la seva mida i posició per defecte. Les altres finestres no tenen
 * entrada (van en cascada).
 *
 * @param {Object}   p
 * @param {number}   p.amplada   Amplada de l'àrea.
 * @param {number}   p.alcada    Alçada de l'àrea.
 * @param {Object[]} p.finestres [{ id, minimitzada, maximitzada }].
 * @return {Object} Per id: { x, y, amplada, alcada }.
 */
export function disposicioInicial( { amplada, alcada, finestres } ) {
	const visibles = finestres.filter( compta );
	if ( ! visibles.length ) {
		return {};
	}
	const area = { amplada, alcada };
	if ( visibles.length === 1 ) {
		return {
			[ visibles[ 0 ].id ]: disposicioSola( area, visibles[ 0 ].id ),
		};
	}
	const ids = visibles.map( ( f ) => f.id );
	if ( ! ids.includes( 'navegador' ) || ! ids.includes( 'parla' ) ) {
		return {};
	}
	const util = amplada - MARGE_ESQ - 2 * MARGE;
	const parla = Math.max( PARLA_MINIM, Math.round( util * PART_PARLA ) );
	const navegador = util - parla;
	const h = alcada - 2 * MARGE;
	return {
		navegador: { x: MARGE_ESQ, y: MARGE, amplada: navegador, alcada: h },
		parla: {
			x: MARGE_ESQ + MARGE + navegador,
			y: MARGE,
			amplada: parla,
			alcada: h,
		},
	};
}

/**
 * La mitja lliure (dreta o esquerra) al costat de finestres ja col·locades,
 * si hi cap una finestra d'almenys `minim` d'amplada.
 *
 * @param {Object}   area     { amplada, alcada }.
 * @param {Object[]} ocupades Rectangles { x, y, amplada, alcada }.
 * @param {number}   minim    Amplada mínima.
 * @return {?Object} Rectangle lliure o null.
 */
export function mitatLliure( area, ocupades, minim = PARLA_MINIM ) {
	const dreta = Math.max( ...ocupades.map( ( r ) => r.x + r.amplada ) );
	const ampDreta = area.amplada - dreta - 2 * MARGE;
	const h = area.alcada - 2 * MARGE;
	if ( ampDreta >= minim ) {
		return { x: dreta + MARGE, y: MARGE, amplada: ampDreta, alcada: h };
	}
	const esquerra = Math.min( ...ocupades.map( ( r ) => r.x ) );
	const ampEsq = esquerra - MARGE_ESQ - MARGE;
	if ( ampEsq >= minim ) {
		return { x: MARGE_ESQ, y: MARGE, amplada: ampEsq, alcada: h };
	}
	return null;
}
