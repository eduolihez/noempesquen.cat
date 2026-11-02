import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/* Respostes que fan marxa enrere: es dibuixen més discretes. */
const SECUNDARIES = new Set( [ 'intro:salta', 'decisio:tornar' ] );

/**
 * Respostes ràpides en píndoles, a sobre del camp de text.
 *
 * En triar-ne una, el botó desapareix: el focus passa al grup i, quan
 * arriben les respostes noves (després de «escrivint…»), a la primera.
 *
 * @param {Object}            props
 * @param {Object[]}          props.respostes  [{ id, text }].
 * @param {(id:string)=>void} props.onResposta Rep l'id triat.
 */
export function Respostes( { respostes, onResposta } ) {
	const grup = useRef( null );
	const espera = useRef( false );
	const hiHa = respostes.length > 0;

	// Després de cada render: si s'esperaven respostes noves i el focus
	// encara és al grup, passa a la primera (també si l'id no canvia).
	useEffect( () => {
		const el = grup.current;
		if ( ! espera.current || ! hiHa || ! el ) {
			return;
		}
		espera.current = false;
		if ( el.ownerDocument.activeElement === el ) {
			el.querySelector( 'button' )?.focus();
		}
	} );

	// Només mentre la decisió és oberta, el grup és l'àncora «decisio».
	const esDecisio = respostes.some( ( x ) => x.id.startsWith( 'decisio:' ) );

	return (
		<div
			ref={ grup }
			className="nep-parla-respostes"
			data-tut={ esDecisio ? 'decisio' : 'parla-respostes' }
			role="group"
			aria-label={ __( 'Respostes ràpides', 'noempesquen' ) }
			tabIndex={ -1 }
		>
			{ respostes.map( ( r ) => (
				<button
					key={ r.id }
					type="button"
					className={ `nep-parla-resposta${
						SECUNDARIES.has( r.id ) ? ' is-secundaria' : ''
					}` }
					onClick={ () => {
						espera.current = true;
						grup.current?.focus( { preventScroll: true } );
						onResposta( r.id );
					} }
				>
					{ r.text }
				</button>
			) ) }
		</div>
	);
}
