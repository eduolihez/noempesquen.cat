/**
 * Gestor de finestres de l'escriptori: reductor pur i immutable.
 * Una finestra per app; l'id de la finestra és el nom de l'app.
 *
 * Estat: { finestres: [{ id, app, minimitzada, maximitzada, z, dades }], focus }
 */

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

function obre( estat, app, dades ) {
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
	};
	return {
		...estat,
		finestres: [ ...estat.finestres, finestra ],
		focus: app,
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
 * @param {Object} accio { tipus: 'OBRE', app, dades? } | { tipus: 'TANCA'|'ENFOCA'|'MINIMITZA'|'MAXIMITZA', id } | { tipus: 'REINICIA' }.
 * @return {Object} Nou estat (el mateix objecte si l'acció no fa res).
 */
export function finestresReductor( estat, accio ) {
	if ( accio.tipus === 'OBRE' ) {
		return obre( estat, accio.app, accio.dades );
	}
	if ( accio.tipus === 'REINICIA' ) {
		return ESTAT_FINESTRES;
	}
	const fn = PER_ID[ accio.tipus ];
	if ( ! fn || ! estat.finestres.some( ( f ) => f.id === accio.id ) ) {
		return estat;
	}
	return fn( estat, accio.id );
}
