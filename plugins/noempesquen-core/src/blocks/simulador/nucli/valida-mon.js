/**
 * Validador pur de les dades de farciment del món compartit
 * (`galeria`, `diari`, `ullada`). Retorna un array d'errors; [] si és vàlid.
 */
import { existeixIlustracio } from '../ui/ilustracions-ids.js';

const esObjecte = ( x ) =>
	x !== null && typeof x === 'object' && ! Array.isArray( x );
const esText = ( x ) => typeof x === 'string' && x.trim() !== '';
const esDataISO = ( x ) => {
	if ( typeof x !== 'string' || ! /^\d{4}-\d{2}-\d{2}$/.test( x ) ) {
		return false;
	}
	const d = new Date( `${ x }T00:00:00Z` );
	return (
		! Number.isNaN( d.getTime() ) && d.toISOString().slice( 0, 10 ) === x
	);
};

/* Valida una llista d'objectes; retorna el conjunt d'ids vistos. */
function elements( errors, nom, valor, camps, extra ) {
	const vistos = new Set();
	if ( ! Array.isArray( valor ) || valor.length === 0 ) {
		errors.push( `${ nom }: ha de ser un array no buit` );
		return vistos;
	}
	valor.forEach( ( e, i ) => {
		const ref = `${ nom }[${ i }]`;
		if ( ! esObjecte( e ) ) {
			errors.push( `${ ref }: ha de ser un objecte` );
			return;
		}
		if ( esText( e.id ) ) {
			if ( vistos.has( e.id ) ) {
				errors.push( `${ ref }: id duplicat «${ e.id }»` );
			}
			vistos.add( e.id );
		}
		[ 'id', ...camps ].forEach( ( c ) => {
			if ( ! esText( e[ c ] ) ) {
				errors.push( `${ ref }: camp «${ c }» buit o absent` );
			}
		} );
		if ( esText( e.il ) && ! existeixIlustracio( e.il ) ) {
			errors.push( `${ ref }: il·lustració inexistent «${ e.il }»` );
		}
		if ( camps.includes( 'data' ) && ! esDataISO( e.data ) ) {
			errors.push( `${ ref }: data no ISO (AAAA-MM-DD)` );
		}
		if ( extra ) {
			extra( e, ref );
		}
	} );
	return vistos;
}

export function validaMon( mon ) {
	const errors = [];
	if ( ! esObjecte( mon ) ) {
		return [ 'mon: ha de ser un objecte' ];
	}

	elements( errors, 'galeria', mon.galeria, [ 'titol', 'data', 'il' ] );

	elements(
		errors,
		'diari',
		mon.diari,
		[ 'titol', 'entradeta', 'seccio', 'data', 'il' ],
		( e, ref ) => {
			if (
				! Array.isArray( e.cos ) ||
				e.cos.length === 0 ||
				! e.cos.every( esText )
			) {
				errors.push( `${ ref }: «cos» ha de ser un array de textos` );
			}
		}
	);

	if ( ! esObjecte( mon.ullada ) ) {
		errors.push( 'ullada: ha de ser un objecte' );
		return errors;
	}
	const perfils = elements( errors, 'ullada.perfils', mon.ullada.perfils, [
		'nom',
		'usuari',
		'il',
	] );
	elements(
		errors,
		'ullada.publicacions',
		mon.ullada.publicacions,
		[ 'autor', 'text', 'il' ],
		( e, ref ) => {
			if ( esText( e.autor ) && ! perfils.has( e.autor ) ) {
				errors.push( `${ ref }: autor inexistent «${ e.autor }»` );
			}
			if ( typeof e.likes !== 'number' || ! Number.isFinite( e.likes ) ) {
				errors.push( `${ ref }: «likes» ha de ser un número` );
			}
		}
	);
	return errors;
}
