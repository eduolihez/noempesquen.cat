/**
 * Combina les missions incloses amb les remotes (CPT). Només s'accepten
 * remotes v2 vàlides; les v1, invàlides o nul·les s'ignoren. Quines es
 * descarten i per què ho torna `diagnostica`, perquè el panel les pugui
 * mostrar (el joc no escriu a la consola).
 */
import { validaMissio } from './valida.js';

const errorsDe = ( m, mon ) => {
	if ( ! m || typeof m !== 'object' ) {
		return [ 'no és un objecte' ];
	}
	try {
		return validaMissio( m, mon );
	} catch {
		return [ 'estructura no vàlida' ];
	}
};

/**
 * @param {Array}  remotes Missions remotes (poden ser qualsevol cosa).
 * @param {Object} mon     Món compartit.
 * @return {Array<{id: ?string, errors: string[]}>} Les descartades.
 */
export function diagnostica( remotes, mon ) {
	return ( Array.isArray( remotes ) ? remotes : [] )
		.map( ( m ) => ( { id: m?.id ?? null, errors: errorsDe( m, mon ) } ) )
		.filter( ( d ) => d.errors.length > 0 );
}

export function combinaMissions( incloses, remotes, mon ) {
	const valides = ( Array.isArray( remotes ) ? remotes : [] ).filter(
		( m ) => errorsDe( m, mon ).length === 0
	);
	const perId = new Map( valides.map( ( m ) => [ m.id, m ] ) );
	const base = incloses.map( ( m ) => perId.get( m.id ) ?? m );
	const ids = new Set( incloses.map( ( m ) => m.id ) );
	const noves = valides.filter( ( m ) => ! ids.has( m.id ) );
	return [ ...base, ...noves ];
}
