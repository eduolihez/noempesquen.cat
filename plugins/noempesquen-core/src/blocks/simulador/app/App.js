import {
	useState,
	useEffect,
	useReducer,
	useCallback,
	useMemo,
	useRef,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { FASE, estatInicial, reductor, puntuacio } from './motor';
import { combinaMissions } from '../nucli/missions';
import { llegeixProgres, desaProgres } from '../nucli/progres';
import { PERSONATGES } from './avatars';
import { Escriptori } from './Escriptori';
import { Mobil } from './Mobil';
import { Bombolla, Decisio, Consequencia, Resultat } from './Pantalles';
import { Simulador } from '../simulador/Simulador';
import llissa01 from '../../../../missions/llissa-01-factura.json';
import mon from '../../../../missions/mon.json';
import remei01 from '../../../../missions/remei-01-paquet.json';

const INCLOSES = [ llissa01, remei01 ];
function emmagatzematge() {
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

function useEsMobil() {
	const query = '(max-width: 767px)';
	const [ esMobil, setEsMobil ] = useState(
		() => window.matchMedia( query ).matches
	);
	useEffect( () => {
		const mq = window.matchMedia( query );
		const onChange = ( e ) => setEsMobil( e.matches );
		mq.addEventListener( 'change', onChange );
		return () => mq.removeEventListener( 'change', onChange );
	}, [] );
	return esMobil;
}

function useMissions( api ) {
	const [ missions, setMissions ] = useState( INCLOSES );
	useEffect( () => {
		if ( ! api ) {
			return;
		}
		fetch( `${ api }missions` )
			.then( ( r ) => ( r.ok ? r.json() : [] ) )
			.then( ( remotes ) => {
				setMissions(
					combinaMissions(
						INCLOSES,
						( remotes || [] ).map( ( r ) => r.guio )
					)
				);
			} )
			.catch( () => {} );
	}, [ api ] );
	return missions;
}

function Joc( { missio, onTorna, onAcaba, seguent } ) {
	const [ estat, dispatch ] = useReducer(
		( e, a ) => reductor( missio, e, a ),
		missio,
		estatInicial
	);

	useEffect( () => {
		if ( estat.fase === FASE.RESULTAT ) {
			onAcaba( missio.id, puntuacio( missio, estat ).estrelles );
		}
	}, [ estat.fase ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const ctx = {
		lupa: estat.lupa,
		trobats: estat.trobats,
		onInspecciona: ( senyal ) =>
			dispatch( { tipus: 'INSPECCIONA', senyal } ),
		onPica: () => dispatch( { tipus: 'PICA' } ),
	};

	if ( estat.fase === FASE.RESULTAT ) {
		return (
			<Resultat
				missio={ missio }
				estat={ estat }
				dispatch={ dispatch }
				onTorna={ onTorna }
				seguent={ seguent }
			/>
		);
	}

	const Dispositiu = missio.dispositiu === 'mobil' ? Mobil : Escriptori;

	return (
		<div
			className={ `nep-joc nep-joc--${ missio.dispositiu }${ estat.lupa ? ' is-lupa' : '' }` }
		>
			<div className="nep-joc__capcalera">
				<button
					type="button"
					className="nep-boto nep-boto--link"
					onClick={ onTorna }
				>
					{ __( '← Missions', 'noempesquen' ) }
				</button>
				<h2 className="nep-joc__titol">{ missio.titol }</h2>
			</div>
			<Dispositiu
				missio={ missio }
				estat={ estat }
				dispatch={ dispatch }
				ctx={ ctx }
			>
				<Bombolla
					missio={ missio }
					estat={ estat }
					dispatch={ dispatch }
				/>
			</Dispositiu>
			{ estat.fase === FASE.DECIDEIX && (
				<Decisio missio={ missio } dispatch={ dispatch } />
			) }
			{ estat.fase === FASE.CONSEQUENCIA && (
				<Consequencia
					missio={ missio }
					estat={ estat }
					dispatch={ dispatch }
				/>
			) }
		</div>
	);
}

function Selector( { missions, progres, preferit, onTria, enfoca } ) {
	const llista = useRef( null );
	const ordenades = useMemo(
		() =>
			[ ...missions ].sort(
				( a, b ) =>
					( a.dispositiu === preferit ? -1 : 0 ) -
					( b.dispositiu === preferit ? -1 : 0 )
			),
		[ missions, preferit ]
	);

	// En tornar d'una partida, el focus va a la targeta que s'ha jugat.
	useEffect( () => {
		if ( enfoca ) {
			llista.current
				?.querySelector(
					`[data-missio="${ window.CSS.escape( enfoca ) }"]`
				)
				?.focus();
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<section className="nep-selector" aria-labelledby="nep-selector-titol">
			<h2 id="nep-selector-titol">
				{ __( 'Tria una missió', 'noempesquen' ) }
			</h2>
			<ul ref={ llista } className="nep-targetes">
				{ ordenades.map( ( m ) => {
					const { nom, Avatar } =
						PERSONATGES[ m.personatge ] ?? PERSONATGES.llissa;
					const estrelles = progres[ m.id ] ?? 0;
					return (
						<li key={ m.id }>
							<button
								type="button"
								className={ `nep-targeta nep-targeta--${ m.personatge }` }
								data-missio={ m.id }
								onClick={ () => onTria( m.id ) }
							>
								<span className="nep-targeta__avatar">
									<Avatar mida={ 64 } />
								</span>
								<span className="nep-targeta__cos">
									<span className="nep-targeta__meta">
										{ m.dispositiu === 'mobil'
											? __( 'Mòbil', 'noempesquen' )
											: __( 'Ordinador', 'noempesquen' ) }
										{ ' · ' }
										{ sprintf(
											/* translators: %d: minuts */
											__( '%d min', 'noempesquen' ),
											m.durada_minuts
										) }
										{ ' · ' }
										{ nom }
									</span>
									<strong className="nep-targeta__titol">
										{ m.titol }
									</strong>
									<span className="nep-targeta__resum">
										{ m.resum }
									</span>
									<span
										className="nep-targeta__estrelles"
										aria-label={
											estrelles
												? sprintf(
														/* translators: %d: estrelles */
														__(
															'Millor resultat: %d de 3 estrelles',
															'noempesquen'
														),
														estrelles
													)
												: __(
														"Encara no l'has jugada",
														'noempesquen'
													)
										}
									>
										{ estrelles
											? '★'.repeat( estrelles ) +
												'☆'.repeat( 3 - estrelles )
											: '☆☆☆' }
									</span>
								</span>
							</button>
						</li>
					);
				} ) }
			</ul>
		</section>
	);
}

export function App( { config } ) {
	const missions = useMissions( config.api );
	const esMobil = useEsMobil();
	let preferit = esMobil ? 'mobil' : 'pc';
	if ( config.dispositiu === 'pc' || config.dispositiu === 'mobil' ) {
		preferit = config.dispositiu;
	}
	const [ actual, setActual ] = useState( null );
	const [ progres, setProgres ] = useState( () =>
		llegeixProgres( emmagatzematge() )
	);
	const [ partida, setPartida ] = useState( 0 );
	const jugada = useRef( null );

	const missio = missions.find( ( m ) => m.id === actual ) ?? null;
	const index = missio ? missions.indexOf( missio ) : -1;
	const seguentMissio = index >= 0 ? missions[ index + 1 ] : null;

	const onAcaba = useCallback( ( id, estrelles ) => {
		setProgres( ( p ) => {
			const nou = { ...p, [ id ]: Math.max( p[ id ] ?? 0, estrelles ) };
			desaProgres( emmagatzematge(), nou );
			return nou;
		} );
	}, [] );

	const tria = ( id ) => {
		jugada.current = id;
		setActual( id );
		setPartida( ( n ) => n + 1 );
	};

	if ( ! missio ) {
		return (
			<Selector
				missions={ missions }
				progres={ progres }
				preferit={ preferit }
				onTria={ tria }
				enfoca={ jugada.current }
			/>
		);
	}

	if ( missio.versio === 2 ) {
		return (
			<Simulador
				key={ `${ missio.id }-${ partida }` }
				missio={ missio }
				mon={ mon }
				onSurt={ () => setActual( null ) }
				onAcaba={ onAcaba }
				seguent={
					seguentMissio ? () => tria( seguentMissio.id ) : null
				}
			/>
		);
	}

	return (
		<Joc
			key={ `${ missio.id }-${ partida }` }
			missio={ missio }
			onTorna={ () => setActual( null ) }
			onAcaba={ onAcaba }
			seguent={ seguentMissio ? () => tria( seguentMissio.id ) : null }
		/>
	);
}
