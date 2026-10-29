import { useEffect, useId, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';

/**
 * Diàleg de confirmació «Denuncia pesca (phishing)», modal dins de Posta.
 * Esc el tanca abans que la pausa (registraMenu); Tab hi queda dins.
 *
 * @param {Object}   props
 * @param {Object}   props.correu     Correu que es denuncia.
 * @param {Function} props.onDenuncia Confirma.
 * @param {Function} props.onCancella Tanca sense fer res.
 */
export function Denuncia( { correu, onDenuncia, onCancella } ) {
	const { registraMenu } = useJoc();
	const caixa = useRef( null );
	const cancella = useRef( onCancella );
	cancella.current = onCancella;
	const idTitol = useId();
	const idText = useId();

	useEffect( () => {
		caixa.current?.querySelector( '[data-focus-inicial]' )?.focus();
		return registraMenu( () => cancella.current() );
	}, [ registraMenu ] );

	const atrapa = ( e ) => {
		if ( e.key !== 'Tab' ) {
			return;
		}
		const botons = [ ...caixa.current.querySelectorAll( 'button' ) ];
		const primer = botons[ 0 ];
		const darrer = botons[ botons.length - 1 ];
		const actiu = caixa.current.ownerDocument.activeElement;
		if ( e.shiftKey && actiu === primer ) {
			e.preventDefault();
			darrer.focus();
		} else if ( ! e.shiftKey && actiu === darrer ) {
			e.preventDefault();
			primer.focus();
		}
	};

	return (
		<div className="nep-posta-dialeg">
			{ /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */ }
			<div
				ref={ caixa }
				className="nep-posta-dialeg__caixa"
				role="alertdialog"
				aria-modal="true"
				aria-labelledby={ idTitol }
				aria-describedby={ idText }
				onKeyDown={ atrapa }
			>
				<h2 id={ idTitol } className="nep-posta-dialeg__titol">
					{ __( 'Denuncia pesca (phishing)', 'noempesquen' ) }
				</h2>
				<p id={ idText } className="nep-posta-dialeg__text">
					{ sprintf(
						/* translators: %s: adreça del remitent */
						__(
							"Posta mourà aquest missatge a Brossa i n'enviarà una còpia a l'equip de seguretat perquè pugui frenar els que arribin de %s.",
							'noempesquen'
						),
						correu.remitent?.adreca ?? ''
					) }
				</p>
				<div className="nep-posta-dialeg__botons">
					<button
						type="button"
						className="nep-posta-boto"
						data-focus-inicial
						onClick={ onCancella }
					>
						{ __( 'Cancel·la', 'noempesquen' ) }
					</button>
					<button
						type="button"
						className="nep-posta-boto nep-posta-boto--principal"
						onClick={ onDenuncia }
					>
						{ __( 'Denuncia', 'noempesquen' ) }
					</button>
				</div>
			</div>
		</div>
	);
}
