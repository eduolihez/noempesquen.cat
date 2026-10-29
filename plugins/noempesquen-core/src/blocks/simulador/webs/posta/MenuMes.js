import { useEffect, useId, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { IconaMes } from './icones';

/**
 * Menú «Més» de la barra de lectura. Esc el tanca abans que la pausa (via
 * registraMenu) i torna el focus al botó; fletxes per moure's; un clic a
 * fora o sortir-ne amb Tab també el tanquen.
 *
 * @param {Object}   props
 * @param {Object[]} props.items Opcions { id, text, Icona, onTria }.
 */
export function MenuMes( { items } ) {
	const { registraMenu } = useJoc();
	const [ obert, setObert ] = useState( false );
	const arrel = useRef( null );
	const boto = useRef( null );
	const menu = useRef( null );
	const id = useId();

	useEffect( () => {
		if ( ! obert ) {
			return undefined;
		}
		menu.current?.querySelector( '[role="menuitem"]' )?.focus();
		const desregistra = registraMenu( () => {
			setObert( false );
			boto.current?.focus();
		} );
		const fora = ( e ) => {
			if ( ! arrel.current?.contains( e.target ) ) {
				setObert( false );
			}
		};
		document.addEventListener( 'pointerdown', fora );
		return () => {
			desregistra();
			document.removeEventListener( 'pointerdown', fora );
		};
	}, [ obert, registraMenu ] );

	const mou = ( e ) => {
		const opcions = [
			...menu.current.querySelectorAll( '[role="menuitem"]' ),
		];
		const i = opcions.indexOf( e.target.ownerDocument.activeElement );
		const salts = { ArrowDown: 1, ArrowUp: -1 };
		if ( salts[ e.key ] ) {
			e.preventDefault();
			opcions[
				( i + salts[ e.key ] + opcions.length ) % opcions.length
			].focus();
		} else if ( e.key === 'Home' || e.key === 'End' ) {
			e.preventDefault();
			opcions[ e.key === 'Home' ? 0 : opcions.length - 1 ].focus();
		} else if ( e.key === 'Tab' ) {
			setObert( false );
		}
	};

	return (
		<div className="nep-posta-mes" ref={ arrel }>
			<button
				ref={ boto }
				type="button"
				className="nep-posta-eina"
				aria-haspopup="menu"
				aria-expanded={ obert }
				aria-controls={ obert ? id : undefined }
				aria-label={ __( 'Més', 'noempesquen' ) }
				title={ __( 'Més', 'noempesquen' ) }
				onClick={ () => setObert( ( o ) => ! o ) }
			>
				<IconaMes mida={ 18 } />
			</button>
			{ obert && (
				<ul
					id={ id }
					ref={ menu }
					className="nep-posta-mes__menu"
					role="menu"
					aria-label={ __( 'Més accions', 'noempesquen' ) }
					onKeyDown={ mou }
				>
					{ items.map( ( it ) => (
						<li key={ it.id } role="none">
							<button
								type="button"
								role="menuitem"
								tabIndex={ -1 }
								className="nep-posta-mes__item"
								onClick={ () => {
									setObert( false );
									it.onTria();
								} }
							>
								<it.Icona mida={ 18 } />
								{ it.text }
							</button>
						</li>
					) ) }
				</ul>
			) }
		</div>
	);
}
