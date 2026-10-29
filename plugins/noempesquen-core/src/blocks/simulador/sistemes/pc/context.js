import { createContext, useContext } from '@wordpress/element';

export const SistemaContext = createContext( null );
export const FinestraContext = createContext( null );

/**
 * Serveis del sistema per a les apps.
 *
 * @return {{obreApp: Function, notificacions: Object[]}} obreApp( app, dades ) obre o enfoca una app.
 */
export function useSistema() {
	const ctx = useContext( SistemaContext );
	if ( ! ctx ) {
		throw new Error( 'useSistema ha de cridar-se dins del sistema.' );
	}
	return ctx;
}

/**
 * Serveis de la finestra que conté l'app.
 *
 * @return {{posaTitol: Function}} posaTitol( text ) canvia el títol de la finestra.
 */
export function useFinestra() {
	const ctx = useContext( FinestraContext );
	if ( ! ctx ) {
		throw new Error( "useFinestra ha de cridar-se dins d'una finestra." );
	}
	return ctx;
}
