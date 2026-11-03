/**
 * Validador de parella ES/CA de les missions incloses (`missions/es/` i
 * `missions/ca/`). Mòdul pur: rep els JSON ja llegits.
 *
 * Què es compara (vegeu `docs/format-missions.md`):
 * - Els dos idiomes tenen exactament els mateixos fitxers (`mon.json` inclòs).
 * - Cada parell de fitxers té la mateixa estructura: mateixes claus a cada
 *   objecte, mateixa llargada a cada llista i mateix tipus a cada node.
 * - Tots els valors (ids, `tipus`, `esdeveniment`, `senyal`, números,
 *   booleans...) han de ser iguals, excepte els textos de les claus de
 *   `CLAUS_LLIURES` (textos que es tradueixen i dominis/adreces de ficció).
 * - Les claus de `webs` són dominis (`.cat` → `.es`): són lliures, però n'hi ha
 *   d'haver el mateix nombre i es comparen les webs en el mateix ordre.
 * - Les `url` dels disparadors i `navegador.inici` són lògica: cada una ha
 *   d'apuntar a una web de la missió o de `mon.json` del MATEIX idioma, i a la
 *   mateixa posició (missió i després món) en tots dos idiomes.
 */

/** Claus amb text lliure (traduïble o dominis de ficció). La resta de valors s'han de repetir. */
export const CLAUS_LLIURES = new Set( [
	// Textos que veu el jugador.
	'titol',
	'resum',
	'intro',
	'instruccions',
	'pistes',
	'nom',
	'assumpte',
	't',
	'text',
	'missatge',
	'boto',
	'etiqueta',
	'autoompli',
	'explicacio',
	'reaccio',
	'normal',
	'web_falsa',
	'pescat',
	'dades_donades',
	'avis_surt',
	'esborra_sol',
	'pregunta',
	'resposta',
	'aprenentatges',
	'consell',
	'processant',
	'nota',
	'inicials',
	'promesa',
	'nom_lloc',
	'telefon',
	'etiquetaTelefon',
	'contador',
	'fitxer',
	'text_boto',
	'rol',
	'entradeta',
	'cos',
	'seccio',
	'usuari',
	'premi',
	'descripcio',
	'import',
	'concepte',
	// Dates i hores amb paraules (`ahir`, `dl.`): T02 les passa a claus neutres.
	'data',
	'hora',
	// Dominis i adreces de ficció (`.cat` en català, `.es` en castellà).
	'url',
	'inici',
	'adreca',
	'origen',
	'correu',
] );

/** Objectes amb claus que són dominis: només compten el nombre i l'ordre. */
export const CLAUS_DOMINIS = new Set( [ 'webs' ] );

const tipus = ( v ) => {
	if ( v === null ) {
		return 'null';
	}
	return Array.isArray( v ) ? 'llista' : typeof v;
};

/**
 * Diferències d'estructura i de lògica entre dos valors.
 *
 * @param {*}      ca   Valor en català.
 * @param {*}      es   Valor en castellà.
 * @param {string} ruta Ruta per als missatges.
 * @param {string} clau Clau que conté el valor (els elements d'una llista hereten la de la llista).
 * @return {string[]} Diferències (buida = mateixa lògica).
 */
export function comparaEstructura( ca, es, ruta = '', clau = '' ) {
	const t = tipus( ca );
	if ( t !== tipus( es ) ) {
		return [
			`${ ruta || '(arrel)' }: tipus diferent (${ t } / ${ tipus( es ) })`,
		];
	}
	if ( t === 'llista' ) {
		if ( ca.length !== es.length ) {
			return [
				`${ ruta }: llargada diferent (${ ca.length } / ${ es.length })`,
			];
		}
		return ca.flatMap( ( v, i ) =>
			comparaEstructura( v, es[ i ], `${ ruta }[${ i }]`, clau )
		);
	}
	if ( t === 'object' ) {
		const kCa = Object.keys( ca );
		const kEs = Object.keys( es );
		if ( CLAUS_DOMINIS.has( clau ) ) {
			if ( kCa.length !== kEs.length ) {
				return [
					`${ ruta }: nombre de webs diferent (${ kCa.length } / ${ kEs.length })`,
				];
			}
			return kCa.flatMap( ( k, i ) =>
				comparaEstructura(
					ca[ k ],
					es[ kEs[ i ] ],
					`${ ruta }.${ k }|${ kEs[ i ] }`,
					''
				)
			);
		}
		const errors = [];
		for ( const k of kCa ) {
			if ( ! Object.prototype.hasOwnProperty.call( es, k ) ) {
				errors.push(
					`${ ruta ? ruta + '.' : '' }${ k }: falta en castellà`
				);
			}
		}
		for ( const k of kEs ) {
			if ( ! Object.prototype.hasOwnProperty.call( ca, k ) ) {
				errors.push(
					`${ ruta ? ruta + '.' : '' }${ k }: falta en català`
				);
			}
		}
		for ( const k of kCa ) {
			if ( Object.prototype.hasOwnProperty.call( es, k ) ) {
				errors.push(
					...comparaEstructura(
						ca[ k ],
						es[ k ],
						ruta ? `${ ruta }.${ k }` : k,
						k
					)
				);
			}
		}
		return errors;
	}
	if ( t === 'string' && CLAUS_LLIURES.has( clau ) ) {
		return [];
	}
	return ca === es
		? []
		: [
				`${ ruta }: valor diferent (${ JSON.stringify(
					ca
				) } / ${ JSON.stringify( es ) })`,
			];
}

/**
 * Domini d'una URL de ficció (`https://posta.cat/x` → `posta.cat`).
 *
 * @param {string} url URL o domini.
 * @return {string} Domini en minúscules.
 */
export const dominiDe = ( url ) =>
	String( url )
		.replace( /^[a-z]+:\/\//i, '' )
		.split( /[/?#]/ )[ 0 ]
		.toLowerCase();

/**
 * URLs lògiques d'una missió, en ordre: `navegador.inici` i les `url` dels disparadors
 * (sense les `app://`).
 *
 * @param {Object} missio Missió.
 * @return {string[]} URLs.
 */
export function urlsLogiques( missio ) {
	const urls = [ ...( missio?.navegador?.inici ?? [] ) ];
	const recorre = ( v ) => {
		if ( Array.isArray( v ) ) {
			v.forEach( recorre );
		} else if ( v && typeof v === 'object' ) {
			for ( const [ k, x ] of Object.entries( v ) ) {
				if ( k === 'url' && typeof x === 'string' ) {
					urls.push( x );
				} else {
					recorre( x );
				}
			}
		}
	};
	recorre( missio?.disparadors ?? [] );
	// `app://…` obre una app del sistema, no una web.
	return urls.filter( ( u ) => ! /^(?!https?:)[a-z]+:\/\//i.test( u ) );
}

/**
 * Posició de cada URL lògica dins de les webs disponibles (missió i després món).
 *
 * @param {Object}   missio Missió.
 * @param {Object}   mon    Món del mateix idioma.
 * @param {string}   nom    Fitxer (per als missatges).
 * @param {string}   idioma Idioma (per als missatges).
 * @param {string[]} errors On s'afegeixen els errors.
 * @return {number[]} Posicions (-1 = no existeix).
 */
function posicionsUrls( missio, mon, nom, idioma, errors ) {
	const dominis = [
		...Object.keys( missio?.webs ?? {} ),
		...Object.keys( mon?.webs ?? {} ),
	].map( dominiDe );
	return urlsLogiques( missio ).map( ( url ) => {
		const i = dominis.indexOf( dominiDe( url ) );
		if ( i < 0 ) {
			errors.push(
				`${ nom }: url "${ url }" (${ idioma }) no és a webs ni a mon.webs`
			);
		}
		return i;
	} );
}

/**
 * Valida la parella de carpetes.
 *
 * @param {{ca: Object<string, *>, es: Object<string, *>}} conjunts JSON per nom de fitxer i idioma.
 * @return {string[]} Errors (buida = parella correcta).
 */
export function validaParella( { ca = {}, es = {} } ) {
	const errors = [];
	const noms = [
		...new Set( [ ...Object.keys( ca ), ...Object.keys( es ) ] ),
	];
	for ( const nom of noms.sort() ) {
		if ( ! ( nom in es ) ) {
			errors.push( `${ nom }: falta a missions/es/` );
		} else if ( ! ( nom in ca ) ) {
			errors.push( `${ nom }: falta a missions/ca/` );
		} else {
			errors.push(
				...comparaEstructura( ca[ nom ], es[ nom ] ).map(
					( e ) => `${ nom }: ${ e }`
				)
			);
			if ( nom !== 'mon.json' ) {
				const pCa = posicionsUrls(
					ca[ nom ],
					ca[ 'mon.json' ],
					nom,
					'ca',
					errors
				);
				const pEs = posicionsUrls(
					es[ nom ],
					es[ 'mon.json' ],
					nom,
					'es',
					errors
				);
				pCa.forEach( ( p, i ) => {
					if ( p >= 0 && pEs[ i ] >= 0 && p !== pEs[ i ] ) {
						errors.push(
							`${ nom }: url ${ i } apunta a webs diferents en ca i es`
						);
					}
				} );
			}
		}
	}
	return errors;
}
