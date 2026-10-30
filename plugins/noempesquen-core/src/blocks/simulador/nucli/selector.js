/**
 * Agrupa les missions per al selector. Mòdul pur.
 * Progrés: { [idMissio]: estrelles 0-3 }; qualsevol altra cosa es tolera.
 */
const MAX_ESTRELLES = 3;

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

/**
 * `recomanada` també apareix dins del seu grup (principals o altres): qui
 * pinti la targeta ha d'excloure-la per id de la llista.
 *
 * @param {Array}  missions Missions (amb id i dispositiu).
 * @param {string} preferit Dispositiu en ús ('pc' o 'mobil').
 * @param {Object} progres  Estrelles per missió.
 * @return {{recomanada:Object|null,principals:Array,altres:Array,resum:{jugades:number,total:number,estrelles:number,max:number}}} Grups i resum.
 */
export function agrupaMissions( missions, preferit, progres ) {
	const llista = Array.isArray( missions ) ? missions.filter( Boolean ) : [];
	const principals = llista.filter( ( m ) => m.dispositiu === preferit );
	const altres = llista.filter( ( m ) => m.dispositiu !== preferit );
	// «Continua per aquí»: primera sense jugar; si no n'hi ha, la primera
	// amb menys de 3 estrelles. Sempre les del dispositiu primer.
	const ordre = [ ...principals, ...altres ];
	const recomanada =
		ordre.find( ( m ) => estrellesDe( progres, m.id ) === 0 ) ??
		ordre.find( ( m ) => estrellesDe( progres, m.id ) < MAX_ESTRELLES ) ??
		null;
	let jugades = 0;
	let estrelles = 0;
	llista.forEach( ( m ) => {
		const e = estrellesDe( progres, m.id );
		if ( e > 0 ) {
			jugades++;
			estrelles += e;
		}
	} );
	return {
		recomanada,
		principals,
		altres,
		resum: {
			jugades,
			total: llista.length,
			estrelles,
			max: llista.length * MAX_ESTRELLES,
		},
	};
}
