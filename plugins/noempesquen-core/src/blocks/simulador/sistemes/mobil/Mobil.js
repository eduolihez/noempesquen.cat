import {
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from '@wordpress/element';
import { useJoc } from '../../simulador/context';
import { FASE } from '../../nucli/motor';
import { APPS_MOBIL } from '../../apps/registre';
import { FinestraContext, SistemaContext } from '../pc/context';
import { MobilContext } from './context';
import { ESTAT_PILA, appActiva, pilaReductor } from './pila';
import { destiParla } from '../../apps/parla/xatsMissio';
import { destiRevenda } from '../../apps/revenda/anuncis.js';
import { Bloqueig } from './Bloqueig';
import { BarraEstat } from './BarraEstat';
import { Inici } from './Inici';
import { CentreControl } from './CentreControl';
import { Banners } from './Banners';
import { BarraNavegacio } from './BarraNavegacio';
import { AvisLupa, BotoLupa } from '../../ui/BotoLupa';

const URL_POSTA = 'https://posta.cat/';

/* On porta tocar una notificació, segons l'app que l'envia. */
const DESTINS = {
	// Parla: vegeu destiParla (el xat de la notificació o el del guia).
	// Revenda: vegeu destiRevenda (pestanya «Xats» i el xat, si n'hi ha).
	// T4: les notificacions de Missatges obren l'app (ja present quan existeixi).
	missatges: [ 'missatges' ],
	// Mentre no hi hagi app de Posta al mòbil, s'obre la web.
	posta: [ 'navegador', { url: URL_POSTA } ],
};

/* Les apps del mòbil no tenen finestra: el títol no es mostra enlloc. */
const SENSE_FINESTRA = { posaTitol: () => {} };

const esDrecera = ( e ) => e.altKey && e.shiftKey && e.code === 'KeyL';

/**
 * Una app de la pila: muntada mentre hi és (conserva l'estat), visible
 * només si és a dalt. Té el seu propi context per registrar «Enrere».
 *
 * @param {Object}   props
 * @param {Object}   props.entrada  Entrada de la pila { clau, app, dades }.
 * @param {boolean}  props.activa   És l'app en primer pla.
 * @param {Object}   props.serveis  Serveis comuns del mòbil.
 * @param {Function} props.registra (clau, fn) registra el gestor d'Enrere.
 */
function PantallaApp( { entrada, activa, serveis, registra } ) {
	const { Component, nom } = APPS_MOBIL[ entrada.app ];
	const valor = useMemo(
		() => ( {
			...serveis,
			registraEnrere: ( fn ) => registra( entrada.clau, fn ),
		} ),
		[ serveis, registra, entrada.clau ]
	);
	return (
		<section
			className="nep-so-m-app-pantalla"
			aria-label={ nom }
			hidden={ ! activa }
			inert={ activa ? undefined : '' }
		>
			<MobilContext.Provider value={ valor }>
				<FinestraContext.Provider value={ SENSE_FINESTRA }>
					<Suspense fallback={ null }>
						<Component dades={ entrada.dades } />
					</Suspense>
				</FinestraContext.Provider>
			</MobilContext.Provider>
		</section>
	);
}

/**
 * Sistema mòbil: bloqueig, inici, pila d'apps, barra d'estat, centre de
 * control, banners, barra de navegació i lupa. Mateix contracte amb
 * Simulador que Pc (sense props; tot via useJoc()).
 */
export default function Mobil() {
	const { estat, dispatch, emet, hora } = useJoc();
	const [ pila, dispatchP ] = useReducer( pilaReductor, ESTAT_PILA );
	const [ centre, setCentre ] = useState( false );
	const [ ambBloqueig, setAmbBloqueig ] = useState(
		estat.fase === FASE.BLOQUEIG
	);
	const arrel = useRef( null );
	const refEstat = useRef( null );
	const gestorsEnrere = useRef( new Map() );
	const bloquejat = estat.fase === FASE.BLOQUEIG;
	const activa = appActiva( pila );
	const pilaRef = useRef( pila );
	pilaRef.current = pila;

	const obreApp = useCallback(
		( app, dades ) => {
			if ( APPS_MOBIL[ app ] ) {
				setCentre( false );
				dispatchP( { tipus: 'OBRE', app, dades } );
				emet( 'app.obre', { app } );
			}
		},
		[ emet ]
	);

	const enrere = useCallback( () => {
		const dalt = appActiva( pilaRef.current );
		if ( ! dalt ) {
			return;
		}
		const gestor = gestorsEnrere.current.get( dalt.clau );
		if ( gestor?.() ) {
			return;
		}
		dispatchP( { tipus: 'ENRERE' } );
	}, [] );

	const inici = useCallback( () => {
		setCentre( false );
		dispatchP( { tipus: 'INICI' } );
	}, [] );

	const registra = useCallback( ( clau, fn ) => {
		gestorsEnrere.current.set( clau, fn );
		return () => {
			if ( gestorsEnrere.current.get( clau ) === fn ) {
				gestorsEnrere.current.delete( clau );
			}
		};
	}, [] );

	const obreNotificacio = useCallback(
		( n ) => {
			const desti = {
				parla: destiParla,
				revenda: destiRevenda,
			}[ n.app ];
			const [ app, dades ] = ( desti
				? desti( n )
				: DESTINS[ n.app ] ) ?? [ n.app ];
			// Còpia nova: cada obertura compta com a dades noves per a l'app.
			obreApp( app, dades && { ...dades } );
		},
		[ obreApp ]
	);

	// Reinici: torna al bloqueig amb la pila buida.
	useEffect( () => {
		if ( estat.fase === FASE.BLOQUEIG ) {
			dispatchP( { tipus: 'REINICIA' } );
			gestorsEnrere.current.clear();
			setCentre( false );
			setAmbBloqueig( true );
		}
	}, [ estat.fase ] );

	// App en primer pla: les seves notificacions ja es veuen, queden llegides.
	const appPrimerPla = activa?.app ?? null;
	const pendent = estat.notificacions.some(
		( n ) => n.app === appPrimerPla && ! n.llegida
	);
	useEffect( () => {
		if ( appPrimerPla && pendent ) {
			dispatch( { tipus: 'NOTIFICACIONS_LLEGIDES', app: appPrimerPla } );
		}
	}, [ appPrimerPla, pendent, dispatch ] );

	// En canviar de pantalla o desbloquejar, el focus no ha de caure a la
	// pàgina: si s'ha perdut (body, o dins d'una part inert o amagada), va
	// al primer icona de l'inici o, dins d'una app, a l'arrel del simulador.
	useEffect( () => {
		const el = arrel.current;
		if ( ! el || bloquejat ) {
			return;
		}
		const actiu = el.ownerDocument.activeElement;
		const perdut =
			! actiu ||
			actiu === el.ownerDocument.body ||
			!! actiu.closest?.( '[inert], [hidden]' );
		if ( ! perdut ) {
			return;
		}
		const icona = activa
			? null
			: el.querySelector( '.nep-so-mobil__inici .nep-so-m-app' );
		if ( icona ) {
			icona.focus();
		} else {
			el.closest( '.nep-so' )?.focus( { preventScroll: true } );
		}
	}, [ activa?.clau, bloquejat ] ); // eslint-disable-line react-hooks/exhaustive-deps -- només en canviar de pantalla o de bloqueig.

	useEffect( () => {
		const onKeyDown = ( e ) => {
			if ( esDrecera( e ) ) {
				e.preventDefault();
				dispatch( { tipus: 'LUPA' } );
			}
		};
		const doc = arrel.current?.ownerDocument ?? document;
		doc.addEventListener( 'keydown', onKeyDown );
		return () => doc.removeEventListener( 'keydown', onKeyDown );
	}, [ dispatch ] );

	const obreCentre = useCallback( () => {
		setCentre( true );
		dispatch( { tipus: 'NOTIFICACIONS_LLEGIDES' } );
	}, [ dispatch ] );
	const tancaCentre = useCallback( () => setCentre( false ), [] );
	const amagaBloqueig = useCallback( () => setAmbBloqueig( false ), [] );
	const obreGuia = useCallback( () => {
		dispatch( { tipus: 'DESBLOQUEJA' } );
		obreApp( 'parla', { xat: 'guia' } );
	}, [ dispatch, obreApp ] );

	const sistema = useMemo(
		() => ( { obreApp, notificacions: estat.notificacions } ),
		[ obreApp, estat.notificacions ]
	);
	const serveis = useMemo(
		() => ( {
			obreApp,
			enrere,
			inici,
			appActiva: appPrimerPla,
			registraEnrere: () => () => {},
		} ),
		[ obreApp, enrere, inici, appPrimerPla ]
	);

	return (
		<SistemaContext.Provider value={ sistema }>
			<MobilContext.Provider value={ serveis }>
				<div className="nep-so-mobil-fons">
					<div
						ref={ arrel }
						className={ `nep-so-mobil${
							estat.lupa ? ' is-lupa' : ''
						}` }
					>
						<div
							className="nep-so-mobil__sessio"
							inert={ bloquejat ? '' : undefined }
						>
							<BarraEstat
								hora={ hora }
								obert={ centre }
								onObre={ obreCentre }
								refBoto={ refEstat }
								to={ activa ? 'clar' : null }
								inerta={ centre }
							/>
							<div
								className="nep-so-mobil__pantalla"
								inert={ centre ? '' : undefined }
							>
								<div
									className="nep-so-mobil__inici"
									hidden={ !! activa }
									inert={ activa ? '' : undefined }
								>
									<Inici hora={ hora } onObre={ obreApp } />
								</div>
								{ pila.apps.map( ( entrada ) => (
									<PantallaApp
										key={ entrada.clau }
										entrada={ entrada }
										activa={ entrada === activa }
										serveis={ serveis }
										registra={ registra }
									/>
								) ) }
							</div>
							<div className="nep-so-mobil__peu">
								<BarraNavegacio
									aInici={ ! activa }
									onEnrere={ enrere }
									onInici={ inici }
									inerta={ centre }
								/>
								<BotoLupa
									className="nep-so-mobil__lupa"
									onClick={ () =>
										dispatch( { tipus: 'LUPA' } )
									}
									inerta={ centre }
								/>
							</div>
							<AvisLupa />
							<Banners
								onObre={ obreNotificacio }
								activa={ appPrimerPla }
								amagats={ centre }
								silenci={ ambBloqueig }
							/>
							{ centre && (
								<CentreControl
									onTanca={ tancaCentre }
									onObre={ obreNotificacio }
									origen={ refEstat }
								/>
							) }
						</div>
						{ ambBloqueig && (
							<Bloqueig
								sortint={ ! bloquejat }
								onFi={ amagaBloqueig }
								onObreGuia={ obreGuia }
							/>
						) }
					</div>
				</div>
			</MobilContext.Provider>
		</SistemaContext.Provider>
	);
}
