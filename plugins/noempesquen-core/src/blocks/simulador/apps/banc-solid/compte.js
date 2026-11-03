/**
 * Dades i ajudes pures de l'app Banc Sòlid del mòbil (sense JSX).
 *
 * Privadesa: el que escriu el jugador a la transferència no surt mai del
 * camp. Aquest mòdul només valida; no desa res.
 */

import { __ } from '@wordpress/i18n';
import { nomPila, NOM_PER_DEFECTE } from '../../nucli/jugador.js';

export { NOM_PER_DEFECTE };
export const URL_APP = 'app://bancsolid';
export const FORMULARI_TRANSFERENCIA = 'transferencia';
export const IBAN_COMPTE = 'ES12 9999 1500 0512 3456 4821';
export const SALDO = 2348.62;

/**
 * Nom de pila del jugador.
 *
 * @param {?Object} mon Món de la missió ({ jugador: { nom } }).
 * @return {string} Primer mot del nom, o el per defecte.
 */
export const nomPilaJugador = nomPila;

export { formataImport } from '../../nucli/idioma.js';

/**
 * IBAN emmascarat: només es veuen el país i els quatre darrers dígits.
 *
 * @param {string} iban IBAN, amb o sense espais.
 * @return {string} Per exemple «ES12 •••• •••• •••• •••• 4821».
 */
export function mascaraIban( iban ) {
	const net = String( iban ?? '' ).replace( /\s+/g, '' );
	if ( net.length < 8 ) {
		return '••••';
	}
	const cap = net.slice( 0, 4 );
	const cua = net.slice( -4 );
	const mig = Math.ceil( ( net.length - 8 ) / 4 );
	return [ cap, ...Array( mig ).fill( '••••' ), cua ].join( ' ' );
}

/**
 * Moviments de farciment (comerços inventats), del més nou al més antic.
 * Coherents amb la web oficial: la compra de 24,90 € i el rebut de Llum Clara.
 *
 * @return {{id:string, data:string, concepte:string, import:number}[]} Llista.
 */
export function moviments() {
	return [
		{
			id: 'm1',
			data: __( 'Dilluns', 'noempesquen' ),
			concepte: __( 'Compra amb targeta · Botiga Verda', 'noempesquen' ),
			import: -24.9,
		},
		{
			id: 'm2',
			data: __( "5 d'octubre", 'noempesquen' ),
			concepte: __( 'Rebut · Llum Clara Energia, SA', 'noempesquen' ),
			import: -62.15,
		},
		{
			id: 'm3',
			data: __( "3 d'octubre", 'noempesquen' ),
			concepte: __(
				'Compra amb targeta · Fleca Cal Pere',
				'noempesquen'
			),
			import: -6.8,
		},
		{
			id: 'm4',
			data: __( "2 d'octubre", 'noempesquen' ),
			concepte: __(
				'Compra amb targeta · Farmàcia del Barri',
				'noempesquen'
			),
			import: -12.35,
		},
		{
			id: 'm5',
			data: __( "1 d'octubre", 'noempesquen' ),
			concepte: __( 'Transferència rebuda · Nòmina', 'noempesquen' ),
			import: 1640,
		},
		{
			id: 'm6',
			data: __( '30 de setembre', 'noempesquen' ),
			concepte: __( 'Rebut · Aigües del Maresme', 'noempesquen' ),
			import: -28.4,
		},
		{
			id: 'm7',
			data: __( '28 de setembre', 'noempesquen' ),
			concepte: __(
				'Compra amb targeta · Llibreria Rodona',
				'noempesquen'
			),
			import: -19.5,
		},
		{
			id: 'm8',
			data: __( '26 de setembre', 'noempesquen' ),
			concepte: __( 'Reintegrament · Caixer Plaça Major', 'noempesquen' ),
			import: -50,
		},
	];
}

const IMPORT_SENSE_MILERS = /^\d+([.,]\d{1,2})?$/;
const IMPORT_AMB_MILERS = /^\d{1,3}(\.\d{3})+(,\d{1,2})?$/;

/**
 * Interpreta un import escrit pel jugador («12,50», «1.200,5», «12.5»).
 *
 * @param {string} text Text escrit.
 * @return {number} Import o NaN si no és vàlid.
 */
export function interpretaImport( text ) {
	const t = String( text ?? '' ).replace( /\s|€/g, '' );
	if ( IMPORT_AMB_MILERS.test( t ) ) {
		return Number( t.replace( /\./g, '' ).replace( ',', '.' ) );
	}
	if ( IMPORT_SENSE_MILERS.test( t ) ) {
		return Number( t.replace( ',', '.' ) );
	}
	return NaN;
}

const IBAN_FORMAT = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;

export const CAMPS_TRANSFERENCIA = [
	'beneficiari',
	'iban',
	'import',
	'concepte',
];

/**
 * Valida els camps de la transferència. Retorna només codis d'error (mai el
 * valor escrit): l'interfície els tradueix a text.
 *
 * @param {Object} valors { beneficiari, iban, import, concepte }.
 * @return {Object} Mapa id de camp → codi d'error (buit si tot és correcte).
 */
export function validaTransferencia( valors ) {
	const errors = {};
	const v = ( id ) => String( valors?.[ id ] ?? '' ).trim();
	if ( ! v( 'beneficiari' ) ) {
		errors.beneficiari = 'buit';
	}
	const iban = v( 'iban' ).replace( /\s+/g, '' ).toUpperCase();
	if ( ! iban ) {
		errors.iban = 'buit';
	} else if ( ! IBAN_FORMAT.test( iban ) ) {
		errors.iban = 'invalid';
	}
	if ( ! v( 'import' ) ) {
		errors.import = 'buit';
	} else {
		const n = interpretaImport( v( 'import' ) );
		if ( Number.isNaN( n ) || n <= 0 ) {
			errors.import = 'invalid';
		} else if ( n > SALDO ) {
			errors.import = 'saldo';
		}
	}
	if ( ! v( 'concepte' ) ) {
		errors.concepte = 'buit';
	}
	return errors;
}

/**
 * Dades que l'app envia al motor en fer la transferència: només la URL i
 * l'id del formulari, mai el contingut.
 *
 * @return {{url:string, formulari:string}} Dades.
 */
export function dadesTransferencia() {
	return { url: URL_APP, formulari: FORMULARI_TRANSFERENCIA };
}
