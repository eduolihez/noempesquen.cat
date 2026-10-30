import { useEffect, useState } from '@wordpress/element';
import { calculaPantalla } from './pantalla';

/* Punter principal gruixut (dit): els portàtils tàctils amb ratolí no. */
const esTactil = () => !! window.matchMedia?.( '(pointer: coarse)' ).matches;
/* Només per triar el text («Gira el mòbil» o «Amplia la finestra»). */
const teTactil = () => ( window.navigator?.maxTouchPoints ?? 0 ) > 0;

const NORMAL = { ...calculaPantalla(), tactil: false, mobil: false };

/*
 * Viewport de disseny (innerWidth/innerHeight), no el visual: el teclat en
 * pantalla o el pessic de zoom no han de reescalar el PC ni demanar girar.
 */
function llegeix( dispositiu ) {
	const tactil = esTactil();
	return {
		...calculaPantalla( {
			w: window.innerWidth,
			h: window.innerHeight,
			dispositiu,
		} ),
		tactil,
		mobil: tactil || teTactil(),
	};
}

const iguals = ( a, b ) => Object.keys( a ).every( ( k ) => a[ k ] === b[ k ] );

/**
 * Mode de pantalla del sistema simulat segons la finestra real.
 * S'actualitza en redimensionar o girar. Fora del PC és sempre normal i no
 * escolta res.
 *
 * @param {string} dispositiu 'pc' o 'mobil'.
 * @return {{mode:string,escala:number,ample:number,alt:number,desplX:number,desplY:number,tactil:boolean,mobil:boolean}} Mode i geometria.
 */
export function usePantalla( dispositiu ) {
	const esPc = dispositiu === 'pc';
	const [ pantalla, setPantalla ] = useState( () =>
		esPc ? llegeix( dispositiu ) : NORMAL
	);

	useEffect( () => {
		if ( ! esPc ) {
			return undefined;
		}
		const actualitza = () => {
			const nova = llegeix( dispositiu );
			setPantalla( ( ara ) => ( iguals( ara, nova ) ? ara : nova ) );
		};
		actualitza();
		window.addEventListener( 'resize', actualitza );
		window.addEventListener( 'orientationchange', actualitza );
		return () => {
			window.removeEventListener( 'resize', actualitza );
			window.removeEventListener( 'orientationchange', actualitza );
		};
	}, [ dispositiu, esPc ] );

	return esPc ? pantalla : NORMAL;
}
