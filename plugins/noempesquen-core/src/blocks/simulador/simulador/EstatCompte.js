/**
 * Estat del compte sota el selector (fora del sistema simulat): convida a
 * crear un compte o confirma que el progrés es desa. Mai dins d'una missió.
 */
import { __ } from '@wordpress/i18n';

/**
 * @param {Object}       props
 * @param {boolean|null} props.connectat `null` mentre es comprova la sessió.
 * @param {string}       props.url       URL de la pàgina de compte (o '').
 */
export function EstatCompte( { connectat, url } ) {
	if ( connectat === null ) {
		return null;
	}
	if ( connectat ) {
		return (
			<p className="nep-estat-compte" role="status">
				{ __( 'Progrés desat al teu compte', 'noempesquen' ) }
			</p>
		);
	}
	if ( ! url ) {
		return null;
	}
	return (
		<p className="nep-estat-compte">
			<a className="nep-estat-compte__enllac" href={ url }>
				{ __(
					'Crea un compte per guardar el teu progrés en qualsevol dispositiu',
					'noempesquen'
				) }
			</a>
		</p>
	);
}
