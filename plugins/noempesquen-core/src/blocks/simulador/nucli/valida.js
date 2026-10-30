/**
 * Validador de missions en format v2. Sense dependències d'interfície.
 */

export const APPS_PC = [ 'navegador', 'parla' ];
export const APPS_MOBIL = [ 'missatges', 'parla', 'navegador' ];
// Apps (o webs que avisen com a app) que una missió pot fer servir, per
// dispositiu: a l'ordinador, Posta és una web amb dades a `apps.posta`.
export const APPS_MISSIO = {
	pc: [ 'navegador', 'parla', 'posta' ],
	mobil: [ 'missatges', 'parla', 'navegador', 'enviat', 'banc-solid' ],
};
export const APPS = [ ...new Set( [ ...APPS_PC, ...APPS_MOBIL ] ) ];
// Fonts de notificació: apps del sistema i webs que també avisen.
export const FONTS_NOTIFICACIO = [
	...new Set( [ ...APPS, ...APPS_MISSIO.pc, ...APPS_MISSIO.mobil ] ),
];
export const PLANTILLES_WEB = [ 'posta', 'llum-clara', 'enviat', 'banc-solid' ];
export const ESDEVENIMENTS_FORMULARI = [
	'formulari.envia',
	'codi.envia',
	'pagament.fes',
];
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
	'codi.envia',
	'pagament.fes',
	'correu.marca',
	'contacte.bloqueja',
	'missatge.esborra',
	'missatge.reenvia',
	'missatge.respon',
	'missatge.envia',
	'enllac.mantingut',
];

const URL_VALIDA = /^(https?:\/\/|cerca:)/i;

const CAMPS_SENYAL = [
	'senyal',
	'assumpte_senyal',
	'domini_senyal',
	'senyal_avis',
];

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

/**
 * Recull recursivament les URL dels enllaços ({ enllac: { url } }).
 *
 * @param {Object|Array|string|number|boolean|null} node Valor JSON.
 * @param {string[]}                                out  Acumulador.
 * @return {Array} URL trobades (qualsevol tipus: es valida després).
 */
function recullUrlsEnllac( node, out = [] ) {
	if ( Array.isArray( node ) ) {
		node.forEach( ( x ) => recullUrlsEnllac( x, out ) );
	} else if ( node && typeof node === 'object' ) {
		Object.entries( node ).forEach( ( [ clau, valor ] ) => {
			if (
				clau === 'enllac' &&
				valor &&
				typeof valor === 'object' &&
				! Array.isArray( valor )
			) {
				out.push( valor.url );
			} else {
				recullUrlsEnllac( valor, out );
			}
		} );
	}
	return out;
}

/**
 * Recull els ids dels elements dels arrays sota `apps.*`.
 *
 * @param {Object} apps Apps de la missió.
 * @return {Set<string>} Ids existents.
 */
function recullIdsApps( apps ) {
	const ids = new Set();
	const objectes = ( v ) =>
		v && typeof v === 'object' ? Object.values( v ) : [];
	objectes( apps ).forEach( ( app ) => {
		objectes( app ).forEach( ( llista ) => {
			if ( Array.isArray( llista ) ) {
				llista.forEach( ( item ) => {
					if ( item?.id !== undefined ) {
						ids.add( item.id );
					}
					// Missatges d'un xat (apps.parla.xats[].missatges[]).
					( Array.isArray( item?.missatges ) ? item.missatges : [] )
						.filter( ( x ) => x?.id !== undefined )
						.forEach( ( x ) => ids.add( x.id ) );
				} );
			}
		} );
	} );
	return ids;
}

function validaEfecte( e, opcions, frases, idsApps, errors ) {
	if ( ! e || typeof e !== 'object' ) {
		errors.push( 'efecte invàlid' );
		return false;
	}
	if ( ! TIPUS_EFECTE.includes( e.tipus ) ) {
		errors.push( `efecte desconegut: ${ e.tipus }` );
	}
	if ( e.tipus === 'decideix' && ! opcions.has( e.opcio ) ) {
		errors.push( `opció inexistent: ${ e.opcio }` );
	}
	if ( e.tipus === 'mostra' && ! idsApps.has( e.id ) ) {
		errors.push( `mostra: element inexistent: ${ e.id }` );
	}
	if ( e.tipus === 'notifica' ) {
		if ( e.xat !== undefined && ( e.app !== 'parla' || ! e.xat ) ) {
			errors.push( 'notifica: xat només amb app parla' );
		}
		const font = e.font === 'mobil' ? APPS_MISSIO.mobil : FONTS_NOTIFICACIO;
		if ( e.font !== undefined && e.font !== 'mobil' ) {
			errors.push( `notifica: font invàlida: ${ e.font }` );
		} else if ( ! font.includes( e.app ) ) {
			errors.push( `notifica: font desconeguda: ${ e.app }` );
		}
	}
	if ( e.tipus === 'guia-diu' ) {
		if ( e.frase !== undefined ) {
			if ( ! Object.hasOwn( frases, e.frase ) ) {
				errors.push( `frase inexistent: ${ e.frase }` );
			}
		} else if ( ! e.text ) {
			errors.push( 'guia-diu sense text ni frase' );
		}
	}
	return e.tipus === 'pescat';
}

function validaDisparadors( m, errors ) {
	const opcions = new Set(
		( m.decisio?.opcions ?? [] )
			.filter( ( o ) => o && typeof o === 'object' )
			.map( ( o ) => o.id )
	);
	const frases = m.frases && typeof m.frases === 'object' ? m.frases : {};
	const idsApps = recullIdsApps( m.apps );
	let hiHaPescat = false;
	( m.disparadors ?? [] ).forEach( ( d ) => {
		if ( ! d || typeof d !== 'object' ) {
			errors.push( 'disparador invàlid' );
			return;
		}
		const ev = d.quan?.esdeveniment;
		if ( ! ESDEVENIMENTS.includes( ev ) ) {
			errors.push( `esdeveniment desconegut: ${ ev }` );
		}
		if ( d.quan?.visible !== undefined ) {
			if ( ! idsApps.has( d.quan.visible ) ) {
				errors.push(
					`visible: element inexistent: ${ d.quan.visible }`
				);
			}
		}
		( d.efectes ?? [] ).forEach( ( e ) => {
			if ( validaEfecte( e, opcions, frases, idsApps, errors ) ) {
				hiHaPescat = true;
			}
		} );
	} );
	if ( ! hiHaPescat ) {
		errors.push( 'cap camí de pescat' );
	}
}

function validaXatsParla( m, mon, errors ) {
	const xats = m.apps?.parla?.xats;
	if ( xats === undefined ) {
		return;
	}
	if ( ! Array.isArray( xats ) ) {
		errors.push( 'parla: xats ha de ser una llista' );
		return;
	}
	const contactes = Array.isArray( mon?.contactes )
		? new Set( mon.contactes.map( ( c ) => c.id ) )
		: null;
	const idsXat = new Set();
	const idsMsg = new Set();
	xats.forEach( ( x ) => {
		if ( ! x || typeof x !== 'object' || ! x.id ) {
			errors.push( 'parla: xat invàlid' );
			return;
		}
		if ( idsXat.has( x.id ) ) {
			errors.push( `parla: xat duplicat: ${ x.id }` );
		}
		idsXat.add( x.id );
		if (
			x.contacte !== undefined &&
			contactes &&
			! contactes.has( x.contacte )
		) {
			errors.push( `parla: contacte inexistent: ${ x.contacte }` );
		}
		if ( ! Array.isArray( x.missatges ) || ! x.missatges.length ) {
			errors.push( `parla: xat sense missatges: ${ x.id }` );
			return;
		}
		x.missatges.forEach( ( msg ) => {
			if ( ! msg?.id || typeof msg.text !== 'string' || ! msg.text ) {
				errors.push( `parla: missatge invàlid a ${ x.id }` );
				return;
			}
			if ( ! [ 'ells', 'jo' ].includes( msg.de ) ) {
				errors.push( `parla: remitent invàlid: ${ msg.id }` );
			}
			if ( idsMsg.has( msg.id ) ) {
				errors.push( `parla: missatge duplicat: ${ msg.id }` );
			}
			idsMsg.add( msg.id );
		} );
	} );
}

function validaFormularis( domini, web, errors ) {
	[ web.formulari, web.formulari_codi ].forEach( ( f ) => {
		if ( ! f || typeof f !== 'object' ) {
			return;
		}
		if (
			f.esdeveniment !== undefined &&
			! ESDEVENIMENTS_FORMULARI.includes( f.esdeveniment )
		) {
			errors.push(
				`formulari: esdeveniment invàlid a ${ domini }: ${ f.esdeveniment }`
			);
		}
		[ 'processant', 'nota' ].forEach( ( c ) => {
			if ( f[ c ] !== undefined && typeof f[ c ] !== 'string' ) {
				errors.push( `formulari: ${ c } ha de ser text a ${ domini }` );
			}
		} );
	} );
}

/**
 * Valida una missió v2.
 *
 * @param {Object}  m   Missió a validar.
 * @param {?Object} mon Món compartit (opcional): amb ell es comproven els contactes dels xats de Parla.
 * @return {string[]} Llista d'errors (buida si és vàlida).
 */
export function validaMissio( m, mon ) {
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

	recullUrlsEnllac( m.apps ).forEach( ( url ) => {
		if ( typeof url !== 'string' || ! URL_VALIDA.test( url ) ) {
			errors.push( `url d'enllaç no permesa: ${ url }` );
		}
	} );

	( m.disparadors ?? [] )
		.flatMap( ( d ) => d?.efectes ?? [] )
		.filter( ( e ) => e?.tipus === 'notifica' && e.font === 'mobil' )
		.forEach( ( e ) => {
			if ( ! APPS_MISSIO.mobil.includes( e.app ) ) {
				errors.push( `app inexistent al dispositiu mobil: ${ e.app }` );
			}
		} );

	const permeses = APPS_MISSIO[ m.dispositiu ];
	if ( permeses ) {
		const usades = [
			...Object.keys( m.apps ?? {} ),
			...( m.disparadors ?? [] )
				.flatMap( ( d ) => d?.efectes ?? [] )
				.filter( ( e ) => e?.tipus === 'notifica' && ! e.font )
				.map( ( e ) => e.app ),
		];
		new Set( usades ).forEach( ( a ) => {
			if ( ! permeses.includes( a ) ) {
				errors.push(
					`app inexistent al dispositiu ${ m.dispositiu }: ${ a }`
				);
			}
		} );
	}

	Object.entries( m.webs ?? {} ).forEach( ( [ domini, web ] ) => {
		if ( ! web || typeof web !== 'object' ) {
			errors.push( `web invàlida: ${ domini }` );
			return;
		}
		if ( ! PLANTILLES_WEB.includes( web.plantilla ) ) {
			errors.push( `plantilla desconeguda: ${ web.plantilla }` );
		}
		validaFormularis( domini, web, errors );
	} );

	validaXatsParla( m, mon, errors );
	validaDisparadors( m, errors );

	( m.decisio?.opcions ?? [] ).forEach( ( o ) => {
		if ( ! o || typeof o !== 'object' ) {
			errors.push( 'opció invàlida' );
		}
	} );
	const valors = ( m.decisio?.opcions ?? [] ).map( ( o ) => o?.valor );
	if ( ! valors.includes( 'correcta' ) ) {
		errors.push( 'cap opció correcta' );
	}
	return errors;
}
