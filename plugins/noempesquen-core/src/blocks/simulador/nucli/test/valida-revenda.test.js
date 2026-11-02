import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validaMissio, PLANTILLES_SOLO_FALSES } from '../valida.js';

const llegeix = ( nom ) =>
	JSON.parse(
		readFileSync(
			new URL( `../../../../../missions/${ nom }`, import.meta.url ),
			'utf8'
		)
	);
const mon = llegeix( 'mon.json' );

// Missió mòbil real a la qual s'afegeix Revenda amb una senyal pròpia.
const fixture = () => {
	const m = llegeix( 'remei-03-sorteig.json' );
	m.senyals.push( { id: 'fora_revenda', nom: 'x', pista: 'x' } );
	m.apps.revenda = {
		anuncis: [
			{
				id: 'bici',
				titol: 'Bici de muntanya',
				preu: 120,
				il: 'bicicleta',
				descripcio: 'Ben cuidada.',
			},
		],
		xats: [
			{
				id: 'xat-jordi',
				contacte: 'comprador',
				anunci: 'bici',
				missatges: [
					{ id: 'r1', de: 'ells', cos: [ { t: 'Hola' } ] },
					{
						id: 'r2',
						de: 'ells',
						ocult: true,
						cos: [
							{ t: 'Cobra aquí: ' },
							{
								enllac: {
									text: 'enllaç',
									url: 'https://cobra-revenda.top/cobrament',
								},
								senyal: 'fora_revenda',
							},
						],
					},
				],
			},
		],
	};
	return m;
};
const errors = ( m ) => validaMissio( m, mon );

describe( 'validaMissio: apps.revenda', () => {
	it( 'accepta una missió amb Revenda vàlida', () => {
		expect( errors( fixture() ) ).toEqual( [] );
	} );

	it( 'les missions reals segueixen vàlides amb el món', () => {
		[
			'llissa-01-factura.json',
			'llissa-02-banc.json',
			'remei-01-paquet.json',
			'remei-02-canviat.json',
			'remei-03-sorteig.json',
			'remei-04-codi.json',
		].forEach( ( f ) => expect( errors( llegeix( f ) ) ).toEqual( [] ) );
	} );

	it( 'rebutja contacte inexistent', () => {
		const m = fixture();
		m.apps.revenda.xats[ 0 ].contacte = 'ningu';
		expect( errors( m ).join( '\n' ) ).toMatch( /contacte inexistent/ );
	} );

	it( 'rebutja anunci inexistent', () => {
		const m = fixture();
		m.apps.revenda.xats[ 0 ].anunci = 'moto';
		expect( errors( m ).join( '\n' ) ).toMatch( /anunci inexistent/ );
	} );

	it( 'rebutja ids duplicats', () => {
		const m = fixture();
		m.apps.revenda.xats[ 0 ].missatges[ 1 ].id = 'r1';
		expect( errors( m ).join( '\n' ) ).toMatch( /id duplicat «r1»/ );
		const n = fixture();
		n.apps.revenda.anuncis.push( { ...n.apps.revenda.anuncis[ 0 ] } );
		expect( errors( n ).join( '\n' ) ).toMatch( /id duplicat «bici»/ );
	} );

	it( 'exigeix http(s) als enllaços', () => {
		const m = fixture();
		m.apps.revenda.xats[ 0 ].missatges[ 1 ].cos[ 1 ].enllac.url =
			'cerca:cobra';
		expect( errors( m ).join( '\n' ) ).toMatch( /url sense http/ );
	} );

	it( 'rebutja una senyal inexistent', () => {
		const m = fixture();
		m.apps.revenda.xats[ 0 ].missatges[ 1 ].cos[ 1 ].senyal = 'fantasma';
		expect( errors( m ) ).toContain( 'senyal desconegut: fantasma' );
	} );

	it( 'rebutja una senyal declarada i no referenciada', () => {
		const m = fixture();
		delete m.apps.revenda.xats[ 0 ].missatges[ 1 ].cos[ 1 ].senyal;
		expect( errors( m ) ).toContain(
			'senyal sense referència: fora_revenda'
		);
	} );

	it( 'rebutja il·lustració i remitent invàlids', () => {
		const m = fixture();
		m.apps.revenda.anuncis[ 0 ].il = 'no-hi-es';
		m.apps.revenda.xats[ 0 ].missatges[ 0 ].de = 'altres';
		const e = errors( m ).join( '\n' );
		expect( e ).toMatch( /il·lustració inexistent/ );
		expect( e ).toMatch( /remitent invàlid/ );
	} );

	it( 'permet que un disparador mostri un missatge de Revenda', () => {
		const m = fixture();
		m.disparadors.push( {
			quan: { esdeveniment: 'inici' },
			retard_ms: 1500,
			efectes: [ { tipus: 'mostra', id: 'r2' } ],
		} );
		expect( errors( m ) ).toEqual( [] );
		m.disparadors[ m.disparadors.length - 1 ].efectes[ 0 ].id = 'zz';
		expect( errors( m ) ).toContain( 'mostra: element inexistent: zz' );
	} );
} );

describe( 'validaMissio: plantilles, senyals de web i cruces', () => {
	it( 'exporta les plantilles només falses', () => {
		expect( PLANTILLES_SOLO_FALSES ).toEqual( [
			'sorteig',
			'cobrament',
			'inversio',
		] );
	} );

	it( 'cobrament i inversio només admeten variant falsa', () => {
		[ 'cobrament', 'inversio' ].forEach( ( plantilla ) => {
			const m = fixture();
			const web = m.webs[ 'sorteig-calroig.top' ];
			web.plantilla = plantilla;
			web.variant = 'oficial';
			expect( errors( m ) ).toContain(
				`${ plantilla } només admet variant falsa: sorteig-calroig.top`
			);
			web.variant = 'falsa';
			expect( errors( m ).join( ', ' ) ).not.toMatch(
				/plantilla desconeguda|només admet variant/
			);
		} );
	} );

	it( 'recull les senyals de compte, promesa i testimonis de les webs', () => {
		const m = fixture();
		const web = m.webs[ 'sorteig-calroig.top' ];
		web.compte_senyal = 'fantasma1';
		web.promesa_senyal = 'fantasma2';
		web.testimonis = [ { nom: 'A', senyal: 'fantasma3' } ];
		const e = errors( m );
		[ 'fantasma1', 'fantasma2', 'fantasma3' ].forEach( ( s ) =>
			expect( e ).toContain( `senyal desconegut: ${ s }` )
		);
	} );

	it( 'valida les URL dels enllaços de les webs', () => {
		const m = fixture();
		m.webs[ 'sorteig-calroig.top' ].enllacos = [
			{ enllac: { text: 'x', url: 'javascript:alert(1)' } },
		];
		expect( errors( m ) ).toContain(
			"url d'enllaç no permesa: javascript:alert(1)"
		);
	} );

	it( 'notifica amb xat: admès a revenda i parla, no a altres apps', () => {
		const m = fixture();
		const efecte = {
			tipus: 'notifica',
			app: 'revenda',
			titol: 'Jordi M.',
			text: 'Hola!',
			xat: 'xat-jordi',
			font: 'mobil',
		};
		m.disparadors.push( {
			quan: { esdeveniment: 'inici' },
			retard_ms: 1500,
			efectes: [ efecte ],
		} );
		expect( errors( m ) ).toEqual( [] );
		efecte.app = 'ullada';
		expect( errors( m ) ).toContain(
			'notifica: xat només amb app parla o revenda'
		);
	} );

	it( 'contacte.bloqueja exigeix un contacte del món', () => {
		const m = fixture();
		m.disparadors.push( {
			quan: { esdeveniment: 'contacte.bloqueja', id: 'comprador' },
			efectes: [ { tipus: 'guia-diu', text: 'ok' } ],
		} );
		expect( errors( m ) ).toEqual( [] );
		m.disparadors[ m.disparadors.length - 1 ].quan.id = 'ningu';
		expect( errors( m ) ).toContain(
			'bloqueja: contacte inexistent: ningu'
		);
	} );

	it( "publicacio.denuncia exigeix una publicació d'Ullada o un anunci", () => {
		const m = fixture();
		const id = mon.ullada.publicacions[ 0 ].id;
		m.disparadors.push( {
			quan: { esdeveniment: 'publicacio.denuncia', id },
			efectes: [ { tipus: 'guia-diu', text: 'ok' } ],
		} );
		expect( errors( m ) ).toEqual( [] );
		m.disparadors[ m.disparadors.length - 1 ].quan.id = 'no-hi-es';
		expect( errors( m ) ).toContain(
			'denuncia: publicació inexistent: no-hi-es'
		);
		// Un anunci fora de la plantilla diari no és denunciable.
		m.webs[ 'sorteig-calroig.top' ].anunci = { id: 'no-hi-es' };
		expect( errors( m ) ).toContain(
			'denuncia: publicació inexistent: no-hi-es'
		);
	} );
} );

describe( 'validaMissio: arrestos de robustesa', () => {
	it( 'bloqueja i denuncia sense id fallen', () => {
		[
			[ 'contacte.bloqueja', 'bloqueja: contacte inexistent: undefined' ],
			[
				'publicacio.denuncia',
				'denuncia: publicació inexistent: undefined',
			],
		].forEach( ( [ esdeveniment, error ] ) => {
			const m = fixture();
			m.webs[ 'sorteig-calroig.top' ].anunci = {};
			m.disparadors.push( {
				quan: { esdeveniment },
				efectes: [ { tipus: 'guia-diu', text: 'ok' } ],
			} );
			expect( errors( m ) ).toContain( error );
		} );
	} );

	it( 'valida preu, ocult, hora i senyal del segment', () => {
		const m = fixture();
		const r = m.apps.revenda;
		r.anuncis[ 0 ].preu = -1;
		r.xats[ 0 ].missatges[ 0 ].ocult = 'si';
		r.xats[ 0 ].missatges[ 0 ].hora = 5;
		r.xats[ 0 ].missatges[ 0 ].cos[ 0 ].senyal = 7;
		const e = errors( m ).join( ', ' );
		expect( e ).toMatch( /«preu»/ );
		expect( e ).toMatch( /«ocult»/ );
		expect( e ).toMatch( /«hora»/ );
		expect( e ).toMatch( /«senyal» ha de ser text/ );
	} );

	it( 'rebutja una URL http(s) buida', () => {
		const m = fixture();
		m.apps.revenda.xats[ 0 ].missatges[ 1 ].cos[ 1 ].enllac.url =
			'https://';
		expect( errors( m ).join( ', ' ) ).toMatch( /url sense http/ );
	} );

	it( 'una senyal referenciada només a webs.*.compte_senyal és vàlida', () => {
		const m = fixture();
		delete m.apps.revenda.xats[ 0 ].missatges[ 1 ].cos[ 1 ].senyal;
		m.webs[ 'sorteig-calroig.top' ].compte_senyal = 'fora_revenda';
		expect( errors( m ) ).toEqual( [] );
	} );

	it( 'rebutja ids de senyal duplicats', () => {
		const m = fixture();
		m.senyals.push( { ...m.senyals[ 0 ] } );
		expect( errors( m ) ).toContain(
			`senyal duplicada: ${ m.senyals[ 0 ].id }`
		);
	} );
} );
