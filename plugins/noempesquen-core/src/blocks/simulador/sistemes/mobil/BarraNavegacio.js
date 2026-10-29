import { __ } from '@wordpress/i18n';
import { IconaEnrere, IconaInici } from './icones';

/**
 * Barra de navegació del sistema (botons «Enrere» i «Inici»), usable amb
 * ratolí, tacte i teclat.
 *
 * @param {Object}   props
 * @param {boolean}  props.aInici   Ja es veu la pantalla d'inici.
 * @param {Function} props.onEnrere Enrere (dins l'app o tanca l'app).
 * @param {Function} props.onInici  Torna a la pantalla d'inici.
 */
export function BarraNavegacio( { aInici, onEnrere, onInici } ) {
	return (
		<nav
			className="nep-so-m-nav"
			aria-label={ __( 'Navegació del sistema', 'noempesquen' ) }
		>
			<button
				type="button"
				className="nep-so-m-nav__boto"
				aria-label={ __( 'Enrere', 'noempesquen' ) }
				aria-disabled={ aInici ? 'true' : undefined }
				onClick={ aInici ? undefined : onEnrere }
			>
				<IconaEnrere mida={ 22 } />
			</button>
			<button
				type="button"
				className="nep-so-m-nav__boto"
				aria-label={ __( 'Inici', 'noempesquen' ) }
				onClick={ onInici }
			>
				<IconaInici mida={ 22 } />
			</button>
		</nav>
	);
}
