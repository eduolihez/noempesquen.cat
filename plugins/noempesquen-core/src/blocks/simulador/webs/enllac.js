/**
 * Només es poden seguir enllaços http i https.
 *
 * @param {*} url Destí.
 * @return {boolean} Cert si és una URL http(s) en text.
 */
export function esUrlNavegable( url ) {
	return typeof url === 'string' && /^https?:\/\//i.test( url );
}

/**
 * Propietats d'un <a> dins del navegador simulat: mostra la URL a la barra
 * d'estat en passar-hi o enfocar-lo i mai deixa que el navegador real hi vagi
 * (ni amb el menú contextual ni arrossegant-lo a una pestanya real).
 *
 * @param {string}   url        Destí.
 * @param {Function} accio      Crida amb la URL en fer-hi clic (o clic del mig).
 * @param {Function} onHoverUrl Barra d'estat: URL o null.
 * @return {Object} Propietats per a l'enllaç.
 */
export function propsEnllac( url, accio, onHoverUrl ) {
	if ( ! esUrlNavegable( url ) ) {
		// Enllaç inert: sense href ni acció, i sense navegar mai de debò.
		const atura = ( e ) => e.preventDefault();
		return {
			onClick: atura,
			onAuxClick: atura,
			onContextMenu: atura,
			onDragStart: atura,
		};
	}
	return {
		href: url,
		onClick: ( e ) => {
			e.preventDefault();
			accio( url );
		},
		onAuxClick: ( e ) => {
			e.preventDefault();
			if ( e.button === 1 ) {
				accio( url );
			}
		},
		onContextMenu: ( e ) => e.preventDefault(),
		onDragStart: ( e ) => e.preventDefault(),
		onMouseEnter: () => onHoverUrl?.( url ),
		onMouseLeave: () => onHoverUrl?.( null ),
		onFocus: () => onHoverUrl?.( url ),
		onBlur: () => onHoverUrl?.( null ),
	};
}
