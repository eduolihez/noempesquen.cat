import { useEffect, useId, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { Ilustracio } from '../../ui/ilustracions';
import { IconaAnterior, IconaSeguent, IconaTanca } from './icones';

/**
 * Visor de fotos: overlay dins de l'app amb la foto gran. Esc el tanca abans
 * que la pausa (registraMenu); les fletxes canvien de foto; Tab no en surt.
 *
 * @param {Object}  props
 * @param {Object}  props.foto     Foto mostrada `{ id, titol, data, il }`.
 * @param {string}  props.etiqueta Data llegible de la foto.
 * @param {boolean} props.hiHaAnt  Hi ha foto anterior.
 * @param {boolean} props.hiHaSeg  Hi ha foto següent.
 * @param {Object}  props.onCanvia `( delta )` canvia de foto.
 * @param {Object}  props.onTanca  Tanca el visor.
 */
export function Visor( {
	foto,
	etiqueta,
	hiHaAnt,
	hiHaSeg,
	onCanvia,
	onTanca,
} ) {
	const { registraMenu } = useJoc();
	const panell = useRef( null );
	const tanca = useRef( onTanca );
	tanca.current = onTanca;
	const idTitol = useId();

	useEffect( () => {
		panell.current.querySelector( '[data-focus-inicial]' )?.focus();
		return registraMenu( () => tanca.current() );
	}, [ registraMenu ] );

	const teclat = ( e ) => {
		if ( e.key === 'ArrowLeft' ) {
			e.preventDefault();
			if ( hiHaAnt ) {
				onCanvia( -1 );
			}
		} else if ( e.key === 'ArrowRight' ) {
			e.preventDefault();
			if ( hiHaSeg ) {
				onCanvia( 1 );
			}
		} else if ( e.key === 'Tab' ) {
			const focusables = [
				...panell.current.querySelectorAll( 'button' ),
			];
			const primer = focusables[ 0 ];
			const darrer = focusables[ focusables.length - 1 ];
			const actiu = e.target.ownerDocument.activeElement;
			if ( e.shiftKey && actiu === primer ) {
				e.preventDefault();
				darrer.focus();
			} else if ( ! e.shiftKey && actiu === darrer ) {
				e.preventDefault();
				primer.focus();
			}
		}
	};

	return (
		// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- teclat del diàleg modal.
		<div
			ref={ panell }
			className="nep-galeria-visor"
			role="dialog"
			aria-modal="true"
			aria-labelledby={ idTitol }
			onKeyDown={ teclat }
		>
			<div className="nep-galeria-visor__cap">
				<button
					type="button"
					className="nep-galeria-visor__boto"
					data-focus-inicial
					onClick={ onTanca }
				>
					<IconaTanca mida={ 20 } />
					<span className="nep-galeria-visor__text">
						{ __( 'Tanca', 'noempesquen' ) }
					</span>
				</button>
			</div>
			<div
				className="nep-galeria-visor__foto"
				role="img"
				aria-label={ foto.titol }
			>
				<Ilustracio id={ foto.il } className="nep-galeria-visor__il" />
			</div>
			<div className="nep-galeria-visor__peu">
				<h3 id={ idTitol } className="nep-galeria-visor__titol">
					{ foto.titol }
				</h3>
				<p className="nep-galeria-visor__data">{ etiqueta }</p>
			</div>
			<div className="nep-galeria-visor__nav">
				<button
					type="button"
					className="nep-galeria-visor__boto"
					aria-disabled={ ! hiHaAnt }
					onClick={ () => hiHaAnt && onCanvia( -1 ) }
				>
					<IconaAnterior mida={ 20 } />
					<span className="nep-galeria-visor__text">
						{ __( 'Anterior', 'noempesquen' ) }
					</span>
				</button>
				<button
					type="button"
					className="nep-galeria-visor__boto"
					aria-disabled={ ! hiHaSeg }
					onClick={ () => hiHaSeg && onCanvia( 1 ) }
				>
					<span className="nep-galeria-visor__text">
						{ __( 'Següent', 'noempesquen' ) }
					</span>
					<IconaSeguent mida={ 20 } />
				</button>
			</div>
		</div>
	);
}
