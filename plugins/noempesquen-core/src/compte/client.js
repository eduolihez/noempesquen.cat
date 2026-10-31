/**
 * Client de l'API de comptes (noempesquen/v1/compte). Mòdul pur: sense JSX ni
 * DOM; rep el `fetch` per poder-lo provar a Node.
 *
 * Mai guarda la contrasenya: només viatja al cos JSON de la petició.
 * El nonce `wp_rest` viu només en memoria (no s'incrusta a l'HTML): s'obté
 * d'`admin-ajax.php?action=rest-nonce` amb la galeta de sessió.
 */

const ERROR_XARXA = {
	ok: false,
	estat: 0,
	codi: 'nep_xarxa',
	missatge: "No s'ha pogut connectar. Torna-ho a provar.",
};

/**
 * Llegeix el cos JSON d'una resposta (o `null` si no ho és).
 *
 * @param {Response} resposta Resposta.
 * @return {Promise<Object|null>} Cos o `null`.
 */
async function llegeixJson( resposta ) {
	try {
		const text = await resposta.text();
		return text ? JSON.parse( text ) : null;
	} catch {
		return null;
	}
}

/**
 * Crea un client.
 *
 * @param {Object}       opcions
 * @param {string}       opcions.api     URL base de noempesquen/v1/ (amb barra final).
 * @param {string}       opcions.ajaxUrl URL d'admin-ajax.php.
 * @param {typeof fetch} opcions.fetchFn Implementació de fetch.
 * @return {Object} Client.
 */
export function creaClient( { api, ajaxUrl, fetchFn } ) {
	const base = api.endsWith( '/' ) ? api : `${ api }/`;
	let nonce = null;

	const fesFetch = ( ...args ) => fetchFn( ...args );

	/**
	 * Petició JSON a una ruta de compte.
	 *
	 * @param {string}  metode Mètode HTTP.
	 * @param {string}  ruta   Ruta relativa (p. ex. `compte/entra`).
	 * @param {Object=} cos    Cos JSON.
	 * @param {Object=} opc    `{ senseNonce }`: no actualitza el nonce.
	 * @return {Promise<Object>} `{ ok:true, dades }` o error.
	 */
	async function peticio( metode, ruta, cos, opc = {} ) {
		const capcaleres = { Accept: 'application/json' };
		if ( cos !== undefined ) {
			capcaleres[ 'Content-Type' ] = 'application/json';
		}
		if ( nonce ) {
			capcaleres[ 'X-WP-Nonce' ] = nonce;
		}
		let resposta;
		try {
			resposta = await fesFetch( base + ruta, {
				method: metode,
				credentials: 'same-origin',
				headers: capcaleres,
				body: cos !== undefined ? JSON.stringify( cos ) : undefined,
			} );
		} catch {
			return { ...ERROR_XARXA };
		}
		const dades = await llegeixJson( resposta );
		if ( ! resposta.ok ) {
			return {
				ok: false,
				estat: resposta.status,
				codi: dades?.code || 'nep_error',
				missatge:
					typeof dades?.message === 'string' && dades.message
						? dades.message
						: ERROR_XARXA.missatge,
			};
		}
		if ( ! opc.senseNonce ) {
			const nou = resposta.headers?.get?.( 'X-WP-Nonce' );
			if ( nou ) {
				nonce = nou;
			}
			if ( typeof dades?.nonce === 'string' && dades.nonce ) {
				nonce = dades.nonce;
			}
		}
		return { ok: true, dades: dades || {} };
	}

	/**
	 * Nonce de la sessió actual o `null` si no n'hi ha.
	 *
	 * @return {Promise<string|null>} Nonce.
	 */
	async function obtenNonce() {
		try {
			const resposta = await fesFetch( `${ ajaxUrl }?action=rest-nonce`, {
				credentials: 'same-origin',
			} );
			if ( ! resposta.ok ) {
				nonce = null;
				return null;
			}
			const text = ( await resposta.text() ).trim();
			nonce = text && text !== '0' && text !== '-1' ? text : null;
		} catch {
			nonce = null;
		}
		return nonce;
	}

	/**
	 * Estat de la sessió: `{ connectat, nonce, progres }`.
	 *
	 * @return {Promise<Object>} Estat.
	 */
	async function estat() {
		const n = await obtenNonce();
		if ( ! n ) {
			return { connectat: false, nonce: null, progres: {} };
		}
		const r = await peticio( 'GET', 'compte/progres' );
		if ( ! r.ok ) {
			return { connectat: false, nonce: null, progres: {} };
		}
		return { connectat: true, nonce, progres: r.dades.progres || {} };
	}

	const tancaSessio = ( r ) => {
		if ( r.ok ) {
			nonce = null;
		}
		return r;
	};

	return {
		obtenNonce,
		estat,
		nonceActual: () => nonce,
		// Claus del contracte de l'API (`acepta`, `majoria_edat`).
		registra: ( dades ) =>
			peticio( 'POST', 'compte/registre', {
				email: dades.email,
				contrasenya: dades.contrasenya,
				acepta: dades.acepta === true,
				majoria_edat: dades.majoria_edat === true,
			} ),
		entra: ( { email, contrasenya } ) =>
			peticio( 'POST', 'compte/entra', { email, contrasenya } ),
		surt: async () =>
			tancaSessio(
				await peticio( 'POST', 'compte/surt', {}, { senseNonce: true } )
			),
		desaProgres: ( progres ) =>
			peticio( 'PUT', 'compte/progres', { progres } ),
		exporta: () => peticio( 'GET', 'compte/exporta' ),
		esborra: async ( contrasenya ) =>
			tancaSessio(
				await peticio(
					'DELETE',
					'compte',
					{ contrasenya },
					{ senseNonce: true }
				)
			),
	};
}
