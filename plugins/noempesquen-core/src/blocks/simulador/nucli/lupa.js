// Lògica pura de la UI de la lupa (comptador, xip i quan es pot
// inspeccionar). Sense JSX: es pot provar amb Vitest.
import { __ } from '@wordpress/i18n';
import { FASE } from './motor';

/**
 * Text curt del comptador: «n/N».
 *
 * @param {{trobats:number, total:number}} ind Resultat de `indicis()`.
 * @return {string} Comptador.
 */
export function textComptador( ind ) {
	return `${ ind?.trobats ?? 0 }/${ ind?.total ?? 0 }`;
}

const XIPS = {
	nova: 'nova',
	normal: 'normal',
	repetida: 'repetida',
};

/**
 * Clau del xip que es mostra després d'inspeccionar.
 *
 * @param {string|null} tipus   `ultimaInspeccio.tipus`.
 * @param {boolean}     complet Ja s'han trobat tots els indicis.
 * @return {string|null} 'nova' | 'normal' | 'repetida' | 'totes' | null.
 */
export function clauXip( tipus, complet = false ) {
	const clau = XIPS[ tipus ] ?? null;
	if ( clau === 'repetida' && complet ) {
		return 'totes';
	}
	return clau;
}

/**
 * Text del xip per a una clau de `clauXip()`.
 *
 * @param {string|null} clau Clau del xip.
 * @return {string} Text traduït (buit sense clau).
 */
export function textXip( clau ) {
	switch ( clau ) {
		case 'nova':
			return __( 'Pista trobada', 'noempesquen' );
		case 'normal':
			return __( 'Sembla normal', 'noempesquen' );
		case 'repetida':
			return __( 'Ja la tenies', 'noempesquen' );
		case 'totes':
			return __( 'Ja els tens tots', 'noempesquen' );
		default:
			return '';
	}
}

/**
 * El motor acceptarà ara una inspecció? (Mateixa condició que el reductor:
 * en pausa o fora de la fase de joc, `INSPECCIONA` s'ignora.)
 *
 * @param {Object} estat Estat del joc.
 * @return {boolean} Sí si la inspecció comptarà.
 */
export function potInspeccionar( estat ) {
	return estat?.fase === FASE.JOC && ! estat?.pausa;
}
