/**
 * Progrés (estrelles per missió) a localStorage, amb migració v1 → v2.
 * Tolera un storage absent o que llança excepcions.
 */
const CLAU_V1 = 'noempesquen-progres-v1';
const CLAU_V2 = 'noempesquen-progres-v2';

export function llegeixProgres( storage ) {
	try {
		const actual = storage.getItem( CLAU_V2 );
		if ( actual !== null && actual !== undefined ) {
			return JSON.parse( actual );
		}
		const antic = storage.getItem( CLAU_V1 );
		if ( antic === null || antic === undefined ) {
			return {};
		}
		const progres = JSON.parse( antic );
		storage.setItem( CLAU_V2, antic );
		return progres;
	} catch {
		return {};
	}
}

export function desaProgres( storage, progres ) {
	try {
		storage.setItem( CLAU_V2, JSON.stringify( progres ) );
	} catch {
		// Sense emmagatzematge: el joc funciona igual.
	}
}
