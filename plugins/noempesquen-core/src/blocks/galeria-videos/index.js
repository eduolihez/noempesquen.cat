import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';

function Edit() {
	const blockProps = useBlockProps( { className: 'nep-galeria-videos' } );
	return (
		<div { ...blockProps }>
			<p>
				{ __(
					'Galeria de vídeos (llista les pàgines filles de Vídeos a la pàgina publicada).',
					'noempesquen'
				) }
			</p>
		</div>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => null,
} );
