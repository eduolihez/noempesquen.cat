import {
	lazy,
	Suspense,
	useReducer,
	useRef,
	useEffect,
	useCallback,
	useMemo,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { FASE, estatInicial, reductor, puntuacio } from '../nucli/motor';
import { PERSONATGES } from '../ui/avatars';
import { JocContext } from './context';
import { usePantallaCompleta } from './usePantallaCompleta';
import { useAillament, recuperaFocus } from './aillament';
import { horaDeJoc } from './hora';
import { Pausa } from './Pausa';
import { Consequencia } from './Consequencia';
import { Resultat } from './Resultat';
import { demanaResum } from './estadistiques';
import { MS_TICK } from '../nucli/temps.js';
import { useSoNotificacions } from './useSoNotificacions';
import { usePantalla } from './usePantalla';
import { Pantalla } from './PantallaSistema';
import { GuiaTutorial } from './GuiaTutorial';

/* Fases en què la partida ja s'ha acabat: Esc no obre la pausa. */
const FASES_FINALS = [ FASE.CONSEQUENCIA, FASE.RESULTAT ];
/* Fases en què sortir de pantalla completa sense demanar-ho pausa. */
const FASES_PAUSABLES = [ FASE.BLOQUEIG, FASE.JOC ];
const SISTEMES = {
	pc: lazy( () => import( '../sistemes/pc/Pc' ) ),
	mobil: lazy( () => import( '../sistemes/mobil/Mobil' ) ),
};

function Carregant() {
	return (
		<div
			className="nep-so-carrega"
			role="status"
			aria-label={ __( 'Carregant el sistema', 'noempesquen' ) }
		>
			<svg
				className="nep-so-carrega__anell"
				viewBox="0 0 48 48"
				width="48"
				height="48"
				aria-hidden="true"
			>
				<circle cx="24" cy="24" r="19" />
			</svg>
		</div>
	);
}

/**
 * Carcasa del simulador: estat, rellotge, pantalla completa i pausa.
 *
 * @param {Object}    props
 * @param {Object}    props.missio  Missió v2.
 * @param {Object}    props.mon     Dades del món (contactes, webs, correus).
 * @param {Function}  props.onSurt  Torna al selector.
 * @param {Function}  props.onAcaba (id, estrelles, estat) en arribar al resultat (un cop per partida).
 * @param {?Function} props.seguent Passa a la missió següent, si n'hi ha.
 * @param {string}    props.api     Arrel de l'API (per al resum públic; opcional).
 */
export function Simulador( { missio, mon, onSurt, onAcaba, seguent, api } ) {
	const arrel = useRef( null );
	const menus = useRef( [] );
	const [ estat, dispatch ] = useReducer(
		( e, a ) => reductor( missio, e, a ),
		missio,
		estatInicial
	);
	const fase = useRef( estat.fase );
	fase.current = estat.fase;
	const pausa = useRef( estat.pausa );
	pausa.current = estat.pausa;

	// Sortir de pantalla completa sense demanar-ho (Esc real, F11...) deixa
	// la capa fixa; durant la partida, a més, obre la pausa.
	const { entra, surt, fixa } = usePantallaCompleta( arrel, () => {
		if ( FASES_PAUSABLES.includes( fase.current ) ) {
			dispatch( { tipus: 'PAUSA' } );
		}
	} );

	const pantalla = usePantalla( missio.dispositiu ?? 'pc' );
	// Amb la petició de girar el joc s'atura com en la pausa: el sistema
	// (bloqueig, toasts, rellotge, so) veu `pausa`, però el diàleg de pausa
	// només surt amb la pausa real.
	const girar = pantalla.mode === 'girar';
	const estatJoc = useMemo(
		() => ( girar && ! estat.pausa ? { ...estat, pausa: true } : estat ),
		[ estat, girar ]
	);

	useAillament( arrel );
	useSoNotificacions( arrel, estatJoc );

	// El clic a la targeta és el gest d'usuari: demanem pantalla completa
	// en muntar. Si el navegador la rebutja, s'activa la capa fixa.
	// El focus només va a l'arrel si cap fill (el bloqueig) ja l'ha pres.
	useEffect( () => {
		entra();
		const el = arrel.current;
		if ( el && ! el.contains( el.ownerDocument.activeElement ) ) {
			el.focus();
		}
	}, [ entra ] );

	// Si l'element amb el focus desapareix (p. ex. en reiniciar), el focus
	// cauria a la pàgina de darrere: el retornem a l'arrel.
	useEffect( () => {
		recuperaFocus( arrel.current );
	} );

	useEffect( () => {
		if ( estat.fase !== FASE.JOC || estat.pausa || girar ) {
			return undefined;
		}
		const id = setInterval(
			() => dispatch( { tipus: 'TICK', segons: 1 } ),
			MS_TICK
		);
		return () => clearInterval( id );
	}, [ estat.fase, estat.pausa, girar ] );

	// Un sol avís per partida: re-renderitzar o tornar a muntar l'efecte no
	// el repeteix; només «Torna a jugar» (REINICIA) obre una partida nova.
	// El resum públic (què va triar la gent) es demana aquí, un cop per
	// partida i sense retardar el resultat; mai en previsualització.
	const avisada = useRef( false );
	const [ resum, setResum ] = useState( null );
	const partidaResum = useRef( 0 );
	useEffect( () => {
		if ( estat.fase === FASE.RESULTAT && ! avisada.current ) {
			avisada.current = true;
			onAcaba( missio.id, puntuacio( missio, estat ).estrelles, estat );
			if ( api && ! missio.previsualitzacio ) {
				const aquesta = partidaResum.current;
				demanaResum( api, missio.id ).then( ( r ) => {
					if ( r && aquesta === partidaResum.current ) {
						setResum( r );
					}
				} );
			}
		}
	}, [ estat.fase ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const emet = useCallback(
		( nom, dades = {} ) =>
			dispatch( { tipus: 'ESDEVENIMENT', nom, dades } ),
		[]
	);

	const registraMenu = useCallback( ( tanca ) => {
		menus.current.push( tanca );
		return () => {
			const i = menus.current.lastIndexOf( tanca );
			if ( i >= 0 ) {
				menus.current.splice( i, 1 );
			}
		};
	}, [] );

	// A document: si el botó que tenia el focus desapareix, el focus cau a
	// <body> i un keydown a l'arrel no arribaria mai.
	useEffect( () => {
		const onKeyDown = ( e ) => {
			if (
				e.key !== 'Escape' ||
				pausa.current ||
				FASES_FINALS.includes( fase.current )
			) {
				return;
			}
			e.preventDefault();
			const tanca = menus.current.pop();
			if ( tanca ) {
				tanca();
			} else {
				dispatch( { tipus: 'PAUSA' } );
			}
		};
		document.addEventListener( 'keydown', onKeyDown );
		return () => document.removeEventListener( 'keydown', onKeyDown );
	}, [] );

	const { nom: nomGuia, Avatar } =
		PERSONATGES[ missio.personatge ] ?? PERSONATGES.llissa;
	const hora = horaDeJoc( missio.rellotge, estat.temps );

	const ctx = useMemo(
		() => ( {
			missio,
			mon,
			estat: estatJoc,
			dispatch,
			emet,
			hora,
			nomGuia,
			Avatar,
			registraMenu,
			seguent,
		} ),
		[
			missio,
			mon,
			estatJoc,
			emet,
			hora,
			nomGuia,
			Avatar,
			registraMenu,
			seguent,
		]
	);

	const Sistema = SISTEMES[ missio.dispositiu ] ?? SISTEMES.pc;

	const continua = () => {
		dispatch( { tipus: 'REPREN' } );
		entra();
	};
	const reinicia = () => {
		avisada.current = false;
		partidaResum.current += 1;
		setResum( null );
		dispatch( { tipus: 'REINICIA' } );
		entra();
	};
	const surtDelJoc = async () => {
		await surt();
		onSurt();
	};
	const missioSeguent = seguent
		? async () => {
				await surt();
				seguent();
			}
		: null;

	const enConsequencia = estat.fase === FASE.CONSEQUENCIA;
	// Pas d'explicació del tutorial: només funciona la targeta de la guia.
	const pasExplicacio =
		estat.fase === FASE.JOC &&
		! girar &&
		missio.passos?.[ estat.pas ]?.continua === 'boto';

	return (
		<JocContext.Provider value={ ctx }>
			<div
				ref={ arrel }
				className={ `nep-so${ fixa ? ' nep-so--fixa' : '' }` }
				tabIndex={ -1 }
			>
				{ estat.fase === FASE.RESULTAT ? (
					<Resultat
						resum={ resum }
						onReinicia={ reinicia }
						onSeguent={ missioSeguent }
						onSurt={ surtDelJoc }
					/>
				) : (
					<div
						className="nep-so__sistema"
						inert={
							estat.pausa || enConsequencia || pasExplicacio
								? ''
								: undefined
						}
					>
						<Pantalla
							dispositiu={ missio.dispositiu ?? 'pc' }
							pantalla={ pantalla }
							pausa={ estat.pausa }
							consequencia={ enConsequencia }
							onSurt={ surtDelJoc }
						>
							<Suspense fallback={ <Carregant /> }>
								<Sistema />
							</Suspense>
						</Pantalla>
					</div>
				) }
				<GuiaTutorial girar={ girar } />
				{ enConsequencia && (
					<Consequencia
						onResultat={ () =>
							dispatch( { tipus: 'VEURE_RESULTAT' } )
						}
					/>
				) }
				{ estat.pausa && (
					<Pausa
						onContinua={ continua }
						onReinicia={ reinicia }
						onSurt={ surtDelJoc }
					/>
				) }
			</div>
		</JocContext.Provider>
	);
}
