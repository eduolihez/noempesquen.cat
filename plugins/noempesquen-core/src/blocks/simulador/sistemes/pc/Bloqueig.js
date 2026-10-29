import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { IconaBateria, IconaWifi } from '../../ui/icones';
import { DATA_LLARGA } from './calendari';
import { Fons } from './Fons';
import { menysMoviment } from './moviment';

/* Tecles que no desbloquegen: Esc és la pausa; Tab només mou el focus. */
const IGNORADES = new Set( [
	'Escape',
	'Tab',
	'Shift',
	'Control',
	'Alt',
	'Meta',
] );

/**
 * Pantalla de bloqueig. Qualsevol clic o tecla desbloqueja; mentre
 * `sortint`, puja amb una animació i avisa amb onFi en acabar.
 *
 * @param {Object}   props
 * @param {boolean}  props.sortint Ja s'ha desbloquejat i s'està amagant.
 * @param {Function} props.onFi    L'animació de sortida ha acabat.
 */
export function Bloqueig( { sortint, onFi } ) {
	const { hora, dispatch, estat, mon } = useJoc();
	const boto = useRef( null );
	const nom = mon?.jugador?.nom ?? 'Àlex Puig';
	const pausa = estat.pausa;

	useEffect( () => {
		boto.current?.focus();
	}, [] );

	useEffect( () => {
		if ( sortint && menysMoviment() ) {
			onFi();
		}
	}, [ sortint, onFi ] );

	useEffect( () => {
		if ( sortint || pausa ) {
			return undefined;
		}
		const onKeyDown = ( e ) => {
			if (
				IGNORADES.has( e.key ) ||
				e.ctrlKey ||
				e.metaKey ||
				e.altKey
			) {
				return;
			}
			e.preventDefault();
			dispatch( { tipus: 'DESBLOQUEJA' } );
		};
		document.addEventListener( 'keydown', onKeyDown );
		return () => document.removeEventListener( 'keydown', onKeyDown );
	}, [ sortint, pausa, dispatch ] );

	const desbloqueja = () => {
		if ( ! sortint ) {
			dispatch( { tipus: 'DESBLOQUEJA' } );
		}
	};

	return (
		// Les tecles es capturen a document (qualsevol tecla desbloqueja);
		// el botó de dins és l'entrada accessible.
		// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
		<div
			className={ `nep-so-bloqueig${ sortint ? ' is-sortint' : '' }` }
			onClick={ desbloqueja }
			onAnimationEnd={ ( e ) => {
				if ( e.target === e.currentTarget ) {
					onFi();
				}
			} }
			inert={ sortint ? '' : undefined }
		>
			<div className="nep-so-bloqueig__fons">
				<Fons />
			</div>
			<div className="nep-so-bloqueig__rellotge">
				<p className="nep-so-bloqueig__hora">{ hora }</p>
				<p className="nep-so-bloqueig__data">{ DATA_LLARGA }</p>
			</div>
			<div className="nep-so-bloqueig__usuari">
				<span
					className="nep-so-avatar nep-so-avatar--gran"
					aria-hidden="true"
				>
					{ nom.charAt( 0 ) }
				</span>
				<p className="nep-so-bloqueig__nom">{ nom }</p>
				<button
					ref={ boto }
					type="button"
					className="nep-so-bloqueig__entra"
				>
					{ __( 'Clica o prem una tecla per entrar', 'noempesquen' ) }
				</button>
			</div>
			<div className="nep-so-bloqueig__estat" aria-hidden="true">
				<IconaWifi mida={ 18 } />
				<IconaBateria mida={ 18 } />
			</div>
		</div>
	);
}
