import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { IconaCercaNav, IconaSenseConnexio } from './icones';

/**
 * Pàgina d'error del navegador: un domini que no existeix (com un error de
 * DNS real) o una cerca, que en aquest navegador no dona resultats.
 *
 * @param {Object}   props
 * @param {string}   props.tipus       'error' o 'cerca'.
 * @param {string}   props.host        Domini que no respon (error).
 * @param {string}   props.text        Text cercat (cerca).
 * @param {Function} props.onRecarrega Torna a carregar la pàgina.
 */
export function PaginaError( { tipus, host, text, onRecarrega } ) {
	if ( tipus === 'cerca' ) {
		return (
			<div className="nep-nav-error">
				<div className="nep-nav-error__icona">
					<IconaCercaNav mida={ 56 } />
				</div>
				<h1 className="nep-nav-error__titol">
					{ __( "No s'ha trobat cap resultat", 'noempesquen' ) }
				</h1>
				<p>
					{ createInterpolateElement(
						/* translators: <cerca />: text cercat */
						__(
							'La cerca <cerca /> no ha donat cap resultat.',
							'noempesquen'
						),
						{ cerca: <strong>{ text }</strong> }
					) }
				</p>
				<p>
					{ __(
						"Comprova com ho has escrit o escriu l'adreça completa de la web (per exemple, llumclara.cat).",
						'noempesquen'
					) }
				</p>
			</div>
		);
	}
	return (
		<div className="nep-nav-error">
			<div className="nep-nav-error__icona">
				<IconaSenseConnexio />
			</div>
			<h1 className="nep-nav-error__titol">
				{ __( 'No es pot accedir a aquest lloc', 'noempesquen' ) }
			</h1>
			<p>
				{ createInterpolateElement(
					/* translators: <domini />: domini que no respon */
					__(
						"No s'ha trobat l'adreça del servidor de <domini />.",
						'noempesquen'
					),
					{ domini: <strong>{ host }</strong> }
				) }
			</p>
			<p>{ __( 'Prova de:', 'noempesquen' ) }</p>
			<ul className="nep-nav-error__llista">
				<li>
					{ __(
						"Comprovar que l'adreça estigui ben escrita",
						'noempesquen'
					) }
				</li>
				<li>{ __( 'Comprovar la connexió', 'noempesquen' ) }</li>
			</ul>
			{ /* eslint-disable-next-line nep/no-literal-ui -- codi tècnic d'error, no es tradueix */ }
			<p className="nep-nav-error__codi">DNS_PROBE_FINISHED_NXDOMAIN</p>
			<button
				type="button"
				className="nep-nav-error__boto"
				onClick={ onRecarrega }
			>
				{ __( 'Torna a carregar', 'noempesquen' ) }
			</button>
		</div>
	);
}
