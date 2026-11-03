/* eslint-disable no-console -- Script de línea de comandos. */
/**
 * Compila `languages/noempesquen-es_ES.po` a `noempesquen-es_ES.mo`, el fichero
 * que PHP carga (`load_plugin_textdomain`) sin WP-CLI ni `msgfmt`.
 *
 *   node scripts/i18n-mo.mjs [fichero.po ...]
 *
 * Sin argumentos usa `noempesquen-es_ES.po`. Con varios, el último con msgstr
 * no vacío gana (útil para probar un fragmento de `parts/` antes del merge).
 * Se omiten las entradas fuzzy y las sin traducir.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePo } from './i18n-po.mjs';

const ARREL = join( dirname( fileURLToPath( import.meta.url ) ), '..' );
const IDIOMES = join( ARREL, 'plugins/noempesquen-core/languages' );

/**
 * Construye el binario .mo (little endian, sin tabla hash).
 *
 * @param {Map<string,string>} mapa Clave original → traducción.
 * @return {Buffer} Contenido del .mo.
 */
export function construeixMo( mapa ) {
	const claus = [ ...mapa.keys() ].sort( ( a, b ) =>
		Buffer.compare( Buffer.from( a ), Buffer.from( b ) )
	);
	const n = claus.length;
	const orig = claus.map( ( k ) => Buffer.from( k, 'utf8' ) );
	const trad = claus.map( ( k ) => Buffer.from( mapa.get( k ), 'utf8' ) );
	const taulaOrig = 28;
	const taulaTrad = taulaOrig + 8 * n;
	let pos = taulaTrad + 8 * n;
	const offO = [];
	const offT = [];
	for ( const b of orig ) {
		offO.push( pos );
		pos += b.length + 1;
	}
	for ( const b of trad ) {
		offT.push( pos );
		pos += b.length + 1;
	}
	const sortida = Buffer.alloc( pos );
	[ 0x950412de, 0, n, taulaOrig, taulaTrad, 0, 0 ].forEach( ( v, i ) =>
		sortida.writeUInt32LE( v, i * 4 )
	);
	for ( let i = 0; i < n; i++ ) {
		sortida.writeUInt32LE( orig[ i ].length, taulaOrig + 8 * i );
		sortida.writeUInt32LE( offO[ i ], taulaOrig + 8 * i + 4 );
		sortida.writeUInt32LE( trad[ i ].length, taulaTrad + 8 * i );
		sortida.writeUInt32LE( offT[ i ], taulaTrad + 8 * i + 4 );
		orig[ i ].copy( sortida, offO[ i ] );
		trad[ i ].copy( sortida, offT[ i ] );
	}
	return sortida;
}

/**
 * Añade al mapa las entradas traducidas de un .po.
 *
 * @param {Map<string,string>} mapa  Mapa destino.
 * @param {string}             text  Contenido del .po.
 */
export function afegeixPo( mapa, text ) {
	const { capcalera, entrades } = parsePo( text );
	if ( capcalera && ! mapa.has( '' ) ) {
		mapa.set( '', capcalera.msgstr.join( '' ) );
	}
	for ( const e of entrades ) {
		if ( ( e.flags ?? [] ).includes( 'fuzzy' ) ) {
			continue;
		}
		const traduccions = e.msgstr.filter( ( s ) => s !== '' );
		if ( ! traduccions.length || traduccions.length < e.msgstr.length ) {
			continue;
		}
		const id =
			( e.msgctxt !== undefined ? e.msgctxt + '\u0004' : '' ) +
			e.msgid +
			( e.msgid_plural !== undefined ? '\u0000' + e.msgid_plural : '' );
		mapa.set( id, e.msgstr.join( '\u0000' ) );
	}
}

if ( process.argv[ 1 ] === fileURLToPath( import.meta.url ) ) {
	const pos = process.argv.slice( 2 );
	if ( ! pos.length ) {
		pos.push( join( IDIOMES, 'noempesquen-es_ES.po' ) );
	}
	const mapa = new Map();
	for ( const p of pos ) {
		afegeixPo( mapa, readFileSync( p, 'utf8' ) );
	}
	const desti = join( IDIOMES, 'noempesquen-es_ES.mo' );
	writeFileSync( desti, construeixMo( mapa ) );
	console.log( `${ desti }: ${ mapa.size - 1 } cadenas.` );
}
