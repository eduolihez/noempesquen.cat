import { createRoot } from '@wordpress/element';
import { Contacte } from './Contacte';

document
	.querySelectorAll( '.wp-block-noempesquen-contacte' )
	.forEach( ( el ) => {
		let config = {};
		try {
			config = JSON.parse( el.dataset.config || '{}' );
		} catch {
			config = {};
		}
		createRoot( el ).render( <Contacte config={ config } /> );
	} );
