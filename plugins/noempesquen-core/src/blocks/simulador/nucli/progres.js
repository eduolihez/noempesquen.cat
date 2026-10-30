/**
 * Progrés (estrelles per missió) a localStorage, amb migració v1 → v2.
 * Tolera un storage absent o que llança excepcions.
 */
const CLAU_V1 = 'noempesquen-progres-v1';
const CLAU_V2 = 'noempesquen-progres-v2';

const esObjecte = ( v ) =>
	!! v && typeof v === 'object' && ! Array.isArray( v );

export function llegeixProgres( storage ) {
	try {
		const actual = storage.getItem( CLAU_V2 );
		if ( actual !== null && actual !== undefined ) {
			const llegit = JSON.parse( actual );
			return esObjecte( llegit ) ? llegit : {};
		}
		const antic = storage.getItem( CLAU_V1 );
		if ( antic === null || antic === undefined ) {
			return {};
		}
		const progres = JSON.parse( antic );
		if ( ! esObjecte( progres ) ) {
			return {};
		}
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
