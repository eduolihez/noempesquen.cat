import { __ } from '@wordpress/i18n';
import { propsEnllac } from '../enllac';

const URL_PROVA = 'https://llumclara.cat/';

/**
 * Posta provisional; la tasca 11 la substitueix.
 *
 * @param {Object}   props
 * @param {Object}   props.dades        Dades de la web.
 * @param {Function} props.obrePestanya Obre una URL en una pestanya nova.
 * @param {Function} props.onHoverUrl   URL sota el punter o amb focus.
 */
export default function Posta( { dades, obrePestanya, onHoverUrl } ) {
	return (
		<div className="nep-so-app-provisional">
			<h1>{ dades.titol }</h1>
			<a { ...propsEnllac( URL_PROVA, obrePestanya, onHoverUrl ) }>
				{ __( 'Obre Llum Clara en una pestanya nova', 'noempesquen' ) }
			</a>
		</div>
	);
}
