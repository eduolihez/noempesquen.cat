import { createRoot } from '@wordpress/element';
import { App } from './simulador/App';

document
	.querySelectorAll( '.wp-block-noempesquen-simulador' )
	.forEach( ( el ) => {
		let config = {};
		try {
			config = JSON.parse( el.dataset.config || '{}' );
		} catch {
			config = {};
		}
		createRoot( el ).render( <App config={ config } /> );
	} );
