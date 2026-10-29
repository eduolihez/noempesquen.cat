import { __, sprintf } from '@wordpress/i18n';
import { useJoc } from '../simulador/context';

/**
 * Text que, amb la lupa activa, es pot inspeccionar.
 *
 * @param {Object} props        Propietats.
 * @param {string} props.text   Text a mostrar.
 * @param {string} props.senyal Identificador del senyal, si n'és un.
 * @param {string} props.as     Etiqueta HTML quan la lupa està apagada.
 */
export function Inspeccionable( { text, senyal, as: Tag = 'span' } ) {
	const { estat, dispatch } = useJoc();
	const trobat = !! senyal && estat.trobats.includes( senyal );

	if ( ! estat.lupa ) {
		return (
			<Tag className={ trobat ? 'nep-marcat' : undefined }>{ text }</Tag>
		);
	}
	return (
		<button
			type="button"
			className={ `nep-inspecciona${ trobat ? ' nep-marcat' : '' }` }
			onClick={ () =>
				dispatch( { tipus: 'INSPECCIONA', senyal: senyal ?? null } )
			}
			aria-pressed={ trobat }
			aria-label={ sprintf(
				/* translators: %s: text inspeccionable */
				__( 'Inspecciona: %s', 'noempesquen' ),
				text
			) }
		>
			{ text }
		</button>
	);
}
