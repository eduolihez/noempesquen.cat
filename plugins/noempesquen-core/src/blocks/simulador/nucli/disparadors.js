/**
 * Disparadors: coincidència d'esdeveniments, efectes i cua de retards.
 * Funcions pures sobre l'estat del motor.
 */
import { FASE, afegeixGuia } from './motor.js';

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
			return dades.url === valor || hostname( dades.url ) === valor;
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
		if ( d.retard > 0 ) {
			actual = {
				...actual,
				pendents: [
					...actual.pendents,
					{ id: d.id, quan: actual.temps + d.retard },
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
	const vencuts = actual.pendents.filter( ( p ) => p.quan <= temps );
	actual = {
		...actual,
		pendents: actual.pendents.filter( ( p ) => p.quan > temps ),
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
