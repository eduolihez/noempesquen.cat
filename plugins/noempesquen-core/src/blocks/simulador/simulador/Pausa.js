import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	desaSons,
	emmagatzem,
	llegeixSons,
	EVENT_SONS,
} from './preferencies.js';
import { useJoc } from './context';

const FOCALITZABLES = 'button:not([disabled])';

/**
 * Diàleg de pausa: modal, amb el focus atrapat.
 *
 * @param {Object}   props
 * @param {Function} props.onContinua Reprèn la partida.
 * @param {Function} props.onReinicia Reinicia la missió.
 * @param {Function} props.onSurt     Surt al selector.
 */
export function Pausa( { onContinua, onReinicia, onSurt } ) {
	const { missio } = useJoc();
	const dialeg = useRef( null );
	const continua = useRef( null );
	// Es llegeix en obrir la pausa; no es desa res del jugador.
	const [ sons, setSons ] = useState( () => llegeixSons( emmagatzem() ) );

	const canviaSons = () => {
		const valor = ! sons;
		if ( desaSons( emmagatzem(), valor ) ) {
			setSons( valor );
			window.dispatchEvent( new Event( EVENT_SONS ) );
		}
	};

	useEffect( () => {
		const anterior = dialeg.current.ownerDocument.activeElement;
		continua.current?.focus();
		return () => {
			if ( anterior?.isConnected ) {
				anterior.focus();
			}
		};
	}, [] );

	const onKeyDown = ( e ) => {
		if ( e.key !== 'Tab' ) {
			return;
		}
		const botons = [ ...dialeg.current.querySelectorAll( FOCALITZABLES ) ];
		const primer = botons[ 0 ];
		const darrer = botons[ botons.length - 1 ];
		if (
			e.shiftKey &&
			dialeg.current.ownerDocument.activeElement === primer
		) {
			e.preventDefault();
			darrer.focus();
		} else if (
			! e.shiftKey &&
			dialeg.current.ownerDocument.activeElement === darrer
		) {
			e.preventDefault();
			primer.focus();
		}
	};

	// Un clic a la capa o al text no ha de treure el focus del diàleg.
	const onMouseDown = ( e ) => {
		if ( ! e.target.closest( 'button' ) ) {
			e.preventDefault();
			continua.current?.focus();
		}
	};

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div className="nep-so-pausa" onMouseDown={ onMouseDown }>
			{ /* Captura Tab per atrapar el focus dins del diàleg modal. */ }
			{ /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */ }
			<div
				ref={ dialeg }
				className="nep-so-pausa__panell"
				role="dialog"
				aria-modal="true"
				aria-labelledby="nep-so-pausa-titol"
				aria-describedby="nep-so-pausa-text"
				onKeyDown={ onKeyDown }
			>
				<h2 id="nep-so-pausa-titol" className="nep-so-pausa__titol">
					{ __( 'Pausa', 'noempesquen' ) }
				</h2>
				<p id="nep-so-pausa-text" className="nep-so-pausa__text">
					{ __(
						"El temps s'ha aturat. Quan vulguis, continuem.",
						'noempesquen'
					) }
				</p>
				<button
					type="button"
					role="switch"
					aria-checked={ sons }
					className="nep-so-pausa__so"
					onClick={ canviaSons }
				>
					<span>
						{ __( 'So de les notificacions', 'noempesquen' ) }
					</span>
					<span className="nep-so-pausa__estat" aria-hidden="true">
						{ sons
							? __( 'Sí', 'noempesquen' )
							: __( 'No', 'noempesquen' ) }
					</span>
				</button>
				<div className="nep-so-pausa__botons">
					<button
						ref={ continua }
						type="button"
						className="nep-so-boto nep-so-boto--accent"
						onClick={ onContinua }
					>
						{ __( 'Continua', 'noempesquen' ) }
					</button>
					<button
						type="button"
						className="nep-so-boto"
						onClick={ onReinicia }
					>
						{ __( 'Reinicia la missió', 'noempesquen' ) }
					</button>
					{ /* Saltar un tutorial torna al selector sense desar res. */ }
					<button
						type="button"
						className="nep-so-boto"
						onClick={ onSurt }
					>
						{ missio?.tutorial === true
							? __( 'Salta el tutorial', 'noempesquen' )
							: __( 'Surt', 'noempesquen' ) }
					</button>
				</div>
			</div>
		</div>
	);
}
