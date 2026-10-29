import { __ } from '@wordpress/i18n';
import { propsEnllac } from '../enllac';
import { MarcaLlumClara } from './Marca';
import { Oficial, enllacosLegals } from './Oficial';
import { Falsa } from './Falsa';
import { seccioOficial } from '../comu/formulari';

function origen( url ) {
	try {
		return new URL( url ).origin;
	} catch {
		return 'https://llumclara.cat';
	}
}

const menu = () => [
	[ '/tarifes', __( 'Tarifes', 'noempesquen' ) ],
	[ '/area-client', __( 'Àrea client', 'noempesquen' ) ],
	[ '/ajuda', __( 'Ajuda', 'noempesquen' ) ],
];

/**
 * Web de Llum Clara: la mateixa plantilla per a l'oficial i per a la còpia
 * falsa (dades.variant). La falsa té el logotip una mica diferent, un avís
 * de tall, demana la targeta, el CVV i el PIN i el peu no té enllaços
 * legals.
 *
 * @param {Object}   props
 * @param {Object}   props.dades      Dades de la web (variant, missatge, formulari).
 * @param {string}   props.url        URL de la pàgina.
 * @param {Function} props.navega     Navega en aquesta pestanya.
 * @param {Function} props.onHoverUrl Barra d'estat.
 */
export default function LlumClara( { dades, url, navega, onHoverUrl } ) {
	const falsa = dades?.variant === 'falsa';
	const base = origen( url );
	const seccio = falsa ? 'pagament' : seccioOficial( url );
	const enllac = ( cami ) => propsEnllac( base + cami, navega, onHoverUrl );

	return (
		<div className={ `nep-lc${ falsa ? ' nep-lc--falsa' : '' }` }>
			<header className="nep-lc-cap">
				<div className="nep-lc-amplada nep-lc-cap__dins">
					<a
						className="nep-lc-cap__inici"
						aria-label={ __( 'Llum Clara, inici', 'noempesquen' ) }
						{ ...enllac( '/' ) }
					>
						<MarcaLlumClara falsa={ falsa } />
					</a>
					<nav aria-label={ __( 'Principal', 'noempesquen' ) }>
						<ul className="nep-lc-cap__menu">
							{ menu().map( ( [ cami, text ] ) => (
								<li key={ cami }>
									<a
										className={
											seccio === cami.slice( 1 )
												? 'is-actiu'
												: undefined
										}
										aria-current={
											seccio === cami.slice( 1 )
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
				</div>
			</header>

			<main className="nep-lc-cos">
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

			<footer className="nep-lc-peu">
				<div className="nep-lc-amplada nep-lc-peu__dins">
					<MarcaLlumClara falsa={ falsa } />
					{ ! falsa && (
						<ul className="nep-lc-peu__legal">
							{ enllacosLegals().map( ( [ cami, text ] ) => (
								<li key={ cami }>
									<a { ...enllac( `/${ cami }` ) }>
										{ text }
									</a>
								</li>
							) ) }
						</ul>
					) }
					<p className="nep-lc-peu__copy">
						{ falsa
							? __(
									'© 2026 Llum Clara. Tots els drets reservats.',
									'noempesquen'
								)
							: __(
									'© 2026 Llum Clara Energia, SA',
									'noempesquen'
								) }
					</p>
				</div>
			</footer>
		</div>
	);
}
