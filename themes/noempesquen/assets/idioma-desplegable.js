/**
 * Desplegable d'idioma de la capçalera: tanca amb Esc, clic fora o en sortir el focus.
 * Sense aquest script el <details> s'obre i es tanca igualment.
 */
( function () {
	var detalls = document.querySelector( '.nep-idioma__desplegable' );
	if ( ! detalls ) {
		return;
	}
	var boto = detalls.querySelector( '.nep-idioma__boto' );

	function tanca( tornaFocus ) {
		if ( ! detalls.open ) {
			return;
		}
		detalls.open = false;
		if ( tornaFocus && boto ) {
			boto.focus();
		}
	}

	// El català és l'idioma per defecte (el servidor redirigeix el castellà a /ca/):
	// triar castellà al selector desa la preferència; triar català l'esborra.
	detalls.addEventListener( 'click', function ( e ) {
		var enllac = e.target.closest ? e.target.closest( 'a[hreflang]' ) : null;
		if ( ! enllac ) {
			return;
		}
		var es = 'es' === enllac.getAttribute( 'hreflang' );
		document.cookie =
			'nep_idioma=' +
			( es ? 'es' : '' ) +
			'; path=/; SameSite=Lax; max-age=' +
			( es ? 31536000 : 0 );
	} );

	detalls.addEventListener( 'keydown', function ( e ) {
		if ( 'Escape' === e.key && detalls.open ) {
			e.preventDefault();
			e.stopPropagation();
			tanca( true );
		}
	} );
	document.addEventListener( 'click', function ( e ) {
		if ( ! detalls.contains( e.target ) ) {
			tanca( false );
		}
	} );
	detalls.addEventListener( 'focusout', function ( e ) {
		if ( e.relatedTarget && ! detalls.contains( e.relatedTarget ) ) {
			tanca( false );
		}
	} );
}() );
