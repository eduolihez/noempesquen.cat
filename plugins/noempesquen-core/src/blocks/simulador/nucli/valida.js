/**
 * Validador de missions en format v2. Sense dependències d'interfície.
 */

import { CLAUS_APPS_PC, CLAUS_APPS_MOBIL } from '../apps/claus';
import { existeixIlustracio } from '../ui/ilustracions-ids';

export const APPS_PC = CLAUS_APPS_PC;
export const APPS_MOBIL = CLAUS_APPS_MOBIL;
// Apps (o webs que avisen com a app) que una missió pot fer servir, per
// dispositiu: a l'ordinador, Posta és una web amb dades a `apps.posta`.
export const APPS_MISSIO = {
	pc: [ 'navegador', 'parla', 'posta' ],
	mobil: [ ...CLAUS_APPS_MOBIL, 'enviat' ],
};
export const APPS = [ ...new Set( [ ...APPS_PC, ...APPS_MOBIL ] ) ];
// Fonts de notificació: apps del sistema i webs que també avisen.
export const FONTS_NOTIFICACIO = [
	...new Set( [ ...APPS, ...APPS_MISSIO.pc, ...APPS_MISSIO.mobil ] ),
];
export const PLANTILLES_WEB = [
	'posta',
	'llum-clara',
	'enviat',
	'banc-solid',
	'sorteig',
	'diari',
	'cobrament',
	'inversio',
];
// Plantilles que només tenen variant falsa (no hi ha versió oficial).
export const PLANTILLES_SOLO_FALSES = [ 'sorteig', 'cobrament', 'inversio' ];
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
	'publicacio.denuncia',
	'codi.comparteix',
];

/**
 * Torna el valor si és una llista; si no, una llista buida.
 *
 * @param {*} v Valor qualsevol.
 * @return {Array} Llista.
 */
const llista = ( v ) => ( Array.isArray( v ) ? v : [] );

const URL_VALIDA = /^(https?:\/\/|cerca:)/i;
const URL_HTTP = /^https?:\/\/\S+/i;

const CAMPS_SENYAL = [
	'senyal',
	'assumpte_senyal',
	'domini_senyal',
	'senyal_avis',
	'premi_senyal',
	'compte_senyal',
	'promesa_senyal',
	'etiqueta_senyal',
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
		objectes( app ).forEach( ( valors ) => {
			if ( Array.isArray( valors ) ) {
				valors.forEach( ( item ) => {
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

function validaDisparadors( m, mon, errors ) {
	const opcions = new Set(
		llista( m.decisio?.opcions )
			.filter( ( o ) => o && typeof o === 'object' )
			.map( ( o ) => o.id )
	);
	const frases = m.frases && typeof m.frases === 'object' ? m.frases : {};
	const idsApps = recullIdsApps( m.apps );
	const contactesMon = Array.isArray( mon?.contactes )
		? new Set(
				mon.contactes
					.map( ( c ) => c?.id )
					.filter( ( id ) => typeof id === 'string' )
			)
		: null;
	// Publicacions denunciables: Ullada (món i missió) i anuncis del Diari.
	const idsDenunciables = new Set(
		[
			...llista( mon?.ullada?.publicacions ).map( ( p ) => p?.id ),
			...llista( m.apps?.ullada?.publicacions ).map( ( p ) => p?.id ),
			...Object.values( m.webs ?? {} )
				.filter( ( w ) => w?.plantilla === 'diari' )
				.map( ( w ) => w?.anunci?.id ),
		].filter( ( id ) => typeof id === 'string' )
	);
	let hiHaPescat = false;
	llista( m.disparadors ).forEach( ( d ) => {
		if ( ! d || typeof d !== 'object' ) {
			errors.push( 'disparador invàlid' );
			return;
		}
		const ev = d.quan?.esdeveniment;
		if ( ! ESDEVENIMENTS.includes( ev ) ) {
			errors.push( `esdeveniment desconegut: ${ ev }` );
		}
		if (
			ev === 'contacte.bloqueja' &&
			contactesMon &&
			! contactesMon.has( d.quan?.id )
		) {
			errors.push( `bloqueja: contacte inexistent: ${ d.quan?.id }` );
		}
		if (
			ev === 'publicacio.denuncia' &&
			mon &&
			! idsDenunciables.has( d.quan?.id )
		) {
			errors.push( `denuncia: publicació inexistent: ${ d.quan?.id }` );
		}
		if ( d.quan?.visible !== undefined ) {
			if ( ! idsApps.has( d.quan.visible ) ) {
				errors.push(
					`visible: element inexistent: ${ d.quan.visible }`
				);
			}
		}
		llista( d.efectes ).forEach( ( e ) => {
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

function validaSegmentCos( seg, r, errors ) {
	if ( ! seg || typeof seg !== 'object' || Array.isArray( seg ) ) {
		errors.push( `${ r }: segment ha de ser un objecte` );
	} else if ( seg.enllac !== undefined ) {
		const e = seg.enllac;
		if (
			! e ||
			typeof e !== 'object' ||
			typeof e.text !== 'string' ||
			typeof e.url !== 'string'
		) {
			errors.push( `${ r }: enllaç ha de tenir text i url` );
		}
	} else if ( typeof seg.t !== 'string' ) {
		errors.push( `${ r }: segment sense «t» ni «enllac»` );
	}
}

function validaCosPublicacio( cos, ref, errors ) {
	if ( ! Array.isArray( cos ) ) {
		errors.push( `${ ref }: «cos» ha de ser una llista de paràgrafs` );
		return;
	}
	cos.forEach( ( par, j ) => {
		if ( ! Array.isArray( par ) ) {
			errors.push(
				`${ ref }.cos[${ j }]: paràgraf ha de ser una llista`
			);
			return;
		}
		par.forEach( ( seg, k ) =>
			validaSegmentCos( seg, `${ ref }.cos[${ j }][${ k }]`, errors )
		);
	} );
}

function validaPublicacionsUllada( m, mon, errors ) {
	const publicacions = m.apps?.ullada?.publicacions;
	if ( publicacions === undefined ) {
		return;
	}
	if ( ! Array.isArray( publicacions ) ) {
		errors.push( 'ullada: publicacions ha de ser una llista' );
		return;
	}
	const text = ( x ) => typeof x === 'string' && x.trim() !== '';
	const perfils = Array.isArray( mon?.ullada?.perfils )
		? new Set( mon.ullada.perfils.map( ( x ) => x?.id ) )
		: null;
	const ids = new Set();
	publicacions.forEach( ( p, i ) => {
		const ref = `ullada.publicacions[${ i }]`;
		if ( ! p || typeof p !== 'object' || Array.isArray( p ) ) {
			errors.push( `${ ref }: ha de ser un objecte` );
			return;
		}
		[ 'id', 'autor', 'text' ].forEach( ( c ) => {
			if ( ! text( p[ c ] ) ) {
				errors.push( `${ ref }: camp «${ c }» buit o absent` );
			}
		} );
		if ( text( p.autor ) && perfils && ! perfils.has( p.autor ) ) {
			errors.push( `${ ref }: autor inexistent «${ p.autor }»` );
		}
		if ( p.cos !== undefined ) {
			validaCosPublicacio( p.cos, ref, errors );
		}
		if ( text( p.id ) ) {
			if ( ids.has( p.id ) ) {
				errors.push( `${ ref }: id duplicat «${ p.id }»` );
			}
			ids.add( p.id );
		}
		if ( ! text( p.il ) || ! existeixIlustracio( p.il ) ) {
			errors.push( `${ ref }: il·lustració inexistent «${ p.il }»` );
		}
		if ( typeof p.likes !== 'number' || ! Number.isFinite( p.likes ) ) {
			errors.push( `${ ref }: «likes» ha de ser un número` );
		}
	} );
}

function validaAnuncisRevenda( anuncis, text, errors ) {
	const ids = new Set();
	if ( ! Array.isArray( anuncis ) ) {
		errors.push( 'revenda: anuncis ha de ser una llista' );
		return ids;
	}
	anuncis.forEach( ( a, i ) => {
		const ref = `revenda.anuncis[${ i }]`;
		if ( ! a || typeof a !== 'object' || Array.isArray( a ) ) {
			errors.push( `${ ref }: ha de ser un objecte` );
			return;
		}
		[ 'id', 'titol', 'descripcio' ].forEach( ( c ) => {
			if ( ! text( a[ c ] ) ) {
				errors.push( `${ ref }: camp «${ c }» buit o absent` );
			}
		} );
		if (
			typeof a.preu !== 'number' ||
			! Number.isFinite( a.preu ) ||
			a.preu < 0
		) {
			errors.push( `${ ref }: «preu» ha de ser un número >= 0` );
		}
		if ( ! text( a.il ) || ! existeixIlustracio( a.il ) ) {
			errors.push( `${ ref }: il·lustració inexistent «${ a.il }»` );
		}
		if ( text( a.id ) ) {
			if ( ids.has( a.id ) ) {
				errors.push( `${ ref }: id duplicat «${ a.id }»` );
			}
			ids.add( a.id );
		}
	} );
	return ids;
}

function validaMissatgeRevenda( msg, ref, idsMsg, errors ) {
	if ( ! msg || typeof msg !== 'object' || ! msg.id ) {
		errors.push( `${ ref }: missatge invàlid` );
		return;
	}
	if ( idsMsg.has( msg.id ) ) {
		errors.push( `${ ref }: id duplicat «${ msg.id }»` );
	}
	idsMsg.add( msg.id );
	if ( ! [ 'ells', 'jo' ].includes( msg.de ) ) {
		errors.push( `${ ref }: remitent invàlid «${ msg.de }»` );
	}
	if ( msg.ocult !== undefined && typeof msg.ocult !== 'boolean' ) {
		errors.push( `${ ref }: «ocult» ha de ser booleà` );
	}
	if ( msg.hora !== undefined && typeof msg.hora !== 'string' ) {
		errors.push( `${ ref }: «hora» ha de ser text` );
	}
	if ( ! Array.isArray( msg.cos ) || ! msg.cos.length ) {
		errors.push( `${ ref }: «cos» ha de ser una llista de segments` );
		return;
	}
	msg.cos.forEach( ( seg, k ) => {
		const rs = `${ ref }.cos[${ k }]`;
		validaSegmentCos( seg, rs, errors );
		if ( seg?.senyal !== undefined && typeof seg.senyal !== 'string' ) {
			errors.push( `${ rs }: «senyal» ha de ser text` );
		}
		const url = seg?.enllac?.url;
		if ( typeof url === 'string' && ! URL_HTTP.test( url ) ) {
			errors.push( `${ rs }: url sense http(s) «${ url }»` );
		}
	} );
}

function validaRevenda( m, mon, errors ) {
	const revenda = m.apps?.revenda;
	if ( revenda === undefined ) {
		return;
	}
	if (
		! revenda ||
		typeof revenda !== 'object' ||
		Array.isArray( revenda )
	) {
		errors.push( 'revenda: ha de ser un objecte' );
		return;
	}
	const text = ( x ) => typeof x === 'string' && x.trim() !== '';
	if ( ! Array.isArray( revenda.xats ) ) {
		errors.push( 'revenda: xats ha de ser una llista' );
	}
	const idsAnunci = validaAnuncisRevenda( revenda.anuncis, text, errors );
	const contactes = Array.isArray( mon?.contactes )
		? new Set( mon.contactes.map( ( c ) => c?.id ) )
		: null;
	const idsXat = new Set();
	const idsMsg = new Set();
	( Array.isArray( revenda.xats ) ? revenda.xats : [] ).forEach( ( x, i ) => {
		const ref = `revenda.xats[${ i }]`;
		if ( ! x || typeof x !== 'object' || Array.isArray( x ) ) {
			errors.push( `${ ref }: ha de ser un objecte` );
			return;
		}
		if ( ! text( x.id ) ) {
			errors.push( `${ ref }: camp «id» buit o absent` );
		} else {
			if ( idsXat.has( x.id ) ) {
				errors.push( `${ ref }: id duplicat «${ x.id }»` );
			}
			idsXat.add( x.id );
		}
		if ( ! text( x.contacte ) ) {
			errors.push( `${ ref }: camp «contacte» buit o absent` );
		} else if ( contactes && ! contactes.has( x.contacte ) ) {
			errors.push( `${ ref }: contacte inexistent «${ x.contacte }»` );
		}
		if ( ! text( x.anunci ) || ! idsAnunci.has( x.anunci ) ) {
			errors.push( `${ ref }: anunci inexistent «${ x.anunci }»` );
		}
		if ( ! Array.isArray( x.missatges ) || ! x.missatges.length ) {
			errors.push( `${ ref }: xat sense missatges` );
			return;
		}
		x.missatges.forEach( ( msg, j ) =>
			validaMissatgeRevenda(
				msg,
				`${ ref }.missatges[${ j }]`,
				idsMsg,
				errors
			)
		);
	} );
}

/**
 * Valida els anuncis patrocinats (`webs.<host>.anunci`): només a la plantilla
 * `diari`, amb id únic (també respecte de les publicacions d'Ullada). Les
 * senyals i les URL dels enllaços ja les revisen les regles generals.
 *
 * @param {Object}   m      Missió.
 * @param {?Object}  mon    Món compartit.
 * @param {string[]} errors Acumulador d'errors.
 */
function validaAnuncisDiari( m, mon, errors ) {
	const text = ( x ) => typeof x === 'string' && x.trim() !== '';
	const ids = new Set(
		[
			...llista( mon?.ullada?.publicacions ),
			...llista( m.apps?.ullada?.publicacions ),
		].map( ( p ) => p?.id )
	);
	Object.entries( m.webs ?? {} ).forEach( ( [ domini, web ] ) => {
		const a = web?.anunci;
		if ( a === undefined ) {
			return;
		}
		const ref = `${ domini }.anunci`;
		if ( web.plantilla !== 'diari' ) {
			errors.push( `${ ref }: només admès a la plantilla diari` );
			return;
		}
		if ( ! a || typeof a !== 'object' || Array.isArray( a ) ) {
			errors.push( `${ ref }: ha de ser un objecte` );
			return;
		}
		[ 'id', 'etiqueta', 'titol' ].forEach( ( c ) => {
			if ( ! text( a[ c ] ) ) {
				errors.push( `${ ref }: camp «${ c }» buit o absent` );
			}
		} );
		if ( text( a.id ) ) {
			if ( ids.has( a.id ) ) {
				errors.push( `${ ref }: id duplicat «${ a.id }»` );
			}
			ids.add( a.id );
		}
		if ( ! text( a.avatar?.nom ) || ! text( a.avatar?.inicials ) ) {
			errors.push( `${ ref }: «avatar» ha de tenir nom i inicials` );
		}
		[ 'etiqueta_senyal', 'boto_denuncia' ].forEach( ( c ) => {
			if ( a[ c ] !== undefined && ! text( a[ c ] ) ) {
				errors.push( `${ ref }: «${ c }» ha de ser text` );
			}
		} );
		validaCosPublicacio( a.cos, ref, errors );
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

	const ids = new Set( llista( m.senyals ).map( ( s ) => s?.id ) );
	const vistes = new Set();
	llista( m.senyals ).forEach( ( s ) => {
		if ( vistes.has( s?.id ) ) {
			errors.push( `senyal duplicada: ${ s?.id }` );
		}
		vistes.add( s?.id );
	} );
	const usats = [ ...recullSenyals( m.apps ), ...recullSenyals( m.webs ) ];
	new Set( usats ).forEach( ( s ) => {
		if ( ! ids.has( s ) ) {
			errors.push( `senyal desconegut: ${ s }` );
		}
	} );

	// Només compta el que recullen `recullSenyals` sobre `m.apps` i `m.webs`
	// (camps de CAMPS_SENYAL); una senyal usada només en disparadors o en
	// altres seccions es considera sense referència.
	const referenciats = new Set( usats );
	ids.forEach( ( id ) => {
		if ( id !== undefined && ! referenciats.has( id ) ) {
			errors.push( `senyal sense referència: ${ id }` );
		}
	} );

	recullUrlsEnllac( m.apps ).forEach( ( url ) => {
		if ( typeof url !== 'string' || ! URL_VALIDA.test( url ) ) {
			errors.push( `url d'enllaç no permesa: ${ url }` );
		}
	} );
	// Les webs no admeten l'esquema intern «cerca:».
	recullUrlsEnllac( m.webs ).forEach( ( url ) => {
		if ( typeof url !== 'string' || ! URL_HTTP.test( url ) ) {
			errors.push( `url d'enllaç no permesa: ${ url }` );
		}
	} );

	llista( m.disparadors )
		.flatMap( ( d ) => llista( d?.efectes ) )
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
			...llista( m.disparadors )
				.flatMap( ( d ) => llista( d?.efectes ) )
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
		if (
			PLANTILLES_SOLO_FALSES.includes( web.plantilla ) &&
			web.variant !== 'falsa'
		) {
			errors.push(
				`${ web.plantilla } només admet variant falsa: ${ domini }`
			);
		}
		validaFormularis( domini, web, errors );
	} );

	validaXatsParla( m, mon, errors );
	validaPublicacionsUllada( m, mon, errors );
	validaRevenda( m, mon, errors );
	validaAnuncisDiari( m, mon, errors );
	validaDisparadors( m, mon, errors );

	llista( m.decisio?.opcions ).forEach( ( o ) => {
		if ( ! o || typeof o !== 'object' ) {
			errors.push( 'opció invàlida' );
		}
	} );
	const valors = llista( m.decisio?.opcions ).map( ( o ) => o?.valor );
	if ( ! valors.includes( 'correcta' ) ) {
		errors.push( 'cap opció correcta' );
	}
	return errors;
}
