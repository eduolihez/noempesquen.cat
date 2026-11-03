import { describe, it, expect } from 'vitest';
import {
	triaConjunt,
	urlMissions,
	IDIOMA_PER_DEFECTE,
} from '../conjunt-missions.js';
import { CONJUNTS } from '../../simulador/missions-incloses.js';
import caFactura from '../../../../../missions/ca/llissa-01-factura.json';
import esFactura from '../../../../../missions/es/llissa-01-factura.json';
import caMon from '../../../../../missions/ca/mon.json';
import esMon from '../../../../../missions/es/mon.json';

describe( 'triaConjunt', () => {
	const conjunts = {
		ca: { missions: [ 'ca' ], mon: { idioma: 'ca' } },
		es: { missions: [ 'es' ], mon: { idioma: 'es' } },
	};

	it( 'tria el conjunt de l’idioma', () => {
		expect( triaConjunt( conjunts, 'ca' ) ).toBe( conjunts.ca );
		expect( triaConjunt( conjunts, 'es' ) ).toBe( conjunts.es );
	} );

	it( 'amb un idioma desconegut o buit, el castellà', () => {
		expect( IDIOMA_PER_DEFECTE ).toBe( 'es' );
		for ( const lang of [ undefined, null, '', 'en', 'CA', 'toString' ] ) {
			expect( triaConjunt( conjunts, lang ) ).toBe( conjunts.es );
		}
	} );

	it( 'el bundle carrega missions/es amb lang=es i missions/ca amb lang=ca', () => {
		const ca = triaConjunt( CONJUNTS, 'ca' );
		const es = triaConjunt( CONJUNTS, 'es' );
		expect( ca.missions ).toContain( caFactura );
		expect( ca.missions ).not.toContain( esFactura );
		expect( ca.mon ).toBe( caMon );
		expect( es.missions ).toContain( esFactura );
		expect( es.missions ).not.toContain( caFactura );
		expect( es.mon ).toBe( esMon );
		expect( es.missions.map( ( m ) => m.id ) ).toEqual(
			ca.missions.map( ( m ) => m.id )
		);
	} );
} );

describe( 'urlMissions', () => {
	it( 'afegeix lang amb ? o & segons l’arrel', () => {
		expect( urlMissions( '/wp-json/noempesquen/v1/', 'ca' ) ).toBe(
			'/wp-json/noempesquen/v1/missions?lang=ca'
		);
		expect( urlMissions( '/?rest_route=/noempesquen/v1/', 'es' ) ).toBe(
			'/?rest_route=/noempesquen/v1/missions&lang=es'
		);
		expect( urlMissions( '/wp-json/noempesquen/v1/', '' ) ).toBe(
			'/wp-json/noempesquen/v1/missions?lang=es'
		);
	} );
} );
