/**
 * Ajudes pures de Parla per als xats de la missió (sense JSX): fusió amb els
 * xats de farciment de mon.json, missatges visibles i si el camp de text és
 * actiu.
 */
import { visible } from '../../nucli/motor.js';
import { contacteDelXat, esDesconegut } from './desconegut.js';

/**
 * Xats que es veuen ara: els de farciment del món i els de la missió
 * (`apps.parla.xats`) amb almenys un missatge visible. Si un xat de la
 * missió té el mateix id que un de farciment (p. ex. `pau`), els seus
 * missatges s'hi afegeixen al final.
 *
 * Forma: { id, nom, contacte?, missatges: [{ de, text, hora, missio? }] }.
 *
 * @param {Object} estat  Estat del motor (`visibles`).
 * @param {Object} mon    Món (mon.parla.xats, mon.contactes).
 * @param {Object} missio Missió (missio.apps.parla.xats).
 * @return {Object[]} Xats (llista nova, sense ordenar).
 */
export function xatsVisibles( estat, mon, missio ) {
	const perId = new Map();
	( mon?.parla?.xats ?? [] ).forEach( ( x ) => perId.set( x.id, x ) );
	( missio?.apps?.parla?.xats ?? [] ).forEach( ( xm ) => {
		const nous = ( xm.missatges ?? [] )
			.filter( ( m ) => visible( estat, m ) )
			.map( ( m ) => ( {
				id: m.id,
				de: m.de,
				text: m.text,
				hora: m.hora ?? '',
				missio: true,
			} ) );
		if ( ! nous.length ) {
			return;
		}
		const base = perId.get( xm.id );
		const contacte = xm.contacte ?? base?.contacte;
		perId.set( xm.id, {
			id: xm.id,
			nom:
				xm.nom ??
				base?.nom ??
				( mon?.contactes ?? [] ).find( ( c ) => c.id === contacte )
					?.nom ??
				xm.id,
			...( contacte ? { contacte } : {} ),
			missatges: [ ...( base?.missatges ?? [] ), ...nous ],
		} );
	} );
	return [ ...perId.values() ];
}

/**
 * Indica si es pot escriure en un xat (que no és el del guia): només si el
 * contacte és a l'agenda, no és un número desconegut i no s'ha bloquejat.
 *
 * @param {Object}   xat        Xat { id, contacte? }.
 * @param {Object[]} contactes  Contactes de mon.json.
 * @param {Set}      bloquejats Ids de contactes bloquejats.
 * @return {boolean} Cert si el camp de text és actiu.
 */
export function xatEscriptible( xat, contactes, bloquejats = new Set() ) {
	const contacte = contacteDelXat( xat, contactes );
	return (
		!! contacte &&
		contacte.rol !== 'guia' &&
		! esDesconegut( contacte ) &&
		! bloquejats.has( contacte.id )
	);
}
