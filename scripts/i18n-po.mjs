/**
 * Lectura y escritura de ficheros .po/.pot (módulo puro, sin dependencias).
 * Lo usan `i18n-merge.mjs` e `i18n-parts.mjs`; lo prueba Vitest.
 */

/**
 * Desescapa el contenido de una cadena entre comillas de un .po.
 *
 * @param {string} s Contenido sin las comillas.
 * @return {string} Texto.
 */
export function desescapa( s ) {
	const especials = { n: '\n', t: '\t', r: '\r' };
	return s.replace( /\\(["\\ntr])/g, ( _, c ) => especials[ c ] ?? c );
}

/**
 * Escapa un texto para ponerlo entre comillas en un .po.
 *
 * @param {string} s Texto.
 * @return {string} Contenido escapado.
 */
export function escapa( s ) {
	return s
		.replace( /\\/g, '\\\\' )
		.replace( /"/g, '\\"' )
		.replace( /\n/g, '\\n' )
		.replace( /\t/g, '\\t' )
		.replace( /\r/g, '\\r' );
}

const nova = () => ( {
	msgstr: [],
	refs: [],
	comentaris: [],
	extrets: [],
	flags: [],
} );

function escriu( entrada, camp, valor, afegeix ) {
	if ( camp[ 0 ] === 'msgstr' ) {
		entrada.msgstr[ camp[ 1 ] ] =
			( afegeix ? ( entrada.msgstr[ camp[ 1 ] ] ?? '' ) : '' ) + valor;
	} else {
		entrada[ camp[ 0 ] ] =
			( afegeix ? ( entrada[ camp[ 0 ] ] ?? '' ) : '' ) + valor;
	}
}

/**
 * Parsea un .po/.pot. La entrada de cabecera (msgid vacío) va aparte.
 *
 * @param {string} text Contenido.
 * @return {{capcalera: ?Object, entrades: Object[]}} Cada entrada:
 *   `{ msgctxt, msgid, msgid_plural, msgstr[], refs[], comentaris[],
 *   extrets[], flags[] }`.
 */
export function parsePo( text ) {
	const entrades = [];
	let actual = null;
	let camp = null;
	const tanca = () => {
		if ( actual && actual.msgid !== undefined ) {
			entrades.push( actual );
		}
		actual = null;
		camp = null;
	};
	for ( const linia of text.replace( /\r\n/g, '\n' ).split( '\n' ) ) {
		const l = linia.trim();
		if ( l === '' ) {
			tanca();
			continue;
		}
		if ( l.startsWith( '#~' ) ) {
			continue;
		}
		// Un comentario tras msgstr abre una entrada nueva.
		if ( l.startsWith( '#' ) && actual && camp && camp[ 0 ] === 'msgstr' ) {
			tanca();
		}
		actual ??= nova();
		if ( l.startsWith( '#:' ) ) {
			actual.refs.push( ...l.slice( 2 ).trim().split( /\s+/ ) );
			continue;
		}
		if ( l.startsWith( '#,' ) ) {
			actual.flags.push(
				...l
					.slice( 2 )
					.split( ',' )
					.map( ( f ) => f.trim() )
					.filter( Boolean )
			);
			continue;
		}
		if ( l.startsWith( '#.' ) ) {
			actual.extrets.push( l.slice( 2 ).replace( /^ /, '' ) );
			continue;
		}
		if ( l.startsWith( '#' ) ) {
			actual.comentaris.push( l.slice( 1 ).replace( /^ /, '' ) );
			continue;
		}
		const m = l.match(
			/^(msgctxt|msgid_plural|msgid|msgstr)(?:\[(\d+)\])?\s+"(.*)"$/
		);
		if ( m ) {
			if ( m[ 1 ] === 'msgid' && actual.msgid !== undefined ) {
				tanca();
				actual = nova();
			}
			camp =
				m[ 1 ] === 'msgstr'
					? [ 'msgstr', Number( m[ 2 ] ?? 0 ) ]
					: [ m[ 1 ] ];
			escriu( actual, camp, desescapa( m[ 3 ] ), false );
			continue;
		}
		const cont = l.match( /^"(.*)"$/ );
		if ( cont && camp ) {
			escriu( actual, camp, desescapa( cont[ 1 ] ), true );
		}
	}
	tanca();
	const idx = entrades.findIndex( ( e ) => e.msgid === '' && ! e.msgctxt );
	const capcalera = idx >= 0 ? entrades.splice( idx, 1 )[ 0 ] : null;
	return { capcalera, entrades };
}

/**
 * Clave única de una entrada (contexto + msgid).
 *
 * @param {Object} e Entrada.
 * @return {string} Clave.
 */
export function clau( e ) {
	return `${ e.msgctxt ?? '' }\u0004${ e.msgid }`;
}

const q = ( s ) => `"${ escapa( s ) }"`;

function campPo( nom, valor ) {
	if (
		! valor.includes( '\n' ) ||
		valor.indexOf( '\n' ) === valor.length - 1
	) {
		return `${ nom } ${ q( valor ) }`;
	}
	const trossos = valor.split( /(?<=\n)/ );
	return [ `${ nom } ""`, ...trossos.map( q ) ].join( '\n' );
}

/**
 * Serializa una entrada.
 *
 * @param {Object} e Entrada.
 * @return {string} Texto (sin línea en blanco final).
 */
export function serialitzaEntrada( e ) {
	const o = [];
	e.comentaris.forEach( ( c ) => o.push( `# ${ c }`.trimEnd() ) );
	e.extrets.forEach( ( c ) => o.push( `#. ${ c }`.trimEnd() ) );
	if ( e.refs.length ) {
		o.push( `#: ${ e.refs.join( ' ' ) }` );
	}
	if ( e.flags.length ) {
		o.push( `#, ${ e.flags.join( ', ' ) }` );
	}
	if ( e.msgctxt !== undefined ) {
		o.push( campPo( 'msgctxt', e.msgctxt ) );
	}
	o.push( campPo( 'msgid', e.msgid ) );
	if ( e.msgid_plural !== undefined ) {
		o.push( campPo( 'msgid_plural', e.msgid_plural ) );
		const n = Math.max( e.msgstr.length, 2 );
		for ( let i = 0; i < n; i++ ) {
			o.push( campPo( `msgstr[${ i }]`, e.msgstr[ i ] ?? '' ) );
		}
	} else {
		o.push( campPo( 'msgstr', e.msgstr[ 0 ] ?? '' ) );
	}
	return o.join( '\n' );
}

/**
 * Serializa un .po completo.
 *
 * @param {string[]} capcaleraLinies Líneas `Clave: valor` de la cabecera.
 * @param {Object[]} entrades        Entradas.
 * @return {string} Contenido.
 */
export function serialitzaPo( capcaleraLinies, entrades ) {
	const cap = [
		'msgid ""',
		'msgstr ""',
		...capcaleraLinies.map( ( l ) => q( l + '\n' ) ),
	].join( '\n' );
	return [ cap, ...entrades.map( serialitzaEntrada ) ].join( '\n\n' ) + '\n';
}

/**
 * Compara dos referencias `ruta:línea` (ruta, luego línea numérica).
 *
 * @param {string} a Referencia.
 * @param {string} b Referencia.
 * @return {number} Orden.
 */
export function cmpRef( a, b ) {
	const ma = a.match( /^(.*?)(?::(\d+))?$/ );
	const mb = b.match( /^(.*?)(?::(\d+))?$/ );
	if ( ma[ 1 ] !== mb[ 1 ] ) {
		return ma[ 1 ] < mb[ 1 ] ? -1 : 1;
	}
	return Number( ma[ 2 ] ?? 0 ) - Number( mb[ 2 ] ?? 0 );
}

/**
 * Ruta y línea de la primera referencia (ordenada) de una entrada.
 *
 * @param {Object} e Entrada.
 * @return {[string, number]} Ruta y línea.
 */
export function primeraRef( e ) {
	const r = [ ...e.refs ].sort( cmpRef )[ 0 ] ?? '';
	const m = r.match( /^(.*?)(?::(\d+))?$/ );
	return [ m[ 1 ], Number( m[ 2 ] ?? 0 ) ];
}
