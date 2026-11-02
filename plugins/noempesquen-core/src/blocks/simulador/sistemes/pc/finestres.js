/**
 * Gestor de finestres de l'escriptori: reductor pur i immutable.
 * Una finestra per app; l'id de la finestra és el nom de l'app.
 *
 * Estat: { finestres: [{ id, app, minimitzada, maximitzada, z, dades, manual, rect }], focus }
 * `manual`: el jugador l'ha moguda; `rect`: { x, y, amplada, alcada } assignat
 * (null = mida i cascada per defecte).
 */

import { disposicioInicial, mitatLliure } from './disposicio';

export const ESTAT_FINESTRES = Object.freeze( {
	finestres: Object.freeze( [] ),
	focus: null,
} );

const zMaxim = ( finestres ) =>
	finestres.reduce( ( max, f ) => Math.max( max, f.z ), 0 );

/**
 * La finestra visible amb la z més alta, o null.
 *
 * @param {Object[]} finestres Finestres.
 * @return {?string} Id de la finestra que ha de rebre el focus.
 */
function focusSeguent( finestres ) {
	const visibles = finestres.filter( ( f ) => ! f.minimitzada );
	if ( ! visibles.length ) {
		return null;
	}
	return visibles.reduce( ( a, b ) => ( b.z > a.z ? b : a ) ).id;
}

const actualitza = ( finestres, id, canvis ) =>
	finestres.map( ( f ) => ( f.id === id ? { ...f, ...canvis } : f ) );

function enfoca( estat, id, canvis = {} ) {
	const z = zMaxim( estat.finestres ) + 1;
	return {
		...estat,
		finestres: actualitza( estat.finestres, id, {
			minimitzada: false,
			z,
			...canvis,
		} ),
		focus: id,
	};
}

/**
 * Col·loca la finestra nova (ja afegida a `finestres`) i, si cap finestra
 * és manual, reparteix també les existents.
 *
 * @param {Object[]} finestres Finestres amb la nova al final.
 * @param {Object}   area      { amplada, alcada } o undefined.
 * @return {Object[]} Finestres amb `rect` assignat.
 */
function reparteix( finestres, area ) {
	if ( ! area ) {
		return finestres;
	}
	const nova = finestres[ finestres.length - 1 ];
	const altres = finestres.slice( 0, -1 );
	const visibles = altres.filter(
		( f ) => ! f.minimitzada && ! f.maximitzada
	);
	if ( ! visibles.length ) {
		return finestres;
	}
	if ( visibles.some( ( f ) => f.manual ) ) {
		const ocupades = visibles
			.filter( ( f ) => f.rect )
			.map( ( f ) => f.rect );
		const lliure =
			ocupades.length === visibles.length
				? mitatLliure( area, ocupades )
				: null;
		return lliure ? [ ...altres, { ...nova, rect: lliure } ] : finestres;
	}
	const disp = disposicioInicial( { ...area, finestres } );
	return finestres.map( ( f ) =>
		disp[ f.id ] ? { ...f, rect: disp[ f.id ] } : f
	);
}

function obre( estat, app, dades, area ) {
	if ( estat.finestres.some( ( f ) => f.id === app ) ) {
		return enfoca( estat, app, dades === undefined ? {} : { dades } );
	}
	const finestra = {
		id: app,
		app,
		minimitzada: false,
		maximitzada: false,
		z: zMaxim( estat.finestres ) + 1,
		dades: dades ?? null,
		manual: false,
		rect: null,
	};
	return {
		...estat,
		finestres: reparteix( [ ...estat.finestres, finestra ], area ),
		focus: app,
	};
}

function mou( estat, id, rect ) {
	return {
		...estat,
		finestres: actualitza( estat.finestres, id, { manual: true, rect } ),
	};
}

function tanca( estat, id ) {
	const finestres = estat.finestres.filter( ( f ) => f.id !== id );
	return {
		...estat,
		finestres,
		focus: estat.focus === id ? focusSeguent( finestres ) : estat.focus,
	};
}

function minimitza( estat, id ) {
	const finestres = actualitza( estat.finestres, id, { minimitzada: true } );
	return {
		...estat,
		finestres,
		focus: estat.focus === id ? focusSeguent( finestres ) : estat.focus,
	};
}

function maximitza( estat, id ) {
	const actual = estat.finestres.find( ( f ) => f.id === id );
	return enfoca( estat, id, { maximitzada: ! actual.maximitzada } );
}

const PER_ID = {
	TANCA: tanca,
	ENFOCA: ( estat, id ) => enfoca( estat, id ),
	MINIMITZA: minimitza,
	MAXIMITZA: maximitza,
};

/**
 * @param {Object} estat Estat de les finestres.
 * @param {Object} accio { tipus: 'OBRE', app, dades?, area? { amplada, alcada } } | { tipus: 'MOU', id, rect } | { tipus: 'TANCA'|'ENFOCA'|'MINIMITZA'|'MAXIMITZA', id } | { tipus: 'REINICIA' }.
 * @return {Object} Nou estat (el mateix objecte si l'acció no fa res).
 */
export function finestresReductor( estat, accio ) {
	if ( accio.tipus === 'OBRE' ) {
		return obre( estat, accio.app, accio.dades, accio.area );
	}
	if ( accio.tipus === 'REINICIA' ) {
		return ESTAT_FINESTRES;
	}
	if ( accio.tipus === 'MOU' ) {
		return estat.finestres.some( ( f ) => f.id === accio.id )
			? mou( estat, accio.id, accio.rect )
			: estat;
	}
	const fn = PER_ID[ accio.tipus ];
	if ( ! fn || ! estat.finestres.some( ( f ) => f.id === accio.id ) ) {
		return estat;
	}
	return fn( estat, accio.id );
}
