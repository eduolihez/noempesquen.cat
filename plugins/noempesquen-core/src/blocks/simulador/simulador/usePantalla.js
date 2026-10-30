import { useEffect, useState } from '@wordpress/element';
import { calculaPantalla } from './pantalla';

/* Punter principal gruixut (dit): els portàtils tàctils amb ratolí no. */
const esTactil = () => !! window.matchMedia?.( '(pointer: coarse)' ).matches;
/* Només per triar el text («Gira el mòbil» o «Amplia la finestra»). */
const teTactil = () => ( window.navigator?.maxTouchPoints ?? 0 ) > 0;

function llegeix( dispositiu ) {
	const vp = window.visualViewport ?? window;
	const w = vp.width ?? vp.innerWidth;
	const h = vp.height ?? vp.innerHeight;
	const tactil = esTactil();
	return {
		...calculaPantalla( { w, h, tactil, dispositiu } ),
		tactil,
		mobil: tactil || teTactil(),
	};
}

const iguals = ( a, b ) => Object.keys( a ).every( ( k ) => a[ k ] === b[ k ] );

/**
 * Mode de pantalla del sistema simulat segons la finestra real.
 * S'actualitza en redimensionar o girar.
 *
 * @param {string} dispositiu 'pc' o 'mobil'.
 * @return {{mode:string,escala:number,ample:number,alt:number,desplX:number,desplY:number,tactil:boolean,mobil:boolean}} Mode i geometria.
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
