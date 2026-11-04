import { registerBlockType } from '@wordpress/blocks';
import {
	useBlockProps,
	useInnerBlocksProps,
	InnerBlocks,
	InspectorControls,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadCheck,
} from '@wordpress/block-editor';
import { Button, Notice, PanelBody, TextControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';

const BLOCS_TRANSCRIPCIO = [ 'core/paragraph', 'core/list', 'core/heading' ];
const PLANTILLA_TRANSCRIPCIO = [
	[ 'core/heading', { level: 3, levelOptions: [ 3, 4 ] } ],
	[ 'core/paragraph' ],
];

/**
 * Fitxer de la biblioteca: botó per triar-lo, nom del fitxer actual i botó per treure'l.
 *
 * @param {Object}               props
 * @param {string}               props.etiqueta Text de l'etiqueta.
 * @param {number}               props.id       Id de l'adjunt (0 si no n'hi ha).
 * @param {string[]}             props.tipus    Tipus permesos a la biblioteca.
 * @param {(id: number) => void} props.onCanvia Rep el nou id (0 per treure'l).
 */
function Fitxer( { etiqueta, id, tipus, onCanvia } ) {
	const media = useSelect(
		( select ) => ( id ? select( coreStore ).getMedia( id ) : null ),
		[ id ]
	);
	let nom = __( 'Cap fitxer', 'noempesquen' );
	if ( id ) {
		nom = media?.source_url
			? media.source_url.split( '/' ).pop()
			: __( 'Fitxer no trobat', 'noempesquen' );
	}
	return (
		<div className="nep-video__fitxer">
			<p>
				<strong>{ etiqueta }</strong>
				<br />
				{ nom }
			</p>
			<MediaUploadCheck>
				<MediaUpload
					allowedTypes={ tipus }
					value={ id }
					onSelect={ ( m ) => onCanvia( m?.id || 0 ) }
					render={ ( { open } ) => (
						<Button variant="secondary" onClick={ open }>
							{ id
								? __( 'Canvia', 'noempesquen' )
								: __( 'Tria', 'noempesquen' ) }
						</Button>
					) }
				/>
			</MediaUploadCheck>
			{ !! id && (
				<Button
					variant="link"
					isDestructive
					onClick={ () => onCanvia( 0 ) }
				>
					{ __( 'Treu', 'noempesquen' ) }
				</Button>
			) }
		</div>
	);
}

function Edit( { attributes, setAttributes, clientId } ) {
	const { video, poster, subtitolsCa, subtitolsEs, durada, missio, tema } =
		attributes;
	const { mediaVideo, mediaPoster } = useSelect(
		( select ) => ( {
			mediaVideo: video ? select( coreStore ).getMedia( video ) : null,
			mediaPoster: poster ? select( coreStore ).getMedia( poster ) : null,
		} ),
		[ video, poster ]
	);
	const transcripcioBuida = useSelect(
		( select ) =>
			! select( 'core/block-editor' )
				.getBlocks( clientId )
				.some( ( b ) => {
					const t = b.attributes?.content;
					return (
						'core/list' === b.name ||
						( typeof t === 'string' ? t : t?.text || '' ).trim() !==
							''
					);
				} ),
		[ clientId ]
	);
	const blockProps = useBlockProps( { className: 'nep-video' } );
	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'nep-video__text' },
		{
			allowedBlocks: BLOCS_TRANSCRIPCIO,
			template: PLANTILLA_TRANSCRIPCIO,
		}
	);

	const avisos = [];
	if ( ! video ) {
		avisos.push(
			__(
				'Falta el vídeo MP4: sense vídeo, la pàgina pública no mostra res.',
				'noempesquen'
			)
		);
	}
	if ( ! subtitolsCa && ! subtitolsEs ) {
		avisos.push( __( 'Falten els subtítols (VTT).', 'noempesquen' ) );
	}
	if ( transcripcioBuida ) {
		avisos.push(
			__(
				'Falta la transcripció: sense ella, la pàgina no cobreix l’alternativa en text del vídeo.',
				'noempesquen'
			)
		);
	}

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Fitxers', 'noempesquen' ) }>
					<Fitxer
						etiqueta={ __( 'Vídeo (MP4)', 'noempesquen' ) }
						id={ video }
						tipus={ [ 'video' ] }
						onCanvia={ ( id ) => setAttributes( { video: id } ) }
					/>
					<Fitxer
						etiqueta={ __( 'Imatge de portada', 'noempesquen' ) }
						id={ poster }
						tipus={ [ 'image' ] }
						onCanvia={ ( id ) => setAttributes( { poster: id } ) }
					/>
					<Fitxer
						etiqueta={ __(
							'Subtítols en català (VTT)',
							'noempesquen'
						) }
						id={ subtitolsCa }
						tipus={ [ 'text/vtt' ] }
						onCanvia={ ( id ) =>
							setAttributes( { subtitolsCa: id } )
						}
					/>
					<Fitxer
						etiqueta={ __(
							'Subtítols en castellà (VTT)',
							'noempesquen'
						) }
						id={ subtitolsEs }
						tipus={ [ 'text/vtt' ] }
						onCanvia={ ( id ) =>
							setAttributes( { subtitolsEs: id } )
						}
					/>
				</PanelBody>
				<PanelBody title={ __( 'Dades', 'noempesquen' ) }>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						type="number"
						min={ 0 }
						label={ __( 'Durada (segons)', 'noempesquen' ) }
						help={ __(
							'Opcional: només es fa servir si WordPress no pot llegir la durada del fitxer MP4.',
							'noempesquen'
						) }
						value={ durada || '' }
						onChange={ ( v ) =>
							setAttributes( {
								durada: Math.max( 0, parseInt( v, 10 ) || 0 ),
							} )
						}
					/>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Tema', 'noempesquen' ) }
						value={ tema }
						onChange={ ( v ) => setAttributes( { tema: v } ) }
					/>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Id de la missió', 'noempesquen' ) }
						help={ __(
							'Per exemple, llissa-01-factura. Si no existeix, no es mostra l’enllaç al simulador.',
							'noempesquen'
						) }
						value={ missio }
						onChange={ ( v ) =>
							setAttributes( { missio: v.trim() } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ avisos.map( ( text ) => (
					<Notice
						key={ text }
						status="warning"
						isDismissible={ false }
					>
						{ text }
					</Notice>
				) ) }
				{ video ? (
					<div className="nep-video__marc">
						{  }
						<video
							controls
							preload="metadata"
							src={ mediaVideo?.source_url }
							poster={ mediaPoster?.source_url }
						/>
					</div>
				) : (
					<MediaPlaceholder
						icon="video-alt3"
						labels={ {
							title: __( 'Vídeo', 'noempesquen' ),
							instructions: __(
								'Puja un MP4 o tria’l de la biblioteca.',
								'noempesquen'
							),
						} }
						accept="video/mp4"
						allowedTypes={ [ 'video' ] }
						onSelect={ ( m ) =>
							setAttributes( { video: m?.id || 0 } )
						}
					/>
				) }
				<h3 className="nep-video__etiqueta">
					{ __( 'Transcripció', 'noempesquen' ) }
				</h3>
				<div { ...innerBlocksProps } />
			</div>
		</>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );
