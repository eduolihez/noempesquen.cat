import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validaMissio, PLANTILLES_WEB } from '../valida.js';

const llegeix = ( nom ) =>
	JSON.parse(
		readFileSync(
			new URL( `../../../../../missions/${ nom }`, import.meta.url ),
			'utf8'
		)
	);
const mon = llegeix( 'mon.json' );
const DOMINI = 'cuinaravui.cat';
const URL_WEB = `https://${ DOMINI }/`;

const senyal = ( id ) => ( {
	id,
	titol: 'Senyal de prova',
	explicacio: 'Explicació de prova.',
	reaccio: 'Reacció de prova.',
} );

const web = () => ( {
	plantilla: 'article',
	https: true,
	titol: 'Coca de recapte',
	nom_lloc: 'Cuina Avui',
	entradeta: [ { t: 'Una recepta de tota la vida.' } ],
	seccions: [
		{ titol: 'Ingredients', llista: [ { t: 'Farina' }, { t: 'Oli' } ] },
		{
			titol: 'Preparació',
			cos: [ [ { t: 'Pasta la farina.' } ], [ { t: 'Enforna-la.' } ] ],
		},
	],
	avis: {
		retard: 4000,
		titol: 'Virus detectat!',
		cos: [ { t: 'El teu ordinador està en perill.', senyal: 'alarma' } ],
		telefon: '900 000 000',
		etiquetaTelefon: 'Suport Segur Digital',
		contador: '04:59',
		reobre: true,
		senyal_telefon: 'telefon_suport',
		instal_la: {
			fitxer: 'suport-remot.exe',
			origen: 'alerta-equip.top',
			senyal_fitxer: 'instalador',
			text_boto: "Instal·la l'eina de suport",
		},
	},
	barra: {
		text: [ { t: 'El teu navegador està desactualitzat.' } ],
		boto: "Descarrega l'actualització",
		fitxer: 'actualitzacio-navegador.exe',
		origen: 'descarrega-navegador.top',
		senyal_origen: 'domini_top',
	},
} );

const fixture = () => {
	const m = llegeix( 'llissa-01-factura.json' );
	m.webs[ DOMINI ] = web();
	m.senyals.push(
		senyal( 'alarma' ),
		senyal( 'telefon_suport' ),
		senyal( 'instalador' ),
		senyal( 'domini_top' )
	);
	m.disparadors.push(
		{
			quan: { esdeveniment: 'telefon.truca', url: URL_WEB },
			efectes: [ { tipus: 'pescat' } ],
		},
		{
			quan: {
				esdeveniment: 'descarrega.fes',
				url: URL_WEB,
				fitxer: 'suport-remot.exe',
			},
			efectes: [ { tipus: 'pescat' } ],
		}
	);
	return m;
};
const errors = ( m ) => validaMissio( m, mon );
const w = ( m ) => m.webs[ DOMINI ];

describe( 'validaMissio: plantilla article', () => {
	it( 'article és una plantilla vàlida', () => {
		expect( PLANTILLES_WEB ).toContain( 'article' );
	} );

	it( 'accepta un article complet amb avís i barra', () => {
		expect( errors( fixture() ) ).toEqual( [] );
	} );

	it( 'accepta un article sense avís ni barra, i amb variant', () => {
		const m = fixture();
		delete w( m ).avis;
		delete w( m ).barra;
		w( m ).variant = 'oficial';
		m.senyals = m.senyals.filter(
			( s ) =>
				! [
					'alarma',
					'telefon_suport',
					'instalador',
					'domini_top',
				].includes( s.id )
		);
		m.disparadors.pop();
		expect( errors( m ) ).toEqual( [] );
	} );

	it( 'exigeix nom_lloc, titol i seccions', () => {
		const m = fixture();
		delete w( m ).nom_lloc;
		w( m ).seccions = [];
		const e = errors( m );
		expect( e ).toContain(
			`article ${ DOMINI }: camp «nom_lloc» buit o absent`
		);
		expect( e ).toContain(
			`article ${ DOMINI }: «seccions» ha de ser una llista no buida`
		);
	} );

	it( 'una secció necessita cos o llista, no tots dos', () => {
		const m = fixture();
		w( m ).seccions[ 0 ].cos = [ { t: 'x' } ];
		expect( errors( m ) ).toContain(
			`article ${ DOMINI }.seccions[0]: cal «cos» o «llista» (només un)`
		);
	} );

	it( 'rebutja segments sense text', () => {
		const m = fixture();
		w( m ).seccions[ 0 ].llista.push( { text: 'malament' } );
		expect( errors( m ) ).toContain(
			`article ${ DOMINI }.seccions[0].llista[2]: segment sense «t» ni «enllac»`
		);
	} );

	it( 'rebutja enllaços a la llista d’una secció', () => {
		const m = fixture();
		w( m ).seccions[ 0 ].llista.push( {
			enllac: { text: 'Botiga', url: 'https://cuinaravui.cat/botiga' },
		} );
		expect( errors( m ) ).toContain(
			`article ${ DOMINI }.seccions[0].llista[2]: «enllac» no admès aquí`
		);
	} );

	it( 'rebutja enllaços al text de la barra', () => {
		const m = fixture();
		w( m ).barra.text.push( {
			enllac: { text: 'Més', url: 'https://cuinaravui.cat/mes' },
		} );
		expect( errors( m ) ).toContain(
			`article ${ DOMINI }.barra.text[1]: «enllac» no admès aquí`
		);
	} );

	it( 'retard ha de ser un nombre ≥ 0', () => {
		[ -1, '4000', undefined, Infinity ].forEach( ( retard ) => {
			const m = fixture();
			w( m ).avis.retard = retard;
			expect( errors( m ) ).toContain(
				`article ${ DOMINI }.avis: «retard» ha de ser un nombre ≥ 0`
			);
		} );
	} );

	it( 'exigeix els textos de l’avís i un instal_la coherent', () => {
		const m = fixture();
		delete w( m ).avis.telefon;
		w( m ).avis.instal_la.fitxer = 7;
		delete w( m ).avis.instal_la.text_boto;
		const e = errors( m );
		expect( e ).toContain(
			`article ${ DOMINI }.avis: camp «telefon» buit o absent`
		);
		expect( e ).toContain(
			`article ${ DOMINI }.avis.instal_la: camp «fitxer» buit o absent`
		);
		expect( e ).toContain(
			`article ${ DOMINI }.avis.instal_la: camp «text_boto» buit o absent`
		);
	} );

	it( 'exigeix fitxer i origen de text a la barra', () => {
		const m = fixture();
		w( m ).barra.origen = [ 'x' ];
		w( m ).barra.text = [];
		const e = errors( m );
		expect( e ).toContain(
			`article ${ DOMINI }.barra: camp «origen» buit o absent`
		);
		expect( e ).toContain(
			`article ${ DOMINI }.barra: «text» ha de ser una llista no buida`
		);
	} );

	it( 'avis i barra només a la plantilla article', () => {
		const m = fixture();
		m.webs[ 'llumclara-pagaments.com' ].barra = web().barra;
		expect( errors( m ) ).toContain(
			'llumclara-pagaments.com.barra: només admès a la plantilla article'
		);
	} );
} );

describe( 'validaMissio: senyals de l’article', () => {
	it( 'compta senyal_telefon, senyal_fitxer i senyal_origen com a referència', () => {
		const m = fixture();
		// Cap altra referència: només els camps nous.
		expect( errors( m ) ).toEqual( [] );
	} );

	it( 'una senyal declarada i no referenciada falla', () => {
		const m = fixture();
		delete w( m ).avis.senyal_telefon;
		expect( errors( m ) ).toContain(
			'senyal sense referència: telefon_suport'
		);
	} );

	it( 'una senyal referenciada i no declarada falla', () => {
		const m = fixture();
		w( m ).barra.senyal_fitxer = 'inexistent';
		expect( errors( m ) ).toContain( 'senyal desconegut: inexistent' );
	} );
} );

describe( 'validaMissio: descarrega.fes i fitxers declarats', () => {
	it( 'accepta el fitxer de la barra', () => {
		const m = fixture();
		m.disparadors.at( -1 ).quan.fitxer = 'actualitzacio-navegador.exe';
		expect( errors( m ) ).toEqual( [] );
	} );

	it( 'rebutja un fitxer que cap web declara', () => {
		const m = fixture();
		m.disparadors.at( -1 ).quan.fitxer = 'altre.exe';
		expect( errors( m ) ).toContain(
			'descarrega: fitxer no declarat: altre.exe'
		);
	} );

	it( 'sense fitxers declarats no es creua', () => {
		const m = fixture();
		delete w( m ).barra;
		delete w( m ).avis.instal_la;
		m.senyals = m.senyals.filter(
			( s ) => ! [ 'instalador', 'domini_top' ].includes( s.id )
		);
		m.disparadors.at( -1 ).quan.fitxer = 'qualsevol.exe';
		expect( errors( m ) ).toEqual( [] );
	} );
} );
