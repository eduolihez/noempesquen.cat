import { __ } from '@wordpress/i18n';
import { propsEnllac } from '../enllac';

const URL_POSTA = 'https://posta.cat/';

/**
 * Llum Clara provisional; la tasca 11 la substitueix.
 *
 * @param {Object}   props
 * @param {Object}   props.dades      Dades de la web.
 * @param {Function} props.navega     Navega a una URL en aquesta pestanya.
 * @param {Function} props.onHoverUrl URL sota el punter o amb focus.
 */
export default function LlumClara( { dades, navega, onHoverUrl } ) {
	return (
		<div className="nep-so-app-provisional">
			<h1>{ dades.titol }</h1>
			{ dades.missatge && <p>{ dades.missatge }</p> }
			<a { ...propsEnllac( URL_POSTA, navega, onHoverUrl ) }>
				{ __( 'Torna a Posta', 'noempesquen' ) }
			</a>
		</div>
	);
}
