/**
 * Estadístiques anònimes: què s'envia en acabar una partida. Mòdul pur
 * (sense JSX). El cos només porta tres camps: res del que escriu el jugador.
 */
import { opcioTriada } from '../nucli/motor.js';
import { idiomaActual } from '../nucli/idioma.js';

/**
 * Cos de l'enviament, o null si no s'ha d'enviar (previsualització).
 *
 * @param {Object} missio    Missió acabada.
 * @param {Object} estat     Estat final del motor.
 * @param {Object} puntuacio Puntuació (`{ estrelles }`).
 * @return {?{missio: string, estrelles: number, decisio: (string|undefined)}} Cos.
 */
export function construeixResultat( missio, estat, puntuacio ) {
	// Ni previsualitzacions ni tutorials: un tutorial no puntua ni compta.
	if ( ! missio || missio.previsualitzacio || missio.tutorial === true ) {
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
 * Envia el resultat sense galetes ni nonce (`credentials: 'omit'`): és anònim
 * encara que el jugador tingui un compte opcional. Falla en silenci: mai bloqueja
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
				headers: {
					'Content-Type': 'application/json',
					'X-Nep-Lang': idiomaActual(),
				},
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

/**
 * Demana el resum públic d'una missió (què va triar la gent). Sense galetes.
 * Falla en silenci: torna null si no hi ha api, la xarxa falla, la resposta
 * no és vàlida o no hi ha prou partides. Mai llença.
 *
 * @param {string} api    Arrel de l'API (acaba en `/`).
 * @param {string} missio Id de la missió.
 * @return {Promise<?{n_banda: string, decisions: Array<{id: string, banda: string}>}>} Resum.
 */
export function demanaResum( api, missio ) {
	if ( ! api || ! missio ) {
		return Promise.resolve( null );
	}
	try {
		const sep = api.includes( '?' ) ? '&' : '?';
		return Promise.resolve(
			fetch(
				`${ api }resultat/resum${ sep }missio=${ encodeURIComponent(
					missio
				) }`,
				{
					method: 'GET',
					credentials: 'omit',
					headers: { 'X-Nep-Lang': idiomaActual() },
				}
			)
		)
			.then( ( r ) => ( r && r.ok ? r.json() : null ) )
			.then( ( d ) =>
				d &&
				typeof d.n_banda === 'string' &&
				Array.isArray( d.decisions )
					? d
					: null
			)
			.catch( () => null );
	} catch {
		return Promise.resolve( null );
	}
}

const BANDA = /^(\d{1,3})-(\d{1,3}) %$/;

/**
 * Què es mostra al jugador a partir del resum: la franja de la seva opció
 * («la mateixa opció que tu») o, si la seva no hi surt, la de l'opció més
 * triada («una altra opció»). Null si no ha decidit o no hi ha res a dir.
 *
 * @param {?Object} resum Resposta de `demanaResum`.
 * @param {?string} opcio Id de l'opció triada (`estat.opcio`).
 * @return {?{min: number, max: number, mateixa: boolean}} Dades de la frase.
 */
export function llegeixResum( resum, opcio ) {
	if ( ! resum || ! Array.isArray( resum.decisions ) || ! opcio ) {
		return null;
	}
	const valides = resum.decisions
		.map( ( d ) => {
			const m = BANDA.exec( d?.banda ?? '' );
			return m && typeof d.id === 'string'
				? { id: d.id, min: Number( m[ 1 ] ), max: Number( m[ 2 ] ) }
				: null;
		} )
		.filter( Boolean );
	const meva = valides.find( ( d ) => d.id === opcio );
	if ( meva ) {
		return { min: meva.min, max: meva.max, mateixa: true };
	}
	if ( ! valides.length ) {
		return null;
	}
	const top = valides.reduce( ( a, b ) => ( b.min > a.min ? b : a ) );
	return { min: top.min, max: top.max, mateixa: false };
}
