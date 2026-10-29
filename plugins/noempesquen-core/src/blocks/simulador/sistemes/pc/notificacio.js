/**
 * Lògica pura (sense JSX) de la presentació d'una notificació del PC:
 * de quin tipus és, quin títol i quin origen porta. Les icones i els
 * components els tria Notificacions.js a partir del resultat.
 */

/**
 * Nom curt del propietari del mòbil vinculat («Àlex Puig» → «Àlex»).
 *
 * @param {string} [nom] Nom complet del jugador.
 * @return {string} Primer nom.
 */
export function nomCurt( nom ) {
	return ( nom || 'Àlex Puig' ).trim().split( /\s+/ )[ 0 ];
}

/**
 * Etiqueta d'origen d'una notificació del mòbil vinculat.
 *
 * @param {string} nomJugador Nom del jugador.
 * @param {string} nomApp     Nom de l'app mòbil (o buit si no es coneix).
 * @return {string} Per exemple «Mòbil d'Àlex · Missatges».
 */
export function etiquetaMobil( nomJugador, nomApp ) {
	const dispositiu = `Mòbil d'${ nomCurt( nomJugador ) }`;
	return nomApp ? `${ dispositiu } · ${ nomApp }` : dispositiu;
}

/**
 * Clau d'agrupació al centre: el mateix id d'app del mòbil i del PC
 * són grups diferents.
 *
 * @param {Object} n Notificació.
 * @return {string} Clau.
 */
export function clauGrup( n ) {
	return `${ n.font === 'mobil' ? 'mobil' : 'pc' }:${ n.app }`;
}

/**
 * Decideix la presentació d'una notificació.
 *
 * @param {Object} n                 Notificació { app, titol, text, font? }.
 * @param {Object} ctx
 * @param {Object} ctx.mon           Món (jugador, contactes).
 * @param {string} ctx.nomGuia       Nom del guia.
 * @param {Object} ctx.nomsAppsPc    Mapa id → nom de les apps del PC.
 * @param {Object} ctx.nomsAppsMobil Mapa id → nom de les apps del mòbil.
 * @return {{tipus:string, app:string, titol:string, iconaApp:?string}}
 *   tipus: 'parla' | 'posta' | 'mobil' | 'app'. `iconaApp` és l'id de l'app
 *   del mòbil si té icona pròpia (si no, només s'usa la icona de mòbil).
 */
export function presenta(
	n,
	{ mon, nomGuia, nomsAppsPc = {}, nomsAppsMobil = {} }
) {
	if ( n.font === 'mobil' ) {
		const nomApp = nomsAppsMobil[ n.app ];
		return {
			tipus: 'mobil',
			app: etiquetaMobil( mon?.jugador?.nom, nomApp ),
			titol: n.titol,
			iconaApp: nomApp ? n.app : null,
		};
	}
	if ( n.app === 'parla' ) {
		const contacte = mon?.contactes?.find( ( c ) => c.id === n.titol );
		return {
			tipus: 'parla',
			app: 'Parla',
			titol: contacte?.nom ?? nomGuia,
			iconaApp: null,
		};
	}
	if ( n.app === 'posta' ) {
		return { tipus: 'posta', app: 'Posta', titol: n.titol, iconaApp: null };
	}
	return {
		tipus: 'app',
		app: nomsAppsPc[ n.app ] ?? n.app,
		titol: n.titol,
		iconaApp: null,
	};
}
