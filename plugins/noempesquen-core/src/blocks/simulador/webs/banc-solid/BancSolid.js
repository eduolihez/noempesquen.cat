import { __, sprintf } from '@wordpress/i18n';
import { nomJugador } from '../../nucli/jugador.js';
import { useJoc } from '../../simulador/context';
import { propsEnllac } from '../enllac';
import { IconaCadenat } from '../comu/icones';
import { MarcaBancSolid } from './Marca';
import { Oficial } from './Oficial';
import { Falsa } from './Falsa';
import { seccioBanc } from './textos';

function origen( url ) {
	try {
		return new URL( url ).origin;
	} catch {
		return 'https://bancsolid.cat';
	}
}

const menu = () => [
	[ '/', 'inici', __( 'Particulars', 'noempesquen' ) ],
	[ '/area-clients', 'area-clients', __( 'Àrea de clients', 'noempesquen' ) ],
];

/**
 * Web de Banc Sòlid: la mateixa plantilla per a l'oficial i per a la còpia
 * falsa (dades.variant). L'oficial té la sessió oberta i cap avís; la falsa
 * avisa d'un bloqueig i demana l'accés i el codi SMS.
 *
 * @param {Object}   props
 * @param {Object}   props.dades      Dades de la web (variant, https, missatge, textos, formulari, formulari_codi).
 * @param {string}   props.url        URL de la pàgina.
 * @param {Function} props.navega     Navega en aquesta pestanya.
 * @param {Function} props.onHoverUrl Barra d'estat.
 */
export default function BancSolid( { dades, url, navega, onHoverUrl } ) {
	const { mon } = useJoc();
	const falsa = dades?.variant === 'falsa';
	const base = origen( url );
	const seccio = falsa ? null : seccioBanc( url );
	const enllac = ( cami ) => propsEnllac( base + cami, navega, onHoverUrl );
	const nom = nomJugador( mon );

	return (
		<div className={ `nep-bs${ falsa ? ' nep-bs--falsa' : '' }` }>
			<header className="nep-bs-cap">
				<div className="nep-bs-amplada nep-bs-cap__dins">
					{ falsa ? (
						<MarcaBancSolid falsa />
					) : (
						<a
							className="nep-bs-cap__inici"
							aria-label={ __(
								'Banc Sòlid, inici',
								'noempesquen'
							) }
							{ ...enllac( '/' ) }
						>
							<MarcaBancSolid />
						</a>
					) }
					{ ! falsa && (
						<nav aria-label={ __( 'Principal', 'noempesquen' ) }>
							<ul className="nep-bs-cap__menu">
								{ menu().map( ( [ cami, clau, text ] ) => (
									<li key={ clau }>
										<a
											aria-current={
												seccio === clau
													? 'page'
													: undefined
											}
											{ ...enllac( cami ) }
										>
											{ text }
										</a>
									</li>
								) ) }
							</ul>
						</nav>
					) }
					<p className="nep-bs-cap__sessio">
						{ falsa
							? __( 'Banca en línia', 'noempesquen' )
							: sprintf(
									/* translators: %s: nom del client */
									__( 'Sessió oberta · %s', 'noempesquen' ),
									nom
								) }
					</p>
				</div>
			</header>

			<main className="nep-bs-cos">
				{ falsa ? (
					<Falsa dades={ dades } url={ url } />
				) : (
					<Oficial
						seccio={ seccio }
						dades={ dades ?? {} }
						enllac={ enllac }
					/>
				) }
			</main>

			<footer className="nep-bs-peu">
				<div className="nep-bs-amplada nep-bs-peu__dins">
					<MarcaBancSolid falsa={ falsa } />
					{ dades?.https && (
						<p className="nep-bs-peu__segur">
							<IconaCadenat mida={ 16 } />
							{ __( 'Connexió segura', 'noempesquen' ) }
						</p>
					) }
					<p>
						{ falsa
							? __(
									'© 2026 Banc Sòlid. Tots els drets reservats.',
									'noempesquen'
								)
							: __(
									'© 2026 Banc Sòlid, SA · Entitat inscrita al registre de bancs',
									'noempesquen'
								) }
					</p>
				</div>
			</footer>
		</div>
	);
}
