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
