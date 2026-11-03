import { __ } from '@wordpress/i18n';
import { Inspeccionable } from '../../ui/Inspeccionable';
import { FormulariFals } from '../comu/FormulariFals';

/**
 * Logotip inventat d'Invest Rapid: una fletxa ascendent (SVG propi).
 */
function MarcaInversio() {
	return (
		<span className="nep-iv-marca">
			<svg
				viewBox="0 0 32 32"
				width="32"
				height="32"
				aria-hidden="true"
				focusable="false"
			>
				<circle cx="16" cy="16" r="15" fill="#1e3a8a" />
				<path
					d="M8 22l6-6 4 4 6-8"
					fill="none"
					stroke="#facc15"
					strokeWidth="2.6"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
			<span className="nep-iv-marca__nom">
				{ __( 'Invest Rapid', 'noempesquen' ) }
			</span>
		</span>
	);
}

/**
 * Web falsa d'inversió (Invest Rapid). El compte enrere és text fix
 * (WCAG 2.2.1): cap temporitzador viu ni animació.
 *
 * @param {Object} props
 * @param {Object} props.dades Dades de la web (promesa, testimonis, formulari).
 * @param {string} props.url   URL de la pàgina.
 */
export default function Inversio( { dades, url } ) {
	const formulari = dades?.formulari ?? { id: 'formulari', camps: [] };
	const avatar = dades?.avatar;
	const compte = dades?.compte_enrere;
	const testimonis = dades?.testimonis ?? [];

	return (
		<div className="nep-iv nep-iv--falsa">
			<header className="nep-iv-cap">
				<MarcaInversio />
			</header>
			<main className="nep-iv-cos">
				<section className="nep-iv-presentacio">
					{ avatar && (
						<p className="nep-iv-avatar">
							<span
								className="nep-iv-avatar__cercle"
								aria-hidden="true"
							>
								{ avatar.inicials }
							</span>
							<span className="nep-iv-avatar__nom">
								{ avatar.nom }
							</span>
						</p>
					) }
					<h1>
						<Inspeccionable
							text={ dades?.promesa ?? '' }
							senyal={ dades?.promesa_senyal }
						/>
					</h1>
					{ compte && (
						<p className="nep-iv-compte">
							<Inspeccionable
								text={ compte.text }
								senyal={ compte.senyal }
							/>
						</p>
					) }
				</section>
				{ testimonis.length > 0 && (
					<section className="nep-iv-testimonis">
						<h2>
							{ __( 'Què diuen els inversors', 'noempesquen' ) }
						</h2>
						<ul>
							{ testimonis.map( ( t, i ) => (
								<li key={ i } className="nep-iv-testimoni">
									<span
										className="nep-iv-testimoni__avatar"
										aria-hidden="true"
									>
										{ String( t.nom ?? '' ).charAt( 0 ) }
									</span>
									<span className="nep-iv-testimoni__cos">
										<strong>{ t.nom }</strong>
										<span>
											<Inspeccionable
												text={ t.text }
												senyal={ t.senyal }
											/>
										</span>
									</span>
								</li>
							) ) }
						</ul>
					</section>
				) }
				<section className="nep-iv-registre">
					<h2>{ __( 'Comença a invertir', 'noempesquen' ) }</h2>
					<div className="nep-lc nep-iv-forma">
						<FormulariFals formulari={ formulari } url={ url } />
					</div>
				</section>
			</main>
			<footer className="nep-iv-peu">
				<p>{ __( 'Invest Rapid · Inversions', 'noempesquen' ) }</p>
			</footer>
		</div>
	);
}
