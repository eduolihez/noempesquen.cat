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
 * Idiomes d'una missió (meta `nep_idioma`).
 */
export const IDIOMES_MISSIO = [ 'es', 'ca' ];

/**
 * Nom del fitxer exportat: `<id>.json` si l'id del guió és vàlid. L'idioma
 * viatja al nom (`<id>.<idioma>.json`) i no al guió, que ha de ser igual en
 * tots dos idiomes llevat dels textos.
 *
 * @param {string}  text   Contingut de l'editor.
 * @param {?string} idioma Idioma de la missió (`es` | `ca`).
 * @return {string} Nom del fitxer.
 */
export function nomFitxer( text, idioma = null ) {
	const sufix = IDIOMES_MISSIO.includes( idioma ) ? `.${ idioma }` : '';
	try {
		const id = JSON.parse( text )?.id;
		if ( typeof id === 'string' && ID_MISSIO.test( id ) ) {
			return `${ id }${ sufix }.json`;
		}
	} catch {}
	return `guio${ sufix }.json`;
}

/**
 * Idioma d'un fitxer importat segons el nom (`<id>.es.json`), o null.
 *
 * @param {string} nom Nom del fitxer.
 * @return {?string} `es`, `ca` o null.
 */
export function idiomaDelFitxer( nom ) {
	const m = /\.([a-z]{2})\.json$/i.exec( String( nom ?? '' ) );
	const idioma = m?.[ 1 ].toLowerCase();
	return IDIOMES_MISSIO.includes( idioma ) ? idioma : null;
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
	const net = text
		.replace( new RegExp( `^${ String.fromCharCode( 0xfeff ) }` ), '' )
		.replace( /\r\n?/g, '\n' );
	let guio;
	try {
		guio = JSON.parse( net );
	} catch {
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
