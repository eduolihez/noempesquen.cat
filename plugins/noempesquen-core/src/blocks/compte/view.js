import { createRoot } from '@wordpress/element';
import { Compte } from './Compte';
import { consumeixTokenUrl } from '../../compte/enllac';

// Abans de res més: el token surt de la URL (historial i Referer).
const accio = consumeixTokenUrl( window );

document.querySelectorAll( '.wp-block-noempesquen-compte' ).forEach( ( el ) => {
	let config = {};
	try {
		config = JSON.parse( el.dataset.config || '{}' );
	} catch {
		config = {};
	}
	createRoot( el ).render( <Compte config={ { ...config, accio } } /> );
} );
