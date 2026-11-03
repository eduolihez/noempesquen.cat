// Valida que missions/es/ i missions/ca/ tenen els mateixos fitxers i la mateixa
// lògica (ids, estructura, valors no traduïbles). Ús: npm run missions:valida
import { readFileSync, readdirSync } from 'node:fs';
import { validaParella } from '../plugins/noempesquen-core/src/blocks/simulador/nucli/parella.js';

const ARREL = new URL( '../plugins/noempesquen-core/missions/', import.meta.url );

const llegeixCarpeta = ( idioma ) => {
	const dir = new URL( `${ idioma }/`, ARREL );
	const conjunt = {};
	for ( const nom of readdirSync( dir ).filter( ( f ) => f.endsWith( '.json' ) ) ) {
		conjunt[ nom ] = JSON.parse( readFileSync( new URL( nom, dir ), 'utf8' ) );
	}
	return conjunt;
};

const conjunts = { ca: llegeixCarpeta( 'ca' ), es: llegeixCarpeta( 'es' ) };
const errors = validaParella( conjunts );

if ( errors.length ) {
	console.error( `Parella ES/CA de missions: ${ errors.length } errors` );
	for ( const e of errors ) {
		console.error( `  - ${ e }` );
	}
	process.exit( 1 );
}
console.log(
	`Parella ES/CA de missions correcta (${ Object.keys( conjunts.ca ).length } fitxers).`
);
