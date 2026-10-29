import { __, sprintf } from '@wordpress/i18n';
import { useJoc } from '../simulador/context';
import { Inspeccionable } from './Inspeccionable';

function Enllac( { seg, onEnllac, onHoverUrl } ) {
	const { estat, dispatch } = useJoc();
	const { text, url } = seg.enllac;
	const trobat = !! seg.senyal && estat.trobats.includes( seg.senyal );
	const hover = {
		onMouseEnter: () => onHoverUrl?.( url ),
		onMouseLeave: () => onHoverUrl?.( null ),
		onFocus: () => onHoverUrl?.( url ),
		onBlur: () => onHoverUrl?.( null ),
	};

	if ( estat.lupa ) {
		return (
			<button
				type="button"
				className={ `nep-enllac nep-inspecciona${
					trobat ? ' nep-marcat' : ''
				}` }
				onClick={ () =>
					dispatch( {
						tipus: 'INSPECCIONA',
						senyal: seg.senyal ?? null,
					} )
				}
				aria-pressed={ trobat }
				aria-label={ sprintf(
					/* translators: %s: text de l'enllaç */
					__( 'Inspecciona: %s', 'noempesquen' ),
					text
				) }
				{ ...hover }
			>
				{ text }
			</button>
		);
	}

	// Sempre s'intercepta: cap gest (clic, Ctrl+clic, clic del mig, menú
	// contextual, arrossegar) ha de portar el navegador real a una URL del joc.
	const obre = ( e ) => {
		e.preventDefault();
		onEnllac?.( url );
	};
	// Només el botó del mig obre; la resta de botons auxiliars s'ignoren.
	const obreAux = ( e ) => {
		e.preventDefault();
		if ( e.button === 1 ) {
			onEnllac?.( url );
		}
	};
	return (
		<a
			href={ url }
			className={ `nep-enllac${ trobat ? ' nep-marcat' : '' }` }
			onClick={ obre }
			onAuxClick={ obreAux }
			onContextMenu={ ( e ) => e.preventDefault() }
			onDragStart={ ( e ) => e.preventDefault() }
			{ ...hover }
		>
			{ text }
		</a>
	);
}

/**
 * Cos d'un missatge: un <p> per paràgraf amb text i enllaços inspeccionables.
 *
 * @param {Object}   props            Propietats.
 * @param {Array}    props.paragrafs  Paràgrafs (arrays de segments).
 * @param {Function} props.onEnllac   Crida amb la URL quan es fa clic a un enllaç.
 * @param {Function} props.onHoverUrl Crida amb la URL en entrar/enfocar, o null en sortir.
 */
export function Cos( { paragrafs, onEnllac, onHoverUrl } ) {
	return paragrafs.map( ( paragraf, i ) => (
		<p key={ i }>
			{ paragraf.map( ( seg, j ) =>
				seg.enllac ? (
					<Enllac
						key={ j }
						seg={ seg }
						onEnllac={ onEnllac }
						onHoverUrl={ onHoverUrl }
					/>
				) : (
					<Inspeccionable
						key={ j }
						text={ seg.t }
						senyal={ seg.senyal }
					/>
				)
			) }
		</p>
	) );
}
