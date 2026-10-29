import { useEffect } from '@wordpress/element';

const FOCALITZABLES = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled]):not([type="hidden"])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'iframe',
	'[tabindex]',
	'[contenteditable="true"]',
].join( ',' );
const SENSE_CONTINGUT = [ 'SCRIPT', 'STYLE', 'LINK', 'TEMPLATE' ];

/**
 * Elements de dins d'`arrel` on es pot arribar amb Tab, en ordre del DOM.
 *
 * @param {HTMLElement} arrel Contenidor.
 * @return {HTMLElement[]} Elements tabulables visibles.
 */
function tabulables( arrel ) {
	const vista = arrel.ownerDocument.defaultView;
	return [ ...arrel.querySelectorAll( FOCALITZABLES ) ].filter(
		( el ) =>
			el.tabIndex >= 0 &&
			! el.closest( '[inert]' ) &&
			el.getClientRects().length > 0 &&
			vista.getComputedStyle( el ).visibility !== 'hidden'
	);
}

/**
 * Si el focus ha caigut a <body> (s'ha esborrat l'element que el tenia),
 * el torna a l'arrel del simulador.
 *
 * @param {?HTMLElement} arrel Arrel `.nep-so`.
 */
export function recuperaFocus( arrel ) {
	const actiu = arrel?.ownerDocument.activeElement;
	if (
		arrel?.isConnected &&
		( ! actiu || actiu === arrel.ownerDocument.body )
	) {
		arrel.focus( { preventScroll: true } );
	}
}

/**
 * Fa `inert` tota la pàgina de fora de l'arrel (germans de cada avantpassat
 * fins a <body>) i, en desmuntar, ho deixa exactament com estava.
 *
 * @param {HTMLElement} arrel Arrel del simulador.
 * @return {Function} Desfà els canvis.
 */
function inertitzaFora( arrel ) {
	const marcats = [];
	const body = arrel.ownerDocument.body;
	for ( let el = arrel; el && el !== body; el = el.parentElement ) {
		for ( const germa of el.parentElement?.children ?? [] ) {
			if (
				germa !== el &&
				! germa.hasAttribute( 'inert' ) &&
				! SENSE_CONTINGUT.includes( germa.tagName )
			) {
				germa.setAttribute( 'inert', '' );
				marcats.push( germa );
			}
		}
	}
	return () => marcats.forEach( ( el ) => el.removeAttribute( 'inert' ) );
}

/**
 * Manté el focus i el cursor del lector de pantalla dins del simulador:
 * la pàgina de darrere és `inert` i Tab dona la volta dins de l'arrel.
 *
 * @param {Object} ref Ref de l'arrel `.nep-so`.
 */
export function useAillament( ref ) {
	useEffect( () => {
		const arrel = ref.current;
		const doc = arrel.ownerDocument;
		const desfes = inertitzaFora( arrel );

		const onKeyDown = ( e ) => {
			if (
				e.key !== 'Tab' ||
				e.defaultPrevented ||
				e.altKey ||
				e.ctrlKey ||
				e.metaKey
			) {
				return;
			}
			const llista = tabulables( arrel );
			const actiu = doc.activeElement;
			const fora = ! arrel.contains( actiu );
			if ( ! llista.length ) {
				e.preventDefault();
				arrel.focus( { preventScroll: true } );
			} else if (
				e.shiftKey &&
				( fora || actiu === arrel || actiu === llista[ 0 ] )
			) {
				e.preventDefault();
				llista.at( -1 ).focus();
			} else if (
				! e.shiftKey &&
				( fora || actiu === llista.at( -1 ) )
			) {
				e.preventDefault();
				llista[ 0 ].focus();
			}
		};
		doc.addEventListener( 'keydown', onKeyDown );
		return () => {
			doc.removeEventListener( 'keydown', onKeyDown );
			desfes();
		};
	}, [ ref ] );
}
