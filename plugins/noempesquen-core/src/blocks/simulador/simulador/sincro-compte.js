/**
 * Sincronització del progrés amb el compte (si hi ha sessió). Mòdul pur:
 * sense JSX ni DOM; rep el client de `src/compte/client.js`.
 *
 * Qualsevol error de xarxa torna al mode local en silenci: el joc no es
 * bloqueja mai.
 */
import { diferencia, fusionaProgres } from '../nucli/sincro';

/**
 * Estat inicial: fusiona el progrés local amb el del servidor.
 *
 * @param {Object} opcions
 * @param {Object} opcions.client       Client del compte.
 * @param {Object} opcions.progresLocal Progrés local `{ id: estrelles }`.
 * @return {Promise<{connectat: boolean, progres: Object, calPujar: boolean}>} Resultat.
 */
export async function sincroInicial( { client, progresLocal } ) {
	const local = { connectat: false, progres: progresLocal, calPujar: false };
	let estat;
	try {
		estat = await client.estat();
	} catch {
		return local;
	}
	if ( ! estat?.connectat ) {
		return local;
	}
	const servidor = estat.progres || {};
	const progres = fusionaProgres( progresLocal, servidor );
	return {
		connectat: true,
		progres,
		calPujar: diferencia( progres, servidor ),
	};
}

/**
 * Desa el progrés al compte (PUT). Mai llança.
 *
 * @param {Object} opcions
 * @param {Object} opcions.client  Client del compte.
 * @param {Object} opcions.progres Progrés `{ id: estrelles }`.
 * @return {Promise<Object|null>} Progrés fusionat del servidor o `null` si falla.
 */
export async function sincronitza( { client, progres } ) {
	try {
		const r = await client.desaProgres( progres );
		return r?.ok ? ( r.dades?.progres ?? null ) : null;
	} catch {
		return null;
	}
}
