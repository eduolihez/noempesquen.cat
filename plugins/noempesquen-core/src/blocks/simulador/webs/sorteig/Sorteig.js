import { __ } from '@wordpress/i18n';
import { Inspeccionable } from '../../ui/Inspeccionable';
import { FormulariFals } from '../comu/FormulariFals';
import { importDe } from '../comu/formulari';
import { MarcaSorteig } from './Marca';

/**
 * Web de Sorteig del Barri. Només existeix la còpia falsa: si `variant` no
 * és `falsa` es mostra igualment la mateixa pàgina (no hi ha versió oficial).
 * El compte enrere és un text fix, sense temporitzadors.
 *
 * @param {Object} props
 * @param {Object} props.dades Dades de la web (premi, formulari, compte_enrere).
 * @param {string} props.url   URL de la pàgina.
 */
export default function Sorteig( { dades, url } ) {
	const formulari = dades?.formulari ?? { id: 'formulari', camps: [] };
	const premi = dades?.premi ?? __( 'Un telèfon mòbil nou', 'noempesquen' );
	const compte =
		dades?.compte_enrere ?? __( 'Només et queden 09:41', 'noempesquen' );
	const total = importDe( formulari.boto ) || __( '2,95 €', 'noempesquen' );

	return (
		<div className="nep-sb nep-sb--falsa">
			<header className="nep-sb-cap">
				<MarcaSorteig />
			</header>
			<main className="nep-sb-cos">
				<section className="nep-sb-premi">
					<h1>{ __( 'Felicitats, has guanyat!', 'noempesquen' ) }</h1>
					<p className="nep-sb-premi__nom">
						<Inspeccionable
							text={ premi }
							senyal={ dades?.premi_senyal }
						/>
					</p>
					<p className="nep-sb-premi__compte">{ compte }</p>
				</section>
				<section className="nep-sb-pagament">
					<h2>{ __( "Despeses d'enviament", 'noempesquen' ) }</h2>
					<p>
						{ __(
							'Paga només les despeses d’enviament per rebre el teu premi:',
							'noempesquen'
						) }{ ' ' }
						<strong>{ total }</strong>
					</p>
					<div className="nep-lc nep-sb-forma">
						<FormulariFals formulari={ formulari } url={ url } />
					</div>
				</section>
			</main>
			<footer className="nep-sb-peu">
				<p>{ __( 'Sorteig del Barri · Sorteigs', 'noempesquen' ) }</p>
			</footer>
		</div>
	);
}
