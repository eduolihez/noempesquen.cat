/**
 * Lògica pura de l'app Revenda (sense JSX): filtrat de xats i missatges.
 */

/**
 * Indica si un contacte és desconegut (rol «desconegut»).
 *
 * @param {?Object} contacte Contacte de `mon.contactes`.
 * @return {boolean} Cert si és desconegut.
 */
export const esDesconegut = ( contacte ) => contacte?.rol === 'desconegut';

/**
 * Missatges d'un xat que el jugador ja pot veure: els no ocults i els ocults
 * que algun disparador ja ha mostrat.
 *
 * @param {?Object}               xat      Xat de la missió.
 * @param {Set<string>|string[]=} visibles Ids d'elements ja mostrats.
 * @return {Object[]} Missatges visibles, en ordre.
 */
export function missatgesVisibles( xat, visibles = [] ) {
	const mostrats = new Set( visibles );
	return ( Array.isArray( xat?.missatges ) ? xat.missatges : [] ).filter(
		( msg ) => ! msg?.ocult || mostrats.has( msg.id )
	);
}

/**
 * Xats amb algun missatge visible (un xat amb tots els missatges ocults encara
 * no existeix per al jugador).
 *
 * @param {Object[]}              xats     Xats de la missió.
 * @param {Set<string>|string[]=} visibles Ids d'elements ja mostrats.
 * @return {Object[]} Xats visibles.
 */
export function xatsVisibles( xats, visibles = [] ) {
	return ( Array.isArray( xats ) ? xats : [] ).filter(
		( x ) => missatgesVisibles( x, visibles ).length > 0
	);
}

/**
 * Últim missatge visible d'un xat (per a la llista de xats).
 *
 * @param {?Object}               xat      Xat.
 * @param {Set<string>|string[]=} visibles Ids d'elements ja mostrats.
 * @return {?Object} Missatge o null.
 */
export function ultimMissatge( xat, visibles = [] ) {
	const v = missatgesVisibles( xat, visibles );
	return v.length ? v[ v.length - 1 ] : null;
}

/**
 * Ids dels elements ocults que el motor ja ha mostrat (`estat.visibles` és
 * un objecte `{ id: true }`).
 *
 * @param {?Object} estat Estat del motor.
 * @return {string[]} Ids visibles.
 */
export function idsVisibles( estat ) {
	const v = estat?.visibles;
	if ( ! v || typeof v !== 'object' ) {
		return [];
	}
	return Object.keys( v ).filter( ( id ) => v[ id ] );
}

export { formataPreu } from '../../nucli/idioma.js';

/**
 * Text pla d'un missatge (segments `{ t }` i `{ enllac: { text } }`), per a
 * la llista de xats i els avisos.
 *
 * @param {?Object} msg Missatge amb `cos`.
 * @return {string} Text.
 */
export function textMissatge( msg ) {
	return ( Array.isArray( msg?.cos ) ? msg.cos : [] )
		.map( ( s ) => ( s?.enllac ? s.enllac.text : s?.t ) ?? '' )
		.join( '' );
}

/**
 * Destí d'una notificació de Revenda al mòbil: la pestanya «Xats» i, si
 * n'indica un, el xat concret.
 *
 * @param {Object} notificacio Notificació { app, xat? }.
 * @return {[string, {pestanya:string, xat?:string}]} App i dades d'obertura.
 */
export function destiRevenda( notificacio ) {
	return [
		'revenda',
		{
			pestanya: 'xats',
			...( notificacio?.xat ? { xat: notificacio.xat } : {} ),
		},
	];
}

/**
 * Esdeveniment que Revenda emet en enviar un missatge. Només porta l'id del
 * contacte: el text que escriu el jugador no surt mai del camp.
 *
 * @param {string} contacte Id del contacte del xat.
 * @return {[string, {contacte: string}]} Nom i dades de l'esdeveniment.
 */
export const esdevenimentEnvia = ( contacte ) => [
	'missatge.envia',
	{ contacte },
];
