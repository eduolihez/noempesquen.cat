import { __ } from '@wordpress/i18n';

/**
 * Parla provisional; la tasca 9 la substitueix.
 */
export default function Parla() {
	return (
		<div className="nep-so-app-provisional">
			<p>{ __( 'Parla', 'noempesquen' ) }</p>
		</div>
	);
}
