import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { APPS } from '../../apps/registre';
import { IconaPaperera } from '../../ui/icones';
import { Fons } from './Fons';

/**
 * Fons i icones de l'escriptori. Un clic selecciona; doble clic o Retorn obre.
 *
 * @param {Object}   props
 * @param {Function} props.onObre Obre una app.
 */
export function Escriptori( { onObre } ) {
	const [ triada, setTriada ] = useState( null );

	return (
		// Un clic al fons treu la selecció, com en un escriptori real.
		<div
			className="nep-so-escriptori"
			onPointerDown={ ( e ) => {
				if ( ! e.target.closest( '.nep-so-escriptori__icona' ) ) {
					setTriada( null );
				}
			} }
		>
			<Fons />
			<ul
				className="nep-so-escriptori__icones"
				aria-label={ __( "Icones de l'escriptori", 'noempesquen' ) }
			>
				{ Object.entries( APPS ).map( ( [ id, { nom, Icona } ] ) => (
					<li key={ id }>
						<button
							type="button"
							className={ `nep-so-escriptori__icona${
								triada === id ? ' is-triada' : ''
							}` }
							onClick={ () => setTriada( id ) }
							onDoubleClick={ () => onObre( id ) }
							onKeyDown={ ( e ) => {
								if ( e.key === 'Enter' ) {
									e.preventDefault();
									onObre( id );
								}
							} }
						>
							<Icona mida={ 40 } />
							<span>{ nom }</span>
						</button>
					</li>
				) ) }
				<li aria-hidden="true">
					<span className="nep-so-escriptori__icona is-decorativa">
						<IconaPaperera mida={ 40 } />
						<span>{ __( 'Paperera', 'noempesquen' ) }</span>
					</span>
				</li>
			</ul>
		</div>
	);
}
