import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import { combinaMissions } from '../nucli/missions';
import { __ } from '@wordpress/i18n';
import { llegeixProgres } from '../nucli/progres';
import {
	preparaPrevisualitzacio,
	registraResultat,
} from '../nucli/previsualitzacio';
import { construeixResultat, enviaResultat } from './estadistiques';
import { Selector } from './Selector';
import { Simulador } from './Simulador';
import llissa01 from '../../../../missions/llissa-01-factura.json';
import llissa02 from '../../../../missions/llissa-02-banc.json';
import llissa03 from '../../../../missions/llissa-03-inversio.json';
import llissa04 from '../../../../missions/llissa-04-suport.json';
import llissa05 from '../../../../missions/llissa-05-actualitzacio.json';
import mon from '../../../../missions/mon.json';
import remei01 from '../../../../missions/remei-01-paquet.json';
import remei02 from '../../../../missions/remei-02-canviat.json';
import remei03 from '../../../../missions/remei-03-sorteig.json';
import remei04 from '../../../../missions/remei-04-codi.json';
import remei05 from '../../../../missions/remei-05-comprador.json';

const INCLOSES = [
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
	const jugada = useRef( null );
	const darreres = useRef( missions );
	darreres.current = missions;

	const missio = missions.find( ( m ) => m.id === actual ) ?? null;
	const index = missio ? missions.indexOf( missio ) : -1;
	const seguentMissio = index >= 0 ? missions[ index + 1 ] : null;

	// Una previsualització no desa progrés ni envia estadístiques.
	const { api } = config;
	const onAcaba = useCallback(
		( id, estrelles, estat ) => {
			const acabada = darreres.current.find( ( m ) => m.id === id );
			setProgres( ( p ) =>
				registraResultat( emmagatzematge(), p, acabada, estrelles )
			);
			enviaResultat(
				api,
				construeixResultat( acabada, estat, { estrelles } )
			);
		},
		[ api ]
	);

	const tria = ( id ) => {
		jugada.current = id;
		setActual( id );
		setPartida( ( n ) => n + 1 );
	};

	if ( ! missio ) {
		return (
			<>
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
				<Selector
					missions={ missions }
					progres={ progres }
					preferit={ preferit }
					onTria={ tria }
					enfoca={ jugada.current }
				/>
			</>
		);
	}

	return (
		<Simulador
			key={ `${ missio.id }-${ partida }` }
			missio={ missio }
			mon={ mon }
			onSurt={ () => setActual( null ) }
			onAcaba={ onAcaba }
			seguent={ seguentMissio ? () => tria( seguentMissio.id ) : null }
		/>
	);
}
