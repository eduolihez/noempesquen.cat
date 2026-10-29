import { createContext, useContext } from '@wordpress/element';

export const JocContext = createContext( null );

/**
 * Accés al joc des de qualsevol component del sistema simulat.
 *
 * @return {{missio:Object, mon:Object, estat:Object, dispatch:Function, emet:Function, hora:string, nomGuia:string, Avatar:Function, registraMenu:Function}} Context del joc.
 */
export function useJoc() {
	const ctx = useContext( JocContext );
	if ( ! ctx ) {
		throw new Error( 'useJoc ha de cridar-se dins de <Simulador>.' );
	}
	return ctx;
}
