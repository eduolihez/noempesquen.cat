/**
 * Disparadors: coincidència d'esdeveniments, efectes i cua de retards.
 * Funcions pures sobre l'estat del motor.
 */
import { FASE, afegeixGuia } from './motor.js';
import { senseWww } from '../apps/navegador/historial.js';
import { MS_TICK, MS_TRAS_INTRO } from './temps.js';

/**
 * Segons de joc (ticks) que cal esperar per a un retard en mil·lisegons,
 * arrodonint amunt: 8000 → 8; 1 → 1; 0 o no vàlid → 0.
 *
 * @param {*} ms Retard en ms.
 * @return {number} Segons de joc.
 */
export function segonsDeMs( ms ) {
	const n = Number( ms );
	return Number.isFinite( n ) && n > 0 ? Math.ceil( n / MS_TICK ) : 0;
}

/**
 * En acabar la intro, endarrereix tots els pendents d'`inici` el mateix (si
 * cal) perquè el primer no surti abans de `temps + MS_TRAS_INTRO`.
 * Desplaçar-los junts conserva el ritme entre avisos (no s'amunteguen). Els
 * pendents d'altres esdeveniments (p. ex. els dels tutorials, que guien el
 * jugador abans de la presentació) no s'esperen a la intro.
 *
 * @param {Object} estat Estat en el moment d'acabar la intro.
 * @return {Object} Nou estat.
 */
export function desplacaPendents( estat ) {
	const pendents = estat.pendents ?? [];
	const dInici = pendents.filter( ( p ) => p.inici );
	if ( ! dInici.length ) {
		return estat;
	}
	const primer = Math.min( ...dInici.map( ( p ) => p.quan ) );
	const minim = estat.temps + segonsDeMs( MS_TRAS_INTRO );
	const delta = minim - primer;
	if ( delta <= 0 ) {
		return estat;
	}
	return {
		...estat,
		pendents: pendents.map( ( p ) =>
			p.inici ? { ...p, quan: p.quan + delta } : p
		),
	};
}

function hostname( valor ) {
	try {
		return new URL( valor ).hostname;
	} catch {
		return null;
	}
}

/**
 * Indica si un esdeveniment compleix la condició `quan` d'un disparador.
 *
 * @param {Object} quan  Condició (`esdeveniment` + claus a comparar).
 * @param {string} nom   Nom de l'esdeveniment.
 * @param {Object} dades Dades de l'esdeveniment.
 * @param {Object} estat Estat (opcional); `quan.visible` exigeix aquest element mostrat.
 * @return {boolean} Si coincideix.
 */
export function coincideix( quan, nom, dades = {}, estat ) {
	return Object.entries( quan ).every( ( [ clau, valor ] ) => {
		if ( clau === 'esdeveniment' ) {
			return valor === nom;
		}
		if ( clau === 'visible' ) {
			return !! estat?.visibles?.[ valor ];
		}
		if ( clau === 'url' ) {
			if ( dades.url === valor ) {
				return true;
			}
			const host = hostname( dades.url );
			return (
				typeof host === 'string' &&
				typeof valor === 'string' &&
				senseWww( host ) === senseWww( valor )
			);
		}
		return dades[ clau ] === valor;
	} );
}

function efectePescat( missio, estat ) {
	return afegeixGuia(
		{
			...estat,
			pescat: true,
			fase: FASE.CONSEQUENCIA,
			lupa: false,
			decisioOberta: false,
		},
		missio.frases.pescat
	);
}

function efecteDecideix( missio, estat, idOpcio ) {
	const opcio = missio.decisio.opcions.find( ( o ) => o.id === idOpcio );
	if ( ! opcio ) {
		return estat;
	}
	return afegeixGuia(
		{
			...estat,
			opcio: opcio.id,
			fase: FASE.CONSEQUENCIA,
			lupa: false,
			decisioOberta: false,
		},
		opcio.resposta
	);
}

function aplicaEfecte( missio, estat, efecte ) {
	switch ( efecte.tipus ) {
		case 'guia-diu': {
			const text =
				efecte.frase !== undefined
					? missio.frases?.[ efecte.frase ]
					: efecte.text;
			return typeof text === 'string' && text
				? afegeixGuia( estat, text )
				: estat;
		}
		case 'notifica':
			return {
				...estat,
				seq: estat.seq + 1,
				notificacions: [
					...estat.notificacions,
					{
						id: `n${ estat.seq }`,
						app: efecte.app,
						titol: efecte.titol,
						text: efecte.text,
						...( efecte.xat ? { xat: efecte.xat } : {} ),
						llegida: false,
						...( efecte.font ? { font: efecte.font } : {} ),
						...( efecte.so ? { so: efecte.so } : {} ),
					},
				],
			};
		case 'mostra':
			return {
				...estat,
				visibles: { ...estat.visibles, [ efecte.id ]: true },
			};
		case 'pescat':
			return efectePescat( missio, estat );
		case 'decideix':
			return efecteDecideix( missio, estat, efecte.opcio );
		default:
			return estat;
	}
}

/**
 * Aplica efectes en ordre; s'atura si la fase deixa de ser `joc`.
 *
 * @param {Object}   missio  Missió.
 * @param {Object}   estat   Estat actual.
 * @param {Object[]} efectes Efectes a aplicar.
 * @return {Object} Nou estat.
 */
export function aplicaEfectes( missio, estat, efectes = [] ) {
	let actual = estat;
	for ( const efecte of efectes ) {
		if ( actual.fase !== FASE.JOC ) {
			break;
		}
		actual = aplicaEfecte( missio, actual, efecte );
	}
	return actual;
}

/**
 * Indica si l'esdeveniment obre un missatge marcat com a `objectiu`.
 *
 * @param {Object} missio Missió.
 * @param {string} nom    Nom de l'esdeveniment.
 * @param {Object} dades  Dades de l'esdeveniment (`app`, `id`).
 * @return {boolean} Si és l'obertura del missatge objectiu.
 */
function obreObjectiu( missio, nom, dades ) {
	if ( nom !== 'missatge.obre' || ! dades.id ) {
		return false;
	}
	const app = missio.apps?.[ dades.app ] ?? {};
	return Object.values( app ).some(
		( llista ) =>
			Array.isArray( llista ) &&
			llista.some( ( item ) => item?.id === dades.id && item.objectiu )
	);
}

/**
 * Processa un esdeveniment del món: executa o programa els disparadors.
 *
 * @param {Object} missio Missió.
 * @param {Object} estat  Estat actual.
 * @param {string} nom    Nom de l'esdeveniment.
 * @param {Object} dades  Dades de l'esdeveniment.
 * @return {Object} Nou estat.
 */
export function processaEsdeveniment( missio, estat, nom, dades = {} ) {
	if ( estat.fase !== FASE.JOC || estat.pausa ) {
		return estat;
	}
	const resultat = executaDisparadors( missio, estat, nom, dades );
	const pas = missio.passos?.[ resultat.pas ];
	// Un esdeveniment del jugador avança com a màxim un pas.
	if (
		resultat.fase === FASE.JOC &&
		pas?.continua &&
		typeof pas.continua === 'object' &&
		coincideix( pas.continua, nom, dades, resultat )
	) {
		return entraPas( missio, resultat, resultat.pas + 1 );
	}
	return resultat;
}

/**
 * Indica si el tutorial és dins els passos (cal mostrar-los i no donar pistes
 * per temps).
 *
 * @param {Object} missio Missió.
 * @param {Object} estat  Estat actual.
 * @return {boolean} Si encara queden passos.
 */
export function enPassos( missio, estat ) {
	return Array.isArray( missio?.passos ) && estat.pas < missio.passos.length;
}

/**
 * Posa el tutorial al pas indicat i processa l'esdeveniment sintètic
 * `pas.entra` només contra els disparadors (no pot avançar cap altre pas).
 *
 * @param {Object} missio Missió.
 * @param {Object} estat  Estat actual.
 * @param {number} index  Índex del pas on entra (== longitud: acabat).
 * @return {Object} Nou estat.
 */
export function entraPas( missio, estat, index ) {
	const nou = { ...estat, pas: index, ultimAvanc: estat.temps };
	const pas = missio.passos?.[ index ];
	return pas
		? executaDisparadors( missio, nou, 'pas.entra', { pas: pas.id } )
		: nou;
}

/**
 * Salta els passos que queden: aplica en ordre els `pas.entra` pendents
 * (cada disparador només s'executa una vegada) i acaba el tutorial.
 *
 * @param {Object} missio Missió.
 * @param {Object} estat  Estat actual.
 * @return {Object} Nou estat.
 */
export function saltaPassos( missio, estat ) {
	let actual = estat;
	for ( let i = estat.pas; i < missio.passos.length; i++ ) {
		if ( actual.fase !== FASE.JOC ) {
			break;
		}
		actual = executaDisparadors( missio, actual, 'pas.entra', {
			pas: missio.passos[ i ].id,
		} );
	}
	return {
		...actual,
		pas: missio.passos.length,
		ultimAvanc: actual.temps,
	};
}

function executaDisparadors( missio, estat, nom, dades ) {
	let actual = obreObjectiu( missio, nom, dades )
		? { ...estat, ultimAvanc: estat.temps }
		: estat;
	for ( const d of missio.disparadors ?? [] ) {
		if ( actual.fase !== FASE.JOC ) {
			break;
		}
		if (
			actual.executats.includes( d.id ) ||
			! coincideix( d.quan, nom, dades, actual )
		) {
			continue;
		}
		actual = {
			...actual,
			executats: [ ...actual.executats, d.id ],
			ultimAvanc: actual.temps,
		};
		const espera = segonsDeMs( d.retard_ms );
		if ( espera > 0 ) {
			actual = {
				...actual,
				pendents: [
					...actual.pendents,
					{
						id: d.id,
						quan: actual.temps + espera,
						...( nom === 'inici' ? { inici: true } : {} ),
					},
				],
			};
		} else {
			actual = aplicaEfectes( missio, actual, d.efectes );
		}
	}
	return actual;
}

/**
 * Avança el rellotge, executa els pendents vençuts i dóna la pista si cal.
 *
 * @param {Object} missio Missió.
 * @param {Object} estat  Estat actual.
 * @param {number} segons Segons a avançar.
 * @param {number} limit  Segons sense avanç abans d'una pista.
 * @return {Object} Nou estat.
 */
export function avancaTemps( missio, estat, segons, limit ) {
	if ( estat.fase !== FASE.JOC || estat.pausa ) {
		return estat;
	}
	const temps = estat.temps + segons;
	let actual = { ...estat, temps };
	// Durant la intro no surt cap avís programat des de l'`inici`: s'esperen
	// i, en acabar-la, `desplacaPendents` els endarrereix el que calgui.
	const toca = ( p ) =>
		( actual.introAcabada || ! p.inici ) && p.quan <= temps;
	const vencuts = actual.pendents.filter( toca );
	actual = {
		...actual,
		pendents: actual.pendents.filter( ( p ) => ! toca( p ) ),
	};
	for ( const p of vencuts ) {
		if ( actual.fase !== FASE.JOC ) {
			break;
		}
		const d = ( missio.disparadors ?? [] ).find( ( x ) => x.id === p.id );
		actual = aplicaEfectes( missio, actual, d?.efectes );
	}
	const pista = missio.pistes?.[ actual.pistesDonades ];
	if (
		actual.introAcabada &&
		! enPassos( missio, actual ) &&
		actual.fase === FASE.JOC &&
		pista !== undefined &&
		actual.temps - actual.ultimAvanc >= limit
	) {
		actual = {
			...afegeixGuia( actual, pista ),
			pistesDonades: actual.pistesDonades + 1,
			ultimAvanc: actual.temps,
		};
	}
	return actual;
}
