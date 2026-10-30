/**
 * Lògica pura del so de notificació (el Web Audio viu a part).
 * Pic ≤ 0,12 i durada total ≤ 600 ms.
 */
const PATRONS = {
	missatge: [
		{ freq: 880, inici: 0, durada: 0.12, pic: 0.1 },
		{ freq: 1175, inici: 0.14, durada: 0.18, pic: 0.1 },
	],
	alerta: [
		{ freq: 660, inici: 0, durada: 0.14, pic: 0.12 },
		{ freq: 660, inici: 0.2, durada: 0.14, pic: 0.12 },
		{ freq: 880, inici: 0.4, durada: 0.18, pic: 0.12 },
	],
};

/**
 * @param {string} tipus 'missatge' (per defecte) o 'alerta'.
 * @return {Array<{freq:number,inici:number,durada:number,pic:number}>} Notes en segons.
 */
export function patroTo( tipus ) {
	return ( PATRONS[ tipus ] ?? PATRONS.missatge ).map( ( n ) => ( {
		...n,
	} ) );
}

/**
 * Ids de notificacions que encara no s'han vist.
 *
 * @param {Iterable<string>} vistes        Ids ja vistos.
 * @param {Array}            notificacions Notificacions actuals.
 * @return {string[]} Ids nous, en ordre.
 */
export function idsNous( vistes, notificacions ) {
	const vist = new Set( vistes ?? [] );
	const ids = ( Array.isArray( notificacions ) ? notificacions : [] )
		.map( ( n ) => n?.id )
		.filter(
			( id ) => id !== undefined && id !== null && ! vist.has( id )
		);
	return [ ...new Set( ids ) ];
}

/**
 * @param {Object}   p
 * @param {boolean}  p.soActivat  El jugador té el so activat (preferència).
 * @param {boolean}  p.interaccio El jugador ja ha interactuat (AudioContext).
 * @param {boolean}  p.pausa      Joc en pausa (o demanant girar).
 * @param {boolean}  p.enJoc      Fase de joc (no bloqueig ni final).
 * @param {string[]} p.noves      Ids nous.
 * @return {boolean} Si ha de sonar.
 */
export function deuSonar( {
	soActivat,
	interaccio,
	pausa,
	enJoc,
	noves,
} = {} ) {
	return Boolean(
		soActivat && interaccio && ! pausa && enJoc && noves && noves.length > 0
	);
}
