import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { comparaEstructura, validaParella } from '../parella.js';

const ARREL = new URL( '../../../../../missions/', import.meta.url );
const carpeta = ( idioma ) => {
	const dir = new URL( `${ idioma }/`, ARREL );
	return Object.fromEntries(
		readdirSync( dir )
			.filter( ( f ) => f.endsWith( '.json' ) )
			.map( ( f ) => [
				f,
				JSON.parse( readFileSync( new URL( f, dir ), 'utf8' ) ),
			] )
	);
};

// Fixture petit amb les peces que importen: ids, efectes, webs amb domini.
const missio = () => ( {
	id: 'prova-01',
	versio: 2,
	titol: 'La factura',
	webs: {
		'llumclara.cat': { plantilla: 'llum-clara', variant: 'oficial' },
		'llumclara-pagaments.com': {
			plantilla: 'llum-clara',
			variant: 'falsa',
		},
	},
	disparadors: [
		{
			id: 'arriba',
			quan: { esdeveniment: 'inici' },
			retard_ms: 8000,
			efectes: [
				{ tipus: 'mostra', id: 'm2' },
				{ tipus: 'notifica', app: 'posta', text: 'Paga ara' },
			],
		},
	],
	senyals: [
		{ id: 'remitent', explicacio: 'Ve de llumclara-pagaments.com' },
	],
	pistes: [ 'Mira el remitent' ],
} );

const traduida = () => {
	const m = missio();
	m.titol = 'La factura de la luz';
	m.webs = {
		'llumclara.es': m.webs[ 'llumclara.cat' ],
		'llumclara-pagos.com': m.webs[ 'llumclara-pagaments.com' ],
	};
	m.disparadors[ 0 ].efectes[ 1 ].text = 'Paga ahora';
	m.senyals[ 0 ].explicacio = 'Viene de llumclara-pagos.com';
	m.pistes = [ 'Mira el remitente' ];
	return m;
};

describe( 'comparaEstructura', () => {
	it( 'textos i dominis traduïts no són diferències', () => {
		expect( comparaEstructura( missio(), traduida() ) ).toEqual( [] );
	} );

	it( 'falla si es canvia un id de missió o de disparador', () => {
		const es = traduida();
		es.id = 'prova-02';
		expect( comparaEstructura( missio(), es ) ).toEqual( [
			'id: valor diferent ("prova-01" / "prova-02")',
		] );
		const es2 = traduida();
		es2.disparadors[ 0 ].efectes[ 0 ].id = 'm3';
		expect( comparaEstructura( missio(), es2 ) ).toHaveLength( 1 );
	} );

	it( 'falla si es treu un node o canvia la lògica', () => {
		const sense = traduida();
		sense.disparadors[ 0 ].efectes.pop();
		expect( comparaEstructura( missio(), sense )[ 0 ] ).toMatch(
			/disparadors\[0\]\.efectes: llargada diferent/
		);
		const tipus = traduida();
		tipus.disparadors[ 0 ].efectes[ 0 ].tipus = 'notifica';
		expect( comparaEstructura( missio(), tipus ) ).toHaveLength( 1 );
		const retard = traduida();
		retard.disparadors[ 0 ].retard_ms = 1;
		expect( comparaEstructura( missio(), retard ) ).toHaveLength( 1 );
		const clau = traduida();
		delete clau.senyals[ 0 ].id;
		expect( comparaEstructura( missio(), clau ) ).toEqual( [
			'senyals[0].id: falta en castellà',
		] );
	} );

	it( 'les webs poden canviar de domini però no de nombre ni de lògica', () => {
		const menys = traduida();
		delete menys.webs[ 'llumclara-pagos.com' ];
		expect( comparaEstructura( missio(), menys )[ 0 ] ).toMatch(
			/webs: nombre de webs diferent/
		);
		const variant = traduida();
		variant.webs[ 'llumclara.es' ].variant = 'falsa';
		expect( comparaEstructura( missio(), variant ) ).toHaveLength( 1 );
	} );

	it( 'un text en lloc d’una llista és una diferència de tipus', () => {
		const es = traduida();
		es.pistes = 'Mira el remitente';
		expect( comparaEstructura( missio(), es )[ 0 ] ).toMatch(
			/pistes: tipus diferent/
		);
	} );
} );

describe( 'validaParella', () => {
	it( 'falla si falta o es renombra un fitxer en un dels dos idiomes', () => {
		expect(
			validaParella( {
				ca: { 'a.json': missio(), 'b.json': missio() },
				es: { 'a.json': traduida(), 'c.json': missio() },
			} )
		).toEqual( [
			'b.json: falta a missions/es/',
			'c.json: falta a missions/ca/',
		] );
	} );

	it( 'les url dels disparadors i navegador.inici han d’existir a les webs del mateix idioma', () => {
		const ambUrls = ( m, inici, url ) => {
			m.navegador = { inici: [ `https://${ inici }/` ] };
			m.disparadors[ 0 ].quan = { esdeveniment: 'web.obre', url };
			return m;
		};
		const mon = ( domini ) => ( { webs: { [ domini ]: {} } } );
		const ca = {
			'a.json': ambUrls(
				missio(),
				'posta.cat',
				'llumclara-pagaments.com'
			),
			'mon.json': mon( 'posta.cat' ),
		};
		expect(
			validaParella( {
				ca,
				es: {
					'a.json': ambUrls(
						traduida(),
						'posta.es',
						'llumclara-pagos.com'
					),
					'mon.json': mon( 'posta.es' ),
				},
			} )
		).toEqual( [] );
		// Domini que no existeix (p. ex. s'ha deixat el .cat a la versió es).
		expect(
			validaParella( {
				ca,
				es: {
					'a.json': ambUrls(
						traduida(),
						'posta.es',
						'llumclara-pagaments.com'
					),
					'mon.json': mon( 'posta.es' ),
				},
			} )
		).toEqual( [
			'a.json: url "llumclara-pagaments.com" (es) no és a webs ni a mon.webs',
		] );
		// Existeix però apunta a una altra web que en català.
		expect(
			validaParella( {
				ca,
				es: {
					'a.json': ambUrls( traduida(), 'posta.es', 'llumclara.es' ),
					'mon.json': mon( 'posta.es' ),
				},
			} )
		).toEqual( [ 'a.json: url 1 apunta a webs diferents en ca i es' ] );
	} );

	it( 'les carpetes reals missions/ca i missions/es són parella', () => {
		const ca = carpeta( 'ca' );
		expect( Object.keys( ca ) ).toContain( 'mon.json' );
		expect( Object.keys( ca ) ).toHaveLength( 13 );
		expect( validaParella( { ca, es: carpeta( 'es' ) } ) ).toEqual( [] );
	} );
} );
