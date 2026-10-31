import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';
import './style.scss';

function Edit() {
	const blockProps = useBlockProps( { className: 'nep-contacte' } );
	return (
		<div { ...blockProps }>
			<p>
				{ __(
					'Formulari de contacte (es mostra a la pàgina publicada).',
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
