import {
	MS_AVIS_BASE,
	MS_AVIS_MAX,
	MS_AVIS_PER_CARACTER,
	MS_ENTRE_AVISOS,
} from './temps.js';

/**
 * Duración (ms) de un aviso según la longitud de su texto.
 *
 * @param {string} text Texto del aviso.
 * @return {number} Duración acotada por MS_AVIS_MAX.
 */
export function duradaAvis( text ) {
	const llargada = typeof text === 'string' ? text.length : 0;
	return Math.min(
		MS_AVIS_MAX,
		MS_AVIS_BASE + MS_AVIS_PER_CARACTER * llargada
	);
}

/**
 * Reparte la cola de avisos pendientes entre los que entran ahora y los que
 * esperan. Mantiene el orden y no pierde ninguno. Cada entrada se separa de la
 * anterior al menos `entre` ms; solo entra uno por llamada si aún no ha pasado
 * el intervalo desde la última entrada, y los siguientes esperan.
 *
 * @param {Array}  cua           Avisos pendientes, en orden de llegada.
 * @param {number} ara           Instante actual (ms).
 * @param {number} ultimaEntrada Instante de la última entrada (ms), o null/-Infinity si no hay.
 * @param {Object} opcions
 * @param {number} opcions.entre Separación mínima entre entradas (ms).
 * @return {{mostra: Array, espera: Array, properaEntrada: (number|null)}}
 *   `mostra` entra ahora (como máximo uno), `espera` queda en cola y
 *   `properaEntrada` es el instante en que puede entrar el siguiente.
 */
export function planificaAvisos(
	cua,
	ara,
	ultimaEntrada,
	{ entre = MS_ENTRE_AVISOS } = {}
) {
	const llista = Array.isArray( cua ) ? cua : [];
	if ( llista.length === 0 ) {
		return { mostra: [], espera: [], properaEntrada: null };
	}
	const sensePrevi = ! Number.isFinite( ultimaEntrada );
	const permes = sensePrevi ? ara : ultimaEntrada + entre;
	if ( ara >= permes ) {
		return {
			mostra: [ llista[ 0 ] ],
			espera: llista.slice( 1 ),
			properaEntrada: llista.length > 1 ? ara + entre : null,
		};
	}
	return { mostra: [], espera: [ ...llista ], properaEntrada: permes };
}

/**
 * Admissió d'avisos amb tope de visibles: si ja n'hi ha `max` a la vista, la
 * cua espera sencera (sense perdre'n cap) fins que en surti algun; si hi ha
 * lloc, delega en `planificaAvisos` (com a màxim un per crida).
 *
 * @param {Object} p
 * @param {Array}  p.cua           Avisos pendents, en ordre d'arribada.
 * @param {number} p.visibles      Quants n'hi ha ara a la vista.
 * @param {number} p.max           Tope de visibles alhora.
 * @param {number} p.ara           Instant actual (ms).
 * @param {number} p.ultimaEntrada Instant de l'última entrada (ms), o null.
 * @param {number} p.entre         Separació mínima entre entrades (ms).
 * @return {{mostra: Array, espera: Array, properaEntrada: (number|null)}}
 *   `properaEntrada` és null si cal esperar que se'n tregui algun.
 */
export function admetAvisos( {
	cua,
	visibles = 0,
	max = Infinity,
	ara,
	ultimaEntrada = null,
	entre = MS_ENTRE_AVISOS,
} = {} ) {
	const llista = Array.isArray( cua ) ? cua : [];
	if ( visibles >= max ) {
		return { mostra: [], espera: [ ...llista ], properaEntrada: null };
	}
	const r = planificaAvisos( llista, ara, ultimaEntrada, { entre } );
	// Si amb aquesta entrada s'omple el tope, la propera espera una sortida.
	if ( r.mostra.length && visibles + r.mostra.length >= max ) {
		return { ...r, properaEntrada: null };
	}
	return r;
}

/**
 * Temps que queda d'un avís després d'haver corregut des de `desde` fins a
 * `ara`. Mai negatiu.
 *
 * @param {number} resta Temps que quedava (ms).
 * @param {number} desde Instant en què es va engegar el comptador (ms).
 * @param {number} ara   Instant actual (ms).
 * @return {number} Temps restant (ms).
 */
export function restaTemps( resta, desde, ara ) {
	return Math.max( 0, resta - Math.max( 0, ara - desde ) );
}

/**
 * Ids de la cua que encara s'han de mostrar: existeixen, no s'han llegit i
 * no els amaga el filtre (p. ex. l'app d'origen és oberta). Manté l'ordre.
 *
 * @param {Array}    cua           Ids pendents.
 * @param {Array}    notificacions Notificacions del motor.
 * @param {Function} [oculta]      (n) => cert si no s'ha de mostrar.
 * @return {Array} Ids que segueixen vius.
 */
export function filtraCua( cua, notificacions, oculta = () => false ) {
	const per = new Map(
		( Array.isArray( notificacions ) ? notificacions : [] ).map( ( n ) => [
			n.id,
			n,
		] )
	);
	return ( Array.isArray( cua ) ? cua : [] ).filter( ( id ) => {
		const n = per.get( id );
		return Boolean( n && ! n.llegida && ! oculta( n ) );
	} );
}

/**
 * Còpia del mapa de temps restants amb només els ids vius.
 *
 * @param {Map}   restes Temps restant per id.
 * @param {Array} vius   Ids que encara són a la vista.
 * @return {Map} Mapa podat.
 */
export function podaRestes( restes, vius ) {
	const v = new Set( vius );
	return new Map(
		[ ...( restes ?? [] ) ].filter( ( [ id ] ) => v.has( id ) )
	);
}

/**
 * Afegeix el text d'un avís que entra a la regió aria-live. Els d'una mateixa
 * tanda s'hi acumulen; una tanda nova buida la llista. Cada entrada porta una
 * clau única perquè dos textos iguals seguits es tornin a anunciar.
 *
 * @param {Array}   anuncis           Entrades actuals [{ clau, text }].
 * @param {string}  text              Text a anunciar.
 * @param {Object}  opcions
 * @param {boolean} opcions.novaTanda Comença una tanda nova.
 * @param {number}  opcions.clau      Clau única de l'entrada.
 * @return {Array} Entrades noves.
 */
export function afegeixAnunci(
	anuncis,
	text,
	{ novaTanda = false, clau } = {}
) {
	const base = novaTanda || ! Array.isArray( anuncis ) ? [] : anuncis;
	return [ ...base, { clau, text } ];
}
