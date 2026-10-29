/**
 * Com ha acabat la missió: s'ha picat o s'ha decidit (i com).
 * Funció pura, sense res d'interfície.
 */
import { opcioTriada } from '../nucli/motor.js';

const AVATAR = {
	pescat: 'trista',
	incorrecta: 'trista',
	correcta: 'contenta',
	parcial: 'normal',
};

/**
 * Desenllaç de la partida a partir de l'estat del motor.
 *
 * @param {Object} missio Missió v2.
 * @param {Object} estat  Estat del motor.
 * @return {?{tipus:string, caigut:boolean, avatar:string, text:string}}
 *         Desenllaç, o null si encara no n'hi ha cap.
 */
export function desenllac( missio, estat ) {
	if ( estat.pescat ) {
		return {
			tipus: 'pescat',
			caigut: true,
			avatar: AVATAR.pescat,
			text: missio.frases?.pescat ?? '',
		};
	}
	const opcio = opcioTriada( missio, estat );
	if ( ! opcio || ! AVATAR[ opcio.valor ] ) {
		return null;
	}
	return {
		tipus: opcio.valor,
		caigut: opcio.valor === 'incorrecta',
		avatar: AVATAR[ opcio.valor ],
		text: opcio.resposta ?? '',
	};
}
