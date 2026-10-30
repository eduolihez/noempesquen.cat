/**
 * Detecció pura (sense JSX) de codis de verificació: quins codis hi ha als
 * SMS i si el que ha escrit el jugador en conté algun. El text escrit només
 * es compara aquí, en local; mai surt de la UI.
 */

const MIN_DIGITS = 4;

/*
 * Seqüència de 4 a 8 xifres, agrupables amb espais o guions («482 913»,
 * «48-29-13»), que no forma part d'un número més llarg (p. ex. un telèfon).
 */
const SEP = `[ \t${ String.fromCharCode( 160 ) }-]`;
const RE_CODI = new RegExp(
	`(?<!\\d${ SEP }?)\\d(?:${ SEP }?\\d){3,7}(?!${ SEP }?\\d)`,
	'g'
);

/**
 * Text pla d'un SMS: `text` o els segments del `cos` (text i enllaços).
 *
 * @param {Object} sms SMS { text?, cos? }.
 * @return {string} Text.
 */
function textDe( sms ) {
	if ( Array.isArray( sms?.cos ) ) {
		return sms.cos
			.map( ( paragraf ) =>
				( Array.isArray( paragraf ) ? paragraf : [] )
					.map( ( seg ) => seg?.t ?? seg?.enllac?.text ?? '' )
					.join( '' )
			)
			.join( '\n' );
	}
	return typeof sms?.text === 'string' ? sms.text : '';
}

/**
 * Codis (només xifres, sense repetir) que apareixen als SMS.
 *
 * @param {Object[]} missatges SMS visibles de la missió.
 * @return {string[]} Codis, p. ex. [ '482913' ].
 */
export function extreuCodis( missatges ) {
	const codis = new Set();
	( Array.isArray( missatges ) ? missatges : [] ).forEach( ( sms ) => {
		( textDe( sms ).match( RE_CODI ) ?? [] ).forEach( ( m ) =>
			codis.add( m.replace( /\D/g, '' ) )
		);
	} );
	return [ ...codis ];
}

/**
 * Cert si el text escrit conté el codi, ignorant espais, guions i punts
 * (també dins d'una frase). El codi ha de tenir com a mínim 4 xifres.
 *
 * @param {string} escrit Text escrit pel jugador.
 * @param {string} codi   Codi a cercar.
 * @return {boolean} Si coincideix.
 */
export function coincideixCodi( escrit, codi ) {
	const xifres = String( codi ?? '' ).replace( /\D/g, '' );
	if ( xifres.length < MIN_DIGITS ) {
		return false;
	}
	const net = String( escrit ?? '' ).replace( /[\s.\-]/g, '' );
	return net.includes( xifres );
}
