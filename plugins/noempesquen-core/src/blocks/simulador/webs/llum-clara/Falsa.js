import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { FormulariFals } from './FormulariFals';
import { IconaAvis } from './Marca';
import { compteEnrere, importDe, referencia } from './formulari';

/* El «tall» és d'aquí a gairebé 24 hores; el rellotge del joc el fa baixar. */
const SEGONS_TALL = 23 * 3600 + 47 * 60 + 12;

/**
 * Contingut de la còpia falsa: avís de tall amb compte enrere, resum de
 * la «factura» i el formulari de la targeta.
 *
 * @param {Object} props
 * @param {Object} props.dades Dades de la web (formulari).
 * @param {string} props.url   URL de la pàgina.
 */
export function Falsa( { dades, url } ) {
	const { estat } = useJoc();
	const formulari = dades.formulari ?? { id: 'formulari', camps: [] };
	const importFactura = importDe( formulari.boto );
	const ref = referencia( url );

	return (
		<>
			<div className="nep-lc-tall">
				<div className="nep-lc-amplada nep-lc-tall__dins">
					<IconaAvis mida={ 26 } />
					<p>
						<strong>
							{ __(
								'Avís de tall de subministrament',
								'noempesquen'
							) }
						</strong>
						{ __(
							'No hem pogut cobrar la teva última factura. Si no la pagues avui, el subministrament es tallarà d’aquí a',
							'noempesquen'
						) }{ ' ' }
						<span className="nep-lc-tall__compte">
							{ compteEnrere( SEGONS_TALL - estat.temps ) }
						</span>
					</p>
				</div>
			</div>
			<section className="nep-lc-hero nep-lc-hero--pagament">
				<div className="nep-lc-amplada">
					<h1>
						{ __( 'Pagament de factura pendent', 'noempesquen' ) }
					</h1>
					<p>
						{ __(
							'Completa el pagament ara per evitar el tall i el cost de reconnexió.',
							'noempesquen'
						) }
					</p>
				</div>
			</section>
			<div className="nep-lc-amplada nep-lc-pagament">
				<section className="nep-lc-resum">
					<h2>{ __( 'Resum', 'noempesquen' ) }</h2>
					<dl>
						<div>
							<dt>{ __( 'Titular', 'noempesquen' ) }</dt>
							<dd>
								{ __( 'Client de Llum Clara', 'noempesquen' ) }
							</dd>
						</div>
						{ ref && (
							<div>
								<dt>{ __( 'Referència', 'noempesquen' ) }</dt>
								<dd>{ ref }</dd>
							</div>
						) }
						<div>
							<dt>{ __( 'Concepte', 'noempesquen' ) }</dt>
							<dd>{ __( 'Factura impagada', 'noempesquen' ) }</dd>
						</div>
						<div>
							<dt>{ __( 'Data límit', 'noempesquen' ) }</dt>
							<dd className="nep-lc-resum__urgent">
								{ __( 'Avui', 'noempesquen' ) }
							</dd>
						</div>
					</dl>
					{ importFactura && (
						<p className="nep-lc-resum__total">
							<span>
								{ __( 'Total a pagar', 'noempesquen' ) }
							</span>
							<strong>{ importFactura }</strong>
						</p>
					) }
				</section>
				<section className="nep-lc-targeta">
					<h2>{ __( 'Dades de la targeta', 'noempesquen' ) }</h2>
					<FormulariFals formulari={ formulari } url={ url } />
				</section>
			</div>
		</>
	);
}
