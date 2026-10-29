import { __ } from '@wordpress/i18n';

/**
 * Navegador provisional; la tasca 10 el substitueix.
 *
 * @param {Object}  props
 * @param {?Object} props.dades Dades d'obertura ({ url }).
 */
export default function Navegador( { dades } ) {
	return (
		<div className="nep-so-app-provisional">
			<p>{ __( 'Navegador', 'noempesquen' ) }</p>
			{ dades?.url && <p>{ dades.url }</p> }
		</div>
	);
}
