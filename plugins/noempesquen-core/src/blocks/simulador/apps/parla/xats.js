/**
 * Ajudes pures de Parla (sense JSX): hores dels xats de farciment, ordre,
 * cerca, separadors de dia i revelació dels missatges del guia.
 */

/**
 * Separa una hora de mon.json («ahir 18:40», «dl. 20:15», «08:05»).
 *
 * @param {string} text Hora tal com ve a les dades.
 * @return {{dia:string, hora:string}} Dia ('' = avui) i hora 'HH:MM'.
 */
export function parteixHora( text ) {
	const parts = String( text ?? '' )
		.trim()
		.split( /\s+/ )
		.filter( Boolean );
	if ( ! parts.length ) {
		return { dia: '', hora: '' };
	}
	return {
		dia: parts.slice( 0, -1 ).join( ' ' ),
		hora: parts[ parts.length - 1 ],
	};
}

/* Com més petit, més recent: avui, ahir, aquesta setmana. */
function antiguitat( dia ) {
	if ( ! dia ) {
		return 0;
	}
	return dia === 'ahir' ? 1 : 2;
}

function clauRecent( xat ) {
	const darrer = xat.missatges?.[ xat.missatges.length - 1 ];
	if ( ! darrer ) {
		return { rang: Infinity, hora: '' };
	}
	const { dia, hora } = parteixHora( darrer.hora );
	return { rang: antiguitat( dia ), hora };
}

/**
 * Xats ordenats del més recent al més antic (nova llista).
 *
 * @param {Object[]} xats Xats { id, nom, missatges: [{ hora }] }.
 * @return {Object[]} Còpia ordenada.
 */
export function ordenaXats( xats ) {
	return [ ...( xats ?? [] ) ].sort( ( a, b ) => {
		const ka = clauRecent( a );
		const kb = clauRecent( b );
		if ( ka.rang !== kb.rang ) {
			return ka.rang - kb.rang;
		}
		return kb.hora.localeCompare( ka.hora );
	} );
}

/**
 * Text en minúscules i sense accents, per cercar.
 *
 * @param {string} text Text.
 * @return {string} Text normalitzat.
 */
export function normalitza( text ) {
	return String( text ?? '' )
		.normalize( 'NFD' )
		.replace( /[̀-ͯ]/g, '' )
		.toLowerCase()
		.trim();
}

/**
 * Elements el nom dels quals conté la cerca (sense majúscules ni accents).
 *
 * @param {Object[]} items Elements amb `nom`.
 * @param {string}   cerca Text cercat.
 * @return {Object[]} Elements que hi coincideixen.
 */
export function filtraPerNom( items, cerca ) {
	const q = normalitza( cerca );
	if ( ! q ) {
		return items;
	}
	return items.filter( ( item ) => normalitza( item.nom ).includes( q ) );
}

/**
 * Grups de missatges consecutius del mateix dia (per als separadors).
 *
 * @param {Object[]} missatges Missatges amb `hora` de mon.json.
 * @return {{dia:string, missatges:Object[]}[]} Grups en ordre.
 */
export function agrupaPerDia( missatges ) {
	return missatges.reduce( ( grups, m ) => {
		const { dia } = parteixHora( m.hora );
		const darrer = grups[ grups.length - 1 ];
		if ( darrer && darrer.dia === dia ) {
			return [
				...grups.slice( 0, -1 ),
				{ dia, missatges: [ ...darrer.missatges, m ] },
			];
		}
		return [ ...grups, { dia, missatges: [ m ] } ];
	}, [] );
}

/**
 * Següent pas de la revelació del xat del guia: els missatges propis es
 * mostren de cop; davant d'un del guia, s'atura i «escriu» (si hi ha
 * animació). Si el xat és més curt que `mostrats` (reinici de la
 * missió), es torna a revelar des del principi: qui crida ha de desar el
 * `mostrats` retornat.
 *
 * @param {Object[]} xat      Missatges { de }.
 * @param {number}   mostrats Quants se'n mostren ara.
 * @param {boolean}  animat   Cal l'indicador «escrivint…».
 * @return {{mostrats:number, escriu:boolean}} Nou recompte i si escriu.
 */
export function properPas( xat, mostrats, animat ) {
	// Un xat més curt que el recompte vol dir un reinici: torna a començar.
	let i = mostrats > xat.length ? 0 : mostrats;
	while ( i < xat.length && ( ! animat || xat[ i ].de !== 'guia' ) ) {
		i++;
	}
	return { mostrats: i, escriu: i < xat.length };
}

/**
 * Xat que s'obre en entrar a Parla al mòbil: el del guia si ho demana
 * l'origen (`dades.xat`) o hi ha missatges seus sense llegir; si no, la llista.
 *
 * @param {number}  noLlegits Missatges del guia sense llegir.
 * @param {?Object} dades     Dades amb què s'ha obert l'app.
 * @param {string}  idGuia    Id del xat del guia.
 * @param {boolean} tutorial  Cert en un tutorial: sempre el xat del guia (la guia visual hi apunta).
 * @return {?string} Id del xat, o null per a la llista.
 */
export function xatInicial( noLlegits, dades, idGuia, tutorial = false ) {
	if ( dades?.xat ) {
		return dades.xat;
	}
	return noLlegits > 0 || tutorial ? idGuia : null;
}
