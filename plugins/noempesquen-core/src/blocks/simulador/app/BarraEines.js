import { __, sprintf } from '@wordpress/i18n';
import { FASE } from './motor';

export function BarraEines( { estat, dispatch, potDecidir, total } ) {
	const explorant = estat.fase === FASE.EXPLORA;
	return (
		<div
			className="nep-eines"
			role="toolbar"
			aria-label={ __( 'Eines del simulador', 'noempesquen' ) }
		>
			<button
				type="button"
				className={ `nep-boto nep-boto--lupa${ estat.lupa ? ' is-actiu' : '' }` }
				aria-pressed={ estat.lupa }
				onClick={ () => dispatch( { tipus: 'LUPA' } ) }
				disabled={ ! explorant }
			>
				<span aria-hidden="true">🔍</span>{ ' ' }
				{ estat.lupa
					? __( 'Lupa activada', 'noempesquen' )
					: __( 'Lupa', 'noempesquen' ) }
			</button>
			<span className="nep-eines__comptador" aria-live="polite">
				{ sprintf(
					/* translators: 1: indicis trobats, 2: total */
					__( 'Indicis: %1$d de %2$d', 'noempesquen' ),
					estat.trobats.length,
					total
				) }
			</span>
			<button
				type="button"
				className="nep-boto nep-boto--principal"
				onClick={ () => dispatch( { tipus: 'VULL_DECIDIR' } ) }
				disabled={ ! explorant || ! potDecidir }
			>
				{ __( 'Ja ho tinc clar', 'noempesquen' ) }
			</button>
		</div>
	);
}
