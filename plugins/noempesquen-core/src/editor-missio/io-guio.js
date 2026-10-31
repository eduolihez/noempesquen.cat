/**
 * Importar i exportar el guió del panell. Mòdul pur (sense DOM) per poder-lo
 * provar: la caixa només hi posa el fitxer i el resultat.
 */

// Mateix límit que el servidor (`NEP_GUIO_MIDA_MAXIMA`, bytes UTF-8).
export const MIDA_MAXIMA = 524288;
export const MOTIU_GRAN =
	'El fitxer és massa gran (màxim 512 KB). No s’ha canviat l’editor.';

const ID_MISSIO = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Mida en bytes UTF-8 d'un text.
 *
 * @param {string} text Text qualsevol.
 * @return {number} Bytes.
 */
export const midaUtf8 = ( text ) => new TextEncoder().encode( text ).length;

/**
 * Text a desar: salts de línia LF i un salt final.
 *
 * @param {string} text Contingut de l'editor.
 * @return {string} Text normalitzat.
 */
export function textExportat( text ) {
	const lf = String( text ?? '' ).replace( /\r\n?/g, '\n' );
	return lf.endsWith( '\n' ) ? lf : `${ lf }\n`;
}

/**
 * Nom del fitxer exportat: `<id>.json` si l'id del guió és vàlid.
 *
 * @param {string} text Contingut de l'editor.
 * @return {string} Nom del fitxer.
 */
export function nomFitxer( text ) {
	try {
		const id = JSON.parse( text )?.id;
		if ( typeof id === 'string' && ID_MISSIO.test( id ) ) {
			return `${ id }.json`;
		}
	} catch ( e ) {}
	return 'guio.json';
}

/**
 * Comprova un fitxer importat. Entrada no confiable: només se'n llegeix el
 * text i, si és vàlid, es posa tal qual a l'editor.
 *
 * @param {string} text Contingut del fitxer.
 * @return {{ ok: true, text: string } | { ok: false, motiu: string }} Resultat.
 */
export function llegeixImportat( text ) {
	if ( typeof text !== 'string' ) {
		return { ok: false, motiu: 'No s’ha pogut llegir el fitxer.' };
	}
	if ( midaUtf8( text ) > MIDA_MAXIMA ) {
		return { ok: false, motiu: MOTIU_GRAN };
	}
	const net = text.replace( /^﻿/, '' ).replace( /\r\n?/g, '\n' );
	let guio;
	try {
		guio = JSON.parse( net );
	} catch ( e ) {
		return {
			ok: false,
			motiu: 'El fitxer no és un JSON vàlid. Comprova que l’has exportat bé.',
		};
	}
	if ( ! guio || typeof guio !== 'object' || Array.isArray( guio ) ) {
		return {
			ok: false,
			motiu: 'El fitxer ha de contenir un guió: un objecte JSON ({ … }).',
		};
	}
	return { ok: true, text: net };
}
