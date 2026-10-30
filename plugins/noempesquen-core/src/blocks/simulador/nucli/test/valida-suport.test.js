import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validaMissio } from '../valida.js';
import { FASE, estatInicial, reductor } from '../motor.js';

const llegeix = ( nom ) =>
	JSON.parse(
		readFileSync(
			new URL( `../../../../../missions/${ nom }`, import.meta.url ),
			'utf8'
		)
	);
const mon = llegeix( 'mon.json' );
const DOMINI = 'receptes-prova.cat';
const URL_WEB = `https://${ DOMINI }/suport`;

// Web article inventada (sense senyals) amb l'avís i el fitxer dels disparadors.
const web = () => ( {
	plantilla: 'article',
	titol: 'Recepta de prova',
	nom_lloc: 'Receptes de Prova',
	seccions: [ { titol: 'Ingredients', llista: [ { t: 'Farina' } ] } ],
	avis: {
		retard: 0,
		titol: 'Avís de prova',
		cos: [ { t: 'Text de prova.' } ],
		telefon: '900 000 000',
		etiquetaTelefon: 'Truca',
		contador: '04:59',
		instal_la: {
			fitxer: 'ajuda.exe',
			origen: 'ajuda-prova.top',
			text_boto: 'Instal·la',
		},
	},
} );

const fixture = () => {
	const m = llegeix( 'llissa-01-factura.json' );
	m.webs[ DOMINI ] = web();
	m.disparadors.push(
		{
			quan: { esdeveniment: 'telefon.truca', url: URL_WEB },
			efectes: [ { tipus: 'pescat' } ],
		},
		{
			quan: {
				esdeveniment: 'descarrega.fes',
				url: URL_WEB,
				fitxer: 'ajuda.exe',
			},
			efectes: [ { tipus: 'guia-diu', text: 'Compte.' } ],
		}
	);
	return m;
};
const errors = ( m ) => validaMissio( m, mon );
const aplica = ( m, ...accions ) =>
	accions.reduce(
		( e, a ) => reductor( m, e, a ),
		reductor( m, estatInicial( m ), { tipus: 'DESBLOQUEJA' } )
	);
const esdev = ( nom, dades ) => ( { tipus: 'ESDEVENIMENT', nom, dades } );

describe( 'validaMissio: telefon.truca i descarrega.fes', () => {
	it( 'accepta disparadors amb els dos esdeveniments', () => {
		expect( errors( fixture() ) ).toEqual( [] );
	} );

	it( 'segueix rebutjant esdeveniments desconeguts', () => {
		const m = fixture();
		m.disparadors.at( -1 ).quan.esdeveniment = 'telefon.inventat';
		expect( errors( m ) ).toContain(
			'esdeveniment desconegut: telefon.inventat'
		);
	} );

	it( 'rebutja un fitxer que no és text', () => {
		const m = fixture();
		m.disparadors.at( -1 ).quan.fitxer = 5;
		expect( errors( m ) ).toContain( 'fitxer ha de ser text' );
	} );

	it( 'rebutja una url que no és cap web article', () => {
		const m = fixture();
		m.disparadors.at( -2 ).quan.url = 'inexistent.cat';
		m.disparadors.at( -1 ).quan.url = 'https://llumclara-pagaments.com/';
		const e = errors( m );
		expect( e ).toContain(
			'telefon.truca: url sense web article: inexistent.cat'
		);
		expect( e ).toContain(
			'descarrega.fes: url sense web article: https://llumclara-pagaments.com/'
		);
	} );

	it( 'accepta la url amb www. i el host pelat', () => {
		const m = fixture();
		m.disparadors.at( -2 ).quan.url = `www.${ DOMINI }`;
		m.disparadors.at( -1 ).quan.url = DOMINI;
		expect( errors( m ) ).toEqual( [] );
	} );

	it( 'telefon.truca exigeix una web amb avís', () => {
		const m = fixture();
		m.webs[ 'sense-avis.cat' ] = { ...web(), avis: undefined };
		delete m.webs[ 'sense-avis.cat' ].avis;
		m.disparadors.at( -2 ).quan.url = 'sense-avis.cat';
		expect( errors( m ) ).toContain(
			'telefon.truca: la web sense-avis.cat no té avís'
		);
	} );

	it( 'avis.apareix exigeix una web article amb avís', () => {
		const m = fixture();
		const w = web();
		delete w.avis;
		m.webs[ 'sense-avis.cat' ] = w;
		m.disparadors.push(
			{
				quan: { esdeveniment: 'avis.apareix', url: URL_WEB },
				efectes: [ { tipus: 'guia-diu', text: 'Ha sortit.' } ],
			},
			{
				quan: { esdeveniment: 'avis.apareix', url: 'sense-avis.cat' },
				efectes: [],
			},
			{
				quan: {
					esdeveniment: 'avis.apareix',
					url: 'llumclara-pagaments.com',
				},
				efectes: [],
			}
		);
		const e = errors( m );
		expect( e ).toContain(
			'avis.apareix: la web sense-avis.cat no té avís'
		);
		expect( e ).toContain(
			'avis.apareix: url sense web article: llumclara-pagaments.com'
		);
		expect( e ).toHaveLength( 2 );
	} );

	it( 'descarrega.fes exigeix una web amb fitxers', () => {
		const m = fixture();
		const w = web();
		delete w.avis.instal_la;
		m.webs[ 'sense-fitxer.cat' ] = w;
		m.disparadors.at( -1 ).quan.url = 'sense-fitxer.cat';
		expect( errors( m ) ).toContain(
			'descarrega.fes: la web sense-fitxer.cat no té cap fitxer'
		);
	} );

	it( 'descarrega.fes exigeix fitxer', () => {
		const m = fixture();
		delete m.disparadors.at( -1 ).quan.fitxer;
		expect( errors( m ) ).toContain(
			`descarrega.fes: falta fitxer (${ DOMINI })`
		);
	} );

	it( 'el fitxer ha de ser de la mateixa web (parella url+fitxer)', () => {
		const m = fixture();
		const w = web();
		w.avis.instal_la.fitxer = 'altra.exe';
		m.webs[ 'altra-prova.cat' ] = w;
		m.disparadors.push( {
			quan: {
				esdeveniment: 'descarrega.fes',
				url: 'altra-prova.cat',
				fitxer: 'altra.exe',
			},
			efectes: [],
		} );
		m.disparadors.at( -2 ).quan.fitxer = 'altra.exe';
		const e = errors( m );
		expect( e ).toContain( 'descarrega: fitxer no declarat: altra.exe' );
		expect( e ).toContain(
			`descarrega: fitxer sense disparador: ${ DOMINI } ajuda.exe`
		);
	} );

	it( 'cada fitxer declarat necessita un disparador', () => {
		const m = fixture();
		m.disparadors.pop();
		expect( errors( m ) ).toContain(
			`descarrega: fitxer sense disparador: ${ DOMINI } ajuda.exe`
		);
	} );
} );

describe( 'motor: telefon.truca i descarrega.fes', () => {
	it( 'telefon.truca emet pescat', () => {
		const m = fixture();
		const e = aplica( m, esdev( 'telefon.truca', { url: URL_WEB } ) );
		expect( e.pescat ).toBe( true );
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
	} );

	it( 'descarrega.fes filtra per fitxer i per url', () => {
		const m = fixture();
		const guies = ( e ) => e.xat.length;
		const base = guies( aplica( m ) );
		const altre = aplica(
			m,
			esdev( 'descarrega.fes', { url: URL_WEB, fitxer: 'altre.pdf' } )
		);
		expect( guies( altre ) ).toBe( base );
		const bo = aplica(
			m,
			esdev( 'descarrega.fes', { url: URL_WEB, fitxer: 'ajuda.exe' } )
		);
		expect( guies( bo ) ).toBe( base + 1 );
	} );
} );
