import { __, sprintf } from '@wordpress/i18n';

/**
 * Un tros de text que, amb la lupa activa, es pot inspeccionar.
 *
 * @param {Object} props        Propietats.
 * @param {string} props.text   Text a mostrar.
 * @param {string} props.senyal Identificador del senyal, si n'és un.
 * @param {Object} props.ctx    Context del joc (lupa, trobats, accions).
 * @param {string} props.as     Etiqueta HTML quan la lupa està apagada.
 */
export function Inspeccionable( { text, senyal, ctx, as: Tag = 'span' } ) {
	const trobat = senyal && ctx.trobats.includes( senyal );
	if ( ! ctx.lupa ) {
		return (
			<Tag className={ trobat ? 'nep-marcat' : undefined }>{ text }</Tag>
		);
	}
	return (
		<button
			type="button"
			className={ `nep-inspecciona${ trobat ? ' nep-marcat' : '' }` }
			onClick={ () => ctx.onInspecciona( senyal ?? null ) }
			aria-pressed={ !! trobat }
			aria-label={ sprintf(
				/* translators: %s: text del missatge */
				__( 'Inspecciona: %s', 'noempesquen' ),
				text
			) }
		>
			{ text }
		</button>
	);
}

function Enllac( { seg, ctx } ) {
	const { text, url } = seg.enllac;
	const trobat = seg.senyal && ctx.trobats.includes( seg.senyal );

	if ( ctx.lupa ) {
		return (
			<button
				type="button"
				className={ `nep-enllac nep-inspecciona${ trobat ? ' nep-marcat' : '' }` }
				onClick={ () => ctx.onInspecciona( seg.senyal ?? null ) }
				onMouseEnter={ () => ctx.onUrl( url ) }
				onMouseLeave={ () => ctx.onUrl( null ) }
				onFocus={ () => ctx.onUrl( url ) }
				onBlur={ () => ctx.onUrl( null ) }
				aria-pressed={ !! trobat }
			>
				{ text }
			</button>
		);
	}

	return (
		<button
			type="button"
			className={ `nep-enllac${ trobat ? ' nep-marcat' : '' }` }
			onClick={ () =>
				ctx.mobil ? ctx.onFullEnllac( url ) : ctx.onPica()
			}
			onMouseEnter={ () => ctx.onUrl( url ) }
			onMouseLeave={ () => ctx.onUrl( null ) }
			onFocus={ () => ctx.onUrl( url ) }
			onBlur={ () => ctx.onUrl( null ) }
			aria-describedby={ ctx.idBarra }
		>
			{ text }
		</button>
	);
}

export function Cos( { paragrafs, ctx } ) {
	return paragrafs.map( ( paragraf, i ) => (
		<p key={ i }>
			{ paragraf.map( ( seg, j ) =>
				seg.enllac ? (
					<Enllac key={ j } seg={ seg } ctx={ ctx } />
				) : (
					<Inspeccionable
						key={ j }
						text={ seg.t }
						senyal={ seg.senyal }
						ctx={ ctx }
					/>
				)
			) }
		</p>
	) );
}
