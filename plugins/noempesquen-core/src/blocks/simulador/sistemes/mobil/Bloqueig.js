import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { IconaParla } from '../../ui/icones';
import { DATA_LLARGA } from '../pc/calendari';
import { menysMoviment } from '../pc/moviment';
import { teclaDesbloqueig } from '../pc/tecles';
import { BarraEstat } from './BarraEstat';

/* Píxels de lliscament cap amunt per desbloquejar. */
const LLISCA = 40;

/**
 * Pantalla de bloqueig del mòbil: hora, data, fons i la primera
 * notificació del guia. Desbloqueja un clic, una tecla o lliscar cap amunt;
 * tocar la notificació desbloqueja i obre Parla. Mentre `sortint`, puja
 * amb una animació i avisa amb onFi en acabar.
 *
 * @param {Object}   props
 * @param {boolean}  props.sortint    Ja s'ha desbloquejat i s'està amagant.
 * @param {Function} props.onFi       L'animació de sortida ha acabat.
 * @param {Function} props.onObreGuia Desbloqueja des de la notificació del guia.
 */
export function Bloqueig( { sortint, onFi, onObreGuia } ) {
	const { hora, dispatch, estat, missio, nomGuia, Avatar } = useJoc();
	const boto = useRef( null );
	const inici = useRef( null );
	const pausa = estat.pausa;
	const avis = missio.intro?.[ 0 ];

	useEffect( () => {
		boto.current?.focus();
	}, [] );

	useEffect( () => {
		if ( ! sortint ) {
			return undefined;
		}
		if ( menysMoviment() ) {
			onFi();
			return undefined;
		}
		// Reserva si `animationend` no arriba (animació 0,35 s + marge).
		const t = setTimeout( onFi, 700 );
		return () => clearTimeout( t );
	}, [ sortint, onFi ] );

	useEffect( () => {
		if ( sortint || pausa ) {
			return undefined;
		}
		const onKeyDown = ( e ) => {
			const accio = teclaDesbloqueig( e );
			if ( ! accio ) {
				return;
			}
			// Retorn o espai sobre la notificació: l'obre (ho fa el botó).
			if ( e.target?.closest?.( '.nep-so-m-bloqueig__avis' ) ) {
				return;
			}
			if ( accio === 'consumeix' ) {
				e.preventDefault();
			}
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
			className={ `nep-so-m-bloqueig${ sortint ? ' is-sortint' : '' }` }
			onClick={ desbloqueja }
			onPointerDown={ ( e ) => {
				inici.current = e.clientY;
			} }
			onPointerUp={ ( e ) => {
				if (
					inici.current !== null &&
					inici.current - e.clientY > LLISCA
				) {
					desbloqueja();
				}
				inici.current = null;
			} }
			onAnimationEnd={ ( e ) => {
				if ( e.target === e.currentTarget ) {
					onFi();
				}
			} }
			inert={ sortint ? '' : undefined }
		>
			<BarraEstat hora={ hora } decorativa />
			<div className="nep-so-m-bloqueig__rellotge">
				<p className="nep-so-m-bloqueig__hora">{ hora }</p>
				<p className="nep-so-m-bloqueig__data">{ DATA_LLARGA }</p>
			</div>
			{ avis && (
				<button
					type="button"
					className="nep-so-m-bloqueig__avis nep-so-m-notif"
					onClick={ ( e ) => {
						e.stopPropagation();
						if ( ! sortint ) {
							onObreGuia();
						}
					} }
				>
					<span className="nep-so-m-notif__cap">
						<IconaParla mida={ 14 } />
						<span>{ __( 'Parla', 'noempesquen' ) }</span>
						<span className="nep-so-m-notif__ara">
							{ __( 'ara', 'noempesquen' ) }
						</span>
					</span>
					<span className="nep-so-m-notif__fila">
						<span
							className="nep-so-m-notif__imatge"
							aria-hidden="true"
						>
							<Avatar mida={ 40 } />
						</span>
						<span className="nep-so-m-notif__text">
							<strong className="nep-so-m-notif__titol">
								{ nomGuia }
							</strong>
							<span className="nep-so-m-notif__missatge">
								{ avis }
							</span>
						</span>
					</span>
				</button>
			) }
			<button
				ref={ boto }
				type="button"
				className="nep-so-m-bloqueig__entra"
				onClick={ ( e ) => {
					e.stopPropagation();
					desbloqueja();
				} }
			>
				<span className="nep-so-m-bloqueig__ansa" aria-hidden="true" />
				{ __(
					'Llisca cap amunt, toca o prem una tecla per entrar',
					'noempesquen'
				) }
			</button>
		</div>
	);
}
