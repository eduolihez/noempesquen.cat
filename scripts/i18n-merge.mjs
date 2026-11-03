/* eslint-disable no-console -- Script de línea de comandos. */
/**
 * Fusiona los fragmentos `languages/parts/es-*.po` en
 * `languages/noempesquen-es_ES.po`.
 *
 *   node scripts/i18n-merge.mjs
 *
 * Falla (código 1) si hay msgstr vacío o fuzzy, o un mismo msgid (+ contexto)
 * con traducciones distintas. Las repeticiones idénticas se unen (referencias
 * sumadas). Salida ordenada por la primera referencia.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clau, cmpRef, parsePo, primeraRef, serialitzaPo } from './i18n-po.mjs';

const ARREL = join( dirname( fileURLToPath( import.meta.url ) ), '..' );
const IDIOMES = join( ARREL, 'plugins/noempesquen-core/languages' );

export const CAPCALERA = [
	'Project-Id-Version: No em pesquen – Nucli',
	'Language: es_ES',
	'MIME-Version: 1.0',
	'Content-Type: text/plain; charset=UTF-8',
	'Content-Transfer-Encoding: 8bit',
	'Plural-Forms: nplurals=2; plural=(n != 1);',
	'X-Domain: noempesquen',
];

/**
 * Fusiona textos .po en una lista de entradas.
 *
 * @param {{nom: string, text: string}[]} fonts Fragmentos.
 * @return {{entrades: Object[], errors: string[]}} Resultado.
 */
export function fusiona( fonts ) {
	const errors = [];
	const mapa = new Map();
	for ( const { nom, text } of fonts ) {
		for ( const e of parsePo( text ).entrades ) {
			const k = clau( e );
			const etiqueta = `${ nom }: «${ e.msgid }»`;
			if (
				e.flags.includes( 'fuzzy' ) ||
				! e.msgstr.length ||
				e.msgstr.some( ( s ) => ! s ) ||
				( e.msgid_plural !== undefined && e.msgstr.length < 2 )
			) {
				errors.push( `msgstr vacío o fuzzy en ${ etiqueta }` );
				continue;
			}
			const previa = mapa.get( k );
			if ( ! previa ) {
				mapa.set( k, { ...e, refs: [ ...e.refs ], origen: nom } );
			} else if ( previa.msgstr.join( '\0' ) !== e.msgstr.join( '\0' ) ) {
				errors.push(
					`msgid duplicado con msgstr distinto: ${ etiqueta } (también en ${ previa.origen })`
				);
			} else {
				previa.refs = [ ...new Set( [ ...previa.refs, ...e.refs ] ) ];
			}
		}
	}
	const entrades = [ ...mapa.values() ].map( ( e ) => {
		const { origen, ...resta } = e;
		return { ...resta, refs: [ ...resta.refs ].sort( cmpRef ) };
	} );
	entrades.sort( ( a, b ) => {
		const [ ra, la ] = primeraRef( a );
		const [ rb, lb ] = primeraRef( b );
		if ( ra === rb ) {
			return la - lb;
		}
		return ra < rb ? -1 : 1;
	} );
	return { entrades, errors };
}

if ( process.argv[ 1 ] === fileURLToPath( import.meta.url ) ) {
	const dirParts = join( IDIOMES, 'parts' );
	const noms = readdirSync( dirParts )
		.filter( ( f ) => /^es-.*\.po$/.test( f ) )
		.sort();
	if ( ! noms.length ) {
		console.error( 'No hay fragmentos languages/parts/es-*.po.' );
		process.exit( 1 );
	}
	const { entrades, errors } = fusiona(
		noms.map( ( nom ) => ( {
			nom,
			text: readFileSync( join( dirParts, nom ), 'utf8' ),
		} ) )
	);
	if ( errors.length ) {
		errors.forEach( ( e ) => console.error( 'ERROR ' + e ) );
		console.error( `${ errors.length } errores; no se escribe nada.` );
		process.exit( 1 );
	}
	const desti = join( IDIOMES, 'noempesquen-es_ES.po' );
	writeFileSync( desti, serialitzaPo( CAPCALERA, entrades ), 'utf8' );
	console.log(
		`${ desti }: ${ entrades.length } cadenas de ${ noms.length } fragmentos.`
	);
}
