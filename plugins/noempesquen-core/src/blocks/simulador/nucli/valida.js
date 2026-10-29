/**
 * Validador de missions en format v2. Sense dependències d'interfície.
 */

export const APPS_PC = [ 'navegador', 'parla' ];
export const PLANTILLES_WEB = [ 'posta', 'llum-clara' ];
export const TIPUS_EFECTE = [
	'guia-diu',
	'notifica',
	'mostra',
	'pescat',
	'decideix',
];
export const ESDEVENIMENTS = [
	'inici',
	'app.obre',
	'missatge.obre',
	'enllac.obre',
	'web.carrega',
	'formulari.envia',
	'correu.marca',
];

const CAMPS_SENYAL = [ 'senyal', 'assumpte_senyal', 'domini_senyal' ];

/**
 * Recull recursivament tots els ids de senyal referenciats.
 *
 * @param {Object|Array|string|number|boolean|null} node Valor JSON.
 * @param {string[]}                                out  Acumulador.
 * @return {string[]} Ids de senyal trobats.
 */
function recullSenyals( node, out = [] ) {
	if ( Array.isArray( node ) ) {
		node.forEach( ( x ) => recullSenyals( x, out ) );
	} else if ( node && typeof node === 'object' ) {
		Object.entries( node ).forEach( ( [ clau, valor ] ) => {
			if ( CAMPS_SENYAL.includes( clau ) && typeof valor === 'string' ) {
				out.push( valor );
			} else {
				recullSenyals( valor, out );
			}
		} );
	}
	return out;
}

function validaDisparadors( m, errors ) {
	const opcions = new Set(
		( m.decisio?.opcions ?? [] ).map( ( o ) => o.id )
	);
	let hiHaPescat = false;
	( m.disparadors ?? [] ).forEach( ( d ) => {
		const ev = d.quan?.esdeveniment;
		if ( ! ESDEVENIMENTS.includes( ev ) ) {
			errors.push( `esdeveniment desconegut: ${ ev }` );
		}
		( d.efectes ?? [] ).forEach( ( e ) => {
			if ( ! TIPUS_EFECTE.includes( e.tipus ) ) {
				errors.push( `efecte desconegut: ${ e.tipus }` );
			}
			if ( e.tipus === 'pescat' ) {
				hiHaPescat = true;
			}
			if ( e.tipus === 'decideix' && ! opcions.has( e.opcio ) ) {
				errors.push( `opció inexistent: ${ e.opcio }` );
			}
		} );
	} );
	if ( ! hiHaPescat ) {
		errors.push( 'cap camí de pescat' );
	}
}

/**
 * Valida una missió v2.
 *
 * @param {Object} m Missió a validar.
 * @return {string[]} Llista d'errors (buida si és vàlida).
 */
export function validaMissio( m ) {
	if ( ! m || typeof m !== 'object' ) {
		return [ 'no és un objecte' ];
	}
	const errors = [];
	if ( m.versio !== 2 ) {
		errors.push( 'versio no suportada' );
	}
	[ 'id', 'titol', 'dispositiu', 'personatge' ].forEach( ( c ) => {
		if ( ! m[ c ] ) {
			errors.push( `falta ${ c }` );
		}
	} );
	if ( m.dispositiu && ! [ 'pc', 'mobil' ].includes( m.dispositiu ) ) {
		errors.push( 'dispositiu invàlid' );
	}
	if ( ! Array.isArray( m.intro ) || ! m.intro.length ) {
		errors.push( 'falta intro' );
	}

	const ids = new Set( ( m.senyals ?? [] ).map( ( s ) => s.id ) );
	const usats = [ ...recullSenyals( m.apps ), ...recullSenyals( m.webs ) ];
	new Set( usats ).forEach( ( s ) => {
		if ( ! ids.has( s ) ) {
			errors.push( `senyal desconegut: ${ s }` );
		}
	} );

	Object.values( m.webs ?? {} ).forEach( ( web ) => {
		if ( ! PLANTILLES_WEB.includes( web.plantilla ) ) {
			errors.push( `plantilla desconeguda: ${ web.plantilla }` );
		}
	} );

	validaDisparadors( m, errors );

	const valors = ( m.decisio?.opcions ?? [] ).map( ( o ) => o.valor );
	if ( ! valors.includes( 'correcta' ) ) {
		errors.push( 'cap opció correcta' );
	}
	return errors;
}
