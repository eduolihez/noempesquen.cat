/**
 * Ruta → posició dins del text JSON del guió. Mòdul pur (sense DOM).
 *
 * Un escàner petit recorre el text i apunta on comença cada clau (o cada
 * element d'una llista). Les posicions són índexs UTF-16, els mateixos que fan
 * servir `CodeMirror.posFromIndex` i `textarea.setSelectionRange`.
 */

const BUIT = /\s/;
const LITERAL = /^(true|false|null|-?\d+(\.\d+)?([eE][+-]?\d+)?)$/;

/**
 * Mapa de rutes («a.b[2].c» → índex del text). Amb claus repetides guanya la
 * darrera, com a `JSON.parse`. Si el text no és JSON vàlid torna el que hagi
 * pogut llegir abans de l'error, i `mapa.error` és on s'ha aturat (si no, null).
 *
 * @param {string} text JSON.
 * @return {Map<string, number>} Posicions.
 */
export function mapaPosicions( text ) {
	const mapa = new Map();
	let i = 0;
	const salta = () => {
		while ( i < text.length && BUIT.test( text[ i ] ) ) {
			i++;
		}
	};
	const cadena = () => {
		// i apunta a la cometa inicial.
		let valor = '';
		i++;
		while ( i < text.length && text[ i ] !== '"' ) {
			if ( text[ i ] === '\\' ) {
				valor += text.slice( i, i + 2 );
				i += 2;
			} else {
				valor += text[ i ];
				i++;
			}
		}
		if ( i >= text.length ) {
			throw new Error( 'cadena' );
		}
		i++;
		try {
			return JSON.parse( `"${ valor }"` );
		} catch {
			return valor;
		}
	};
	const valor = ( ruta ) => {
		salta();
		const c = text[ i ];
		if ( i >= text.length ) {
			throw new Error( 'final' );
		}
		if ( c === '{' ) {
			i++;
			salta();
			while ( i < text.length && text[ i ] !== '}' ) {
				if ( text[ i ] !== '"' ) {
					throw new Error( 'clau' );
				}
				const inici = i;
				const clau = cadena();
				const fill = ruta ? `${ ruta }.${ clau }` : clau;
				mapa.set( fill, inici );
				salta();
				if ( text[ i ] !== ':' ) {
					throw new Error( 'dos punts' );
				}
				i++;
				valor( fill );
				seguent( '}' );
			}
			if ( i >= text.length ) {
				throw new Error( 'final' );
			}
			i++;
		} else if ( c === '[' ) {
			i++;
			salta();
			let n = 0;
			while ( i < text.length && text[ i ] !== ']' ) {
				const fill = `${ ruta }[${ n }]`;
				mapa.set( fill, i );
				valor( fill );
				n++;
				seguent( ']' );
			}
			if ( i >= text.length ) {
				throw new Error( 'final' );
			}
			i++;
		} else if ( c === '"' ) {
			cadena();
		} else {
			const inici = i;
			while ( i < text.length && ! /[\s,\]}:]/.test( text[ i ] ) ) {
				i++;
			}
			if ( ! LITERAL.test( text.slice( inici, i ) ) ) {
				i = inici;
				throw new Error( 'literal' );
			}
		}
	};
	// Després d'un element: coma (i no pot venir el tancament) o tancament.
	const seguent = ( tanca ) => {
		salta();
		if ( text[ i ] === ',' ) {
			i++;
			salta();
			if ( text[ i ] === tanca || i >= text.length ) {
				throw new Error( 'coma final' );
			}
		} else if ( text[ i ] !== tanca ) {
			throw new Error( 'separador' );
		}
	};
	let error = null;
	try {
		valor( '' );
		salta();
		if ( i < text.length ) {
			throw new Error( 'sobra' );
		}
	} catch {
		error = Math.min( i, text.length );
	}
	mapa.error = error;
	return mapa;
}

/**
 * Converteix una ruta en llista a text: [ 'webs', 'x.cat', 'seccions', 1 ]
 * → «webs.x.cat.seccions[1]», el mateix format de clau que `mapaPosicions`.
 *
 * @param {Array<string|number>} ruta Ruta.
 * @return {string} Ruta en text.
 */
export function rutaText( ruta ) {
	return ruta.reduce( ( acc, pas ) => {
		if ( typeof pas === 'number' ) {
			return `${ acc }[${ pas }]`;
		}
		return acc ? `${ acc }.${ pas }` : pas;
	}, '' );
}

/**
 * Posició de la ruta dins del text, o la de l'avantpassat més proper que hi
 * sigui. Null si no se'n troba cap.
 *
 * @param {string}               text JSON.
 * @param {Array<string|number>} ruta Ruta.
 * @return {?number} Índex.
 */
export function posicioDeRuta( text, ruta ) {
	if ( ! Array.isArray( ruta ) || ! ruta.length ) {
		return null;
	}
	const mapa = mapaPosicions( text );
	for ( let n = ruta.length; n > 0; n-- ) {
		const p = mapa.get( rutaText( ruta.slice( 0, n ) ) );
		if ( p !== undefined ) {
			return p;
		}
	}
	return null;
}

/**
 * Posició d'un error de sintaxi a partir del missatge de `JSON.parse`.
 *
 * @param {string} text     JSON.
 * @param {string} missatge Missatge de l'excepció.
 * @return {?number} Índex.
 */
export function posicioErrorSintaxi( text, missatge ) {
	const pos = /position (\d+)/.exec( missatge );
	if ( pos ) {
		return Math.min( Number( pos[ 1 ] ), text.length );
	}
	const lc = /line (\d+) column (\d+)/.exec( missatge );
	if ( lc ) {
		const linies = text.split( '\n' );
		const l = Number( lc[ 1 ] ) - 1;
		let index = 0;
		for ( let k = 0; k < l && k < linies.length; k++ ) {
			index += linies[ k ].length + 1;
		}
		return Math.min( index + Number( lc[ 2 ] ) - 1, text.length );
	}
	// Els missatges de V8 sovint no diuen on és («Unexpected token 'x'»):
	// llavors es fa servir on s'atura l'escàner.
	return mapaPosicions( text ).error;
}
