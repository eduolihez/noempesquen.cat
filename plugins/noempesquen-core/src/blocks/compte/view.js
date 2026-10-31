import { createRoot } from '@wordpress/element';
import { Compte } from './Compte';

document.querySelectorAll( '.wp-block-noempesquen-compte' ).forEach( ( el ) => {
	let config = {};
	try {
		config = JSON.parse( el.dataset.config || '{}' );
	} catch {
		config = {};
	}
	createRoot( el ).render( <Compte config={ config } /> );
} );
