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
 * Recalcula la disposició automàtica després d'obrir, restaurar, tancar o
 * minimitzar. Si hi ha finestres manuals ocupant l'àrea, només la finestra
 * `id` (la que acaba d'aparèixer) es col·loca a la mitja lliure; una manual
 * minimitzada també compta com a ocupada. Si no, es reparteix l'àrea entre
 * les visibles no manuals; una de sola torna a la mida per defecte (rect null).
 *
 * @param {Object[]} finestres Finestres.
 * @param {Object}   area      { amplada, alcada } o undefined.
 * @param {?string}  id        Finestra que acaba d'aparèixer, si n'hi ha.
 * @return {Object[]} Finestres amb `rect` actualitzat.
 */
function recoloca( finestres, area, id = null ) {
	if ( ! area ) {
		return finestres;
	}
	const manuals = finestres.filter(
		( f ) => f.manual && f.rect && ! f.maximitzada && f.id !== id
	);
	const objectiu = finestres.find( ( f ) => f.id === id );
	if ( manuals.length ) {
		if ( ! objectiu || objectiu.manual ) {
			return finestres;
		}
		const lliure = mitatLliure(
			area,
			manuals.map( ( f ) => f.rect )
		);
		return finestres.map( ( f ) =>
			f.id === id ? { ...f, rect: lliure } : f
		);
	}
	const visibles = finestres.filter(
		( f ) => ! f.minimitzada && ! f.maximitzada
	);
	if ( visibles.some( ( f ) => f.manual ) ) {
		return finestres;
	}
	if ( visibles.length === 1 ) {
		return finestres.map( ( f ) =>
			f.id === visibles[ 0 ].id && f.rect ? { ...f, rect: null } : f
		);
	}
	const disp = disposicioInicial( { ...area, finestres } );
	return finestres.map( ( f ) =>
		disp[ f.id ] ? { ...f, rect: disp[ f.id ] } : f
	);
}

function obre( estat, app, dades ) {
	const existent = estat.finestres.find( ( f ) => f.id === app );
	if ( existent ) {
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
		finestres: [ ...estat.finestres, finestra ],
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
 * @param {Object} accio { tipus: 'OBRE', app, dades?, area? { amplada, alcada } } | { tipus: 'MOU', id, rect } | { tipus: 'TANCA'|'ENFOCA'|'MINIMITZA'|'MAXIMITZA', id, area? } | { tipus: 'REINICIA' }.
 * @return {Object} Nou estat (el mateix objecte si l'acció no fa res).
 */
export function finestresReductor( estat, accio ) {
	const nou = reductorBase( estat, accio );
	if ( nou === estat || ! accio.area ) {
		return nou;
	}
	const id = accio.tipus === 'OBRE' ? accio.app : accio.id;
	const abans = estat.finestres.find( ( f ) => f.id === id );
	// Només apareix (es col·loca) si és nova o estava minimitzada/maximitzada.
	const apareix =
		accio.tipus !== 'TANCA' &&
		accio.tipus !== 'MINIMITZA' &&
		( ! abans || abans.minimitzada || abans.maximitzada );
	return {
		...nou,
		finestres: recoloca( nou.finestres, accio.area, apareix ? id : null ),
	};
}

function reductorBase( estat, accio ) {
	if ( accio.tipus === 'OBRE' ) {
		return obre( estat, accio.app, accio.dades );
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
