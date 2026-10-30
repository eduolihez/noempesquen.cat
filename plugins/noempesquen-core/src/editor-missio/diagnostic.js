/**
 * Errors d'un guió escrit al panell. Mòdul pur (sense DOM) per poder-lo provar.
 */
import { diagnostica } from '../blocks/simulador/nucli/missions.js';

/**
 * @param {string} text                   JSON del guió.
 * @param {Object} opcions
 * @param {Object} opcions.mon            Món compartit.
 * @param {string} [opcions.dispositiu]   Dispositiu triat a la missió.
 * @param {string} [opcions.personatge]   Personatge triat a la missió.
 * @param {Array}  [opcions.idsExistents] Ids de guió d'altres missions.
 * @return {string[]} Errors (buit = vàlid).
 */
export function errorsGuio(
	text,
	{ mon, dispositiu, personatge, idsExistents } = {}
) {
	let guio;
	try {
		guio = JSON.parse( text );
	} catch ( e ) {
		return [ `El guió no és un JSON vàlid: ${ e.message }` ];
	}
	if ( ! guio || typeof guio !== 'object' || Array.isArray( guio ) ) {
		return [ 'El guió ha de ser un objecte JSON ({ … }).' ];
	}
	const errors = diagnostica( [ guio ], mon )[ 0 ]?.errors ?? [];
	if (
		Array.isArray( idsExistents ) &&
		typeof guio.id === 'string' &&
		idsExistents.includes( guio.id )
	) {
		errors.push( `Ja hi ha una altra missió amb l'id «${ guio.id }».` );
	}
	if (
		dispositiu &&
		[ 'pc', 'mobil' ].includes( guio.dispositiu ) &&
		guio.dispositiu !== dispositiu
	) {
		errors.push(
			`El dispositiu del guió («${ guio.dispositiu }») no coincideix amb el de la missió («${ dispositiu }»).`
		);
	}
	if (
		personatge &&
		[ 'llissa', 'remei' ].includes( guio.personatge ) &&
		guio.personatge !== personatge
	) {
		errors.push(
			`El personatge del guió («${ guio.personatge }») no coincideix amb el de la missió («${ personatge }»).`
		);
	}
	return errors;
}
