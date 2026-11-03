/**
 * Idioma del simulador (`es` | `ca`): ajudes pures per a dates, mesos,
 * imports, articles, ordre alfabètic i minúscules. Els mòduls de lògica
 * reben `lang` com a argument opcional; si no, usen `idiomaActual()`, que
 * l'`App` inicialitza una vegada amb `config.lang` (`fixaIdioma`).
 */

export const IDIOMES = [ 'es', 'ca' ];
const PER_DEFECTE = 'es';
const LOCALES = { es: 'es-ES', ca: 'ca-ES' };

const MESOS = {
	ca: [
		'gener',
		'febrer',
		'març',
		'abril',
		'maig',
		'juny',
		'juliol',
		'agost',
		'setembre',
		'octubre',
		'novembre',
		'desembre',
	],
	es: [
		'enero',
		'febrero',
		'marzo',
		'abril',
		'mayo',
		'junio',
		'julio',
		'agosto',
		'septiembre',
		'octubre',
		'noviembre',
		'diciembre',
	],
};

/* Tokens de dia de les dades (mon.json): clau interna neutra (la catalana) i
 * les formes que se'n llegeixen en cada idioma. */
const DIES = {
	ahir: [ 'ahir', 'ayer' ],
	'dl.': [ 'dl.', 'lun.' ],
	'dt.': [ 'dt.', 'mar.' ],
	'dc.': [ 'dc.', 'mié.', 'mie.' ],
	'dj.': [ 'dj.', 'jue.' ],
	'dv.': [ 'dv.', 'vie.' ],
	'ds.': [ 'ds.', 'sáb.', 'sab.' ],
	'dg.': [ 'dg.', 'dom.' ],
};

/* Abans que l'App el fixi (tests, mòduls soltos) es manté el català original. */
let actual = 'ca';

/**
 * Normalitza un codi d'idioma a `es` o `ca`.
 *
 * @param {?string} lang Codi (`es`, `ca`, `ca-ES`...).
 * @return {string} `es` o `ca` (`es` per defecte).
 */
export function normalitzaIdioma( lang ) {
	const base = String( lang ?? '' )
		.toLowerCase()
		.slice( 0, 2 );
	return IDIOMES.includes( base ) ? base : PER_DEFECTE;
}

/**
 * Fixa l'idioma actual del bundle (des de `config.lang`).
 *
 * @param {?string} lang Codi d'idioma.
 */
export function fixaIdioma( lang ) {
	actual = normalitzaIdioma( lang );
}

/**
 * @return {string} Idioma actual (`es` | `ca`).
 */
export function idiomaActual() {
	return actual;
}

/**
 * @param {?string} lang Idioma (per defecte l'actual).
 * @return {string} Locale BCP 47: `es-ES` o `ca-ES`.
 */
export function localeDe( lang = actual ) {
	return LOCALES[ normalitzaIdioma( lang ) ];
}

/**
 * @param {number}  mes  Mes 1-12.
 * @param {?string} lang Idioma.
 * @return {string} Nom del mes en minúscules.
 */
export function nomMes( mes, lang = actual ) {
	return MESOS[ normalitzaIdioma( lang ) ][ mes - 1 ] ?? '';
}

/**
 * Article davant del mes: en català «d'» davant vocal o «h», sinó «de »; en
 * castellà sempre «de ».
 *
 * @param {string}  mes  Nom del mes.
 * @param {?string} lang Idioma.
 * @return {string} `d'` o `de `.
 */
export function articleDe( mes, lang = actual ) {
	return normalitzaIdioma( lang ) === 'ca' && /^[aeiouh]/i.test( mes )
		? "d'"
		: 'de ';
}

/**
 * Data llarga: «12 d'octubre de 2026» (ca) o «12 de octubre de 2026» (es).
 *
 * @param {number}  any  Any.
 * @param {number}  mes  Mes 1-12.
 * @param {number}  dia  Dia.
 * @param {?string} lang Idioma.
 * @return {string} Text.
 */
export function formataDataLlarga( any, mes, dia, lang = actual ) {
	const nom = nomMes( mes, lang );
	return `${ dia } ${ articleDe( nom, lang ) }${ nom } de ${ any }`;
}

function separadorEuro( lang ) {
	return normalitzaIdioma( lang ) === 'es' ? ' ' : ' ';
}

/**
 * Import en euros amb dos decimals: «2.348,62 €» (ca, espai normal) o amb
 * espai no separable abans de «€» (es).
 *
 * @param {number}  valor Import (negatiu = càrrec).
 * @param {boolean} signe Afegeix «+» als positius.
 * @param {?string} lang  Idioma.
 * @return {string} Text.
 */
export function formataImport( valor, signe = false, lang = actual ) {
	const [ enters, decimals ] = Math.abs( valor ).toFixed( 2 ).split( '.' );
	const grups = enters.replace( /\B(?=(\d{3})+(?!\d))/g, '.' );
	let prefix = '';
	if ( valor < 0 ) {
		prefix = '-';
	} else if ( signe && valor > 0 ) {
		prefix = '+';
	}
	return `${ prefix }${ grups },${ decimals }${ separadorEuro( lang ) }€`;
}

/**
 * Preu sense decimals si és enter: «120 €», «12,50 €».
 *
 * @param {number}  preu Preu.
 * @param {?string} lang Idioma.
 * @return {string} Text ('' si no és un número).
 */
export function formataPreu( preu, lang = actual ) {
	if ( typeof preu !== 'number' || ! Number.isFinite( preu ) ) {
		return '';
	}
	const xifra = new Intl.NumberFormat( localeDe( lang ), {
		minimumFractionDigits: Number.isInteger( preu ) ? 0 : 2,
		maximumFractionDigits: 2,
		useGrouping: 'always',
	} ).format( preu );
	return `${ xifra }${ separadorEuro( lang ) }€`;
}

/**
 * Comparador alfabètic (ñ, ç i accents segons l'idioma).
 *
 * @param {?string} lang Idioma.
 * @return {Function} `( a, b ) => number`.
 */
export function comparador( lang = actual ) {
	return new Intl.Collator( localeDe( lang ) ).compare;
}

/**
 * @param {string}  txt  Text.
 * @param {?string} lang Idioma.
 * @return {string} Text en minúscules segons l'idioma.
 */
export function minuscules( txt, lang = actual ) {
	return String( txt ?? '' ).toLocaleLowerCase( localeDe( lang ) );
}

/**
 * Clau interna neutra d'un token de dia de les dades: accepta les formes
 * catalanes i castellanes («ahir»/«ayer», «dl.»/«lun.»).
 *
 * @param {string} dia Token tal com ve a les dades.
 * @return {string} Clau neutra (`ahir`, `dl.`...) o el text original.
 */
export function clauDia( dia ) {
	const t = String( dia ?? '' )
		.trim()
		.toLowerCase();
	const trobat = Object.entries( DIES ).find( ( [ , formes ] ) =>
		formes.includes( t )
	);
	return trobat ? trobat[ 0 ] : dia;
}
