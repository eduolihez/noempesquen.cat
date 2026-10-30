import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Ilustracio } from '../../ui/ilustracions';
import { formataLikes } from './feed.js';
import { IconaCor } from './icones';

/**
 * Una publicació del feed. El «m'agrada» és estat local (suma o resta 1).
 *
 * @param {Object} props
 * @param {Object} props.publicacio Publicació amb el perfil resolt.
 */
export function Publicacio( { publicacio } ) {
	const [ agrada, setAgrada ] = useState( false );
	const { perfil, text, il, likes } = publicacio;
	const nom = perfil.nom || perfil.usuari || __( 'Usuari', 'noempesquen' );
	const total = likes + ( agrada ? 1 : 0 );

	return (
		<article
			className="nep-ullada-pub"
			aria-label={ sprintf(
				/* translators: %s: nom de l'autor */
				__( 'Publicació de %s', 'noempesquen' ),
				nom
			) }
		>
			<header className="nep-ullada-pub__cap">
				<span className="nep-ullada-pub__avatar" aria-hidden="true">
					{ perfil.il && <Ilustracio id={ perfil.il } /> }
				</span>
				<span className="nep-ullada-pub__autor">
					<strong>{ nom }</strong>
					{ perfil.usuari && (
						<span className="nep-ullada-pub__usuari">
							{ '@' + perfil.usuari }
						</span>
					) }
				</span>
			</header>
			<div
				className="nep-ullada-pub__imatge"
				role="img"
				aria-label={ text }
			>
				<Ilustracio id={ il } />
			</div>
			<div className="nep-ullada-pub__accions">
				<button
					type="button"
					className="nep-ullada-pub__agrada"
					aria-pressed={ agrada }
					onClick={ () => setAgrada( ( v ) => ! v ) }
				>
					<IconaCor mida={ 24 } />
					<span>{ __( "M'agrada", 'noempesquen' ) }</span>
				</button>
				<span className="nep-ullada-pub__likes" aria-live="polite">
					{ formataLikes( total ) }
				</span>
			</div>
			<p className="nep-ullada-pub__text">
				<strong>{ perfil.usuari || nom }</strong> { text }
			</p>
		</article>
	);
}
