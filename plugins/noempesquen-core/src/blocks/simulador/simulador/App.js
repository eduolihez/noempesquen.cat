import {
	useState,
	useEffect,
	useCallback,
	useMemo,
	useRef,
} from '@wordpress/element';
import { combinaMissions } from '../nucli/missions';
import { seguentDe } from '../nucli/ruta';
import { __ } from '@wordpress/i18n';
import { desaProgres, llegeixProgres } from '../nucli/progres';
import { fusionaProgres } from '../nucli/sincro';
import { creaClient } from '../../../compte/client';
import { hiHaMarcaSessio, treuMarcaSessio } from '../../../compte/marca';
import {
	preparaPrevisualitzacio,
	registraResultat,
} from '../nucli/previsualitzacio';
import { construeixResultat, enviaResultat } from './estadistiques';
import { EstatCompte } from './EstatCompte';
import { progresAPujar, sincroInicial, sincronitza } from './sincro-compte';
import { Selector } from './Selector';
import { Simulador } from './Simulador';
import llissa01 from '../../../../missions/ca/llissa-01-factura.json';
import llissa02 from '../../../../missions/ca/llissa-02-banc.json';
import llissa03 from '../../../../missions/ca/llissa-03-inversio.json';
import llissa04 from '../../../../missions/ca/llissa-04-suport.json';
import llissa05 from '../../../../missions/ca/llissa-05-actualitzacio.json';
import mon from '../../../../missions/ca/mon.json';
import remei01 from '../../../../missions/ca/remei-01-paquet.json';
import remei02 from '../../../../missions/ca/remei-02-canviat.json';
import remei03 from '../../../../missions/ca/remei-03-sorteig.json';
import remei04 from '../../../../missions/ca/remei-04-codi.json';
import remei05 from '../../../../missions/ca/remei-05-comprador.json';
import tutorialMobil from '../../../../missions/ca/tutorial-mobil.json';
import tutorialPc from '../../../../missions/ca/tutorial-pc.json';

const INCLOSES = [
	tutorialPc,
	tutorialMobil,
	llissa01,
	llissa02,
	llissa03,
	llissa04,
	llissa05,
	remei01,
	remei02,
	remei03,
	remei04,
	remei05,
];
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

/**
 * Compte del jugador (si n'hi ha): fusiona el progrés en muntar i el desa en
 * acabar cada missió. Sense sessió o sense xarxa, tot queda en local.
 *
 * Sense la marca `nep-compte-sessio` (posada en entrar a /compte/) no es fa
 * cap petició de compte, ni tan sols la del nonce.
 *
 * @param {Object}                config           Configuració del bloc.
 * @param {Object}                desat            Estat de l'App.
 * @param {{current: Object}}     desat.progresRef Progrés vigent (ref compartida amb l'App).
 * @param {(nou: Object) => void} desat.setProgres Setter del progrés.
 * @return {Object} `{ connectat, puja }`: estat (`null` pendent) i pujada.
 */
function useCompte( config, { progresRef, setProgres } ) {
	const { api, compte, previsualitza } = config;
	const [ ambMarca ] = useState( () => hiHaMarcaSessio() );
	const actiu = !! compte && ! previsualitza && ambMarca;
	// Un sol client per muntatge: el nonce viu només en aquesta instància.
	const client = useMemo(
		() =>
			actiu
				? creaClient( {
						api: api || '/wp-json/noempesquen/v1/',
						ajaxUrl: compte.ajaxUrl || '/wp-admin/admin-ajax.php',
						fetchFn: ( ...args ) => window.fetch( ...args ),
					} )
				: null,
		[ actiu, api, compte?.ajaxUrl ]
	);
	const [ connectat, setConnectat ] = useState( actiu ? null : false );
	const connectatRef = useRef( false );

	// Aplica el que torna el servidor sense trepitjar progrés més nou. La ref
	// s'actualitza al moment perquè un `onAcaba` immediat parteixi d'aquí.
	const aplica = useCallback(
		( servidor ) => {
			const nou = fusionaProgres( progresRef.current, servidor );
			progresRef.current = nou;
			desaProgres( emmagatzematge(), nou );
			setProgres( ( p ) => fusionaProgres( p, nou ) );
		},
		[ progresRef, setProgres ]
	);

	useEffect( () => {
		if ( ! client ) {
			return;
		}
		let viu = true;
		sincroInicial( { client, progresLocal: progresRef.current } ).then(
			async ( r ) => {
				if ( ! viu ) {
					return;
				}
				connectatRef.current = r.connectat;
				setConnectat( r.connectat );
				if ( ! r.connectat ) {
					treuMarcaSessio();
					return;
				}
				// Inclou el que s'hagi acabat mentre s'esperava `estat()`.
				const pendent = progresAPujar( {
					sincro: r,
					vigent: progresRef.current,
				} );
				aplica( r.progres );
				if ( pendent ) {
					const servidor = await sincronitza( {
						client,
						progres: pendent,
					} );
					if ( viu && servidor ) {
						aplica( servidor );
					}
				}
			}
		);
		return () => {
			viu = false;
		};
	}, [ client, aplica, progresRef ] );

	const puja = useCallback(
		async ( nou ) => {
			if ( ! client || ! connectatRef.current ) {
				return;
			}
			const servidor = await sincronitza( { client, progres: nou } );
			if ( servidor ) {
				aplica( servidor );
			}
		},
		[ client, aplica ]
	);

	return { connectat, puja };
}

const llegeix = ( url, opcions ) =>
	fetch( url, opcions ).then( ( r ) => ( r.ok ? r.json() : null ) );

/**
 * Guió en previsualització (també esborrany) per a qui el gestiona.
 *
 * @param {string} api           Arrel de l'API.
 * @param {number} previsualitza Id de l'entrada.
 * @param {string} nonce         Nonce REST.
 * @return {Promise<?Object>} Guió rebut (sense validar) o null.
 */
function previsualitzacio( api, previsualitza, nonce ) {
	return llegeix( `${ api }previsualitza/${ previsualitza }`, {
		headers: { 'X-WP-Nonce': nonce },
		credentials: 'same-origin',
	} ).then( ( r ) => r?.guio ?? null );
}

/**
 * Missions incloses + remotes + (si n'hi ha) la de prova, al final i amb id
 * propi: no substitueix cap missió real. `fallaPrevi` avisa el gestor si la
 * de prova no s'ha pogut carregar o no és vàlida.
 *
 * @param {Object} config               Configuració del bloc.
 * @param {string} config.api           Arrel de l'API.
 * @param {number} config.previsualitza Id de l'entrada en prova (opcional).
 * @param {string} config.nonce         Nonce REST (opcional).
 * @return {{missions: Array, fallaPrevi: boolean}} Missions i estat de la prova.
 */
function useMissions( { api, previsualitza, nonce } ) {
	const [ missions, setMissions ] = useState( INCLOSES );
	const [ fallaPrevi, setFallaPrevi ] = useState( false );
	useEffect( () => {
		if ( ! api ) {
			return;
		}
		const ambPrevi = !! ( previsualitza && nonce );
		Promise.allSettled( [
			llegeix( `${ api }missions` ),
			ambPrevi ? previsualitzacio( api, previsualitza, nonce ) : null,
		] ).then( ( [ remotes, previ ] ) => {
			const guions = Array.isArray( remotes.value )
				? remotes.value.map( ( r ) => r?.guio )
				: [];
			const combinades = combinaMissions( INCLOSES, guions, mon );
			const prova = ambPrevi
				? preparaPrevisualitzacio( previ.value, mon )
				: null;
			// `<id>--prova` no compleix el patró d'id: mai coincideix amb una real.
			setFallaPrevi( ambPrevi && ! prova );
			setMissions( prova ? [ ...combinades, prova ] : combinades );
		} );
	}, [ api, previsualitza, nonce ] );
	return { missions, fallaPrevi };
}

export function App( { config } ) {
	const { missions, fallaPrevi } = useMissions( config );
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
	const progresActual = useRef( progres );
	progresActual.current = progres;
	const { connectat, puja } = useCompte( config, {
		progresRef: progresActual,
		setProgres,
	} );
	const jugada = useRef( null );
	const darreres = useRef( missions );
	darreres.current = missions;

	const missio = missions.find( ( m ) => m.id === actual ) ?? null;
	// La següent de la ruta del mateix vaixell si ja és jugable amb el progrés
	// actual; a l'última o si encara és bloquejada, tornar al mapa.
	const seguentId = missio ? seguentDe( missions, missio.id, progres ) : null;
	// Vaixell de la darrera missió jugada: el selector hi torna obert.
	const vaixellJugat =
		missions.find( ( m ) => m.id === jugada.current )?.dispositiu ?? null;

	// Una previsualització no desa progrés ni envia estadístiques.
	const { api } = config;
	const onAcaba = useCallback(
		( id, estrelles, estat ) => {
			const acabada = darreres.current.find( ( m ) => m.id === id );
			const abans = progresActual.current;
			const nou = registraResultat(
				emmagatzematge(),
				abans,
				acabada,
				estrelles
			);
			progresActual.current = nou;
			setProgres( nou );
			enviaResultat(
				api,
				construeixResultat( acabada, estat, { estrelles } )
			);
			// Una previsualització no canvia el progrés: no hi ha res a pujar.
			if ( nou !== abans ) {
				puja( nou );
			}
		},
		[ api, puja ]
	);

	const tria = ( id ) => {
		jugada.current = id;
		setActual( id );
		setPartida( ( n ) => n + 1 );
	};

	if ( ! missio ) {
		// L'avís de prova i l'estat del compte van a la barra inferior del
		// selector: és a pantalla completa i taparia res que quedés fora.
		return (
			<Selector
				// `vaixellInicial` només es llegeix en muntar: si canvia
				// (missions remotes que arriben tard), es torna a muntar.
				key={ vaixellJugat ?? 'port' }
				missions={ missions }
				progres={ progres }
				preferit={ preferit }
				onTria={ tria }
				enfoca={ jugada.current }
				vaixellInicial={ vaixellJugat }
				inici={ config.inici || '/' }
			>
				{ !! config.previsualitza && (
					<p className="nep-sim-avis" role="status">
						{ fallaPrevi
							? __(
									"No s'ha pogut carregar el guió de prova",
									'noempesquen'
								)
							: '' }
					</p>
				) }
				{ ! config.previsualitza && !! config.compte && (
					<EstatCompte
						connectat={ connectat }
						url={ config.compte.url || '' }
					/>
				) }
			</Selector>
		);
	}

	return (
		<Simulador
			key={ `${ missio.id }-${ partida }` }
			missio={ missio }
			mon={ mon }
			onSurt={ () => setActual( null ) }
			onAcaba={ onAcaba }
			api={ config.api }
			seguent={ seguentId ? () => tria( seguentId ) : null }
		/>
	);
}
