/* eslint-disable no-console -- Script de línea de comandos. */
/**
 * Convierte `languages/noempesquen-es_ES.po` en el JSON (formato Jed de WP) que
 * carga `wp_set_script_translations()` para el view script del simulador.
 *
 *   node scripts/i18n-json.mjs
 *
 * Por qué no `wp i18n make-json`: nombra el fichero con el md5 de la ruta del
 * fuente (`src/…`), pero WordPress busca el del script encolado (`build/…`).
 * Método elegido: `load_script_textdomain()` prueba primero
 * `<path>/<domain>-<locale>-<handle>.json` cuando `wp_set_script_translations()`
 * recibe `$path` (lo hace noempesquen-core.php con `languages/`), así que el
 * fichero se nombra por el handle y no hace falta el filtro
 * `load_script_translation_file`. El handle lo genera WP a partir de block.json
 * (`generate_block_asset_handle( 'noempesquen/simulador', 'viewScript' )`).
 * Todas las cadenas del .po van a ese único handle (el catalán es el msgid y no
 * necesita fichero). Si el .po no existe, avisa y sale sin error.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = join( dirname( fileURLToPath( import.meta.url ) ), '..' );
const IDIOMES = join( ARREL, 'plugins/noempesquen-core/languages' );
const DOMINI = 'noempesquen';
const HANDLES = [
	'noempesquen-simulador-view-script',
	'noempesquen-compte-view-script',
	'noempesquen-contacte-view-script',
];
const LOCALES = [ 'es_ES' ];

/**
 * Desescapa una cadena entre comillas de un .po.
 *
 * @param {string} s Contenido sin las comillas.
 * @return {string} Texto.
 */
function desescapa( s ) {
	return s.replace( /\\(["\\ntr])/g, ( _, c ) => {
		if ( c === 'n' ) {
			return '\n';
		}
		if ( c === 't' ) {
			return '\t';
		}
		if ( c === 'r' ) {
			return '\r';
		}
		return c;
	} );
}

/**
 * Lee un .po: cabecera y entradas (sin las fuzzy ni las obsoletas).
 *
 * @param {string} text Contenido del .po.
 * @return {{capcalera: Object<string,string>, entrades: Array}} Datos.
 */
function llegeixPo( text ) {
	const entrades = [];
	let actual = null;
	let camp = null;

	const tanca = () => {
		if ( actual && ! actual.fuzzy && actual.msgid !== undefined ) {
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
		actual ??= { msgstr: [] };
		if ( l.startsWith( '#,' ) ) {
			actual.fuzzy ||= /\bfuzzy\b/.test( l );
			continue;
		}
		if ( l.startsWith( '#' ) ) {
			continue;
		}
		const m = l.match(
			/^(msgctxt|msgid_plural|msgid|msgstr)(?:\[(\d+)\])?\s+"(.*)"$/
		);
		if ( m ) {
			if ( m[ 1 ] === 'msgid' && actual.msgid !== undefined ) {
				tanca();
				actual = { msgstr: [] };
			}
			camp =
				m[ 1 ] === 'msgstr'
					? [ 'msgstr', Number( m[ 2 ] ?? 0 ) ]
					: [ m[ 1 ] ];
			escriu( actual, camp, desescapa( m[ 3 ] ) );
			continue;
		}
		const cont = l.match( /^"(.*)"$/ );
		if ( cont && camp ) {
			escriu( actual, camp, desescapa( cont[ 1 ] ), true );
		}
	}
	tanca();

	const capcalera = {};
	const idx = entrades.findIndex( ( e ) => e.msgid === '' && ! e.msgctxt );
	if ( idx >= 0 ) {
		for ( const l of ( entrades[ idx ].msgstr[ 0 ] || '' ).split( '\n' ) ) {
			const p = l.indexOf( ':' );
			if ( p > 0 ) {
				capcalera[ l.slice( 0, p ).trim().toLowerCase() ] = l
					.slice( p + 1 )
					.trim();
			}
		}
		entrades.splice( idx, 1 );
	}
	return { capcalera, entrades };
}

function escriu( entrada, camp, valor, afegeix = false ) {
	if ( camp[ 0 ] === 'msgstr' ) {
		entrada.msgstr[ camp[ 1 ] ] =
			( afegeix ? ( entrada.msgstr[ camp[ 1 ] ] ?? '' ) : '' ) + valor;
	} else {
		entrada[ camp[ 0 ] ] =
			( afegeix ? ( entrada[ camp[ 0 ] ] ?? '' ) : '' ) + valor;
	}
}

let generats = 0;
for ( const locale of LOCALES ) {
	const po = join( IDIOMES, `${ DOMINI }-${ locale }.po` );
	if ( ! existsSync( po ) ) {
		console.warn( `Avís: no existeix ${ po }; no es genera cap JSON.` );
		continue;
	}
	const { capcalera, entrades } = llegeixPo( readFileSync( po, 'utf8' ) );
	const missatges = {
		'': {
			domain: 'messages',
			lang: capcalera.language || locale,
			'plural-forms':
				capcalera[ 'plural-forms' ] || 'nplurals=2; plural=(n != 1);',
		},
	};
	for ( const e of entrades ) {
		if ( ! e.msgstr.some( ( s ) => s ) ) {
			continue;
		}
		const clau = e.msgctxt ? `${ e.msgctxt }\u0004${ e.msgid }` : e.msgid;
		missatges[ clau ] = e.msgstr;
	}
	const json = {
		'translation-revision-date': capcalera[ 'po-revision-date' ] || '',
		generator: 'noempesquen scripts/i18n-json.mjs',
		domain: 'messages',
		locale_data: { messages: missatges },
	};
	for ( const handle of HANDLES ) {
		const desti = join(
			IDIOMES,
			`${ DOMINI }-${ locale }-${ handle }.json`
		);
		writeFileSync( desti, JSON.stringify( json ) + '\n', 'utf8' );
		console.log(
			`${ desti }: ${ Object.keys( missatges ).length - 1 } cadenes.`
		);
	}
	generats++;
}
if ( ! generats ) {
	console.log( 'Cap JSON generat.' );
}
