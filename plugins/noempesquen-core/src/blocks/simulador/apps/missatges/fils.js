/**
 * Ajudes pures de Missatges (sense JSX): quins fils es veuen, de qui és
 * cada número, què queda després d'esborrar i a qui es pot reenviar.
 *
 * Esborrats i bloquejats són estat local de la interfície; al motor només
 * li arriben els esdeveniments ({ app, id } o { id } del contacte).
 */
import { comparador } from '../../nucli/idioma.js';
import { visible } from '../../nucli/motor.js';
import { ordenaXats } from '../parla/xats.js';

/* Xats de Parla als quals es pot reenviar un SMS. */
export const DESTINS_REENVIA = [ 'familia', 'pau', 'marta' ];

/* Espais (\s inclou els no separables) reduïts a un de sol i sense extrems. */
const normalitza = ( text ) =>
	String( text ?? '' )
		.replace( /\s+/g, ' ' )
		.trim();

/**
 * Id del contacte del món que té aquest nom (o número), si n'hi ha.
 *
 * @param {Object} mon Món (mon.contactes).
 * @param {string} nom Nom o número tal com el mostra el remitent.
 * @return {?string} Id del contacte o null.
 */
export function contacteDe( mon, nom ) {
	const cercat = normalitza( nom );
	return (
		( mon?.contactes ?? [] ).find( ( c ) => normalitza( c.nom ) === cercat )
			?.id ?? null
	);
}

/**
 * Fils de conversa que es veuen ara: els SMS de la missió (si el motor els
 * ha mostrat), agrupats per remitent, i els fils de farciment del món. Del
 * més recent al més antic.
 *
 * Forma: { id, nom, contacte, senyal, missatges: [{ id, de, hora, cos|text }] }.
 *
 * @param {Object} estat  Estat del motor.
 * @param {Object} mon    Món (mon.missatges.fils, mon.contactes).
 * @param {Object} missio Missió (missio.apps.missatges.missatges).
 * @return {Object[]} Fils ordenats (llista nova).
 */
export function filsVisibles( estat, mon, missio ) {
	const perId = new Map();
	( mon?.missatges?.fils ?? [] ).forEach( ( f ) => {
		perId.set( f.id, {
			id: f.id,
			nom: f.nom,
			contacte: contacteDe( mon, f.nom ) ?? f.id,
			senyal: null,
			missatges: ( f.missatges ?? [] ).map( ( m, i ) => ( {
				id: `${ f.id }-${ i }`,
				de: m.de,
				hora: m.hora,
				text: m.text,
			} ) ),
		} );
	} );
	( missio?.apps?.missatges?.missatges ?? [] )
		.filter( ( sms ) => visible( estat, sms ) )
		.forEach( ( sms ) => {
			const nom = sms.remitent?.nom ?? '';
			const contacte =
				sms.remitent?.contacte ??
				contacteDe( mon, nom ) ??
				`num:${ normalitza( nom ) }`;
			const fil = perId.get( contacte ) ?? {
				id: contacte,
				nom,
				contacte,
				senyal: null,
				missatges: [],
			};
			fil.senyal = fil.senyal ?? sms.remitent?.senyal ?? null;
			fil.missatges = [
				...fil.missatges,
				{
					id: sms.id,
					de: 'ella',
					hora: sms.hora,
					cos: sms.cos,
					missio: true,
				},
			];
			perId.set( contacte, fil );
		} );
	return ordenaXats( [ ...perId.values() ] );
}

/**
 * Treu els missatges esborrats i els fils que queden buits.
 *
 * @param {Object[]} fils      Fils visibles.
 * @param {Set}      esborrats Ids de missatges esborrats.
 * @return {Object[]} Fils que es mostren a la llista.
 */
export function senseEsborrats( fils, esborrats ) {
	return fils
		.map( ( f ) => ( {
			...f,
			missatges: f.missatges.filter( ( m ) => ! esborrats.has( m.id ) ),
		} ) )
		.filter( ( f ) => f.missatges.length > 0 );
}

/**
 * Contactes i números localitzables des de la llista de contactes: un per
 * fil, encara que la conversa s'hagi esborrat (la fitxa sobreviu).
 *
 * @param {Object[]} fils Fils visibles (abans d'esborrar).
 * @param {Object}   mon  Món (per al rol del contacte).
 * @return {Object[]} { id, nom, senyal, rol } ordenats per nom.
 */
export function contactesLocalitzables( fils, mon ) {
	const vistos = new Map();
	fils.forEach( ( f ) => {
		if ( ! vistos.has( f.contacte ) ) {
			const dades = ( mon?.contactes ?? [] ).find(
				( c ) => c.id === f.contacte
			);
			vistos.set( f.contacte, {
				id: f.contacte,
				nom: f.nom,
				senyal: f.senyal,
				rol: dades?.rol ?? null,
			} );
		}
	} );
	return [ ...vistos.values() ].sort( ( a, b ) =>
		comparador()( a.nom, b.nom )
	);
}

/**
 * Text pla d'un missatge (vista prèvia i etiquetes accessibles).
 *
 * @param {Object} m Missatge { text } o { cos: [[{ t } | { enllac: { text } }]] }.
 * @return {string} Text sense format.
 */
export function textPla( m ) {
	if ( typeof m?.text === 'string' ) {
		return m.text;
	}
	return ( m?.cos ?? [] )
		.map( ( paragraf ) =>
			paragraf
				.map(
					( seg ) => ( seg.enllac ? seg.enllac.text : seg.t ) ?? ''
				)
				.join( '' )
		)
		.join( ' ' );
}

/**
 * Destins del reenviament amb el nom del xat de Parla.
 *
 * @param {Object} mon Món (mon.parla.xats).
 * @return {{id:string, nom:string}[]} Destins en ordre fix.
 */
export function destinsReenvia( mon ) {
	const xats = mon?.parla?.xats ?? [];
	return DESTINS_REENVIA.map( ( id ) => ( {
		id,
		nom: xats.find( ( x ) => x.id === id )?.nom ?? id,
	} ) );
}

/**
 * Missatge al qual va una resposta: el triat al menú si és d'aquest fil;
 * si no, l'últim rebut.
 *
 * @param {Object}  fil     Fil.
 * @param {?string} triatId Id triat amb «Respon» al menú.
 * @return {?string} Id del missatge o null.
 */
export function destiResposta( fil, triatId ) {
	if (
		triatId &&
		( fil?.missatges ?? [] ).some( ( m ) => m.id === triatId )
	) {
		return triatId;
	}
	return darrerRebut( fil )?.id ?? null;
}

/**
 * Últim missatge rebut d'un fil (al qual va la resposta), o null.
 *
 * @param {Object} fil Fil.
 * @return {?Object} Missatge.
 */
export function darrerRebut( fil ) {
	const rebuts = ( fil?.missatges ?? [] ).filter( ( m ) => m.de !== 'jo' );
	return rebuts[ rebuts.length - 1 ] ?? null;
}
