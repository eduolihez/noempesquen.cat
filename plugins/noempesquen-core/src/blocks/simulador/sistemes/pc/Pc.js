import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { FASE } from '../../nucli/motor';

/**
 * Esquelet provisional de l'escriptori; la tasca 7 el substitueix.
 */
export default function Pc() {
	const { estat, dispatch, hora } = useJoc();
	return (
		<div className="nep-so-pc-esquelet">
			<p>{ __( 'Escriptori', 'noempesquen' ) }</p>
			{ estat.fase === FASE.BLOQUEIG && (
				<button
					type="button"
					className="nep-so-boto nep-so-boto--accent"
					onClick={ () => dispatch( { tipus: 'DESBLOQUEJA' } ) }
				>
					{ __( 'Desbloqueja', 'noempesquen' ) }
				</button>
			) }
			<p aria-label={ __( 'Hora', 'noempesquen' ) }>{ hora }</p>
		</div>
	);
}
