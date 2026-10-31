import {
	useEffect,
	useMemo,
	useRef,
	useState,
	useCallback,
} from '@wordpress/element';
import { creaClient } from '../../compte/client';
import { T } from './textos';
import { Acces } from './Acces';
import { Panell } from './Panell';

/**
 * Pantalla de compte: accés (alta / entrada) o panell del compte.
 *
 * @param {Object} props
 * @param {Object} props.config `{ api, ajaxUrl, urlSimulador }`.
 */
export function Compte( { config } ) {
	const client = useMemo(
		() =>
			creaClient( {
				api: config.api || '/wp-json/noempesquen/v1/',
				ajaxUrl: config.ajaxUrl || '/wp-admin/admin-ajax.php',
				fetchFn: ( ...args ) => window.fetch( ...args ),
			} ),
		[ config.api, config.ajaxUrl ]
	);
	const [ carregant, setCarregant ] = useState( true );
	const [ connectat, setConnectat ] = useState( false );
	const [ progres, setProgres ] = useState( {} );
	const [ avis, setAvis ] = useState( '' );
	const titolPanell = useRef( null );
	const titolAcces = useRef( null );
	const focusPendent = useRef( null );

	useEffect( () => {
		let viu = true;
		client.estat().then( ( e ) => {
			if ( viu ) {
				setConnectat( e.connectat );
				setProgres( e.progres || {} );
				setCarregant( false );
			}
		} );
		return () => {
			viu = false;
		};
	}, [ client ] );

	// Després d'entrar o sortir, el focus va al títol de la vista nova.
	useEffect( () => {
		if ( focusPendent.current ) {
			focusPendent.current.current?.focus();
			focusPendent.current = null;
		}
	}, [ connectat ] );

	const haEntrat = useCallback( ( dades, missatge ) => {
		focusPendent.current = titolPanell;
		setProgres( dades.progres || {} );
		setConnectat( true );
		setAvis( missatge );
	}, [] );

	const haSortit = useCallback( ( missatge ) => {
		focusPendent.current = titolAcces;
		setProgres( {} );
		setConnectat( false );
		setAvis( missatge );
	}, [] );

	return (
		<div className="nep-compte__app">
			<div className="nep-compte__avis" aria-live="polite" role="status">
				{ avis }
			</div>
			{ carregant && <p>{ T.carregant }</p> }
			{ ! carregant && ! connectat && (
				<Acces
					client={ client }
					onEntra={ haEntrat }
					refTitol={ titolAcces }
				/>
			) }
			{ ! carregant && connectat && (
				<Panell
					client={ client }
					progres={ progres }
					urlSimulador={ config.urlSimulador }
					onSurt={ haSortit }
					onAvis={ setAvis }
					refTitol={ titolPanell }
				/>
			) }
		</div>
	);
}
