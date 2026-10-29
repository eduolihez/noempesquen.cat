import { useEffect, useId, useRef } from '@wordpress/element';
import { useJoc } from '../../simulador/context';

/**
 * Full inferior modal de Missatges (menú, enllaç, bloqueig, reenviament).
 * Esc el tanca abans que la pausa (registraMenu), el focus hi entra en
 * obrir-se i torna a l'origen en tancar-se; tocar fora també el tanca.
 *
 * @param {Object}   props
 * @param {string}   props.titol    Títol visible (i nom accessible).
 * @param {Function} props.onTanca  Tanca el full.
 * @param {Object}   props.origen   Element que l'ha obert (rep el focus en tancar).
 * @param {Object}   props.children Contingut.
 */
export function Fulla( { titol, onTanca, origen, children } ) {
	const { registraMenu } = useJoc();
	const panell = useRef( null );
	const tanca = useRef( onTanca );
	tanca.current = onTanca;
	const idTitol = useId();

	useEffect( () => {
		const el = panell.current;
		const doc = el.ownerDocument;
		(
			el.querySelector( '[data-focus-inicial]' ) ??
			el.querySelector( 'button, input' ) ??
			el
		).focus();
		const desregistra = registraMenu( () => tanca.current() );
		return () => {
			desregistra();
			const actiu = doc.activeElement;
			if (
				( ! actiu || actiu === doc.body || el.contains( actiu ) ) &&
				origen?.isConnected
			) {
				origen.focus();
			}
		};
	}, [ registraMenu, origen ] );

	// Tab no surt del full: és modal.
	const atrapa = ( e ) => {
		if ( e.key !== 'Tab' ) {
			return;
		}
		const focusables = [
			...panell.current.querySelectorAll(
				'button:not([disabled]), input:not([disabled])'
			),
		];
		if ( ! focusables.length ) {
			return;
		}
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
	};

	return (
		<>
			{ /* Amb onClick (no onPointerDown) el toc no travessa cap a sota. */ }
			{  }
			<div
				className="nep-missatges-fulla__capa"
				aria-hidden="true"
				onClick={ onTanca }
			/>
			{ /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Tab no surt del diàleg modal. */ }
			<div
				ref={ panell }
				className="nep-missatges-fulla"
				role="dialog"
				aria-modal="true"
				aria-labelledby={ idTitol }
				tabIndex={ -1 }
				onKeyDown={ atrapa }
			>
				<span
					className="nep-missatges-fulla__nansa"
					aria-hidden="true"
				/>
				<h3 id={ idTitol } className="nep-missatges-fulla__titol">
					{ titol }
				</h3>
				{ children }
			</div>
		</>
	);
}
