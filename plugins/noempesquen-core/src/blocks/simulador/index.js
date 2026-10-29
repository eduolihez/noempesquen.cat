import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';
import './style.scss';

function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps( {
		className: 'nep-sim nep-sim--editor',
	} );
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Dispositiu', 'noempesquen' ) }>
					<SelectControl
						label={ __( 'Dispositiu inicial', 'noempesquen' ) }
						value={ attributes.dispositiu }
						options={ [
							{
								label: __(
									'Automàtic segons la pantalla',
									'noempesquen'
								),
								value: 'auto',
							},
							{
								label: __( 'Ordinador', 'noempesquen' ),
								value: 'pc',
							},
							{
								label: __( 'Mòbil', 'noempesquen' ),
								value: 'mobil',
							},
						] }
						onChange={ ( dispositiu ) =>
							setAttributes( { dispositiu } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<p>
					{ __(
						'Simulador No em pesquen (es mostra a la pàgina publicada).',
						'noempesquen'
					) }
				</p>
			</div>
		</>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => null,
} );
