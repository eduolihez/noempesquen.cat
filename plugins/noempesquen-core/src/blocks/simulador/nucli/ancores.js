/**
 * Claus d'àncora (`data-tut`) vàlides per als `passos` d'un tutorial.
 * Mòdul pur: el validador les comprova i la interfície les posa al DOM.
 */
export const ANCORES = [
	'pantalla',
	'escriptori',
	'barra',
	'inici',
	'rellotge',
	'lupa',
	'app-navegador',
	'app-parla',
	'finestra-navegador',
	'finestra-parla',
	'botons-finestra',
	'parla-xat',
	'parla-respostes',
	'avis',
	'llista-correus',
	'correu-primer',
	'correu-obert',
	'remitent',
	'enllacos',
	'adreca',
	'decisio',
	'bloqueig',
	'dock',
	'app-missatges',
	'app-parla-mobil',
	'banner',
	'centre-control',
	'nav-enrere',
	'nav-inici',
	'conversa',
	'barra-estat',
	'llista-sms',
];

/**
 * Àncora del pas del tutorial en curs (null si no n'hi ha o s'ha acabat).
 * Els avisos (`avis`, `banner`) no caduquen mentre el pas hi apunta.
 *
 * @param {Object} missio Missió.
 * @param {Object} estat  Estat del motor.
 * @return {?string} Clau d'àncora.
 */
export function ancoraDelPas( missio, estat ) {
	return missio?.passos?.[ estat?.pas ]?.ancora ?? null;
}

/**
 * Àncores que cap avís no pot tapar mentre el pas hi apunta: el botó per
 * decidir queda al racó on surten els avisos del PC.
 */
const ANCORES_SENSE_AVISOS = [ 'decisio' ];

/**
 * Cert si el pas del tutorial en curs demana que els avisos s'amaguin (no es
 * perden: queden a la campana i en tornar mostren el temps que els quedava).
 *
 * @param {Object} missio Missió.
 * @param {Object} estat  Estat del motor.
 * @return {boolean} Cert si s'han d'amagar els avisos.
 */
export function pasSenseAvisos( missio, estat ) {
	return ANCORES_SENSE_AVISOS.includes( ancoraDelPas( missio, estat ) );
}
