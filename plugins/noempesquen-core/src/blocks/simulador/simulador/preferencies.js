/**
 * Preferències d'Ajustos persistides. Mòdul pur: l'emmagatzematge s'injecta
 * (a l'app, window.localStorage) i qualsevol error s'empassa.
 */
export const CLAU_SONS = 'noempesquen-sons';
/* Esdeveniment de window que avisa que la preferència ha canviat. */
export const EVENT_SONS = 'noempesquen-sons-canvi';

/* Retorna true per defecte si no hi ha valor, és corrupte o falla l'accés. */
export function llegeixSons( emmagatzem ) {
	try {
		const valor = emmagatzem?.getItem( CLAU_SONS );
		if ( valor === 'true' ) {
			return true;
		}
		if ( valor === 'false' ) {
			return false;
		}
	} catch {
		// Sense emmagatzematge: valor per defecte.
	}
	return true;
}

/* Desa un booleà; retorna si s'ha pogut desar. */
export function desaSons( emmagatzem, valor ) {
	try {
		emmagatzem.setItem( CLAU_SONS, valor ? 'true' : 'false' );
		return true;
	} catch {
		return false;
	}
}
