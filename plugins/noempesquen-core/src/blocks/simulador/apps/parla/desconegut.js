/**
 * Ajudes pures de Parla per als números desconeguts (sense JSX): decidir si
 * un xat és d'un número que no és a l'agenda i quin avís li toca.
 */

/**
 * Contacte de mon.json d'un xat de farciment: el seu camp `contacte` o, si
 * no n'hi ha, el mateix id del xat.
 *
 * @param {?Object}   xat       Xat { id, contacte? }.
 * @param {Object[]=} contactes Contactes de mon.json.
 * @return {?Object} El contacte o null.
 */
export function contacteDelXat( xat, contactes ) {
	if ( ! xat ) {
		return null;
	}
	const id = xat.contacte ?? xat.id;
	return ( contactes ?? [] ).find( ( c ) => c.id === id ) ?? null;
}

/**
 * @param {?Object} contacte Contacte de mon.json.
 * @return {boolean} Cert si és un número desconegut.
 */
export function esDesconegut( contacte ) {
	return contacte?.rol === 'desconegut';
}

/**
 * Què es mostra a sobre de la conversa.
 *
 * @param {Object}  p
 * @param {?Object} p.contacte  Contacte del xat (o null).
 * @param {boolean} p.bloquejat Ja s'ha bloquejat.
 * @param {boolean} p.descartat S'ha tancat l'avís amb «Afegeix als contactes».
 * @return {'bloquejat'|'avis'|null} Estat de l'avís.
 */
export function estatAvis( { contacte, bloquejat, descartat } ) {
	if ( ! esDesconegut( contacte ) ) {
		return null;
	}
	if ( bloquejat ) {
		return 'bloquejat';
	}
	return descartat ? null : 'avis';
}
