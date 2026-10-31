/* eslint-disable no-console -- Script de línea de comandos. */
/**
 * Empaqueta el plugin y el tema para subirlos al servidor (que no tiene Node).
 *
 *   npm run build && npm run empaqueta
 *
 * Salida en `dist/`: carpetas listas para copiar a wp-content/ y un zip por
 * pieza (plugin y tema) con entradas «/», aptas para «Plugins > Añadir».
 * Se queda fuera todo lo que no se ejecuta en producción: código fuente,
 * tests, phpunit y fixtures de misiones.
 */
import {
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	rmSync,
	statSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const arrel = resolve( dirname( fileURLToPath( import.meta.url ) ), '..' );
const dist = join( arrel, 'dist' );

const PECES = [
	{
		nom: 'noempesquen-core',
		origen: join( arrel, 'plugins', 'noempesquen-core' ),
		destí: join( dist, 'wp-content', 'plugins', 'noempesquen-core' ),
		exclou: [
			'src',
			'tests',
			'phpunit.xml.dist',
			'.distignore',
			'missions/test-fixtures',
			'vendor',
			'node_modules',
		],
		requereix: [
			'build/blocks/simulador/block.json',
			'noempesquen-core.php',
		],
	},
	{
		nom: 'noempesquen',
		origen: join( arrel, 'themes', 'noempesquen' ),
		destí: join( dist, 'wp-content', 'themes', 'noempesquen' ),
		exclou: [ 'node_modules' ],
		requereix: [ 'style.css', 'theme.json' ],
	},
];

const net = ( p ) => p.split( sep ).join( '/' );

function llista( dir ) {
	return readdirSync( dir, { withFileTypes: true } ).flatMap( ( e ) => {
		const ruta = join( dir, e.name );
		return e.isDirectory() ? llista( ruta ) : [ ruta ];
	} );
}

rmSync( dist, { recursive: true, force: true } );

for ( const peça of PECES ) {
	for ( const f of peça.requereix ) {
		if ( ! existsSync( join( peça.origen, f ) ) ) {
			console.error(
				`Falta ${ f } a ${ peça.nom }. Ejecuta «npm run build» antes.`
			);
			process.exit( 1 );
		}
	}
	mkdirSync( peça.destí, { recursive: true } );
	cpSync( peça.origen, peça.destí, {
		recursive: true,
		filter: ( font ) => {
			const rel = net( relative( peça.origen, font ) );
			return ! peça.exclou.some(
				( x ) => rel === x || rel.startsWith( `${ x }/` )
			);
		},
	} );

	const zip = join( dist, `${ peça.nom }.zip` );
	const pare = dirname( peça.destí );
	// bsdtar (Windows 10+, macOS) escribe zips con «/»; Compress-Archive de PS 5.1 usa «\».
	// En Windows se fuerza el tar del sistema: el de Git Bash (GNU) no hace zips.
	const tar =
		process.platform === 'win32'
			? join(
					process.env.SystemRoot ?? 'C:/Windows',
					'System32',
					'tar.exe'
				)
			: 'tar';
	const r = spawnSync( tar, [ '-a', '-cf', zip, peça.nom ], {
		cwd: pare,
		stdio: 'inherit',
	} );
	if ( r.status !== 0 ) {
		console.error(
			`No se pudo crear ${ zip } (¿hay «tar» con soporte zip?).`
		);
		process.exit( 1 );
	}
	const fitxers = llista( peça.destí );
	const bytes = fitxers.reduce( ( s, f ) => s + statSync( f ).size, 0 );
	console.log(
		`${ peça.nom }: ${ fitxers.length } ficheros, ${ ( bytes / 1024 ).toFixed( 0 ) } KB → ${ relative( arrel, zip ) }`
	);
}
