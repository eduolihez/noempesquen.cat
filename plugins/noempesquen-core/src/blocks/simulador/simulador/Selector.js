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
 * Props
 * - missions, progres, preferit, onTria: com sempre.
 * - enfoca:         id de la missió jugada (focus al seu node en tornar).
 * - vaixellInicial: 'pc' | 'mobil' | null. Obre directament aquest mapa.
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
import { JocContext } from './context';
import { Mapa } from './Mapa';

/* Mòbil que gira cap a horitzontal (fletxa en arc). */
const IconaGira = ( p ) => (
	<Glif { ...p }>
		<rect x="2" y="9" width="12" height="8" rx="1.5" />
		<path d="M7 4.5a7 7 0 0 1 9.5 4" />
		<path d="M16.8 5.6 16.5 8.5 13.7 7.9" />
	</Glif>
);

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
					<span className="nep-sel-barco__marques">
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
} ) {
	const arrel = useRef( null );
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
	// Què s'ha d'enfocar després del canvi de vista: 'titol' o un dispositiu.
	const focus = useRef( null );

	const ruta = obert ? rutes[ obert ] : null;

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
	// canvia la llista; un cop trobat, no es torna a moure el focus.
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
	}, [ missions.length ] );

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
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<section
			ref={ arrel }
			className={ classes }
			aria-labelledby="nep-selector-titol"
		>
			<header className="nep-selector__cap">
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
				{ ruta && (
					<div className="nep-sel-mapa">
						<Mapa
							ruta={ ruta }
							dispositiu={ obert }
							onTria={ onTria }
							onTorna={ torna }
							titolRef={ titolMapa }
						/>
					</div>
				) }
			</div>
		</section>
	);
}
