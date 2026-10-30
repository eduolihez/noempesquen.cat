import { useEffect, useId, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { Inspeccionable } from '../../ui/Inspeccionable';
import { IconaBloqueja } from '../missatges/icones';
import { IconaMes } from './icones';

/**
 * Banner no intrusiu d'un número que no és a l'agenda.
 *
 * @param {Object}   props
 * @param {()=>void} props.onBloqueja Bloqueja el número.
 * @param {()=>void} props.onAfegeix  Només tanca el banner (no toca el motor).
 * @param {?string}  props.senyal     Senyal del text del banner, si n'és un.
 */
export function AvisDesconegut( { onBloqueja, onAfegeix, senyal } ) {
	return (
		<div
			className="nep-parla-avis"
			role="group"
			aria-label={ __( 'Número desconegut', 'noempesquen' ) }
		>
			<p className="nep-parla-avis__text">
				<Inspeccionable
					text={ __(
						'Aquest número no és als teus contactes',
						'noempesquen'
					) }
					senyal={ senyal }
				/>
			</p>
			<div className="nep-parla-avis__accions">
				<button
					type="button"
					className="nep-parla-avis__boto is-perill"
					onClick={ onBloqueja }
				>
					{ __( 'Bloqueja', 'noempesquen' ) }
				</button>
				<button
					type="button"
					className="nep-parla-avis__boto"
					onClick={ onAfegeix }
				>
					{ __( 'Afegeix als contactes', 'noempesquen' ) }
				</button>
			</div>
		</div>
	);
}

/**
 * Menú del xat («Més opcions») amb «Bloqueja el número». Esc el tanca abans
 * que la pausa (registraMenu); en obrir-lo el focus va a l'opció i en
 * tancar-lo torna al botó.
 *
 * @param {Object}   props
 * @param {()=>void} props.onBloqueja Bloqueja el número.
 */
export function MenuXat( { onBloqueja } ) {
	const { registraMenu } = useJoc();
	const [ obert, setObert ] = useState( false );
	const arrel = useRef( null );
	const boto = useRef( null );
	const opcio = useRef( null );
	const id = useId();

	useEffect( () => {
		if ( ! obert ) {
			return undefined;
		}
		opcio.current?.focus();
		const desregistra = registraMenu( () => {
			setObert( false );
			boto.current?.focus();
		} );
		const doc = arrel.current.ownerDocument;
		const fora = ( e ) => {
			if ( ! arrel.current?.contains( e.target ) ) {
				setObert( false );
			}
		};
		doc.addEventListener( 'pointerdown', fora );
		return () => {
			desregistra();
			doc.removeEventListener( 'pointerdown', fora );
		};
	}, [ obert, registraMenu ] );

	return (
		<div
			ref={ arrel }
			className="nep-parla-menu"
			onBlur={ ( e ) => {
				if ( ! arrel.current.contains( e.relatedTarget ) ) {
					setObert( false );
				}
			} }
		>
			<button
				ref={ boto }
				type="button"
				className="nep-parla-menu__boto"
				aria-haspopup="menu"
				aria-expanded={ obert }
				aria-controls={ obert ? id : undefined }
				aria-label={ __( 'Més opcions', 'noempesquen' ) }
				onClick={ () => setObert( ! obert ) }
			>
				<IconaMes mida={ 18 } />
			</button>
			{ obert && (
				<ul id={ id } className="nep-parla-menu__llista" role="menu">
					<li role="none">
						<button
							ref={ opcio }
							type="button"
							role="menuitem"
							className="nep-parla-menu__opcio"
							onClick={ () => {
								setObert( false );
								onBloqueja();
							} }
						>
							<IconaBloqueja mida={ 18 } />
							{ __( 'Bloqueja el número', 'noempesquen' ) }
						</button>
					</li>
				</ul>
			) }
		</div>
	);
}
