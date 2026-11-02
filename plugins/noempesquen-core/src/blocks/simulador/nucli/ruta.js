/**
 * Ruta lineal d'un dispositiu per al mapa del port. Mòdul pur.
 * Progrés: { [idMissio]: estrelles 0-3 }; qualsevol altra cosa es tolera.
 * Un tutorial fet es desa com a 1 al mateix mapa (no són estrelles).
 */
const MAX_ESTRELLES = 3;
const DISPOSITIUS = [ 'pc', 'mobil' ];

function estrellesDe( progres, id ) {
	if (
		! progres ||
		typeof progres !== 'object' ||
		Array.isArray( progres )
	) {
		return 0;
	}
	const n = progres[ id ];
	if ( ! Number.isFinite( n ) ) {
		return 0;
	}
	return Math.min( MAX_ESTRELLES, Math.max( 0, Math.floor( n ) ) );
}

function missionsDe( missions, dispositiu ) {
	const totes = Array.isArray( missions )
		? missions.filter( ( m ) => m && typeof m === 'object' )
		: [];
	const delDispositiu = totes.filter( ( m ) => m.dispositiu === dispositiu );
	return [
		...delDispositiu.filter( ( m ) => m.tutorial === true ),
		...delDispositiu.filter( ( m ) => m.tutorial !== true ),
	];
}

/**
 * Construeix la ruta lineal d'un dispositiu: tutorial primer, després la
 * resta en l'ordre de l'array (les remotes ja hi van al final).
 *
 * @param {Array}  missions   Missions (amb id, dispositiu i tutorial).
 * @param {string} dispositiu 'pc' o 'mobil'.
 * @param {Object} progres    Estrelles per missió.
 * @return {{dispositiu:string,nodes:Array,feta:number,total:number,estrelles:number,max:number,seguent:string|null}} Ruta.
 */
export function construeixRuta( missions, dispositiu, progres ) {
	const llista = missionsDe( missions, dispositiu );
	let disponibleAssignada = false;
	let faltaId = null; // darrera missió no feta de la ruta
	let feta = 0;
	let estrelles = 0;
	let max = 0;
	let seguent = null;
	const nodes = llista.map( ( m, i ) => {
		const tutorial = m.tutorial === true;
		const e = estrellesDe( progres, m.id );
		let estat;
		let motiu = null;
		if ( e >= 1 ) {
			estat = 'feta';
		} else if ( ! disponibleAssignada ) {
			estat = 'disponible';
			disponibleAssignada = true;
			seguent = m.id;
		} else {
			estat = 'bloquejada';
			motiu = faltaId;
		}
		if ( estat !== 'feta' ) {
			faltaId = m.id;
		}
		if ( estat === 'feta' ) {
			feta++;
		}
		if ( ! tutorial ) {
			max += MAX_ESTRELLES;
			estrelles += e;
		}
		return {
			id: m.id,
			indes: i + 1,
			titol: m.titol,
			tutorial,
			estat,
			estrelles: tutorial ? Math.min( e, 1 ) : e,
			motiu,
		};
	} );
	return {
		dispositiu,
		nodes,
		feta,
		total: nodes.length,
		estrelles,
		max,
		seguent,
	};
}

/**
 * Missió següent a la ruta del mateix dispositiu que `id`.
 *
 * @param {Array}  missions Missions.
 * @param {string} id       Id de la missió acabada.
 * @return {string|null} Id de la següent o null si és l'última o no existeix.
 */
export function seguentDe( missions, id ) {
	const totes = Array.isArray( missions ) ? missions : [];
	const actual = totes.find( ( m ) => m && m.id === id );
	if ( ! actual ) {
		return null;
	}
	const llista = missionsDe( totes, actual.dispositiu );
	const i = llista.findIndex( ( m ) => m.id === id );
	return llista[ i + 1 ]?.id ?? null;
}

/**
 * Dispositius que tenen almenys una missió, en l'ordre pc, mobil.
 *
 * @param {Array} missions Missions.
 * @return {string[]} Dispositius amb ruta.
 */
export function dispositiusAmbRuta( missions ) {
	return DISPOSITIUS.filter( ( d ) => missionsDe( missions, d ).length > 0 );
}
