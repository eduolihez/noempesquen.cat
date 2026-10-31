/**
 * Progrés (estrelles per missió) a localStorage, amb migració v1 → v2.
 * Tolera un storage absent o que llança excepcions.
 */
const CLAU_V1 = 'noempesquen-progres-v1';
const CLAU_V2 = 'noempesquen-progres-v2';

const esObjecte = ( v ) =>
	!! v && typeof v === 'object' && ! Array.isArray( v );

// Només es conserven les entrades amb estrelles numèriques.
const netejaProgres = ( progres ) =>
	Object.fromEntries(
		Object.entries( progres ).filter(
			( [ , v ] ) => typeof v === 'number' && Number.isFinite( v )
		)
	);

export function llegeixProgres( storage ) {
	try {
		const actual = storage.getItem( CLAU_V2 );
		if ( actual !== null && actual !== undefined ) {
			const llegit = JSON.parse( actual );
			return esObjecte( llegit ) ? netejaProgres( llegit ) : {};
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
		return netejaProgres( progres );
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

/**
 * Esborra el progrés local (v1 i v2): en sortir o esborrar el compte, perquè
 * a un ordinador compartit no quedi el progrés del jugador anterior.
 *
 * @param {?Storage} storage Emmagatzematge.
 */
export function esborraProgres( storage ) {
	try {
		storage.removeItem( CLAU_V2 );
		storage.removeItem( CLAU_V1 );
	} catch {
		// Sense emmagatzematge: no hi ha res a esborrar.
	}
}
