/**
 * Lectura del token dels enllaços de correu (`?verifica=` i `?restableix=`).
 * Mòdul pur: no toca el DOM, rep la query i torna la URL neta.
 */

const TOKEN = /^\d{1,10}\.[0-9a-f]{64}$/;
const TIPUS = [ 'verifica', 'restableix' ];

/**
 * Extreu el token de la query i calcula la mateixa URL sense aquests paràmetres.
 *
 * @param {string} cerca Query (`location.search`).
 * @return {{ tipus: string|null, token: string|null, cerca: string }}
 *   `tipus`/`token` nuls si no n'hi ha o no tenen forma de token; `cerca` és la
 *   query sense `verifica` ni `restableix` (sempre es treuen).
 */
export function extreuToken( cerca ) {
	const params = new URLSearchParams(
		typeof cerca === 'string' ? cerca : ''
	);
	let tipus = null;
	let token = null;
	for ( const clau of TIPUS ) {
		const valor = params.get( clau );
		if ( tipus === null && valor !== null && TOKEN.test( valor ) ) {
			tipus = clau;
			token = valor;
		}
		params.delete( clau );
	}
	const resta = params.toString();
	return { tipus, token, cerca: resta ? `?${ resta }` : '' };
}

/**
 * Llegeix el token de la URL i la neteja amb `history.replaceState` abans de res
 * més, perquè no es quedi a l'historial ni s'enviï com a `Referer`.
 *
 * @param {Object} finestra `window` (o equivalent amb `location` i `history`).
 * @return {{ tipus: string|null, token: string|null }} Acció pendent.
 */
export function consumeixTokenUrl( finestra ) {
	const { location, history } = finestra;
	const { tipus, token, cerca } = extreuToken( location.search );
	const teParam = /[?&](verifica|restableix)=/.test( location.search );
	if ( teParam ) {
		history.replaceState(
			history.state,
			'',
			`${ location.pathname }${ cerca }${ location.hash }`
		);
	}
	return { tipus, token };
}
