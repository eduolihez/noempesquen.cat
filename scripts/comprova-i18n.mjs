/* eslint-disable no-console -- Script de línea de comandos. */
/**
 * Comprueba el despliegue i18n con peticiones HTTP reales (solo Node, sin
 * dependencias; necesita Node 18+ por `fetch`).
 *
 *   node scripts/comprova-i18n.mjs [baseUrl] [--sense-301] [--ayuda]
 *
 * Para cada URL esperada comprueba: status 200, `<html lang>`, canonical
 * autorreferenciado, hreflang recíproco (+ x-default) y, aparte, los 301 de las
 * URLs catalanas antiguas. Imprime también Vary/Age/Cache-Control (informativo;
 * sirve para ver Varnish). Sale con código 1 si algo falla.
 * La tabla es la de docs/despliegue-i18n.md; mantenerlas a la par.
 */

const AYUDA = `Uso: node scripts/comprova-i18n.mjs [baseUrl] [opciones]

  baseUrl      Por defecto http://localhost:8888 (p. ej. https://noempesquen.cat)
  --sense-301  No comprueba los 301 (antes de insertar el .htaccess)
  --ayuda      Muestra este texto

Sale con código 0 si todo pasa y 1 si falla algo. Los avisos (DUBTE) no
hacen fallar: son URLs pendientes de confirmar.`;

// Pares ES (raíz) <-> CA (/ca/). `dubte`: el slug no está confirmado.
const PARELLS = [
	{ es: '/', ca: '/ca/' },
	{ es: '/como-funciona/', ca: '/ca/com-funciona/' },
	{ es: '/misiones/', ca: '/ca/missions/' },
	{ es: '/cuenta/', ca: '/ca/compte/' },
	{ es: '/contacto/', ca: '/ca/contacte/' },
	{ es: '/sobre-el-proyecto/', ca: '/ca/sobre-el-projecte/' },
	{ es: '/simulador/', ca: '/ca/simulador/', dubte: true },
];

// 301 de las URLs catalanas antiguas (raíz) a /ca/…. `/` y `/simulador/` no.
const REDIRECCIONS = [
	[ '/com-funciona/', '/ca/com-funciona/' ],
	[ '/missions/', '/ca/missions/' ],
	[ '/compte/', '/ca/compte/' ],
	[ '/contacte/', '/ca/contacte/' ],
	[ '/sobre-el-projecte/', '/ca/sobre-el-projecte/' ],
];

// Rutas que NO deben redirigirse.
const SENSE_REDIRECCIO = [ '/', '/simulador/' ];

const LANG = { es: 'es-ES', ca: 'ca' };

const args = process.argv.slice( 2 );
if ( args.includes( '--ayuda' ) || args.includes( '--help' ) ) {
	console.log( AYUDA );
	process.exit( 0 );
}
const sense301 = args.includes( '--sense-301' );
const base = (
	args.find( ( a ) => ! a.startsWith( '--' ) ) || 'http://localhost:8888'
).replace( /\/+$/, '' );

let errors = 0;
let avisos = 0;
const ok = ( m ) => console.log( `  ok     ${ m }` );
const ko = ( m ) => {
	errors++;
	console.log( `  FALLA  ${ m }` );
};
const dubte = ( m ) => {
	avisos++;
	console.log( `  DUBTE  ${ m }` );
};

const ruta = ( url ) => {
	try {
		return new URL( url, base ).pathname;
	} catch {
		return url;
	}
};

/** Lee un atributo de una etiqueta (comillas simples o dobles). */
const attr = ( etiqueta, nom ) => {
	const m = etiqueta.match(
		new RegExp( `\\b${ nom }\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i' )
	);
	return m ? m[ 1 ] ?? m[ 2 ] : null;
};

const etiquetes = ( html, nom ) =>
	html.match( new RegExp( `<${ nom }\\b[^>]*>`, 'gi' ) ) || [];

async function peticio( cami ) {
	return fetch( base + cami, { redirect: 'manual' } );
}

function info( res ) {
	const h = ( n ) => res.headers.get( n ) ?? '-';
	console.log(
		`         Vary: ${ h( 'vary' ) } | Age: ${ h( 'age' ) } | Cache-Control: ${ h( 'cache-control' ) }`
	);
}

async function comprovaPagina( cami, idioma, parell ) {
	console.log( `\n${ cami }  (esperado lang=${ LANG[ idioma ] })` );
	const informa = parell.dubte ? dubte : ko;
	let res;
	try {
		res = await peticio( cami );
	} catch ( e ) {
		informa( `sin respuesta: ${ e.message }` );
		return;
	}
	if ( res.status !== 200 ) {
		informa( `status ${ res.status } (esperado 200)` );
		return;
	}
	ok( 'status 200' );
	info( res );
	const html = await res.text();
	const nom = parell.dubte ? dubte : ko;

	const lang = ( attr( etiquetes( html, 'html' )[ 0 ] || '', 'lang' ) || '' )
		.trim();
	if ( lang.toLowerCase() === LANG[ idioma ].toLowerCase() ) {
		ok( `html lang="${ lang }"` );
	} else {
		nom( `html lang="${ lang }" (esperado "${ LANG[ idioma ] }")` );
	}

	const enllacos = etiquetes( html, 'link' );
	const canon = enllacos.find(
		( l ) => ( attr( l, 'rel' ) || '' ).toLowerCase() === 'canonical'
	);
	const canonHref = canon ? attr( canon, 'href' ) : null;
	if ( ! canonHref ) {
		nom( 'falta <link rel="canonical">' );
	} else if ( ruta( canonHref ) === cami ) {
		ok( `canonical ${ canonHref }` );
	} else {
		nom( `canonical ${ canonHref } no apunta a sí misma (${ cami })` );
	}

	const alt = {};
	for ( const l of enllacos ) {
		if ( ( attr( l, 'rel' ) || '' ).toLowerCase() === 'alternate' ) {
			const hl = attr( l, 'hreflang' );
			if ( hl ) {
				alt[ hl.toLowerCase() ] = ruta( attr( l, 'href' ) || '' );
			}
		}
	}
	const esperado = {
		es: parell.es,
		'es-es': parell.es,
		ca: parell.ca,
		'x-default': parell.es,
	};
	const esAlt = alt.es ?? alt[ 'es-es' ];
	const checks = [
		[ 'hreflang es', esAlt, parell.es ],
		[ 'hreflang ca', alt.ca, parell.ca ],
		[ 'hreflang x-default', alt[ 'x-default' ], esperado[ 'x-default' ] ],
	];
	for ( const [ etiqueta, real, quiero ] of checks ) {
		if ( real === quiero ) {
			ok( `${ etiqueta } → ${ real }` );
		} else {
			nom( `${ etiqueta } = ${ real ?? 'ausente' } (esperado ${ quiero })` );
		}
	}
}

async function comprovaRedireccio( origen, desti ) {
	console.log( `\n301 ${ origen }` );
	let res;
	try {
		res = await peticio( origen );
	} catch ( e ) {
		ko( `sin respuesta: ${ e.message }` );
		return;
	}
	const loc = res.headers.get( 'location' );
	if ( res.status === 301 && loc && ruta( loc ) === desti ) {
		ok( `301 → ${ loc }` );
	} else {
		ko(
			`status ${ res.status }, Location ${ loc ?? '-' } (esperado 301 → ${ desti })`
		);
	}
	info( res );
}

async function comprovaSenseRedireccio( cami ) {
	console.log( `\nsin 301 ${ cami }` );
	try {
		const res = await peticio( cami );
		if ( res.status >= 300 && res.status < 400 ) {
			ko(
				`redirige (${ res.status } → ${ res.headers.get( 'location' ) }); no debe`
			);
		} else {
			ok( `status ${ res.status }, sin redirección` );
		}
	} catch ( e ) {
		ko( `sin respuesta: ${ e.message }` );
	}
}

console.log( `Comprobando ${ base }` );
for ( const p of PARELLS ) {
	await comprovaPagina( p.es, 'es', p );
	await comprovaPagina( p.ca, 'ca', p );
}
if ( sense301 ) {
	console.log( '\n(301 omitidos por --sense-301)' );
} else {
	for ( const [ origen, desti ] of REDIRECCIONS ) {
		await comprovaRedireccio( origen, desti );
	}
	for ( const cami of SENSE_REDIRECCIO ) {
		await comprovaSenseRedireccio( cami );
	}
}

console.log(
	`\n${ errors ? 'FALLA' : 'OK' }: ${ errors } error(es), ${ avisos } aviso(s)`
);
process.exit( errors ? 1 : 0 );
