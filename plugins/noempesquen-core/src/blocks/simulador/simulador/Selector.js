/**
 * Selector de missions (fora del sistema simulat): un port amb un vaixell per
 * dispositiu (el Pesquer = ordinador, el Pirata = mòbil). En triar-ne un, la
 * càmera s'hi acosta i apareix el mapa de la seva ruta.
 *
 * Vistes
 * - port: escena amb un botó damunt de cada vaixell que té ruta.
 * - mapa: escena ampliada + capa germana amb <Mapa> (fora del marc que fa el
 *   zoom). «Torna al port» i Esc tornen al port i el focus va al vaixell.
 *
 * Ocupa tota la finestra (capa fixa per sobre del tema, sense scroll de
 * pàgina, la resta de la pàgina inert). Cantonades: «Surt» (a `inici`), el
 * títol, «Pausa animacions» i «Pantalla completa» (Fullscreen API sobre
 * <html>: la partida hi anida la seva i, en sortir-ne, s'hi torna).
 *
 * Props
 * - missions, progres, preferit, onTria: com sempre.
 * - enfoca:         id de la missió jugada (focus al seu node en tornar).
 * - vaixellInicial: 'pc' | 'mobil' | null. Obre directament aquest mapa.
 * - inici:          URL de la portada del web (enllaç «Surt»).
 * - children:       barra inferior (estat del compte, avisos).
 */
import {
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { construeixRuta, dispositiusAmbRuta } from '../nucli/ruta';
import { Escena } from '../ui/port/Escena';
import { Estrella, Glif } from '../ui/icones';
import { useAillament } from './aillament';
import { JocContext } from './context';
import { Mapa } from './Mapa';
import { CLASSE_SCROLL } from './usePantallaCompleta';

/* Mòbil que gira cap a horitzontal (fletxa en arc). */
const IconaGira = ( p ) => (
	<Glif { ...p }>
		<rect x="2" y="9" width="12" height="8" rx="1.5" />
		<path d="M7 4.5a7 7 0 0 1 9.5 4" />
		<path d="M16.8 5.6 16.5 8.5 13.7 7.9" />
	</Glif>
);

/* Pausa (dues barres) i reprèn (triangle). */
const IconaPausa = ( p ) => (
	<Glif { ...p } strokeWidth="2.2">
		<path d="M7.5 5v10M12.5 5v10" />
	</Glif>
);
const IconaPlay = ( p ) => (
	<Glif { ...p } strokeWidth="2">
		<path d="M7 5v10l8-5Z" />
	</Glif>
);

/* Porta amb fletxa cap a fora (surt al web). */
const IconaSurt = ( p ) => (
	<Glif { ...p } strokeWidth="2">
		<path d="M8 4H4.5v12H8" />
		<path d="M8.5 10H17M13.5 6.5 17 10l-3.5 3.5" />
	</Glif>
);

/* Quatre cantonades cap a fora (entra) o cap a dins (surt). */
const IconaAmplia = ( p ) => (
	<Glif { ...p } strokeWidth="2">
		<path d="M3.5 7.5v-4h4M12.5 3.5h4v4M16.5 12.5v4h-4M7.5 16.5h-4v-4" />
	</Glif>
);
const IconaRedueix = ( p ) => (
	<Glif { ...p } strokeWidth="2">
		<path d="M7.5 3.5v4h-4M16.5 7.5h-4v-4M12.5 16.5v-4h4M3.5 12.5h4v4" />
	</Glif>
);

/**
 * Pantalla completa real de la pàgina (<html>), només per gest d'usuari.
 * `pot` és fals si el navegador no té l'API (el botó no es mostra).
 *
 * @return {{pot: boolean, actiu: boolean, commuta: Function}} Control.
 */
function usePantallaCompletaPagina() {
	const doc = window.document;
	const pot =
		!! doc.fullscreenEnabled && !! doc.documentElement.requestFullscreen;
	const [ actiu, setActiu ] = useState( () => !! doc.fullscreenElement );
	useEffect( () => {
		const onChange = () => setActiu( !! doc.fullscreenElement );
		doc.addEventListener( 'fullscreenchange', onChange );
		return () => doc.removeEventListener( 'fullscreenchange', onChange );
	}, [ doc ] );
	const commuta = () => {
		const peticio = doc.fullscreenElement
			? doc.exitFullscreen()
			: doc.documentElement.requestFullscreen();
		peticio?.catch?.( () => {} );
	};
	return { pot, actiu, commuta };
}

/**
 * Sense scroll de pàgina mentre el selector és muntat (mateixa classe que la
 * capa fixa del joc; el joc la torna a posar si la necessita).
 */
function useSenseScroll() {
	useEffect( () => {
		const html = window.document.documentElement;
		html.classList.add( CLASSE_SCROLL );
		return () => html.classList.remove( CLASSE_SCROLL );
	}, [] );
}

const vaixells = () => ( {
	pc: {
		nom: __( 'el Pesquer', 'noempesquen' ),
		descripcio: __( 'ordinador amb la Llissa', 'noempesquen' ),
		obert: __( 'Has obert el mapa del Pesquer', 'noempesquen' ),
	},
	mobil: {
		nom: __( 'el Pirata', 'noempesquen' ),
		descripcio: __( 'mòbil amb la Remei', 'noempesquen' ),
		obert: __( 'Has obert el mapa del Pirata', 'noempesquen' ),
	},
} );

function BotoVaixell( {
	dispositiu,
	ruta,
	aqui,
	horitzontal,
	onObre,
	refBoto,
} ) {
	const { nom, descripcio } = vaixells()[ dispositiu ];
	const marquesId = `nep-sel-${ dispositiu }-marques`;
	const etiqueta = sprintf(
		/* translators: 1: nom del vaixell, 2: dispositiu i guia, 3: missions fetes, 4: total, 5: estrelles, 6: màxim */
		__(
			'Obre %1$s: %2$s, %3$d de %4$d missions, %5$d de %6$d estrelles',
			'noempesquen'
		),
		nom,
		descripcio,
		ruta.feta,
		ruta.total,
		ruta.estrelles,
		ruta.max
	);
	return (
		<button
			type="button"
			ref={ refBoto }
			className={ `nep-sel-barco nep-sel-barco--${ dispositiu }` }
			aria-label={ etiqueta }
			aria-describedby={ aqui || horitzontal ? marquesId : undefined }
			onClick={ () => onObre( dispositiu ) }
		>
			<span className="nep-sel-barco__cartell" aria-hidden="true">
				<span className="nep-sel-barco__nom">{ nom }</span>
				<span className="nep-sel-barco__xifres">
					<span>
						{ sprintf(
							/* translators: 1: missions fetes, 2: total */
							__( '%1$d de %2$d', 'noempesquen' ),
							ruta.feta,
							ruta.total
						) }
					</span>
					<span className="nep-sel-barco__estrelles">
						<Estrella mida={ 16 } plena />
						{ `${ ruta.estrelles }/${ ruta.max }` }
					</span>
				</span>
				{ ( aqui || horitzontal ) && (
					<span id={ marquesId } className="nep-sel-barco__marques">
						{ aqui && (
							<span className="nep-sel-barco__aqui">
								{ __( 'Aquí', 'noempesquen' ) }
							</span>
						) }
						{ horitzontal && (
							<span className="nep-sel-horitzontal">
								<IconaGira mida={ 16 } />
								{ __( 'Millor en horitzontal', 'noempesquen' ) }
							</span>
						) }
					</span>
				) }
			</span>
		</button>
	);
}

/**
 * Esc tanca el mapa. Dins del joc es registra com a menú; fora (el cas
 * normal: el selector no és dins de <Simulador>), escolta la finestra només
 * mentre el mapa és obert.
 *
 * @param {boolean}    obert Si el mapa és obert.
 * @param {() => void} tanca Torna al port.
 */
function useEscTanca( obert, tanca ) {
	const ctx = useContext( JocContext );
	const tancaRef = useRef( tanca );
	tancaRef.current = tanca;
	useEffect( () => {
		if ( ! obert ) {
			return;
		}
		if ( ctx?.registraMenu ) {
			return ctx.registraMenu( () => tancaRef.current() );
		}
		const onTecla = ( e ) => {
			if ( e.key === 'Escape' && ! e.defaultPrevented ) {
				e.preventDefault();
				tancaRef.current();
			}
		};
		window.addEventListener( 'keydown', onTecla );
		return () => window.removeEventListener( 'keydown', onTecla );
	}, [ obert, ctx ] );
}

export function Selector( {
	missions,
	progres,
	preferit,
	onTria,
	enfoca,
	vaixellInicial = null,
	inici = '/',
	children,
} ) {
	const arrel = useRef( null );
	const completa = usePantallaCompletaPagina();
	useSenseScroll();
	useAillament( arrel );
	const escena = useRef( null );
	const titolMapa = useRef( null );
	const botons = { pc: useRef( null ), mobil: useRef( null ) };
	const dispositius = useMemo(
		() => dispositiusAmbRuta( missions ),
		[ missions ]
	);
	const rutes = useMemo( () => {
		const r = {};
		dispositius.forEach( ( d ) => {
			r[ d ] = construeixRuta( missions, d, progres );
		} );
		return r;
	}, [ missions, dispositius, progres ] );

	const [ obert, setObert ] = useState( () =>
		vaixellInicial === 'pc' || vaixellInicial === 'mobil'
			? vaixellInicial
			: null
	);
	// Obert en muntar (tornant d'una partida): sense animació d'entrada.
	const [ directe, setDirecte ] = useState( () => !! obert );
	const [ anunci, setAnunci ] = useState( '' );
	// Atura les animacions del port i del mapa (WCAG 2.2.2). No es desa.
	const [ pausat, setPausat ] = useState( false );
	// Què s'ha d'enfocar després del canvi de vista: 'titol' o un dispositiu.
	const focus = useRef( null );

	const ruta = obert ? ( rutes[ obert ] ?? null ) : null;

	// Si el vaixell obert es queda sense ruta (missions que canvien), es
	// torna al port: si no, l'escena quedaria ampliada sense mapa.
	useEffect( () => {
		if ( obert && ! rutes[ obert ] ) {
			setObert( null );
		}
	}, [ obert, rutes ] );

	const obre = ( d ) => {
		setDirecte( false );
		focus.current = 'titol';
		setObert( d );
		setAnunci(
			sprintf(
				/* translators: 1: «Has obert el mapa del Pesquer», 2: missions fetes, 3: total */
				__( '%1$s: %2$d de %3$d missions fetes', 'noempesquen' ),
				vaixells()[ d ].obert,
				rutes[ d ]?.feta ?? 0,
				rutes[ d ]?.total ?? 0
			)
		);
	};

	const torna = () => {
		const d = obert;
		if ( ! d ) {
			return;
		}
		setDirecte( false );
		focus.current = d;
		setObert( null );
		setAnunci( __( 'Has tornat al port', 'noempesquen' ) );
	};

	// Node bloquejat: s'anuncia per l'aria-live (el Mapa el mostra al cartell
	// del node). Un espai dur alternat fa que es torni a anunciar el mateix.
	const repeticio = useRef( false );
	const bloquejat = ( id, motiu ) => {
		repeticio.current = ! repeticio.current;
		setAnunci( repeticio.current ? motiu : `${ motiu }\u00a0` );
	};

	useEscTanca( !! ruta, torna );

	// Amb el mapa obert, l'escena (i els seus botons) queda inerta.
	useEffect( () => {
		if ( escena.current ) {
			escena.current.inert = !! ruta;
		}
		const objectiu = focus.current;
		focus.current = null;
		if ( objectiu === 'titol' ) {
			titolMapa.current?.focus();
		} else if ( objectiu ) {
			botons[ objectiu ]?.current?.focus();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ ruta ] );

	// En tornar d'una partida, el focus va al node que s'ha jugat. Si encara
	// no hi és (missions remotes que arriben després), es reintenta quan
	// canvia la llista o el mapa obert; un cop trobat, no es torna a moure.
	const pendent = useRef( enfoca );
	useEffect( () => {
		if ( ! pendent.current ) {
			return;
		}
		const node = arrel.current?.querySelector(
			`[data-missio="${ window.CSS.escape( pendent.current ) }"]`
		);
		if ( node ) {
			node.focus();
			pendent.current = null;
		}
	}, [ missions.length, obert ] );

	const total = dispositius.reduce(
		( acc, d ) => ( {
			fetes: acc.fetes + rutes[ d ].feta,
			total: acc.total + rutes[ d ].total,
			estrelles: acc.estrelles + rutes[ d ].estrelles,
			max: acc.max + rutes[ d ].max,
		} ),
		{ fetes: 0, total: 0, estrelles: 0, max: 0 }
	);

	const classes = [
		'nep-selector',
		ruta ? 'nep-sel--mapa' : 'nep-sel--port',
		directe && 'nep-sel--directe',
		pausat && 'nep-sel--pausat',
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<section
			ref={ arrel }
			className={ classes }
			aria-labelledby="nep-selector-titol"
			tabIndex={ -1 }
		>
			<header className="nep-selector__cap">
				<a className="nep-sel-control nep-sel-surt" href={ inici }>
					<IconaSurt mida={ 20 } />
					<span className="nep-sel-control__text">
						{ __( 'Surt', 'noempesquen' ) }
					</span>
				</a>
				<div className="nep-selector__rotul">
					<h2 id="nep-selector-titol" className="nep-selector__titol">
						{ __( 'Tria una missió', 'noempesquen' ) }
					</h2>
					{ total.fetes > 0 && (
						<p className="nep-selector__resum">
							{ sprintf(
								/* translators: 1: missions fetes, 2: total de missions, 3: estrelles guanyades, 4: estrelles possibles */
								__(
									'%1$d de %2$d missions fetes · %3$d de %4$d estrelles',
									'noempesquen'
								),
								total.fetes,
								total.total,
								total.estrelles,
								total.max
							) }
						</p>
					) }
				</div>
				<div className="nep-selector__accions">
					<button
						type="button"
						className="nep-sel-control nep-sel-pausa"
						aria-pressed={ pausat }
						onClick={ () => setPausat( ( p ) => ! p ) }
					>
						{ pausat ? (
							<IconaPlay mida={ 20 } />
						) : (
							<IconaPausa mida={ 20 } />
						) }
						<span className="nep-sel-control__text">
							{ __( 'Pausa animacions', 'noempesquen' ) }
						</span>
					</button>
					{ completa.pot && (
						<button
							type="button"
							className="nep-sel-control nep-sel-completa"
							onClick={ completa.commuta }
						>
							{ completa.actiu ? (
								<IconaRedueix mida={ 20 } />
							) : (
								<IconaAmplia mida={ 20 } />
							) }
							<span className="nep-sel-control__text">
								{ completa.actiu
									? __(
											'Surt de pantalla completa',
											'noempesquen'
										)
									: __( 'Pantalla completa', 'noempesquen' ) }
							</span>
						</button>
					) }
				</div>
			</header>

			<p className="screen-reader-text" aria-live="polite">
				{ anunci }
			</p>

			<div className="nep-sel-port">
				<div ref={ escena } className="nep-sel-port__escena">
					<Escena activa={ preferit } seleccionada={ obert }>
						{ ! ruta &&
							dispositius.map( ( d ) => (
								<BotoVaixell
									key={ d }
									dispositiu={ d }
									ruta={ rutes[ d ] }
									aqui={ preferit === d }
									horitzontal={
										d === 'pc' && preferit === 'mobil'
									}
									onObre={ obre }
									refBoto={ botons[ d ] }
								/>
							) ) }
					</Escena>
				</div>
			</div>
			{ ruta && (
				<div className="nep-sel-mapa">
					<Mapa
						ruta={ ruta }
						dispositiu={ obert }
						onTria={ onTria }
						onTorna={ torna }
						onBloquejat={ bloquejat }
						titolRef={ titolMapa }
					/>
				</div>
			) }
			<div className="nep-selector__peu">{ children }</div>
		</section>
	);
}
