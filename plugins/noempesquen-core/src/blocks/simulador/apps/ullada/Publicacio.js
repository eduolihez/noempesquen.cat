import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { useSistema } from '../../sistemes/pc/context';
import { Cos } from '../../ui/Cos';
import { Ilustracio } from '../../ui/ilustracions';
import { formataLikes } from './feed.js';
import { IconaCor, IconaDenuncia } from './icones';

/**
 * Una publicació del feed. El «m'agrada» i la denúncia són estat local; al
 * motor li arriben `publicacio.denuncia` i, si el `cos` té enllaços,
 * `enllac.obre`. El mòbil també proveeix `useSistema()` (obreApp).
 *
 * @param {Object} props
 * @param {Object} props.publicacio Publicació amb el perfil resolt.
 */
export function Publicacio( { publicacio } ) {
	const { emet } = useJoc();
	const { obreApp } = useSistema();
	const [ agrada, setAgrada ] = useState( false );
	const [ denunciada, setDenunciada ] = useState( false );
	const { id, perfil, text, cos, il, likes } = publicacio;
	const nom = perfil.nom || perfil.usuari || __( 'Usuari', 'noempesquen' );
	const total = likes + ( agrada ? 1 : 0 );

	const obreEnllac = ( url ) => {
		emet( 'enllac.obre', { url } );
		obreApp( 'navegador', { url } );
	};

	const denuncia = () => {
		if ( denunciada ) {
			return;
		}
		setDenunciada( true );
		emet( 'publicacio.denuncia', { id } );
	};

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
				<button
					type="button"
					className="nep-ullada-pub__denuncia"
					aria-disabled={ denunciada }
					aria-label={ sprintf(
						/* translators: %s: nom de l'autor */
						__( 'Denuncia la publicació de %s', 'noempesquen' ),
						nom
					) }
					onClick={ denuncia }
				>
					<IconaDenuncia mida={ 20 } />
					<span>{ __( 'Denuncia', 'noempesquen' ) }</span>
				</button>
			</div>
			<p className="nep-ullada-pub__estat" role="status">
				{ denunciada
					? __( 'Denunciada. Gràcies.', 'noempesquen' )
					: '' }
			</p>
			{ Array.isArray( cos ) && cos.length ? (
				<div className="nep-ullada-pub__text nep-ullada-pub__cos">
					<strong>{ perfil.usuari || nom }</strong>
					<Cos paragrafs={ cos } onEnllac={ obreEnllac } />
				</div>
			) : (
				<p className="nep-ullada-pub__text">
					<strong>{ perfil.usuari || nom }</strong> { text }
				</p>
			) }
		</article>
	);
}
