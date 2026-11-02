import { useEffect, useRef } from '@wordpress/element';
import { FASE } from '../nucli/motor';
import { creaMotorSo } from './tones';
import { deuSonar, idsNous } from './so-notificacio';
import { emmagatzem, llegeixSons } from './preferencies';
import { AVIS_ENTRA } from './useCuaAvisos';

/**
 * So de les notificacions: un to per avís quan entra de debò a la vista
 * (esdeveniment AVIS_ENTRA dels toasts o banners), no quan arriba. Com que
 * les entrades van escalonades (MS_ENTRE_AVISOS), els sons no se solapen.
 * No substitueix l'avís visual ni aria-live. Cal una interacció prèvia
 * (política d'autoplay).
 *
 * @param {{current: ?HTMLElement}} arrel Contenidor arrel del simulador.
 * @param {Object}                  estat Estat del motor.
 */
export function useSoNotificacions( arrel, estat ) {
	const motor = useRef( null );
	const interaccio = useRef( false );
	const actual = useRef( estat );
	actual.current = estat;
	const vistes = useRef( null );
	// Ids que no han de sonar mai: el lot que crea desbloquejar (bloqueig ->
	// joc) i el que arriba fora de la fase de joc.
	const muts = useRef( new Set() );
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
		const entra = ( e ) => {
			const id = e.detail?.id;
			const { pausa, fase, notificacions } = actual.current;
			if (
				! muts.current.has( id ) &&
				deuSonar( {
					soActivat: llegeixSons( emmagatzem() ),
					interaccio: interaccio.current,
					pausa,
					enJoc: fase === FASE.JOC,
					noves: [ id ],
				} )
			) {
				// Els avisos de risc (efecte `notifica` amb `so: "alerta"`)
				// sonen «alerta»; la resta, «missatge».
				const n = notificacions.find( ( x ) => x.id === id );
				motor.current?.reprodueix(
					n?.so === 'alerta' ? 'alerta' : 'missatge'
				);
			}
		};
		el?.addEventListener( 'pointerdown', marca );
		el?.addEventListener( 'keydown', marca );
		el?.addEventListener( AVIS_ENTRA, entra );
		return () => {
			el?.removeEventListener( 'pointerdown', marca );
			el?.removeEventListener( 'keydown', marca );
			el?.removeEventListener( AVIS_ENTRA, entra );
			motor.current?.tanca();
			motor.current = null;
		};
	}, [ arrel ] );

	const faseAnterior = useRef( estat.fase );

	useEffect( () => {
		const veniaDeJoc = faseAnterior.current === FASE.JOC;
		faseAnterior.current = estat.fase;
		if ( ! estat.notificacions.length ) {
			vistes.current = new Set();
			muts.current = new Set();
			return;
		}
		const noves = idsNous( vistes.current, estat.notificacions );
		noves.forEach( ( id ) => vistes.current.add( id ) );
		if ( ! veniaDeJoc || estat.fase !== FASE.JOC ) {
			noves.forEach( ( id ) => muts.current.add( id ) );
		}
	}, [ estat.notificacions, estat.fase ] );
}
