/**
 * Estat pur del navegador: pestanyes, historial i resolució d'URL a webs.
 *
 * Estat: { pestanyes: [{ id, historial: [url], index, carrega }], activa, seq, carregues }
 * - `carregues` compta les càrregues de la pestanya activa (navegar, enrere,
 *   endavant, tornar a carregar, obrir pestanya). Canviar de pestanya no
 *   carrega res.
 * - `carrega` de cada pestanya és el valor de `carregues` de la seva última
 *   càrrega (serveix de clau per tornar a muntar la pàgina).
 */
import { __ } from '@wordpress/i18n';

export const NOVA_PESTANYA = 'nep:nova-pestanya';
export const PREFIX_CERCA = 'cerca:';

export const ESTAT_NAVEGADOR = {
	pestanyes: [],
	activa: null,
	seq: 0,
	carregues: 0,
};

/* posta.cat és el correu de l'Àlex: hi és en totes les missions. */
const POSTA = {
	plantilla: 'posta',
	https: true,
	titol: __( 'Posta', 'noempesquen' ),
};
const DIARI = {
	plantilla: 'diari',
	https: true,
	titol: __( 'El Diari del Barri', 'noempesquen' ),
};

/**
 * Hostname d'una URL http(s), o null si no n'és una.
 *
 * @param {string} url URL.
 * @return {?string} Hostname en minúscules.
 */
export function hostname( url ) {
	if ( typeof url !== 'string' || ! /^https?:\/\//i.test( url ) ) {
		return null;
	}
	try {
		return new URL( url ).hostname;
	} catch {
		return null;
	}
}

/**
 * Converteix el text de la barra d'adreces en una URL.
 * Afegeix https:// si falta; el text sense punt o amb espais és una cerca.
 *
 * @param {string} text Text escrit.
 * @return {?string} URL, `cerca:<text>` o null si és buit.
 */
export function normalitzaUrl( text ) {
	const net = ( text ?? '' ).trim();
	if ( ! net ) {
		return null;
	}
	const cerca = PREFIX_CERCA + encodeURIComponent( net );
	if ( /^https?:\/\//i.test( net ) ) {
		try {
			return new URL( net ).href;
		} catch {
			return cerca;
		}
	}
	if ( /\s/.test( net ) || ! net.includes( '.' ) ) {
		return cerca;
	}
	try {
		return new URL( `https://${ net }` ).href;
	} catch {
		return cerca;
	}
}

/**
 * Text cercat d'una URL de cerca, o null si no ho és.
 *
 * @param {string} url URL.
 * @return {?string} Text de la cerca.
 */
export function textCerca( url ) {
	return url?.startsWith( PREFIX_CERCA )
		? decodeURIComponent( url.slice( PREFIX_CERCA.length ) )
		: null;
}

/**
 * Hostname sense el prefix `www.`.
 *
 * @param {string} host Hostname.
 * @return {string} Hostname sense `www.`.
 */
export const senseWww = ( host ) => host.replace( /^www\./i, '' );

/**
 * Web registrada per a una URL, buscada pel hostname a `missio.webs`.
 *
 * @param {string} url    URL.
 * @param {Object} missio Missió (amb `webs`).
 * @return {?{plantilla:string, dades:Object}} Web o null si no n'hi ha.
 */
export function resolWeb( url, missio ) {
	const host = hostname( url );
	if ( ! host ) {
		return null;
	}
	// Primer el host exacte (una missió pot declarar un `www.` a propòsit);
	// si no hi és, la mateixa entrada sense `www.`.
	const web = missio?.webs?.[ host ] ?? missio?.webs?.[ senseWww( host ) ];
	if ( web?.plantilla ) {
		return { plantilla: web.plantilla, dades: web };
	}
	if ( host === 'posta.cat' ) {
		return { plantilla: 'posta', dades: POSTA };
	}
	if ( host === 'diaridelbarri.cat' || host === 'www.diaridelbarri.cat' ) {
		return { plantilla: 'diari', dades: DIARI };
	}
	return null;
}

/**
 * Com un servidor que redirigeix a https: una URL http d'una web amb
 * `https: true` passa a https.
 *
 * @param {string} url    URL.
 * @param {Object} missio Missió.
 * @return {string} URL final.
 */
export function ajustaEsquema( url, missio ) {
	if (
		! /^http:\/\//i.test( url ) ||
		! resolWeb( url, missio )?.dades.https
	) {
		return url;
	}
	return url.replace( /^http:/i, 'https:' );
}

export const pestanyaActiva = ( estat ) =>
	estat.pestanyes.find( ( p ) => p.id === estat.activa ) ?? null;

export const urlActual = ( pestanya ) =>
	pestanya ? pestanya.historial[ pestanya.index ] : null;

function obre( estat, url ) {
	const carregues = estat.carregues + 1;
	const id = estat.seq + 1;
	return {
		...estat,
		pestanyes: [
			...estat.pestanyes,
			{
				id,
				historial: [ url ?? NOVA_PESTANYA ],
				index: 0,
				carrega: carregues,
			},
		],
		activa: id,
		seq: id,
		carregues,
	};
}

/* Aplica `canvi` a la pestanya activa i compta una càrrega. */
function carregaActiva( estat, canvi ) {
	const p = pestanyaActiva( estat );
	const nova = p && canvi( p );
	if ( ! nova ) {
		return estat;
	}
	const carregues = estat.carregues + 1;
	return {
		...estat,
		pestanyes: estat.pestanyes.map( ( q ) =>
			q.id === p.id ? { ...nova, carrega: carregues } : q
		),
		carregues,
	};
}

function tanca( estat, id ) {
	const i = estat.pestanyes.findIndex( ( p ) => p.id === id );
	if ( i < 0 ) {
		return estat;
	}
	const pestanyes = estat.pestanyes.filter( ( p ) => p.id !== id );
	if ( ! pestanyes.length ) {
		return obre( { ...estat, pestanyes, activa: null } );
	}
	const activa =
		estat.activa === id
			? ( pestanyes[ i ] ?? pestanyes[ i - 1 ] ).id
			: estat.activa;
	return { ...estat, pestanyes, activa };
}

const afegeix = ( url ) => ( p ) => ( {
	...p,
	historial: [ ...p.historial.slice( 0, p.index + 1 ), url ],
	index: p.index + 1,
} );

/* Anar a la URL en què ja som no afegeix res a l'historial: recarrega. */
const navega = ( url ) => ( p ) =>
	urlActual( p ) === url ? p : afegeix( url )( p );

const mou = ( pas ) => ( p ) => {
	const index = p.index + pas;
	return index >= 0 && index < p.historial.length ? { ...p, index } : null;
};

/**
 * @param {Object} estat Estat del navegador.
 * @param {Object} accio { tipus: 'OBRE_PESTANYA', url? } | { tipus: 'TANCA_PESTANYA'|'ACTIVA', id } | { tipus: 'NAVEGA', url } | { tipus: 'ENRERE'|'ENDAVANT'|'RECARREGA' }.
 * @return {Object} Nou estat (el mateix objecte si l'acció no fa res).
 */
export function navegadorReductor( estat, accio ) {
	switch ( accio.tipus ) {
		case 'OBRE_PESTANYA':
			return obre( estat, accio.url );
		case 'TANCA_PESTANYA':
			return tanca( estat, accio.id );
		case 'ACTIVA':
			return estat.pestanyes.some( ( p ) => p.id === accio.id )
				? { ...estat, activa: accio.id }
				: estat;
		case 'NAVEGA':
			return pestanyaActiva( estat )
				? carregaActiva( estat, navega( accio.url ) )
				: obre( estat, accio.url );
		case 'ENRERE':
			return carregaActiva( estat, mou( -1 ) );
		case 'ENDAVANT':
			return carregaActiva( estat, mou( 1 ) );
		case 'RECARREGA':
			return carregaActiva( estat, ( p ) => p );
		default:
			return estat;
	}
}

/**
 * Estat en obrir el navegador: una pestanya amb la URL donada o la nova pestanya.
 *
 * @param {?string} url URL inicial.
 * @return {Object} Estat.
 */
export const estatInicial = ( url ) => obre( ESTAT_NAVEGADOR, url );
