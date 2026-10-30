import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

function IconaGira() {
	return (
		<svg
			className="nep-so-girar__icona"
			viewBox="0 0 64 64"
			width="64"
			height="64"
			aria-hidden="true"
			focusable="false"
		>
			<rect
				x="22"
				y="8"
				width="20"
				height="34"
				rx="3"
				fill="none"
				stroke="currentColor"
				strokeWidth="3"
			/>
			<rect
				x="14"
				y="36"
				width="36"
				height="20"
				rx="3"
				fill="currentColor"
				opacity="0.25"
			/>
			<rect
				x="14"
				y="36"
				width="36"
				height="20"
				rx="3"
				fill="none"
				stroke="currentColor"
				strokeWidth="3"
			/>
			<path
				d="M50 14a12 12 0 0 1 4 16"
				fill="none"
				stroke="currentColor"
				strokeWidth="3"
				strokeLinecap="round"
			/>
			<path
				d="M48 28l6 3 2-7"
				fill="none"
				stroke="currentColor"
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

/**
 * Petició de girar el mòbil (o ampliar la finestra) quan el PC simulat no hi
 * cap. La partida queda aturada al darrere fins que torna a cabre.
 *
 * @param {Object}   props
 * @param {boolean}  props.mobil  Dispositiu tàctil (mòbil o tauleta).
 * @param {boolean}  props.pausa  La pausa real és oberta a sobre.
 * @param {Function} props.onSurt Torna al selector.
 */
export function PeticioGirar( { mobil, pausa, onSurt } ) {
	const boto = useRef( null );
	const tactil = mobil;

	// Focus al botó en aparèixer i en tancar-se la pausa de sobre.
	useEffect( () => {
		if ( ! pausa ) {
			boto.current?.focus();
		}
	}, [ pausa ] );

	// Opcional: només funciona en pantalla completa i en alguns mòbils. No
	// es desbloqueja en desmuntar (tornaria a vertical): ho fa Pantalla en
	// sortir del simulador.
	useEffect( () => {
		if ( ! tactil ) {
			return;
		}
		try {
			window.screen?.orientation
				?.lock?.( 'landscape' )
				?.catch?.( () => {} );
		} catch {
			// Sense bloqueig d'orientació: el missatge ja ho explica.
		}
	}, [ tactil ] );

	return (
		<div
			className="nep-so-girar"
			role="alertdialog"
			aria-modal="true"
			aria-labelledby="nep-so-girar-titol"
			aria-describedby="nep-so-girar-text"
		>
			<div className="nep-so-girar__panell">
				<IconaGira />
				<h2 id="nep-so-girar-titol" className="nep-so-girar__titol">
					{ tactil
						? __( 'Gira el mòbil', 'noempesquen' )
						: __( 'Amplia la finestra', 'noempesquen' ) }
				</h2>
				<p id="nep-so-girar-text" className="nep-so-girar__text">
					{ tactil
						? __(
								'Aquesta missió passa en un ordinador i necessita la pantalla en horitzontal. La partida és en pausa: continuarà on l’has deixada.',
								'noempesquen'
							)
						: __(
								'Aquesta missió passa en un ordinador i necessita una finestra més ampla. La partida és en pausa: continuarà on l’has deixada.',
								'noempesquen'
							) }
				</p>
				<button
					ref={ boto }
					type="button"
					className="nep-so-girar__surt"
					onClick={ onSurt }
				>
					{ __( 'Torna al selector', 'noempesquen' ) }
				</button>
			</div>
		</div>
	);
}
