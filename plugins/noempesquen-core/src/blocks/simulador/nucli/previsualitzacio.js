/**
 * Missió en previsualització (guió de prova des del panell) i què se'n desa.
 * Mòdul pur: sense JSX ni DOM.
 *
 * La de prova surt sempre al selector amb un id propi (no substitueix cap
 * missió real) i marcada «esborrany». El seu resultat no es desa mai.
 */
import { __, sprintf } from '@wordpress/i18n';
import { validaMissio } from './valida.js';
import { desaProgres } from './progres.js';

export const SUFIX_PROVA = '--prova';

/**
 * Prepara el guió de prova per al selector.
 *
 * Es valida amb l'id original (el sufix no compleix el patró d'id); si és
 * vàlid, es torna una còpia amb id `<id>--prova`, títol «· esborrany» i la
 * bandera `previsualitzacio`.
 *
 * @param {?Object} guio Guió rebut del servidor.
 * @param {Object}  mon  Món compartit.
 * @return {?Object} Missió de prova o null si no és vàlida.
 */
export function preparaPrevisualitzacio( guio, mon ) {
	if ( ! guio || typeof guio !== 'object' || Array.isArray( guio ) ) {
		return null;
	}
	let errors;
	try {
		errors = validaMissio( guio, mon );
	} catch {
		return null;
	}
	if ( errors.length ) {
		return null;
	}
	return {
		...guio,
		id: `${ guio.id }${ SUFIX_PROVA }`,
		titol: sprintf(
			/* translators: %s: títol de la missió */
			__( '%s · esborrany', 'noempesquen' ),
			guio.titol
		),
		previsualitzacio: true,
	};
}

/**
 * Progrés després d'acabar una missió. Desa a l'emmagatzematge només si no és
 * una previsualització (en aquest cas torna el mateix objecte i no escriu).
 *
 * @param {?Object} storage   Emmagatzematge (localStorage o null).
 * @param {Object}  progres   Progrés actual.
 * @param {?Object} missio    Missió acabada.
 * @param {number}  estrelles Estrelles obtingudes.
 * @return {Object} Progrés nou (o el mateix si no es desa).
 */
export function registraResultat( storage, progres, missio, estrelles ) {
	// Previsualització: ni progrés ni (a T7) estadístiques.
	if ( ! missio || missio.previsualitzacio ) {
		return progres;
	}
	const nou = {
		...progres,
		[ missio.id ]: Math.max( progres[ missio.id ] ?? 0, estrelles ),
	};
	desaProgres( storage, nou );
	return nou;
}
