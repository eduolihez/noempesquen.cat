import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
	validaMissio,
	APPS,
	APPS_PC,
	APPS_MOBIL,
	ESDEVENIMENTS,
} from '../valida.js';

const ruta = new URL(
	'../../../../../missions/llissa-01-factura.json',
	import.meta.url
);
const factura = JSON.parse( readFileSync( ruta, 'utf8' ) );
const copia = () => structuredClone( factura );

describe( 'validaMissio v2', () => {
	it( 'no peta amb null o no-array a senyals, disparadors, efectes i opcions', () => {
		[ null, 5, 'x', {} ].forEach( ( v ) => {
			const m = copia();
			m.senyals = v;
			m.disparadors = v;
			m.decisio.opcions = v;
			expect( () => validaMissio( m ) ).not.toThrow();
			const n = copia();
			n.disparadors.forEach( ( d ) => {
				d.efectes = v;
			} );
			expect( () => validaMissio( n ) ).not.toThrow();
		} );
		const m = copia();
		m.senyals = [ null, ...m.senyals ];
		expect( () => validaMissio( m ) ).not.toThrow();
	} );

	it( 'la missió factura v2 és vàlida', () => {
		expect( validaMissio( factura ) ).toEqual( [] );
	} );

	it( 'rebutja versio 1', () => {
		const m = copia();
		m.versio = 1;
		expect( validaMissio( m ) ).toContain( 'versio no suportada' );
	} );

	it( 'detecta senyal desconegut a un camp de formulari', () => {
		const m = copia();
		m.webs[ 'llumclara-pagaments.com' ].formulari.camps[ 0 ].senyal = 'xyz';
		expect( validaMissio( m ) ).toContain( 'senyal desconegut: xyz' );
	} );

	it( 'detecta disparador amb efecte desconegut', () => {
		const m = copia();
		m.disparadors[ 0 ].efectes.push( { tipus: 'vola' } );
		expect( validaMissio( m ) ).toContain( 'efecte desconegut: vola' );
	} );

	it( 'detecta decideix amb opció inexistent', () => {
		const m = copia();
		m.disparadors.push( {
			id: 'x',
			quan: { esdeveniment: 'inici' },
			efectes: [ { tipus: 'decideix', opcio: 'z' } ],
		} );
		expect( validaMissio( m ) ).toContain( 'opció inexistent: z' );
	} );

	it( 'exigeix un camí de pescat', () => {
		const m = copia();
		m.disparadors.forEach( ( d ) => {
			d.efectes = d.efectes.filter( ( e ) => e.tipus !== 'pescat' );
		} );
		expect( validaMissio( m ) ).toContain( 'cap camí de pescat' );
	} );

	it( 'detecta web amb plantilla desconeguda', () => {
		const m = copia();
		m.webs[ 'llumclara.cat' ].plantilla = 'res';
		expect( validaMissio( m ) ).toContain( 'plantilla desconeguda: res' );
	} );

	it( "detecta senyal desconegut al domini d'una web", () => {
		const m = copia();
		m.webs[ 'llumclara-pagaments.com' ].domini_senyal = 'nope';
		expect( validaMissio( m ) ).toContain( 'senyal desconegut: nope' );
	} );

	it( 'detecta camps obligatoris, dispositiu i opció correcta', () => {
		const m = copia();
		delete m.titol;
		delete m.intro;
		m.dispositiu = 'tele';
		m.decisio.opcions.forEach( ( o ) => ( o.valor = 'incorrecta' ) );
		const errors = validaMissio( m );
		expect( errors ).toEqual(
			expect.arrayContaining( [
				'falta titol',
				'falta intro',
				'dispositiu invàlid',
				'cap opció correcta',
			] )
		);
	} );

	it( 'no valida una cosa que no és un objecte', () => {
		expect( validaMissio( null ) ).toEqual( [ 'no és un objecte' ] );
	} );
	it( 'detecta frase inexistent a guia-diu', () => {
		const m = copia();
		m.disparadors[ 1 ].efectes[ 0 ] = {
			tipus: 'guia-diu',
			frase: 'no-hi-es',
		};
		expect( validaMissio( m ) ).toContain( 'frase inexistent: no-hi-es' );
	} );

	it( 'exigeix text o frase a guia-diu', () => {
		const m = copia();
		m.disparadors[ 1 ].efectes[ 0 ] = { tipus: 'guia-diu' };
		expect( validaMissio( m ) ).toContain( 'guia-diu sense text ni frase' );
	} );

	it( 'accepta guia-diu amb text literal', () => {
		const m = copia();
		m.disparadors[ 1 ].efectes[ 0 ] = { tipus: 'guia-diu', text: 'Hola' };
		expect( validaMissio( m ) ).toEqual( [] );
	} );

	it( 'exporta els vocabularis de dispositiu', () => {
		expect( APPS_PC ).toEqual( [ 'navegador', 'parla' ] );
		expect( APPS_MOBIL ).toEqual( [
			'missatges',
			'parla',
			'navegador',
			'banc-solid',
			'galeria',
			'camera',
			'ullada',
			'calculadora',
			'rellotge',
			'ajustos',
			'revenda',
		] );
		expect( [ ...APPS ].sort() ).toEqual(
			[ ...new Set( [ ...APPS_PC, ...APPS_MOBIL ] ) ].sort()
		);
	} );

	it( 'accepta la plantilla enviat i els esdeveniments mòbils', () => {
		const nous = [
			'contacte.bloqueja',
			'missatge.esborra',
			'missatge.reenvia',
			'missatge.respon',
			'enllac.mantingut',
		];
		nous.forEach( ( ev ) => expect( ESDEVENIMENTS ).toContain( ev ) );
		const m = copia();
		m.webs[ 'llumclara.cat' ].plantilla = 'enviat';
		nous.forEach( ( ev, i ) =>
			m.disparadors.push( {
				id: `nou${ i }`,
				quan: { esdeveniment: ev },
				efectes: [ { tipus: 'guia-diu', text: 'x' } ],
			} )
		);
		expect( validaMissio( m ) ).toEqual( [] );
	} );

	it( 'accepta banc-solid com a app de missió al mòbil', () => {
		const m = copia();
		m.dispositiu = 'mobil';
		m.apps = { 'banc-solid': {} };
		expect( validaMissio( m ) ).not.toContain(
			'app inexistent al dispositiu mobil: banc-solid'
		);
		m.apps = { 'banc-fals': {} };
		expect( validaMissio( m ) ).toContain(
			'app inexistent al dispositiu mobil: banc-fals'
		);
	} );

	it( 'rebutja un esdeveniment inexistent', () => {
		const m = copia();
		m.disparadors[ 0 ].quan.esdeveniment = 'missatge.vola';
		expect( validaMissio( m ) ).toContain(
			'esdeveniment desconegut: missatge.vola'
		);
	} );

	it( 'mostra: exigeix un id existent sota apps.*', () => {
		const m = copia();
		m.disparadors.push( {
			id: 'mx',
			quan: { esdeveniment: 'inici' },
			efectes: [ { tipus: 'mostra', id: 'no-hi-es' } ],
		} );
		expect( validaMissio( m ) ).toContain(
			'mostra: element inexistent: no-hi-es'
		);
	} );

	it( 'notifica: accepta fonts conegudes i rebutja la resta', () => {
		const amb = ( app ) => {
			const m = copia();
			m.disparadors.push( {
				id: 'nx',
				quan: { esdeveniment: 'inici' },
				efectes: [ { tipus: 'notifica', app, titol: 't', text: 'x' } ],
			} );
			return validaMissio( m );
		};
		[ 'parla', 'navegador', 'posta' ].forEach( ( app ) =>
			expect( amb( app ) ).toEqual( [] )
		);
		expect( amb( 'altra' ) ).toContain(
			'notifica: font desconeguda: altra'
		);
	} );

	it( 'una missió v1 falla per versio', () => {
		expect( validaMissio( { versio: 1, id: 'antiga' } ) ).toContain(
			'versio no suportada'
		);
	} );

	it( 'no llança amb elements nuls i informa dels errors', () => {
		const m = copia();
		m.disparadors.push( null );
		m.disparadors[ 0 ].efectes.push( null );
		m.webs.nul = null;
		m.decisio.opcions.push( null );
		let errors;
		expect( () => ( errors = validaMissio( m ) ) ).not.toThrow();
		expect( errors ).toEqual(
			expect.arrayContaining( [
				'disparador invàlid',
				'efecte invàlid',
				'web invàlida: nul',
				'opció invàlida',
			] )
		);
	} );

	it( "rebutja URL d'enllaç amb esquema no permès", () => {
		const m = copia();
		const seg = m.apps.posta.correus
			.flatMap( ( c ) => c.cos.flat() )
			.find( ( x ) => x.enllac );
		seg.enllac.url = 'javascript:alert(1)';
		expect( validaMissio( m ) ).toContain(
			"url d'enllaç no permesa: javascript:alert(1)"
		);
		seg.enllac.url = 'cerca:factura';
		expect( validaMissio( m ) ).toEqual( [] );
		delete seg.enllac.url;
		expect( validaMissio( m ) ).toContain(
			"url d'enllaç no permesa: undefined"
		);
	} );

	it( 'rebutja apps que no existeixen al dispositiu de la missió', () => {
		const m = copia();
		m.apps.missatges = { missatges: [] };
		expect( validaMissio( m ) ).toContain(
			'app inexistent al dispositiu pc: missatges'
		);
		const n = copia();
		n.disparadors.push( {
			quan: { esdeveniment: 'inici' },
			efectes: [ { tipus: 'notifica', app: 'missatges', titol: 'x' } ],
		} );
		expect( validaMissio( n ) ).toContain(
			'app inexistent al dispositiu pc: missatges'
		);
	} );

	describe( 'font de notificació i esdeveniments nous', () => {
		const amb = ( efecte ) => {
			const m = copia();
			m.disparadors.push( {
				id: 'x',
				quan: { esdeveniment: 'inici' },
				efectes: [
					{ tipus: 'notifica', titol: 't', text: 'x', ...efecte },
				],
			} );
			return validaMissio( m );
		};

		it( 'accepta codi.envia i pagament.fes', () => {
			expect( ESDEVENIMENTS ).toContain( 'codi.envia' );
			expect( ESDEVENIMENTS ).toContain( 'pagament.fes' );
			const m = copia();
			m.disparadors.push( {
				id: 'y',
				quan: { esdeveniment: 'pagament.fes' },
				efectes: [ { tipus: 'pescat' } ],
			} );
			expect( validaMissio( m ) ).toEqual( [] );
		} );

		it( 'segueix rebutjant esdeveniments desconeguts', () => {
			const m = copia();
			m.disparadors[ 0 ].quan.esdeveniment = 'inventat.nou';
			expect( validaMissio( m ) ).toContain(
				'esdeveniment desconegut: inventat.nou'
			);
		} );

		it( 'accepta font mobil amb app de mòbil en missió pc', () => {
			expect( amb( { app: 'missatges', font: 'mobil' } ) ).toEqual( [] );
		} );

		it( 'accepta font mobil amb banc-solid', () => {
			expect( amb( { app: 'banc-solid', font: 'mobil' } ) ).toEqual( [] );
		} );

		it( 'rebutja font diferent de mobil', () => {
			expect( amb( { app: 'posta', font: 'pc' } ) ).toContain(
				'notifica: font invàlida: pc'
			);
		} );

		it( 'font mobil exigeix app de mòbil', () => {
			expect( amb( { app: 'posta', font: 'mobil' } ) ).toContain(
				'app inexistent al dispositiu mobil: posta'
			);
		} );

		it( 'sense font manté la regla del dispositiu', () => {
			expect( amb( { app: 'missatges' } ) ).toContain(
				'app inexistent al dispositiu pc: missatges'
			);
		} );
	} );
} );

describe( 'validaMissio: webs banc-solid i formularis', () => {
	const base = () => ( {
		versio: 2,
		id: 'x',
		titol: 'x',
		dispositiu: 'pc',
		personatge: 'llissa',
		intro: [ 'hola' ],
		senyals: [],
		webs: {
			'bancsolid.cat': { plantilla: 'banc-solid', variant: 'oficial' },
		},
		disparadors: [
			{
				quan: { esdeveniment: 'inici' },
				efectes: [ { tipus: 'pescat' } ],
			},
		],
		decisio: { opcions: [ { id: 'a', valor: 'correcta' } ] },
	} );
	const amb = ( formulari ) => {
		const m = base();
		m.webs[ 'bancsolid.cat' ].formulari = formulari;
		return validaMissio( m );
	};

	it( 'accepta la plantilla banc-solid', () => {
		expect( validaMissio( base() ) ).toEqual( [] );
	} );

	it( 'accepta esdeveniments de formulari coneguts', () => {
		[ 'formulari.envia', 'codi.envia', 'pagament.fes' ].forEach( ( esd ) =>
			expect( amb( { esdeveniment: esd } ) ).toEqual( [] )
		);
	} );

	it( 'rebutja un esdeveniment de formulari desconegut', () => {
		expect( amb( { esdeveniment: 'inici' } ) ).toContain(
			'formulari: esdeveniment invàlid a bancsolid.cat: inici'
		);
	} );

	it( 'exigeix que processant i nota siguin text', () => {
		const errors = amb( { processant: 3, nota: {} } );
		expect( errors ).toContain(
			'formulari: processant ha de ser text a bancsolid.cat'
		);
		expect( errors ).toContain(
			'formulari: nota ha de ser text a bancsolid.cat'
		);
		expect( amb( { processant: 'Espera', nota: 'Segur' } ) ).toEqual( [] );
	} );
} );

describe( 'validaMissio: apps.parla.xats', () => {
	const mon = { contactes: [ { id: 'pau' } ] };
	const xats = () => [
		{
			id: 'x1',
			contacte: 'pau',
			missatges: [
				{ id: 'p1', de: 'ells', text: 'Hola', ocult: true },
				{ id: 'p2', de: 'jo', text: 'Ei' },
			],
		},
	];
	const amb = ( llista ) => {
		const m = copia();
		m.apps = { ...m.apps, parla: { xats: llista } };
		m.disparadors = [
			...m.disparadors,
			{
				id: 'dp',
				quan: { esdeveniment: 'missatge.envia', contacte: 'pau' },
				efectes: [ { tipus: 'mostra', id: 'p1' } ],
			},
		];
		return m;
	};

	it( 'accepta xats vàlids, missatge.envia i mostra cap a un missatge', () => {
		expect( ESDEVENIMENTS ).toContain( 'missatge.envia' );
		expect( validaMissio( amb( xats() ), mon ) ).toEqual( [] );
	} );

	it( 'detecta ids duplicats i contacte inexistent', () => {
		const llista = xats();
		llista.push( { ...llista[ 0 ], contacte: 'ningu' } );
		const errors = validaMissio( amb( llista ), mon );
		expect( errors ).toContain( 'parla: xat duplicat: x1' );
		expect( errors ).toContain( 'parla: missatge duplicat: p1' );
		expect( errors ).toContain( 'parla: contacte inexistent: ningu' );
	} );

	it( 'detecta mostra cap a un id inexistent', () => {
		const m = amb( xats() );
		m.disparadors[ m.disparadors.length - 1 ].efectes[ 0 ].id = 'zz';
		expect( validaMissio( m, mon ) ).toContain(
			'mostra: element inexistent: zz'
		);
	} );

	it( 'valida senyal, senyal_avis i xat de notifica', () => {
		const llista = xats();
		llista[ 0 ].missatges[ 0 ].senyal = 'inexistent';
		llista[ 0 ].senyal_avis = 'altre';
		const m = amb( llista );
		m.disparadors[ m.disparadors.length - 1 ].efectes.push( {
			tipus: 'notifica',
			app: 'posta',
			titol: 't',
			text: 't',
			xat: 'x1',
		} );
		const errors = validaMissio( m, mon );
		expect( errors ).toContain( 'senyal desconegut: inexistent' );
		expect( errors ).toContain( 'senyal desconegut: altre' );
		expect( errors ).toContain( 'notifica: xat només amb app parla' );
	} );
} );

describe( 'validaMissio: apps.ullada.publicacions', () => {
	const bona = {
		id: 'p1',
		autor: 'a1',
		text: 'Hola',
		il: 'gat',
		likes: 3,
	};
	const amb = ( publicacions ) => {
		const m = copia();
		m.apps.ullada = { publicacions };
		return validaMissio( m ).filter( ( e ) => e.startsWith( 'ullada' ) );
	};

	it( 'accepta una publicació vàlida o sense publicacions', () => {
		expect( amb( [ bona ] ) ).toEqual( [] );
		expect( amb( undefined ) ).toEqual( [] );
	} );

	it( 'rebutja no-array, elements no objecte i camps absents', () => {
		expect( amb( null ) ).toHaveLength( 1 );
		expect( amb( [ null ] ) ).toHaveLength( 1 );
		expect( amb( [ { ...bona, text: '' } ] ) ).toHaveLength( 1 );
	} );

	it( 'rebutja il·lustració inexistent i likes no numèrics', () => {
		expect( amb( [ { ...bona, il: 'xyz' } ] ) ).toHaveLength( 1 );
		expect( amb( [ { ...bona, likes: '3' } ] ) ).toHaveLength( 1 );
	} );

	it( 'rebutja ids duplicats', () => {
		expect( amb( [ bona, bona ] ) ).toHaveLength( 1 );
	} );
} );

describe( 'validaMissio: cos i autor de publicacions', () => {
	const bona = {
		id: 'p1',
		autor: 'p_nuria',
		text: 'Hola',
		il: 'gat',
		likes: 3,
	};
	const mon = { ullada: { perfils: [ { id: 'p_nuria' } ] } };
	const amb = ( p, monArg ) => {
		const m = copia();
		m.apps.ullada = { publicacions: [ { ...bona, ...p } ] };
		return validaMissio( m, monArg ).filter(
			( e ) =>
				e.startsWith( 'ullada' ) ||
				e.startsWith( 'senyal' ) ||
				e.startsWith( 'url' )
		);
	};

	it( 'accepta un cos vàlid amb text i enllaç', () => {
		const cos = [
			[
				{ t: 'Hola ' },
				{ enllac: { text: 'aquí', url: 'https://x.cat' } },
			],
		];
		expect( amb( { cos }, mon ) ).toEqual( [] );
	} );

	it( 'rebutja cos malformat', () => {
		expect( amb( { cos: 'x' } ) ).toHaveLength( 1 );
		expect( amb( { cos: [ 'x' ] } ) ).toHaveLength( 1 );
		expect( amb( { cos: [ [ null ] ] } ) ).toHaveLength( 1 );
		expect( amb( { cos: [ [ { x: 1 } ] ] } ) ).toHaveLength( 1 );
		expect( amb( { cos: [ [ { enllac: { text: 'a' } } ] ] } ) ).not.toEqual(
			[]
		);
	} );

	it( 'rebutja enllaç amb url no permesa', () => {
		const cos = [ [ { enllac: { text: 'a', url: 'ftp://x' } } ] ];
		expect( amb( { cos } ) ).toHaveLength( 1 );
		const ok = [ [ { enllac: { text: 'a', url: 'cerca:x' } } ] ];
		expect( amb( { cos: ok } ) ).toEqual( [] );
	} );

	it( 'rebutja senyal inexistent dins un segment', () => {
		const cos = [ [ { t: 'a', senyal: 'no-existeix' } ] ];
		expect( amb( { cos } ) ).toHaveLength( 1 );
	} );

	it( 'valida autor només si hi ha mon', () => {
		expect( amb( {}, mon ) ).toEqual( [] );
		expect( amb( { autor: 'p_x' }, mon ) ).toHaveLength( 1 );
		expect( amb( { autor: 'p_x' } ) ).toEqual( [] );
	} );

	it( 'coneix els esdeveniments nous', () => {
		expect( ESDEVENIMENTS ).toContain( 'publicacio.denuncia' );
		expect( ESDEVENIMENTS ).toContain( 'codi.comparteix' );
	} );
} );

describe( 'validaMissio: sorteig i premi_senyal', () => {
	const sorteig = () =>
		JSON.parse(
			readFileSync(
				new URL(
					'../../../../../missions/remei-03-sorteig.json',
					import.meta.url
				),
				'utf8'
			)
		);

	it( 'detecta premi_senyal inexistent', () => {
		const m = sorteig();
		m.webs[ 'sorteig-calroig.top' ].premi_senyal = 'no_existeix';
		expect( validaMissio( m ) ).toContain(
			'senyal desconegut: no_existeix'
		);
	} );

	it( 'rebutja variant diferent de falsa a la plantilla sorteig', () => {
		const m = sorteig();
		m.webs[ 'sorteig-calroig.top' ].variant = 'oficial';
		expect( validaMissio( m ) ).toContain(
			'sorteig només admet variant falsa: sorteig-calroig.top'
		);
	} );

	it( 'amb mon.ullada.perfils buit, tot autor és inexistent', () => {
		const m = sorteig();
		const mon = { ullada: { perfils: [] } };
		const errors = validaMissio( m, mon );
		expect( errors.some( ( e ) => e.includes( 'autor inexistent' ) ) ).toBe(
			true
		);
	} );
} );
