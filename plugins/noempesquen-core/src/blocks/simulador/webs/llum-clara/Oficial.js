import { __ } from '@wordpress/i18n';
import { AreaClient } from './AreaClient';
import { IconaAvis, IconaCanvi, IconaEina, IconaFactura } from './Marca';

/* Il·lustració del hero: el dial d'un comptador que s'encén. */
function Dial() {
	return (
		<svg
			className="nep-lc-hero__dial"
			viewBox="0 0 320 320"
			width="320"
			height="320"
			aria-hidden="true"
			focusable="false"
		>
			<circle cx="160" cy="160" r="150" fill="#24345a" />
			<circle
				cx="160"
				cy="160"
				r="112"
				fill="none"
				stroke="#33466f"
				strokeWidth="2"
			/>
			<path
				d="M72 214a100 100 0 1 1 176 0"
				fill="none"
				stroke="#3d5280"
				strokeWidth="18"
				strokeLinecap="round"
			/>
			<path
				d="M72 214a100 100 0 0 1 117-138"
				fill="none"
				stroke="#f5a300"
				strokeWidth="18"
				strokeLinecap="round"
			/>
			<circle cx="160" cy="160" r="46" fill="#f5a300" />
			<path
				d="M150 166l10-15 10 15"
				fill="none"
				stroke="#fff"
				strokeWidth="5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<rect x="146" y="212" width="28" height="8" rx="4" fill="#f5a300" />
			<rect x="150" y="226" width="20" height="8" rx="4" fill="#f5a300" />
		</svg>
	);
}

function Inici( { enllac } ) {
	return (
		<>
			<p className="nep-lc-franja">
				<IconaAvis mida={ 18 } />
				<span>
					{ __(
						'Circulen correus falsos amb el nom de Llum Clara. No et demanarem mai la targeta per correu.',
						'noempesquen'
					) }{ ' ' }
					<a { ...enllac( '/ajuda' ) }>
						{ __( 'Com els reconeixes', 'noempesquen' ) }
					</a>
				</span>
			</p>
			<section className="nep-lc-hero">
				<div className="nep-lc-amplada nep-lc-hero__dins">
					<div className="nep-lc-hero__text">
						<h1>
							{ __(
								"Llum a un preu que s'entén.",
								'noempesquen'
							) }
						</h1>
						<p>
							{ __(
								'Tarifa Clara 24 h: el mateix preu a qualsevol hora del dia, sense permanència.',
								'noempesquen'
							) }
						</p>
						<p className="nep-lc-preu">
							<span className="nep-lc-preu__xifra">0,128 €</span>
							<span className="nep-lc-preu__unitat">
								{ __(
									'per kWh, IVA no inclòs',
									'noempesquen'
								) }
							</span>
						</p>
						<div className="nep-lc-hero__botons">
							<a
								className="nep-lc-boto"
								{ ...enllac( '/tarifes' ) }
							>
								{ __( 'Mira les tarifes', 'noempesquen' ) }
							</a>
							<a
								className="nep-lc-boto nep-lc-boto--contorn"
								{ ...enllac( '/area-client' ) }
							>
								{ __( "Entra a l'àrea client", 'noempesquen' ) }
							</a>
						</div>
					</div>
					<Dial />
				</div>
			</section>
			<section className="nep-lc-amplada nep-lc-serveis">
				<h2 className="screen-reader-text">
					{ __( 'Gestions', 'noempesquen' ) }
				</h2>
				{ [
					[
						IconaFactura,
						__( 'Factures i consums', 'noempesquen' ),
						__(
							"Descarrega les factures i mira el consum de cada mes a l'àrea client.",
							'noempesquen'
						),
					],
					[
						IconaEina,
						__( 'Avaries', 'noempesquen' ),
						__(
							"Si et quedes sense llum, avisa'ns des de l'àrea client a qualsevol hora.",
							'noempesquen'
						),
					],
					[
						IconaCanvi,
						__( 'Canvi de tarifa', 'noempesquen' ),
						__(
							"Canvia de tarifa o de potència sense cap cost, un cop l'any.",
							'noempesquen'
						),
					],
				].map( ( [ Icona, titol, text ] ) => (
					<div key={ titol } className="nep-lc-servei">
						<Icona mida={ 26 } />
						<h3>{ titol }</h3>
						<p>{ text }</p>
					</div>
				) ) }
			</section>
		</>
	);
}

function Tarifes() {
	return (
		<section className="nep-lc-amplada nep-lc-pagina">
			<h1>{ __( 'Tarifes', 'noempesquen' ) }</h1>
			<table className="nep-lc-taula">
				<thead>
					<tr>
						<th scope="col">{ __( 'Tarifa', 'noempesquen' ) }</th>
						<th scope="col">{ __( 'Energia', 'noempesquen' ) }</th>
						<th scope="col">{ __( 'Potència', 'noempesquen' ) }</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<th scope="row">
							{ __( 'Clara 24 h', 'noempesquen' ) }
						</th>
						<td>
							{ __( '0,128 €/kWh tot el dia', 'noempesquen' ) }
						</td>
						<td>{ __( '0,11 €/kW i dia', 'noempesquen' ) }</td>
					</tr>
					<tr>
						<th scope="row">
							{ __( 'Clara Nit i Dia', 'noempesquen' ) }
						</th>
						<td>
							{ __(
								'0,159 €/kWh de dia · 0,089 €/kWh de nit',
								'noempesquen'
							) }
						</td>
						<td>{ __( '0,11 €/kW i dia', 'noempesquen' ) }</td>
					</tr>
				</tbody>
			</table>
			<p className="nep-lc-nota">
				{ __( 'Preus sense IVA ni impost elèctric.', 'noempesquen' ) }
			</p>
		</section>
	);
}

const preguntes = () => [
	[
		__( 'Com sé si un correu és vostre?', 'noempesquen' ),
		__(
			"Els nostres correus arriben sempre d'una adreça acabada en @llumclara.cat. No hi posem enllaços per pagar i mai no et demanarem la targeta ni el PIN.",
			'noempesquen'
		),
	],
	[
		__( 'Com pago una factura?', 'noempesquen' ),
		__(
			"Les factures es cobren per domiciliació bancària. Si un cobrament falla, t'avisem per carta i a l'àrea client, i tens com a mínim dos mesos per pagar-la.",
			'noempesquen'
		),
	],
	[
		__( 'He rebut un correu sospitós, què faig?', 'noempesquen' ),
		__(
			"No facis clic als enllaços. Entra a llumclara.cat escrivint tu l'adreça i mira a l'àrea client si tens res pendent. Després marca el correu com a pesca (phishing).",
			'noempesquen'
		),
	],
];

function Ajuda() {
	return (
		<section className="nep-lc-amplada nep-lc-pagina">
			<h1>{ __( 'Ajuda', 'noempesquen' ) }</h1>
			{ preguntes().map( ( [ pregunta, resposta ] ) => (
				<details key={ pregunta } className="nep-lc-pregunta">
					<summary>{ pregunta }</summary>
					<p>{ resposta }</p>
				</details>
			) ) }
		</section>
	);
}

const titolsLegals = () => ( {
	'avis-legal': __( 'Avís legal', 'noempesquen' ),
	privacitat: __( 'Política de privacitat', 'noempesquen' ),
	cookies: __( 'Galetes', 'noempesquen' ),
	accessibilitat: __( 'Accessibilitat', 'noempesquen' ),
} );

/**
 * Contingut de la web oficial segons la secció.
 *
 * @param {Object}   props
 * @param {string}   props.seccio Secció (vegeu seccioOficial).
 * @param {Object}   props.dades  Dades de la web (missatge).
 * @param {Function} props.enllac (camí) → propietats d'un enllaç intern.
 */
export function Oficial( { seccio, dades, enllac } ) {
	if ( seccio === 'area-client' ) {
		return (
			<section className="nep-lc-amplada nep-lc-pagina nep-lc-pagina--client">
				<AreaClient missatge={ dades.missatge } />
			</section>
		);
	}
	if ( seccio === 'tarifes' ) {
		return <Tarifes />;
	}
	if ( seccio === 'ajuda' ) {
		return <Ajuda />;
	}
	const legal = titolsLegals()[ seccio ];
	if ( legal ) {
		return (
			<section className="nep-lc-amplada nep-lc-pagina">
				<h1>{ legal }</h1>
				<p>
					{ __(
						"Llum Clara Energia, SA tracta les teves dades només per gestionar el contracte de subministrament. Pots exercir els teus drets des de l'àrea client.",
						'noempesquen'
					) }
				</p>
			</section>
		);
	}
	return <Inici enllac={ enllac } />;
}

export const enllacosLegals = () => Object.entries( titolsLegals() );
