import { T } from './textos';

export const ORDRE = [ 'nom', 'correu', 'assumpte', 'missatge', 'privacitat' ];

const CORREU = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Llargada en caràcters (no en unitats UTF-16), com fa el servidor.
 *
 * @param {string} text Text.
 * @return {number} Caràcters.
 */
const llargada = ( text ) => Array.from( text ).length;

/**
 * Valida el formulari al client (el servidor torna a validar-ho tot).
 *
 * @param {Object} v Valors `{ nom, correu, assumpte, missatge, privacitat }`.
 * @return {Object} Errors per camp (buit si tot és correcte).
 */
export function valida( v ) {
	const errors = {};
	const nom = v.nom.trim();
	const correu = v.correu.trim();
	const missatge = v.missatge.trim();

	if ( ! nom ) {
		errors.nom = T.errors.nom;
	} else if ( llargada( nom ) > 80 ) {
		errors.nom = T.errors.nomLlarg;
	}
	if ( ! correu ) {
		errors.correu = T.errors.correu;
	} else if ( ! CORREU.test( correu ) || llargada( correu ) > 100 ) {
		errors.correu = T.errors.correuFormat;
	}
	if ( ! T.assumptes.some( ( a ) => a.valor === v.assumpte ) ) {
		errors.assumpte = T.errors.assumpte;
	}
	if ( ! missatge ) {
		errors.missatge = T.errors.missatge;
	} else if ( llargada( missatge ) < 10 ) {
		errors.missatge = T.errors.missatgeCurt;
	} else if ( llargada( missatge ) > 2000 ) {
		errors.missatge = T.errors.missatgeLlarg;
	}
	if ( v.privacitat !== true ) {
		errors.privacitat = T.errors.privacitat;
	}
	return errors;
}
