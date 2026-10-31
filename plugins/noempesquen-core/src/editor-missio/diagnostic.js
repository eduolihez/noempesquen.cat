/**
 * Errors d'un guió escrit al panell. Mòdul pur (sense DOM) per poder-lo provar.
 */
import { diagnostica } from '../blocks/simulador/nucli/missions.js';
import { errorLlegible, etiquetaRuta } from './llegible.js';
import { posicioErrorSintaxi } from './localitza.js';

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

/**
 * Errors del guió per al panell: text llegible, on és («Decisió › Opció 2») i
 * la ruta (o la posició, si el JSON no es pot llegir) per anar-hi.
 *
 * @param {string} text    JSON del guió.
 * @param {Object} opcions Les mateixes que `errorsGuio`.
 * @return {Array<{codi: string, text: string, on: ?string, ruta: ?Array, posicio: ?number}>} Errors.
 */
export function diagnosticGuio( text, opcions = {} ) {
	const codis = errorsGuio( text, opcions );
	let guio = null;
	let sintaxi = null;
	try {
		guio = JSON.parse( text );
	} catch ( e ) {
		sintaxi = e.message;
	}
	return codis.map( ( codi ) => {
		if ( sintaxi !== null ) {
			return {
				codi,
				text: 'El guió no és un JSON vàlid i no es pot llegir. Revisa les comes, les cometes i les claus a prop d’on hi ha l’error.',
				on: null,
				ruta: null,
				posicio: posicioErrorSintaxi( text, sintaxi ),
			};
		}
		const camp = /^El (dispositiu|personatge) del guió/.exec( codi );
		if ( camp || codi.startsWith( 'Ja hi ha una altra missió' ) ) {
			const ruta = [ camp ? camp[ 1 ] : 'id' ];
			return {
				codi,
				text: camp
					? `${ codi } Canvia’l al guió o al selector de dalt.`
					: `${ codi } Posa-li un id diferent.`,
				on: etiquetaRuta( ruta, guio ),
				ruta,
				posicio: null,
			};
		}
		if ( ! guio || typeof guio !== 'object' || Array.isArray( guio ) ) {
			return { codi, text: codi, on: null, ruta: null, posicio: null };
		}
		return { ...errorLlegible( codi, guio ), posicio: null };
	} );
}
