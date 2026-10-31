import {
	MS_AVIS_BASE,
	MS_AVIS_MAX,
	MS_AVIS_PER_CARACTER,
	MS_ENTRE_AVISOS,
} from './temps.js';

/**
 * Duración (ms) de un aviso según la longitud de su texto.
 *
 * @param {string} text Texto del aviso.
 * @return {number} Duración acotada por MS_AVIS_MAX.
 */
export function duradaAvis( text ) {
	const llargada = typeof text === 'string' ? text.length : 0;
	return Math.min(
		MS_AVIS_MAX,
		MS_AVIS_BASE + MS_AVIS_PER_CARACTER * llargada
	);
}

/**
 * Reparte la cola de avisos pendientes entre los que entran ahora y los que
 * esperan. Mantiene el orden y no pierde ninguno. Cada entrada se separa de la
 * anterior al menos `entre` ms; solo entra uno por llamada si aún no ha pasado
 * el intervalo desde la última entrada, y los siguientes esperan.
 *
 * @param {Array}  cua           Avisos pendientes, en orden de llegada.
 * @param {number} ara           Instante actual (ms).
 * @param {number} ultimaEntrada Instante de la última entrada (ms), o null/-Infinity si no hay.
 * @param {Object} opcions
 * @param {number} opcions.entre Separación mínima entre entradas (ms).
 * @return {{mostra: Array, espera: Array, properaEntrada: (number|null)}}
 *   `mostra` entra ahora (como máximo uno), `espera` queda en cola y
 *   `properaEntrada` es el instante en que puede entrar el siguiente.
 */
export function planificaAvisos(
	cua,
	ara,
	ultimaEntrada,
	{ entre = MS_ENTRE_AVISOS } = {}
) {
	const llista = Array.isArray( cua ) ? cua : [];
	if ( llista.length === 0 ) {
		return { mostra: [], espera: [], properaEntrada: null };
	}
	const sensePrevi = ! Number.isFinite( ultimaEntrada );
	const permes = sensePrevi ? ara : ultimaEntrada + entre;
	if ( ara >= permes ) {
		return {
			mostra: [ llista[ 0 ] ],
			espera: llista.slice( 1 ),
			properaEntrada: llista.length > 1 ? ara + entre : null,
		};
	}
	return { mostra: [], espera: [ ...llista ], properaEntrada: permes };
}
