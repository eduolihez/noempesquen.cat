import { useEffect, useRef, useState } from '@wordpress/element';
import { useJoc } from '../../simulador/context';
import { RETARD_PISTA } from '../../nucli/temps.js';

/* `RETARD_PISTA` ha de coincidir amb el `transition-delay` de `.nep-so-pista`; amb moviment
   reduït no hi ha transició i la pista es veu a l'instant. */

const REDUIT = '(prefers-reduced-motion: reduce)';
const AMB_PISTA = ':scope > .nep-so-pista';

/**
 * Element de dins de `nav` que ara mostra la pista: el que té el ratolí a
 * sobre o el focus de teclat. Null si cap.
 *
 * @param {HTMLElement} nav Contenidor.
 * @return {?HTMLElement} Element amb la pista visible.
 */
function ambPista( nav ) {
	const candidats = nav.querySelectorAll( ':hover, :focus-visible' );
	return (
		[ ...candidats ]
			.reverse()
			.find( ( el ) => el.querySelector( AMB_PISTA ) ) ?? null
	);
}

/**
 * Pistes flotants descartables amb Esc (WCAG 1.4.13): mentre se'n veu una,
 * Esc l'amaga (i no obre la pausa); torna a sortir en canviar de botó.
 *
 * @param {Object} ref Ref del contenidor de les pistes.
 * @return {boolean} La pista actual està amagada.
 */
export function usePistaDescartable( ref ) {
	const { registraMenu } = useJoc();
	const [ origen, setOrigen ] = useState( null );
	const [ descartada, setDescartada ] = useState( null );
	const actual = useRef( null );

	useEffect( () => {
		const nav = ref.current;
		let temps = null;
		const recalcula = () => {
			clearTimeout( temps );
			// Després de l'esdeveniment, quan :hover i :focus ja s'han mogut.
			temps = setTimeout( () => {
				const nou = ambPista( nav );
				if ( nou !== actual.current ) {
					actual.current = nou;
					setOrigen( nou );
					setDescartada( null );
				}
			} );
		};
		const tipus = [ 'pointerover', 'pointerout', 'focusin', 'focusout' ];
		tipus.forEach( ( t ) => nav.addEventListener( t, recalcula ) );
		return () => {
			clearTimeout( temps );
			tipus.forEach( ( t ) => nav.removeEventListener( t, recalcula ) );
		};
	}, [ ref ] );

	// Només es registra (i consumeix Esc) quan la pista ja és visible.
	useEffect( () => {
		if ( ! origen || descartada === origen ) {
			return undefined;
		}
		let desregistra = null;
		const cal = () => setDescartada( origen );
		const reduit = window.matchMedia( REDUIT ).matches;
		let temps = null;
		if ( reduit ) {
			desregistra = registraMenu( cal );
		} else {
			temps = setTimeout( () => {
				desregistra = registraMenu( cal );
			}, RETARD_PISTA );
		}
		return () => {
			clearTimeout( temps );
			desregistra?.();
		};
	}, [ origen, descartada, registraMenu ] );

	return !! origen && descartada === origen;
}
