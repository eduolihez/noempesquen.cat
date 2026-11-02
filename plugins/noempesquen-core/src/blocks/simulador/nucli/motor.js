/**
 * Motor de missions v2: estat i regles pures, sense res d'interfície.
 * Reductor immutable.
 */

import {
	processaEsdeveniment,
	avancaTemps,
	desplacaPendents,
} from './disparadors.js';
import { senseWww } from '../apps/navegador/historial.js';
import { SEGONS_PISTA } from './temps.js';

export const FASE = {
	BLOQUEIG: 'bloqueig',
	JOC: 'joc',
	CONSEQUENCIA: 'consequencia',
	RESULTAT: 'resultat',
};

export const PUNTS = {
	senyal: 10,
	correcta: 50,
	parcial: 20,
	incorrecta: 0,
	picar: -20,
	pista: -5,
};

const TEXT_SEGUENT = 'Següent';
const TEXT_COMENCA = 'Som-hi!';
const TEXT_SALTA = 'Salta la presentació';
const TEXT_DECIDIR = 'Ja ho tinc clar';
const TEXT_TORNAR = 'Encara vull mirar';

/**
 * Clau d'una web per a l'estat: el host sense `www.` (com `resolWeb`), o el
 * valor tal qual si no és una URL.
 *
 * @param {string} url URL de la pàgina.
 * @return {?string} Clau o null si no és text.
 */
export function clauWeb( url ) {
	if ( typeof url !== 'string' || ! url ) {
		return null;
	}
	try {
		return senseWww( new URL( url ).hostname );
	} catch {
		return senseWww( url );
	}
}

// Esdeveniments que deixen rastre a l'estat (només l'id o la clau de la web).
const RASTRE = {
	'contacte.bloqueja': 'bloquejats',
	'publicacio.denuncia': 'denunciats',
	'avis.apareix': 'avisosVistos',
};

/**
 * Anota l'id d'un bloqueig o d'una denúncia, o la web on ha sortit un avís
 * (sense duplicats), abans de processar els disparadors, que poden tancar el
 * joc.
 *
 * @param {Object} estat Estat actual.
 * @param {string} nom   Nom de l'esdeveniment.
 * @param {Object} dades Dades de l'esdeveniment.
 * @return {Object} Nou estat.
 */
function anotaEsdeveniment( estat, nom, dades ) {
	const camp = RASTRE[ nom ];
	const id = nom === 'avis.apareix' ? clauWeb( dades?.url ) : dades?.id;
	if (
		! camp ||
		typeof id !== 'string' ||
		estat.fase !== FASE.JOC ||
		estat.pausa ||
		estat[ camp ].includes( id )
	) {
		return estat;
	}
	return { ...estat, [ camp ]: [ ...estat[ camp ], id ] };
}

export function estatInicial( missio ) {
	return {
		missioId: missio?.id ?? null,
		personatge: missio?.personatge ?? '',
		fase: FASE.BLOQUEIG,
		pausa: false,
		temps: 0,
		introPas: 0,
		introAcabada: false,
		lupa: false,
		lupaUsada: false,
		// Resultat de l'última inspecció (mai text del jugador): `clau` puja a
		// cada inspecció perquè la UI mostri el xip encara que el tipus es repeteixi.
		ultimaInspeccio: { clau: 0, tipus: null },
		trobats: [],
		falsos: 0,
		pescat: false,
		opcio: null,
		decisioOberta: false,
		xat: [],
		notificacions: [],
		visibles: {},
		executats: [],
		pendents: [],
		pistesDonades: 0,
		// Ids (mai text) de contactes bloquejats i publicacions denunciades:
		// la UI els llegeix d'aquí perquè sobrevisquin en tancar l'app o la web.
		bloquejats: [],
		denunciats: [],
		// Webs `article` (clauWeb) on ja ha sortit l'avís, i el que el jugador
		// hi ha tancat (`clau:avis`, `clau:barra`): tancat es queda tancat.
		avisosVistos: [],
		tancats: [],
		ultimAvanc: 0,
		seq: 0,
	};
}

/**
 * Afegeix un missatge del guia al xat i la notificació corresponent.
 *
 * @param {Object} estat Estat actual.
 * @param {string} text  Text del missatge.
 * @param {string} nota  Nota opcional del missatge.
 * @return {Object} Nou estat.
 */
export function afegeixGuia( estat, text, nota ) {
	const idMissatge = `m${ estat.seq }`;
	const idNota = `n${ estat.seq + 1 }`;
	const missatge = { id: idMissatge, de: 'guia', text };
	if ( nota ) {
		missatge.nota = nota;
	}
	return {
		...estat,
		seq: estat.seq + 2,
		xat: [ ...estat.xat, missatge ],
		notificacions: [
			...estat.notificacions,
			{
				id: idNota,
				app: 'parla',
				titol: estat.personatge,
				text,
				llegida: false,
			},
		],
	};
}

function afegeixJo( estat, text ) {
	return {
		...estat,
		seq: estat.seq + 1,
		xat: [ ...estat.xat, { id: `m${ estat.seq }`, de: 'jo', text } ],
	};
}

function seguentIntro( missio, estat ) {
	const jo = afegeixJo(
		estat,
		estat.introPas + 1 < missio.intro.length ? TEXT_SEGUENT : TEXT_COMENCA
	);
	const pas = estat.introPas + 1;
	if ( pas < missio.intro.length ) {
		return afegeixGuia( { ...jo, introPas: pas }, missio.intro[ pas ] );
	}
	return afegeixGuia(
		desplacaPendents( { ...jo, introAcabada: true } ),
		missio.instruccions
	);
}

function saltaIntro( missio, estat ) {
	return afegeixGuia(
		desplacaPendents( {
			...afegeixJo( estat, TEXT_SALTA ),
			introAcabada: true,
		} ),
		missio.instruccions
	);
}

function obreDecisio( missio, estat ) {
	return afegeixGuia(
		{
			...afegeixJo( estat, TEXT_DECIDIR ),
			decisioOberta: true,
			lupa: false,
		},
		missio.decisio.pregunta
	);
}

function triaOpcio( missio, estat, opcioId ) {
	const opcio = missio.decisio.opcions.find( ( o ) => o.id === opcioId );
	if ( ! opcio ) {
		return estat;
	}
	return afegeixGuia(
		{
			...afegeixJo( estat, opcio.text ),
			opcio: opcio.id,
			decisioOberta: false,
			fase: FASE.CONSEQUENCIA,
		},
		opcio.resposta
	);
}

function resposta( missio, estat, id ) {
	if ( estat.fase !== FASE.JOC ) {
		return estat;
	}
	if ( ! estat.introAcabada ) {
		if ( id === 'intro:seguent' ) {
			return seguentIntro( missio, estat );
		}
		return id === 'intro:salta' ? saltaIntro( missio, estat ) : estat;
	}
	if ( estat.decisioOberta ) {
		if ( id === 'decisio:tornar' ) {
			return {
				...afegeixJo( estat, TEXT_TORNAR ),
				decisioOberta: false,
			};
		}
		return id.startsWith( 'decisio:' )
			? triaOpcio( missio, estat, id.slice( 'decisio:'.length ) )
			: estat;
	}
	return id === 'decidir' ? obreDecisio( missio, estat ) : estat;
}

/**
 * Comptador d'indicis de la missió.
 *
 * @param {Object} missio Missió (pot no tenir senyals).
 * @param {Object} estat  Estat actual.
 * @return {{trobats:number,total:number,complet:boolean}} Comptador.
 */
export function indicis( missio, estat ) {
	const total = missio?.senyals?.length ?? 0;
	const trobats = estat?.trobats?.length ?? 0;
	return { trobats, total, complet: trobats === total && total > 0 };
}

function amb( estat, tipus ) {
	return {
		...estat,
		ultimaInspeccio: {
			clau: ( estat.ultimaInspeccio?.clau ?? 0 ) + 1,
			tipus,
		},
	};
}

function inspecciona( missio, estat, idSenyal ) {
	if ( estat.fase !== FASE.JOC || estat.pausa ) {
		return estat;
	}
	const senyal = missio.senyals?.find( ( s ) => s.id === idSenyal );
	if ( ! senyal ) {
		return amb( { ...estat, falsos: estat.falsos + 1 }, 'normal' );
	}
	if ( estat.trobats.includes( senyal.id ) ) {
		return amb( estat, 'repetida' );
	}
	const trobats = [ ...estat.trobats, senyal.id ];
	const nou = { ...estat, trobats, ultimAvanc: estat.temps };
	return afegeixGuia(
		amb( nou, 'nova' ),
		senyal.reaccio,
		`Indicis: ${ trobats.length } de ${ missio.senyals.length }`
	);
}

// Elements d'una web `article` que el jugador pot tancar.
const TANCABLES = [ 'avis', 'barra' ];

/**
 * Clau de l'estat per a un element tancat d'una web.
 *
 * @param {string} url     URL de la pàgina.
 * @param {string} element `avis` o `barra`.
 * @return {string} Clau (`host:element`).
 */
export const clauTancat = ( url, element ) =>
	`${ clauWeb( url ) }:${ element }`;

/**
 * Anota que el jugador ha tancat l'avís o la barra d'una web.
 *
 * @param {Object} estat   Estat actual.
 * @param {string} url     URL de la pàgina.
 * @param {string} element `avis` o `barra`.
 * @return {Object} Nou estat.
 */
function tancaWeb( estat, url, element ) {
	// Sense mirar la fase: Esc ha de poder tancar l'avís també amb la
	// conseqüència a sobre (si no, el menú quedaria registrat i obert).
	if ( ! clauWeb( url ) || ! TANCABLES.includes( element ) ) {
		return estat;
	}
	const clau = clauTancat( url, element );
	return estat.tancats.includes( clau )
		? estat
		: { ...estat, tancats: [ ...estat.tancats, clau ] };
}

export function reductor( missio, estat, accio ) {
	switch ( accio.tipus ) {
		case 'DESBLOQUEJA':
			if ( estat.fase !== FASE.BLOQUEIG ) {
				return estat;
			}
			return processaEsdeveniment(
				missio,
				afegeixGuia( { ...estat, fase: FASE.JOC }, missio.intro[ 0 ] ),
				'inici',
				{}
			);

		case 'ESDEVENIMENT':
			return processaEsdeveniment(
				missio,
				anotaEsdeveniment( estat, accio.nom, accio.dades ),
				accio.nom,
				accio.dades
			);

		case 'TICK':
			return avancaTemps(
				missio,
				estat,
				accio.segons ?? 1,
				SEGONS_PISTA
			);

		case 'RESPOSTA':
			return resposta( missio, estat, accio.id );

		case 'LUPA': {
			if ( estat.fase !== FASE.JOC || estat.pausa ) {
				return estat;
			}
			const nou = { ...estat, lupa: ! estat.lupa };
			// Primera vegada per partida: avisa missions i tutorials.
			return nou.lupa && ! estat.lupaUsada
				? processaEsdeveniment(
						missio,
						{ ...nou, lupaUsada: true },
						'lupa.activa',
						{}
					)
				: nou;
		}

		case 'INSPECCIONA':
			return inspecciona( missio, estat, accio.senyal );

		case 'PAUSA':
			return { ...estat, pausa: true };

		case 'REPREN':
			return { ...estat, pausa: false };

		case 'NOTIFICACIONS_LLEGIDES':
			return {
				...estat,
				notificacions: estat.notificacions.map( ( n ) =>
					! accio.app || n.app === accio.app
						? { ...n, llegida: true }
						: n
				),
			};

		case 'TANCA_WEB':
			return tancaWeb( estat, accio.url, accio.element );

		case 'VEURE_RESULTAT':
			return estat.fase === FASE.CONSEQUENCIA
				? { ...estat, fase: FASE.RESULTAT }
				: estat;

		case 'REINICIA':
			return estatInicial( missio );

		default:
			return estat;
	}
}

/**
 * Respostes ràpides derivades de l'estat (mai es desen).
 *
 * @param {Object} missio Missió.
 * @param {Object} estat  Estat actual.
 * @return {{id: string, text: string}[]} Respostes disponibles.
 */
export function respostesRapides( missio, estat ) {
	if ( estat.fase !== FASE.JOC ) {
		return [];
	}
	if ( ! estat.introAcabada ) {
		const ultim = estat.introPas + 1 >= missio.intro.length;
		return [
			{
				id: 'intro:seguent',
				text: ultim ? TEXT_COMENCA : TEXT_SEGUENT,
			},
			{ id: 'intro:salta', text: TEXT_SALTA },
		];
	}
	if ( estat.decisioOberta ) {
		return [
			...missio.decisio.opcions.map( ( o ) => ( {
				id: `decisio:${ o.id }`,
				text: o.text,
			} ) ),
			{ id: 'decisio:tornar', text: TEXT_TORNAR },
		];
	}
	return [ { id: 'decidir', text: TEXT_DECIDIR } ];
}

export function opcioTriada( missio, estat ) {
	return missio.decisio.opcions.find( ( o ) => o.id === estat.opcio ) ?? null;
}

export function visible( estat, item ) {
	return ! item.ocult || !! estat.visibles?.[ item.id ];
}

/**
 * Un senyal amb `requereix` (id d'un element ocult o d'un disparador) només
 * compta al màxim si el jugador l'ha trobat o aquell element ja s'ha vist
 * (`mostra`) o executat (p. ex. `web-falsa`). Sense `requereix`, sempre compta.
 *
 * @param {Object} estat  Estat del motor.
 * @param {Object} senyal Senyal de la missió.
 * @return {boolean} Si compta al màxim.
 */
function senyalDisponible( estat, senyal ) {
	return (
		! senyal.requereix ||
		estat.trobats.includes( senyal.id ) ||
		!! estat.visibles?.[ senyal.requereix ] ||
		estat.executats.includes( senyal.requereix )
	);
}

export function puntuacio( missio, estat ) {
	// Un tutorial no puntua: l'1 només marca el progrés com a «fet».
	if ( missio.tutorial === true ) {
		return { punts: 0, maxim: 0, estrelles: 1 };
	}
	const disponibles = missio.senyals.filter( ( s ) =>
		senyalDisponible( estat, s )
	);
	const maxim = disponibles.length * PUNTS.senyal + PUNTS.correcta;
	const opcio = opcioTriada( missio, estat );
	let punts = estat.trobats.length * PUNTS.senyal;
	if ( opcio ) {
		punts += PUNTS[ opcio.valor ] ?? 0;
	}
	if ( estat.pescat ) {
		punts += PUNTS.picar;
	}
	punts += estat.pistesDonades * PUNTS.pista;
	punts = Math.max( 0, punts );
	const ratio = maxim ? punts / maxim : 0;
	let estrelles = 1;
	if ( ratio >= 0.9 ) {
		estrelles = 3;
	} else if ( ratio >= 0.6 ) {
		estrelles = 2;
	}
	return { punts, maxim, estrelles };
}
