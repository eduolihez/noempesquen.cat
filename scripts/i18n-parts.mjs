/* eslint-disable no-console -- Script de línea de comandos. */
/**
 * Emite el esqueleto `languages/parts/es-<area>.po` (msgstr vacío) desde el
 * .pot, para que el agente de área solo rellene las traducciones.
 *
 *   node scripts/i18n-parts.mjs <area> [--force]
 *
 * Áreas: apps, webs, resto (nucli, simulador, sistemes, ui, estils) y altres
 * (PHP, otros bloques, editor de misiones, block.json: lo que no cae bajo
 * `src/blocks/simulador/`). Cada cadena se asigna a UN área según su primera
 * referencia, así ninguna cae en dos fragmentos aunque se repita en varios
 * ficheros. No sobrescribe un fragmento existente sin `--force`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CAPCALERA } from './i18n-merge.mjs';
import { parsePo, primeraRef, serialitzaPo } from './i18n-po.mjs';

const ARREL = join( dirname( fileURLToPath( import.meta.url ) ), '..' );
const IDIOMES = join( ARREL, 'plugins/noempesquen-core/languages' );
const SIM = 'src/blocks/simulador/';

export const AREES = {
	apps: [ SIM + 'apps/' ],
	webs: [ SIM + 'webs/' ],
	resto: [
		SIM + 'nucli/',
		SIM + 'simulador/',
		SIM + 'sistemes/',
		SIM + 'ui/',
		SIM + 'estils/',
	],
};

/**
 * Área de una entrada según su primera referencia.
 *
 * @param {Object} e Entrada.
 * @return {string} Nombre del área (`altres` si ninguna encaja).
 */
export function areaDe( e ) {
	const [ ruta ] = primeraRef( e );
	for ( const [ area, prefixos ] of Object.entries( AREES ) ) {
		if ( prefixos.some( ( p ) => ruta.startsWith( p ) ) ) {
			return area;
		}
	}
	return 'altres';
}

if ( process.argv[ 1 ] === fileURLToPath( import.meta.url ) ) {
	const [ area ] = process.argv.slice( 2 );
	const valides = [ ...Object.keys( AREES ), 'altres' ];
	if ( ! valides.includes( area ?? '' ) ) {
		console.error(
			`Uso: i18n-parts.mjs <${ valides.join( '|' ) }> [--force]`
		);
		process.exit( 1 );
	}
	const { entrades } = parsePo(
		readFileSync( join( IDIOMES, 'noempesquen.pot' ), 'utf8' )
	);
	const triades = entrades
		.filter( ( e ) => areaDe( e ) === area )
		.map( ( e ) => ( {
			...e,
			msgstr: e.msgid_plural !== undefined ? [ '', '' ] : [ '' ],
		} ) );
	const dir = join( IDIOMES, 'parts' );
	mkdirSync( dir, { recursive: true } );
	const desti = join( dir, `es-${ area }.po` );
	if ( existsSync( desti ) && ! process.argv.includes( '--force' ) ) {
		console.error(
			`${ desti } ya existe (usa --force para sobrescribir).`
		);
		process.exit( 1 );
	}
	writeFileSync( desti, serialitzaPo( CAPCALERA, triades ), 'utf8' );
	console.log( `${ desti }: ${ triades.length } cadenas.` );
}
