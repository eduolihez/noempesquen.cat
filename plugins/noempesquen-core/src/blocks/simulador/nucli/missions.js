/**
 * Combina les missions incloses amb les remotes (CPT). Només s'accepten
 * remotes v2 vàlides; les v1, invàlides o nul·les s'ignoren.
 */
import { validaMissio } from './valida.js';

const esValida = ( m, mon ) =>
	!! m && typeof m === 'object' && validaMissio( m, mon ).length === 0;

export function combinaMissions( incloses, remotes, mon ) {
	const valides = ( Array.isArray( remotes ) ? remotes : [] ).filter( ( m ) =>
		esValida( m, mon )
	);
	const perId = new Map( valides.map( ( m ) => [ m.id, m ] ) );
	const base = incloses.map( ( m ) => perId.get( m.id ) ?? m );
	const ids = new Set( incloses.map( ( m ) => m.id ) );
	const noves = valides.filter( ( m ) => ! ids.has( m.id ) );
	return [ ...base, ...noves ];
}
