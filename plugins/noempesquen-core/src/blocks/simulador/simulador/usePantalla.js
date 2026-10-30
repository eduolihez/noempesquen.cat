import { useEffect, useState } from '@wordpress/element';
import { calculaPantalla } from './pantalla';

const esTactil = () =>
	!! window.matchMedia?.( '(pointer: coarse)' ).matches ||
	( window.navigator?.maxTouchPoints ?? 0 ) > 0;

function llegeix( dispositiu ) {
	const vp = window.visualViewport ?? window;
	const w = vp.width ?? vp.innerWidth;
	const h = vp.height ?? vp.innerHeight;
	const tactil = esTactil();
	return { ...calculaPantalla( { w, h, tactil, dispositiu } ), tactil };
}

const iguals = ( a, b ) => Object.keys( a ).every( ( k ) => a[ k ] === b[ k ] );

/**
 * Mode de pantalla del sistema simulat segons la finestra real.
 * S'actualitza en redimensionar o girar.
 *
 * @param {string} dispositiu 'pc' o 'mobil'.
 * @return {{mode:string,escala:number,ample:number,alt:number,desplX:number,desplY:number,tactil:boolean}} Mode i geometria.
 */
export function usePantalla( dispositiu ) {
	const [ pantalla, setPantalla ] = useState( () => llegeix( dispositiu ) );

	useEffect( () => {
		const actualitza = () => {
			const nova = llegeix( dispositiu );
			setPantalla( ( ara ) => ( iguals( ara, nova ) ? ara : nova ) );
		};
		actualitza();
		const vv = window.visualViewport;
		window.addEventListener( 'resize', actualitza );
		window.addEventListener( 'orientationchange', actualitza );
		vv?.addEventListener( 'resize', actualitza );
		return () => {
			window.removeEventListener( 'resize', actualitza );
			window.removeEventListener( 'orientationchange', actualitza );
			vv?.removeEventListener( 'resize', actualitza );
		};
	}, [ dispositiu ] );

	return pantalla;
}
