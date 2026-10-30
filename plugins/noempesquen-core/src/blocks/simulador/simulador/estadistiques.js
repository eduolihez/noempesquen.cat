/**
 * Estadístiques anònimes: què s'envia en acabar una partida. Mòdul pur
 * (sense JSX). El cos només porta tres camps: res del que escriu el jugador.
 */
import { opcioTriada } from '../nucli/motor.js';

/**
 * Cos de l'enviament, o null si no s'ha d'enviar (previsualització).
 *
 * @param {Object} missio    Missió acabada.
 * @param {Object} estat     Estat final del motor.
 * @param {Object} puntuacio Puntuació (`{ estrelles }`).
 * @return {?{missio: string, estrelles: number, decisio: (string|undefined)}} Cos.
 */
export function construeixResultat( missio, estat, puntuacio ) {
	if ( ! missio || missio.previsualitzacio ) {
		return null;
	}
	const cos = { missio: missio.id, estrelles: puntuacio.estrelles };
	const opcio = opcioTriada( missio, estat );
	if ( opcio ) {
		cos.decisio = opcio.id;
	}
	return cos;
}

/**
 * Envia el resultat sense galetes ni nonce. Falla en silenci: mai bloqueja
 * ni llença.
 *
 * @param {string}  api     Arrel de l'API (acaba en `/`).
 * @param {?Object} payload Cos de `construeixResultat`.
 */
export function enviaResultat( api, payload ) {
	if ( ! api || ! payload ) {
		return;
	}
	try {
		Promise.resolve(
			fetch( `${ api }resultat`, {
				method: 'POST',
				keepalive: true,
				credentials: 'omit',
				headers: { 'Content-Type': 'application/json' },
				// Només els tres camps, encara que el cos en porti més.
				body: JSON.stringify( {
					missio: payload.missio,
					estrelles: payload.estrelles,
					decisio: payload.decisio,
				} ),
			} )
		).catch( () => {} );
	} catch {
		// Sense xarxa o sense fetch: l'estadística es perd i prou.
	}
}
