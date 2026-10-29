import { __ } from '@wordpress/i18n';
import { FormulariFals } from '../comu/FormulariFals';
import { importDe } from '../comu/formulari';

/**
 * Còpia falsa: demana pagar les «despeses d'entrega» amb targeta. Fa servir
 * el formulari comú, que només emet `formulari.envia` amb { url, formulari }.
 *
 * @param {Object} props
 * @param {Object} props.dades Dades de la web (formulari).
 * @param {string} props.url   URL de la pàgina.
 */
export function Falsa( { dades, url } ) {
	const formulari = dades?.formulari ?? { id: 'formulari', camps: [] };
	const total = importDe( formulari.boto );

	return (
		<section className="nep-ev-pagament">
			<h1>{ __( "Paga les despeses d'entrega", 'noempesquen' ) }</h1>
			<p className="nep-ev-pagament__avis">
				{ __(
					'El teu paquet és al magatzem. Paga avui per evitar que el retornem al remitent.',
					'noempesquen'
				) }
			</p>
			{ total && (
				<p className="nep-ev-pagament__total">
					<span>{ __( 'Total a pagar', 'noempesquen' ) }</span>
					<strong>{ total }</strong>
				</p>
			) }
			<div className="nep-lc nep-ev-forma">
				<FormulariFals formulari={ formulari } url={ url } />
			</div>
		</section>
	);
}
