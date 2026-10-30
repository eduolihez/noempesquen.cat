import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import { combinaMissions } from '../nucli/missions';
import { llegeixProgres, desaProgres } from '../nucli/progres';
import { Selector } from './Selector';
import { Simulador } from './Simulador';
import llissa01 from '../../../../missions/llissa-01-factura.json';
import llissa02 from '../../../../missions/llissa-02-banc.json';
import mon from '../../../../missions/mon.json';
import remei01 from '../../../../missions/remei-01-paquet.json';
import remei02 from '../../../../missions/remei-02-canviat.json';

const INCLOSES = [ llissa01, llissa02, remei01, remei02 ];
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
						( remotes || [] ).map( ( r ) => r.guio ),
						mon
					)
				);
			} )
			.catch( () => {} );
	}, [ api ] );
	return missions;
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
