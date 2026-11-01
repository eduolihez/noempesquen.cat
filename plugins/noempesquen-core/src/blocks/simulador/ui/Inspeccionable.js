import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useJoc } from '../simulador/context';
import { indicis } from '../nucli/motor';
import { clauXip, potInspeccionar, textXip } from '../nucli/lupa';
import { MS_XIP_LUPA } from '../nucli/temps';
import { separaEspais } from './espais';

/**
 * Text que, amb la lupa activa, es pot inspeccionar.
 *
 * Després d'inspeccionar-lo mostra un xip breu (via `data-xip`, fora del
 * text del DOM); el lector de pantalla el llegeix des de `AvisLupa`.
 *
 * @param {Object} props        Propietats.
 * @param {string} props.text   Text a mostrar.
 * @param {string} props.senyal Identificador del senyal, si n'és un.
 * @param {string} props.as     Etiqueta HTML quan la lupa està apagada.
 */
export function Inspeccionable( { text, senyal, as: Tag = 'span' } ) {
	const { missio, estat, dispatch } = useJoc();
	const trobat = !! senyal && estat.trobats.includes( senyal );
	// Clau de la inspecció feta des d'aquest text (només local).
	const [ meva, setMeva ] = useState( null );
	const ultima = estat.ultimaInspeccio;
	const mostra = meva !== null && ultima?.clau === meva;

	useEffect( () => {
		if ( ! mostra ) {
			return;
		}
		const t = setTimeout( () => setMeva( null ), MS_XIP_LUPA );
		return () => clearTimeout( t );
	}, [ mostra, meva ] );

	if ( ! estat.lupa ) {
		return (
			<Tag className={ trobat ? 'nep-marcat' : undefined }>{ text }</Tag>
		);
	}
	const xip = mostra
		? clauXip( ultima.tipus, indicis( missio, estat ).complet )
		: null;
	// Els espais dels extrems queden fora del botó: si no, es perden.
	const { abans, nucli, despres } = separaEspais( text );
	return (
		<>
			{ abans }
			<button
				type="button"
				className={ [
					'nep-inspecciona',
					trobat && 'nep-marcat',
					xip && `is-xip is-xip-${ xip }`,
				]
					.filter( Boolean )
					.join( ' ' ) }
				data-xip={ xip ? textXip( xip ) : undefined }
				onClick={ () => {
					// Si el motor ignorarà la inspecció, no reserva cap clau:
					// la següent (d'un altre text) hi coincidiria.
					if ( potInspeccionar( estat ) ) {
						setMeva( ( ultima?.clau ?? 0 ) + 1 );
					}
					dispatch( {
						tipus: 'INSPECCIONA',
						senyal: senyal ?? null,
					} );
				} }
				aria-pressed={ trobat }
				aria-label={ sprintf(
					/* translators: %s: text inspeccionable */
					__( 'Inspecciona: %s', 'noempesquen' ),
					nucli
				) }
			>
				{ nucli }
			</button>
			{ despres }
		</>
	);
}
