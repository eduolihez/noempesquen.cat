import { createContext, useContext } from '@wordpress/element';

export const MobilContext = createContext( null );

/**
 * Serveis propis del mòbil per a les apps (a més de `useSistema()` de
 * `sistemes/pc/context`, que el mòbil també proveeix amb el mateix
 * contracte: { obreApp, notificacions }).
 *
 * - obreApp( app, dades ): obre l'app (o la porta a dalt de la pila).
 * - enrere(): com el botó «Enrere» del sistema.
 * - inici(): torna a la pantalla d'inici.
 * - appActiva: id de l'app en primer pla, o null a l'inici.
 * - registraEnrere( fn ): l'app intercepta «Enrere» (navegació interna);
 *   fn() retorna true si l'ha gestionat. Retorna la funció per desregistrar.
 *
 * @return {{obreApp: Function, enrere: Function, inici: Function, appActiva: ?string, registraEnrere: Function}} Serveis del mòbil.
 */
export function useMobil() {
	const ctx = useContext( MobilContext );
	if ( ! ctx ) {
		throw new Error( 'useMobil ha de cridar-se dins del mòbil.' );
	}
	return ctx;
}
