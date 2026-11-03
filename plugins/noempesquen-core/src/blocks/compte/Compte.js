import {
	useEffect,
	useMemo,
	useRef,
	useState,
	useCallback,
} from '@wordpress/element';
import { creaClient } from '../../compte/client';
import { posaMarcaSessio, treuMarcaSessio } from '../../compte/marca';
import { esborraProgres } from '../simulador/nucli/progres';
import { T } from './textos';
import { Acces } from './Acces';
import { Panell } from './Panell';
import { FormRecupera, FormRestableix } from './Recupera';

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
				lang: config.lang,
			} ),
		[ config.api, config.ajaxUrl, config.lang ]
	);
	const [ carregant, setCarregant ] = useState( true );
	const [ connectat, setConnectat ] = useState( false );
	const [ progres, setProgres ] = useState( {} );
	const [ avis, setAvis ] = useState( '' );
	const titolPanell = useRef( null );
	const titolAcces = useRef( null );
	const focusPendent = useRef( null );
	const accio = config.accio || {};
	const [ verificat, setVerificat ] = useState( false );
	// El token de recuperació només viu a la memòria d'aquest component.
	const [ tokenRestableix, setTokenRestableix ] = useState(
		accio.tipus === 'restableix' ? accio.token : null
	);
	const [ obreRecupera, setObreRecupera ] = useState( false );
	const [ pestanyaEntra, setPestanyaEntra ] = useState( false );
	const verificaFeta = useRef( false );

	useEffect( () => {
		let viu = true;
		client.estat().then( async ( e ) => {
			let ok = e.verificat === true;
			if (
				accio.tipus === 'verifica' &&
				accio.token &&
				! verificaFeta.current
			) {
				verificaFeta.current = true;
				const r = await client.verifica( accio.token );
				ok = ok || r.ok;
				if ( viu ) {
					setAvis( r.ok ? T.verificat : T.errToken );
				}
			}
			if ( viu ) {
				setVerificat( ok );
				if ( e.connectat ) {
					posaMarcaSessio();
				} else {
					treuMarcaSessio();
				}
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
	}, [ connectat, tokenRestableix, obreRecupera ] );

	const haEntrat = useCallback( ( dades, missatge ) => {
		posaMarcaSessio();
		focusPendent.current = titolPanell;
		setVerificat( dades.verificat === true );
		setProgres( dades.progres || {} );
		setConnectat( true );
		setAvis( missatge );
	}, [] );

	const haSortit = useCallback( ( missatge ) => {
		treuMarcaSessio();
		// Ordinador compartit: no hi queda el progrés copiat del servidor.
		try {
			esborraProgres( window.localStorage );
		} catch {}
		focusPendent.current = titolAcces;
		setProgres( {} );
		setConnectat( false );
		setVerificat( false );
		setAvis( missatge );
	}, [] );

	// Contrasenya canviada: el servidor ha tancat totes les sessions.
	const haRestablert = useCallback(
		( missatge ) => {
			haSortit( missatge );
			setPestanyaEntra( true );
			setTokenRestableix( null );
		},
		[ haSortit ]
	);

	return (
		<div className="nep-compte__app">
			<div className="nep-compte__avis" role="status">
				{ avis }
			</div>
			{ carregant && <p>{ T.carregant }</p> }
			{ ! carregant && tokenRestableix && (
				<FormRestableix
					client={ client }
					token={ tokenRestableix }
					onFet={ haRestablert }
					onDemana={ () => {
						setObreRecupera( true );
						setTokenRestableix( null );
					} }
					refTitol={ titolAcces }
				/>
			) }
			{ ! carregant && ! tokenRestableix && obreRecupera && (
				<FormRecupera
					client={ client }
					refTitol={ titolAcces }
					onTorna={ () => {
						focusPendent.current = connectat
							? titolPanell
							: titolAcces;
						setPestanyaEntra( true );
						setObreRecupera( false );
					} }
				/>
			) }
			{ ! carregant &&
				! tokenRestableix &&
				! obreRecupera &&
				! connectat && (
					<Acces
						client={ client }
						onEntra={ haEntrat }
						refTitol={ titolAcces }
						pestanyaInicial={ pestanyaEntra ? 'entra' : 'crea' }
					/>
				) }
			{ ! carregant &&
				! tokenRestableix &&
				! obreRecupera &&
				connectat && (
					<Panell
						client={ client }
						progres={ progres }
						verificat={ verificat }
						urlSimulador={ config.urlSimulador }
						onSurt={ haSortit }
						onAvis={ setAvis }
						refTitol={ titolPanell }
					/>
				) }
		</div>
	);
}
