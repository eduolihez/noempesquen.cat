import { useEffect, useRef } from '@wordpress/element';
import { FASE } from '../nucli/motor';
import { creaMotorSo } from './tones';
import { deuSonar, idsNous } from './so-notificacio';
import { llegeixSons } from './preferencies';

/**
 * So de les notificacions noves (una nota per tanda). No substitueix l'avís
 * visual ni aria-live. Cal una interacció prèvia (política d'autoplay).
 *
 * @param {{current: ?HTMLElement}} arrel Contenidor arrel del simulador.
 * @param {Object}                  estat Estat del motor.
 */
export function useSoNotificacions( arrel, estat ) {
	const motor = useRef( null );
	const interaccio = useRef( false );
	const vistes = useRef( null );
	if ( ! vistes.current ) {
		vistes.current = new Set( estat.notificacions.map( ( n ) => n.id ) );
	}

	useEffect( () => {
		motor.current = creaMotorSo();
		const el = arrel.current;
		const marca = () => {
			interaccio.current = true;
			motor.current?.reprèn();
		};
		el?.addEventListener( 'pointerdown', marca );
		el?.addEventListener( 'keydown', marca );
		return () => {
			el?.removeEventListener( 'pointerdown', marca );
			el?.removeEventListener( 'keydown', marca );
			motor.current?.tanca();
			motor.current = null;
		};
	}, [ arrel ] );

	useEffect( () => {
		const noves = idsNous( vistes.current, estat.notificacions );
		if ( ! noves.length ) {
			return;
		}
		noves.forEach( ( id ) => vistes.current.add( id ) );
		let actiu = true;
		try {
			actiu = llegeixSons( window.localStorage );
		} catch {
			actiu = true;
		}
		if (
			deuSonar( {
				actiu,
				interaccio: interaccio.current,
				pausa: estat.pausa,
				silenci: estat.fase === FASE.BLOQUEIG,
				noves,
			} )
		) {
			motor.current?.reprodueix( 'missatge' );
		}
	}, [ estat.notificacions, estat.pausa, estat.fase ] );
}
