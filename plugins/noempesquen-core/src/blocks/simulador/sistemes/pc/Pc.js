import {
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from '@wordpress/element';
import { useJoc } from '../../simulador/context';
import { FASE } from '../../nucli/motor';
import { recuperaFocus } from '../../simulador/aillament';
import { APPS } from '../../apps/registre';
import { SistemaContext } from './context';
import { ESTAT_FINESTRES, finestresReductor } from './finestres';
import { Bloqueig } from './Bloqueig';
import { Escriptori } from './Escriptori';
import { Finestra } from './Finestra';
import { BarraTasques } from './BarraTasques';
import { MenuInici } from './MenuInici';
import { CentreNotificacions } from './CentreNotificacions';
import { Toasts } from './Notificacions';
import { AvisLupa } from '../../ui/BotoLupa';

const URL_POSTA = 'https://posta.cat/';

/* On porta el clic en una notificació, segons l'app que l'envia. */
const DESTINS = {
	parla: [ 'parla' ],
	posta: [ 'navegador', { url: URL_POSTA } ],
};

const esDrecera = ( e ) => e.altKey && e.shiftKey && e.code === 'KeyL';

/**
 * Sistema PC: bloqueig, escriptori, finestres, barra de tasques,
 * menú d'inici, notificacions i lupa.
 */
export default function Pc() {
	const { estat, dispatch, emet, missio, hora } = useJoc();
	const [ f, dispatchF ] = useReducer( finestresReductor, ESTAT_FINESTRES );
	const [ panell, setPanell ] = useState( null );
	const [ ambBloqueig, setAmbBloqueig ] = useState(
		estat.fase === FASE.BLOQUEIG
	);
	const refInici = useRef( null );
	const refRellotge = useRef( null );
	const refFinestres = useRef( null );
	const faseAnterior = useRef( estat.fase );
	const bloquejat = estat.fase === FASE.BLOQUEIG;

	// Les accions de finestra porten l'àrea (mides lògiques) per a la disposició.
	const envia = useCallback( ( accio ) => {
		const zona = refFinestres.current;
		dispatchF( {
			...accio,
			area: zona
				? { amplada: zona.clientWidth, alcada: zona.clientHeight }
				: undefined,
		} );
	}, [] );

	// `app.obre` només quan l'obre el jugador (no el desbloqueig automàtic).
	const obreApp = useCallback(
		( app, dades, { automatica = false } = {} ) => {
			if ( APPS[ app ] ) {
				setPanell( null );
				envia( { tipus: 'OBRE', app, dades } );
				if ( ! automatica ) {
					emet( 'app.obre', { app } );
				}
			}
		},
		[ emet, envia ]
	);

	const obreNotificacio = useCallback(
		( n ) => {
			const [ app, dades ] = DESTINS[ n.app ] ?? [ n.app ];
			obreApp( app, dades );
		},
		[ obreApp ]
	);

	// Desbloqueig: navegador i Parla, en aquest ordre (en cascada).
	// Reinici: torna al bloqueig amb l'escriptori buit.
	useEffect( () => {
		const anterior = faseAnterior.current;
		faseAnterior.current = estat.fase;
		if ( estat.fase === FASE.BLOQUEIG ) {
			dispatchF( { tipus: 'REINICIA' } );
			setPanell( null );
			setAmbBloqueig( true );
		} else if ( anterior === FASE.BLOQUEIG ) {
			const url = missio.apps?.navegador?.inici?.[ 0 ];
			obreApp( 'navegador', url ? { url } : undefined, {
				automatica: true,
			} );
			obreApp( 'parla', undefined, { automatica: true } );
		}
	}, [ estat.fase, missio, obreApp ] );

	// Parla en primer pla: els seus missatges ja es veuen, queden llegits.
	const parlaActiva = f.focus === 'parla';
	const parlaPendent = estat.notificacions.some(
		( n ) => n.app === 'parla' && ! n.font && ! n.llegida
	);
	useEffect( () => {
		if ( parlaActiva && parlaPendent ) {
			dispatch( { tipus: 'NOTIFICACIONS_LLEGIDES', app: 'parla' } );
		}
	}, [ parlaActiva, parlaPendent, dispatch ] );

	// En tancar o minimitzar la darrera finestra, el seu botó desapareix:
	// el focus no ha de caure a la pàgina de darrere.
	useEffect( () => {
		recuperaFocus( refInici.current?.closest( '.nep-so' ) );
	}, [ f.focus ] );

	useEffect( () => {
		const onKeyDown = ( e ) => {
			if ( esDrecera( e ) ) {
				e.preventDefault();
				dispatch( { tipus: 'LUPA' } );
			}
		};
		const doc = refInici.current?.ownerDocument ?? document;
		doc.addEventListener( 'keydown', onKeyDown );
		return () => doc.removeEventListener( 'keydown', onKeyDown );
	}, [ dispatch ] );

	const tancaPanell = useCallback( () => setPanell( null ), [] );
	const amagaBloqueig = useCallback( () => setAmbBloqueig( false ), [] );

	const alternaPanell = ( nom, obre = false ) => {
		const nou = panell === nom && ! obre ? null : nom;
		if ( nou === 'notificacions' ) {
			dispatch( { tipus: 'NOTIFICACIONS_LLEGIDES' } );
		}
		setPanell( nou );
	};

	const clicApp = ( app ) => {
		setPanell( null );
		const finestra = f.finestres.find( ( x ) => x.app === app );
		if ( ! finestra ) {
			obreApp( app );
		} else if ( f.focus === finestra.id ) {
			envia( { tipus: 'MINIMITZA', id: finestra.id } );
		} else {
			envia( { tipus: 'ENFOCA', id: finestra.id } );
		}
	};

	const sistema = useMemo(
		() => ( { obreApp, notificacions: estat.notificacions } ),
		[ obreApp, estat.notificacions ]
	);

	return (
		<SistemaContext.Provider value={ sistema }>
			<div
				className={ `nep-so-pc${ estat.lupa ? ' is-lupa' : '' }` }
				data-tut="pantalla"
			>
				<div
					className="nep-so-pc__sessio"
					inert={ bloquejat ? '' : undefined }
				>
					<Escriptori onObre={ obreApp } />
					<div ref={ refFinestres } className="nep-so-pc__finestres">
						{ f.finestres.map( ( finestra, i ) => {
							const accio = ( tipus ) => () =>
								envia( { tipus, id: finestra.id } );
							return (
								<Finestra
									key={ finestra.id }
									finestra={ finestra }
									ordre={ i }
									enfocada={ f.focus === finestra.id }
									onEnfoca={ accio( 'ENFOCA' ) }
									onMinimitza={ accio( 'MINIMITZA' ) }
									onMaximitza={ accio( 'MAXIMITZA' ) }
									onTanca={ accio( 'TANCA' ) }
									onMou={ ( rect ) =>
										dispatchF( {
											tipus: 'MOU',
											id: finestra.id,
											rect,
										} )
									}
								/>
							);
						} ) }
					</div>
					{ panell && (
						<div
							className="nep-so-pc__capa"
							aria-hidden="true"
							onPointerDown={ tancaPanell }
						/>
					) }
					{ panell === 'inici' && (
						<MenuInici
							onObre={ obreApp }
							onApaga={ () => {
								setPanell( null );
								dispatch( { tipus: 'PAUSA' } );
							} }
							onTanca={ tancaPanell }
							origen={ refInici }
						/>
					) }
					{ panell === 'notificacions' && (
						<CentreNotificacions
							onObre={ obreNotificacio }
							onTanca={ tancaPanell }
							origen={ refRellotge }
						/>
					) }
					<Toasts
						onObre={ obreNotificacio }
						parlaActiva={ parlaActiva }
						amagats={ panell === 'notificacions' }
						silenci={ ambBloqueig }
					/>
					<BarraTasques
						finestres={ f.finestres }
						focus={ f.focus }
						panell={ panell }
						onPanell={ alternaPanell }
						onApp={ clicApp }
						onLupa={ () => {
							setPanell( null );
							dispatch( { tipus: 'LUPA' } );
						} }
						hora={ hora }
						noLlegides={
							estat.notificacions.filter( ( n ) => ! n.llegida )
								.length
						}
						refInici={ refInici }
						refRellotge={ refRellotge }
					/>
					<AvisLupa />
				</div>
				{ ambBloqueig && (
					<Bloqueig sortint={ ! bloquejat } onFi={ amagaBloqueig } />
				) }
			</div>
		</SistemaContext.Provider>
	);
}
