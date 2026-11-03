/* eslint-disable no-console -- Script de línea de comandos. */
/**
 * axe (WCAG 2.2 AA) de la cabecera con el selector de idioma y del aviso de
 * sugerencia de idioma, en una página ES y una CA. Navegador en catalán para que
 * el aviso aparezca en ES.
 *
 *   node scripts/axe-i18n.mjs [baseUrl]
 *
 * Sale con código 1 si hay violaciones serias o críticas.
 */
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const base = ( process.argv[ 2 ] || 'http://localhost:8888' ).replace( /\/+$/, '' );
const rutes = [ '/', '/simulador/', '/ca/', '/ca/simulador/' ];

const navegador = await chromium.launch();
const context = await navegador.newContext( { locale: 'ca-ES' } );
let serioses = 0;
for ( const ruta of rutes ) {
	const pagina = await context.newPage();
	await pagina.goto( base + ruta, { waitUntil: 'load' } );
	const avis = await pagina.locator( '.nep-suggeriment' ).isVisible();
	const res = await new AxeBuilder( { page: pagina } )
		.withTags( [ 'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa' ] )
		.analyze();
	const greus = res.violations.filter( ( v ) =>
		[ 'serious', 'critical' ].includes( v.impact )
	);
	serioses += greus.length;
	console.log(
		`${ ruta }  aviso visible: ${ avis }  violaciones serias: ${ greus.length }`
	);
	greus.forEach( ( v ) =>
		console.log( `  - ${ v.id }: ${ v.nodes.map( ( n ) => n.target ).join( ' ' ) }` )
	);
	if ( avis ) {
		await pagina.locator( '.nep-suggeriment__tanca' ).click();
		const amagat = ! ( await pagina.locator( '.nep-suggeriment' ).isVisible() );
		const focus = await pagina.evaluate( () => document.activeElement?.className );
		console.log( `  tras «Tanca»: oculto ${ amagat }, foco en ${ focus }` );
	}
	await pagina.close();
}
await navegador.close();
process.exit( serioses ? 1 : 0 );
