import { __ } from '@wordpress/i18n';
import { FormulariFals } from '../comu/FormulariFals';

/**
 * Logotip inventat de Revenda Cobra: una moneda dins d'un cercle (SVG propi).
 */
function MarcaCobrament() {
	return (
		<span className="nep-cb-marca">
			<svg
				viewBox="0 0 32 32"
				width="32"
				height="32"
				aria-hidden="true"
				focusable="false"
			>
				<circle cx="16" cy="16" r="15" fill="#065f46" />
				<circle cx="16" cy="16" r="9" fill="#fde68a" />
				<path
					d="M13 16h6M16 12v8"
					stroke="#065f46"
					strokeWidth="2.4"
					strokeLinecap="round"
				/>
			</svg>
			<span className="nep-cb-marca__nom">Revenda Cobra</span>
		</span>
	);
}

/**
 * Web falsa de cobrament (Revenda Cobra). Només existeix la còpia falsa.
 *
 * @param {Object} props
 * @param {Object} props.dades Dades de la web (import, concepte, formulari).
 * @param {string} props.url   URL de la pàgina.
 */
export default function Cobrament( { dades, url } ) {
	const formulari = dades?.formulari ?? { id: 'formulari', camps: [] };
	const importe = dades?.import ?? '';

	return (
		<div className="nep-cb nep-cb--falsa">
			<header className="nep-cb-cap">
				<MarcaCobrament />
			</header>
			<main className="nep-cb-cos">
				<section className="nep-cb-resum">
					<h1>
						{ __( 'Cobra els', 'noempesquen' ) }{ ' ' }
						<span className="nep-cb-import">{ importe }</span>
					</h1>
					{ dades?.concepte && (
						<p className="nep-cb-concepte">{ dades.concepte }</p>
					) }
				</section>
				<section className="nep-cb-pagament">
					<h2>{ __( 'Dades de la targeta', 'noempesquen' ) }</h2>
					<p>
						{ __(
							"Introdueix les dades de la targeta per rebre l'ingrés.",
							'noempesquen'
						) }
					</p>
					<div className="nep-lc nep-cb-forma">
						<FormulariFals formulari={ formulari } url={ url } />
					</div>
				</section>
			</main>
			<footer className="nep-cb-peu">
				<p>{ __( 'Revenda Cobra · Cobraments', 'noempesquen' ) }</p>
			</footer>
		</div>
	);
}
