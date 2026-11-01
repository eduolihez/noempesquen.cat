/**
 * Agrupa les missions per al selector. Mòdul pur.
 * Progrés: { [idMissio]: estrelles 0-3 }; qualsevol altra cosa es tolera.
 * Un tutorial fet es desa com a 1 al mateix mapa (no són estrelles).
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
 * Diu si un tutorial ja s'ha fet (qualsevol valor positiu al progrés).
 *
 * @param {Object} progres Progrés.
 * @param {string} id      Id del tutorial.
 * @return {boolean} Cert si està fet.
 */
export const tutorialFet = ( progres, id ) => estrellesDe( progres, id ) > 0;

/**
 * `recomanada` també apareix dins del seu grup (tutorials, principals o
 * altres): qui pinti la targeta ha d'excloure-la per id de la llista.
 *
 * La primera vegada (cap tutorial fet ni cap missió jugada) es recomana el
 * tutorial del dispositiu en ús; després, mai més un tutorial. Els tutorials
 * no compten al resum.
 *
 * @param {Array}  missions Missions (amb id i dispositiu).
 * @param {string} preferit Dispositiu en ús ('pc' o 'mobil').
 * @param {Object} progres  Estrelles per missió.
 * @return {{recomanada:Object|null,tutorials:Array,principals:Array,altres:Array,resum:{jugades:number,total:number,estrelles:number,max:number}}} Grups i resum.
 */
export function agrupaMissions( missions, preferit, progres ) {
	const totes = Array.isArray( missions ) ? missions.filter( Boolean ) : [];
	const esTutorial = ( m ) => m.tutorial === true;
	const llista = totes.filter( ( m ) => ! esTutorial( m ) );
	const tutorials = [
		...totes.filter(
			( m ) => esTutorial( m ) && m.dispositiu === preferit
		),
		...totes.filter(
			( m ) => esTutorial( m ) && m.dispositiu !== preferit
		),
	];
	const principals = llista.filter( ( m ) => m.dispositiu === preferit );
	const altres = llista.filter( ( m ) => m.dispositiu !== preferit );
	const primerCop =
		! totes.some( ( m ) => estrellesDe( progres, m.id ) > 0 ) &&
		tutorials.length > 0 &&
		tutorials[ 0 ].dispositiu === preferit;
	// «Continua per aquí»: primera sense jugar; si no n'hi ha, la primera
	// amb menys de 3 estrelles. Sempre les del dispositiu primer.
	const ordre = [ ...principals, ...altres ];
	const recomanada = primerCop
		? tutorials[ 0 ]
		: ( ordre.find( ( m ) => estrellesDe( progres, m.id ) === 0 ) ??
			ordre.find(
				( m ) => estrellesDe( progres, m.id ) < MAX_ESTRELLES
			) ??
			null );
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
		tutorials,
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
