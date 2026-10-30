import { useEffect, useRef } from '@wordpress/element';
import { FASE } from '../nucli/motor';
import { creaMotorSo } from './tones';
import { deuSonar, idsNous } from './so-notificacio';
import { emmagatzem, llegeixSons } from './preferencies';

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

	const faseAnterior = useRef( estat.fase );

	useEffect( () => {
		const enJoc = estat.fase === FASE.JOC;
		const veniaDeJoc = faseAnterior.current === FASE.JOC;
		faseAnterior.current = estat.fase;
		if ( ! estat.notificacions.length ) {
			vistes.current = new Set();
			return;
		}
		const noves = idsNous( vistes.current, estat.notificacions );
		if ( ! noves.length ) {
			return;
		}
		// Es marquen vistes encara que no sonin: el que arriba en pausa (o
		// mentre es demana girar) no sona en reprendre. És intencionat: un
		// so endarrerit no correspon a cap avís visual nou.
		noves.forEach( ( id ) => vistes.current.add( id ) );
		// El lot que crea desbloquejar (bloqueig -> joc) no sona.
		if ( ! veniaDeJoc ) {
			return;
		}
		const soActivat = llegeixSons( emmagatzem() );
		if (
			deuSonar( {
				soActivat,
				interaccio: interaccio.current,
				pausa: estat.pausa,
				enJoc,
				noves,
			} )
		) {
			motor.current?.reprodueix( 'missatge' );
		}
	}, [ estat.notificacions, estat.pausa, estat.fase ] );
}
