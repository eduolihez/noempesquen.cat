import { __ } from '@wordpress/i18n';
import { MarcaEnviat } from './Marca';
import { Oficial } from './Oficial';
import { Falsa } from './Falsa';

/**
 * Web d'Envia't: la mateixa plantilla per a l'oficial (seguiment) i per a
 * la còpia falsa (dades.variant === 'falsa'). No hi ha cap enllaç real.
 *
 * @param {Object} props
 * @param {Object} props.dades Dades de la web (variant, missatge, formulari).
 * @param {string} props.url   URL de la pàgina.
 */
export default function Enviat( { dades, url } ) {
	const falsa = dades?.variant === 'falsa';
	return (
		<div className={ `nep-ev${ falsa ? ' nep-ev--falsa' : '' }` }>
			<header className="nep-ev-cap">
				<MarcaEnviat />
			</header>
			<main className="nep-ev-cos">
				{ falsa ? (
					<Falsa dades={ dades } url={ url } />
				) : (
					<Oficial dades={ dades } />
				) }
			</main>
			<footer className="nep-ev-peu">
				<p>{ __( "Envia't · Missatgeria", 'noempesquen' ) }</p>
			</footer>
		</div>
	);
}
