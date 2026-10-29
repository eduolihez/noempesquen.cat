/**
 * Què fa una tecla a la pantalla de bloqueig.
 *
 * - 'consumeix': desbloqueja i s'evita l'acció per defecte (Retorn, espai, imprimibles).
 * - 'deixa': desbloqueja sense tocar l'acció del navegador (fletxes, etc.).
 * - null: no fa res (Esc és la pausa; Tab, modificadors, F1-F12 i dreceres
 *   amb Ctrl/Meta/Alt són del navegador o de l'usuari).
 */
const IGNORADES = new Set( [
	'Escape',
	'Tab',
	'Shift',
	'Control',
	'Alt',
	'AltGraph',
	'Meta',
	'CapsLock',
] );
const FUNCIO = /^F\d{1,2}$/;

/**
 * @param {{key:string, ctrlKey:boolean, metaKey:boolean, altKey:boolean}} e Esdeveniment de teclat.
 * @return {?('consumeix'|'deixa')} Acció.
 */
export function teclaDesbloqueig( e ) {
	if (
		e.ctrlKey ||
		e.metaKey ||
		e.altKey ||
		IGNORADES.has( e.key ) ||
		FUNCIO.test( e.key )
	) {
		return null;
	}
	if ( e.key === 'Enter' || e.key.length === 1 ) {
		return 'consumeix';
	}
	return 'deixa';
}
