/**
 * Motor de missions: estat i regles, sense res d'interfície.
 */

export const FASE = {
	INTRO: 'intro',
	EXPLORA: 'explora',
	DECIDEIX: 'decideix',
	CONSEQUENCIA: 'consequencia',
	RESULTAT: 'resultat',
};

export const PUNTS = {
	senyal: 10,
	correcta: 50,
	parcial: 20,
	incorrecta: 0,
	picar: -20,
};

export function estatInicial( missio ) {
	return {
		missioId: missio?.id ?? null,
		fase: FASE.INTRO,
		pasIntro: 0,
		obert: null,
		lupa: false,
		trobats: [],
		falsos: 0,
		haPicat: false,
		opcio: null,
		bombolla: missio?.intro?.[ 0 ] ?? '',
		ultimaRevelada: null,
	};
}

function fraseNormal( missio, comptador ) {
	const frases = missio.frases?.normal ?? [];
	return frases.length ? frases[ comptador % frases.length ] : '';
}

export function reductor( missio, estat, accio ) {
	switch ( accio.tipus ) {
		case 'SEGUENT_INTRO': {
			const seg = estat.pasIntro + 1;
			if ( seg < missio.intro.length ) {
				return {
					...estat,
					pasIntro: seg,
					bombolla: missio.intro[ seg ],
				};
			}
			return {
				...estat,
				fase: FASE.EXPLORA,
				bombolla: missio.instruccions,
			};
		}
		case 'SALTA_INTRO':
			return {
				...estat,
				fase: FASE.EXPLORA,
				bombolla: missio.instruccions,
			};

		case 'OBRE':
			return { ...estat, obert: accio.id };

		case 'TANCA':
			return { ...estat, obert: null };

		case 'LUPA':
			return { ...estat, lupa: ! estat.lupa };

		case 'INSPECCIONA': {
			if ( estat.fase !== FASE.EXPLORA ) {
				return estat;
			}
			const senyal = missio.senyals.find(
				( s ) => s.id === accio.senyal
			);
			if ( ! senyal ) {
				return {
					...estat,
					falsos: estat.falsos + 1,
					bombolla: fraseNormal( missio, estat.falsos ),
					ultimaRevelada: null,
				};
			}
			if ( estat.trobats.includes( senyal.id ) ) {
				return {
					...estat,
					bombolla: senyal.reaccio,
					ultimaRevelada: senyal.id,
				};
			}
			return {
				...estat,
				trobats: [ ...estat.trobats, senyal.id ],
				bombolla: senyal.reaccio,
				ultimaRevelada: senyal.id,
			};
		}

		case 'PICA':
			if ( estat.fase !== FASE.EXPLORA ) {
				return estat;
			}
			return {
				...estat,
				haPicat: true,
				fase: FASE.CONSEQUENCIA,
				opcio: null,
				bombolla: missio.frases?.esquer ?? '',
			};

		case 'VULL_DECIDIR':
			return estat.fase === FASE.EXPLORA
				? { ...estat, fase: FASE.DECIDEIX, lupa: false }
				: estat;

		case 'TORNA_A_EXPLORAR':
			return estat.fase === FASE.DECIDEIX
				? { ...estat, fase: FASE.EXPLORA }
				: estat;

		case 'TRIA': {
			const opcio = missio.decisio.opcions.find(
				( o ) => o.id === accio.id
			);
			if ( ! opcio || estat.fase !== FASE.DECIDEIX ) {
				return estat;
			}
			return {
				...estat,
				opcio: opcio.id,
				fase: FASE.CONSEQUENCIA,
				bombolla: opcio.resposta,
			};
		}

		case 'VEURE_RESULTAT':
			return { ...estat, fase: FASE.RESULTAT };

		case 'REINICIA':
			return estatInicial( missio );

		default:
			return estat;
	}
}

export function opcioTriada( missio, estat ) {
	return missio.decisio.opcions.find( ( o ) => o.id === estat.opcio ) ?? null;
}

export function puntuacio( missio, estat ) {
	const maxim = missio.senyals.length * PUNTS.senyal + PUNTS.correcta;
	const opcio = opcioTriada( missio, estat );
	let punts = estat.trobats.length * PUNTS.senyal;
	if ( opcio ) {
		punts += PUNTS[ opcio.valor ] ?? 0;
	}
	if ( estat.haPicat ) {
		punts += PUNTS.picar;
	}
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

/**
 * Valida l'estructura mínima d'una missió.
 *
 * @param {Object} m Missió a validar.
 * @return {string[]} Llista d'errors (buida si és vàlida).
 */
export function validaMissio( m ) {
	const errors = [];
	if ( ! m || typeof m !== 'object' ) {
		return [ 'no és un objecte' ];
	}
	[ 'id', 'titol', 'dispositiu', 'app', 'personatge' ].forEach( ( c ) => {
		if ( ! m[ c ] ) {
			errors.push( `falta ${ c }` );
		}
	} );
	if ( ! [ 'pc', 'mobil' ].includes( m.dispositiu ) ) {
		errors.push( 'dispositiu invàlid' );
	}
	if ( ! Array.isArray( m.intro ) || ! m.intro.length ) {
		errors.push( 'falta intro' );
	}
	if (
		! Array.isArray( m.missatges ) ||
		! m.missatges.some( ( x ) => x.objectiu )
	) {
		errors.push( 'cap missatge objectiu' );
	}
	const ids = new Set( ( m.senyals ?? [] ).map( ( s ) => s.id ) );
	( m.missatges ?? [] ).forEach( ( msg ) => {
		const usats = [ msg.remitent?.senyal, msg.assumpte_senyal ];
		( msg.cos ?? [] ).flat().forEach( ( seg ) => usats.push( seg.senyal ) );
		usats.filter( Boolean ).forEach( ( s ) => {
			if ( ! ids.has( s ) ) {
				errors.push( `senyal desconegut: ${ s }` );
			}
		} );
	} );
	const valors = ( m.decisio?.opcions ?? [] ).map( ( o ) => o.valor );
	if ( ! valors.includes( 'correcta' ) ) {
		errors.push( 'cap opció correcta' );
	}
	return errors;
}
