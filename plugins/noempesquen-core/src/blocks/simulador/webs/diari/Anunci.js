import { __, sprintf } from '@wordpress/i18n';
import { Cos } from '../../ui/Cos';
import { Inspeccionable } from '../../ui/Inspeccionable';

/**
 * Anunci patrocinat de la portada (`dades.anunci`). L'avatar són inicials
 * (mai una foto) i la denúncia l'avisa una regió `role="status"` que sempre
 * és al DOM. L'estat de denúncia el guarda qui el pinta.
 *
 * @param {Object}   props
 * @param {Object}   props.anunci     Anunci de la missió.
 * @param {boolean}  props.denunciat  Si ja s'ha denunciat.
 * @param {Function} props.onDenuncia Crida en informar de l'anunci.
 * @param {Function} props.onEnllac   Crida amb la URL d'un enllaç del cos.
 * @param {Function} props.onHoverUrl Barra d'estat: URL o null.
 */
export function Anunci( {
	anunci,
	denunciat,
	onDenuncia,
	onEnllac,
	onHoverUrl,
} ) {
	const { etiqueta, etiqueta_senyal: senyal, avatar, titol, cos } = anunci;
	return (
		<section
			className="nep-dv-anunci"
			aria-label={ sprintf(
				/* translators: %s: etiqueta de l'anunci */
				__( 'Anunci: %s', 'noempesquen' ),
				etiqueta
			) }
		>
			<p className="nep-dv-anunci__etiqueta">
				<Inspeccionable text={ etiqueta } senyal={ senyal } />
			</p>
			<div className="nep-dv-anunci__cap">
				<span className="nep-dv-anunci__avatar" aria-hidden="true">
					{ avatar?.inicials }
				</span>
				<span className="nep-dv-anunci__nom">{ avatar?.nom }</span>
			</div>
			<h2 className="nep-dv-anunci__titol">{ titol }</h2>
			<div className="nep-dv-anunci__cos">
				<Cos
					paragrafs={ Array.isArray( cos ) ? cos : [] }
					onEnllac={ onEnllac }
					onHoverUrl={ onHoverUrl }
				/>
			</div>
			<button
				type="button"
				className="nep-dv-anunci__denuncia"
				aria-disabled={ denunciat }
				onClick={ onDenuncia }
			>
				{ anunci.boto_denuncia ??
					__( "Informa d'aquest anunci", 'noempesquen' ) }
			</button>
			<p className="nep-dv-anunci__estat" role="status">
				{ denunciat
					? __( 'Anunci denunciat. Gràcies.', 'noempesquen' )
					: '' }
			</p>
		</section>
	);
}
