/**
 * Suggeriment d'idioma: mostra l'avís si el navegador és en català i no s'ha tancat.
 * No redirigeix ni fa servir galetes; només desa el tancament a localStorage.
 */
( function () {
	var avis = document.querySelector( '.nep-suggeriment' );
	var clau = 'noempesquen-suggeriment-idioma';
	var llengua = String( navigator.language || '' ).toLowerCase();
	if ( ! avis || llengua.indexOf( 'ca' ) !== 0 ) {
		return;
	}
	try {
		if ( window.localStorage.getItem( clau ) ) {
			return;
		}
	} catch ( e ) {
		// Sense localStorage: es mostra igualment.
	}
	avis.hidden = false;
	avis.querySelector( '.nep-suggeriment__tanca' ).addEventListener( 'click', function () {
		try {
			window.localStorage.setItem( clau, '1' );
		} catch ( e ) {
			// Sense localStorage: només es tanca en aquesta visita.
		}
		avis.hidden = true;
		// El focus no es perd: va al selector d'idioma de la capçalera.
		var selector = document.querySelector( '.nep-idioma__enllac' );
		if ( selector ) {
			selector.focus();
		}
	} );
}() );
