import { describe, it, expect } from 'vitest';
import { validaMissio } from '../valida.js';
import { ANCORES } from '../ancores.js';
import { estatInicial, reductor } from '../motor.js';
import { avancaTemps } from '../disparadors.js';
import { SEGONS_PISTA } from '../temps.js';

const PASSOS = () => [
	{
		id: 'a',
		ancora: null,
		titol: 'Hola',
		text: 'Benvinguda.',
		continua: 'boto',
	},
	{
		id: 'b',
		ancora: 'app-navegador',
		titol: 'Obre',
		text: 'Obre el navegador.',
		continua: { esdeveniment: 'app.obre', app: 'navegador' },
	},
	{
		id: 'c',
		ancora: 'barra',
		titol: 'Fi',
		text: 'Ja està.',
		continua: 'boto',
	},
];

const mostra = ( id, pas, extra = {} ) => ( {
	id,
	quan: { esdeveniment: 'pas.entra', pas },
	efectes: [ { tipus: 'mostra', id } ],
	...extra,
} );

const tutorial = ( canvis = {} ) => ( {
	versio: 2,
	id: 'tutorial-prova',
	tutorial: true,
	titol: 'Prova',
	dispositiu: 'pc',
	personatge: 'llissa',
	instruccions: 'Mira.',
	pistes: [ 'Pista 1', 'Pista 2' ],
	senyals: [],
	passos: PASSOS(),
	disparadors: [],
	decisio: {
		pregunta: 'Ho tens clar?',
		opcions: [
			{ id: 'x', text: 'Sí', valor: 'correcta', resposta: 'Molt bé!' },
		],
	},
	tancament: { aprenentatges: [], consell: 'Juga.' },
	...canvis,
} );

const obre = ( m ) =>
	reductor( m, estatInicial( m ), { tipus: 'DESBLOQUEJA' } );
const ev = ( m, e, nom, dades = {} ) =>
	reductor( m, e, { tipus: 'ESDEVENIMENT', nom, dades } );

describe( 'validació de passos', () => {
	it( 'un tutorial amb passos és vàlid, amb intro absent o buida', () => {
		expect( validaMissio( tutorial() ) ).toEqual( [] );
		expect( validaMissio( tutorial( { intro: [] } ) ) ).toEqual( [] );
	} );

	it( 'ANCORES inclou les claus inicials', () => {
		expect( ANCORES ).toContain( 'barra' );
		expect( new Set( ANCORES ).size ).toBe( ANCORES.length );
	} );

	it( 'sense passos la intro continua sent obligatòria', () => {
		const m = tutorial();
		delete m.passos;
		expect( validaMissio( m ) ).toContain( 'falta intro' );
	} );

	it( 'passos en una missió no tutorial és invàlid', () => {
		const m = tutorial( { tutorial: false, intro: [ 'Hola' ] } );
		expect( validaMissio( m ) ).toContain(
			'passos: només els tutorials en poden tenir'
		);
		const n = tutorial( { tutorial: undefined } );
		expect( validaMissio( n ) ).toContain(
			'passos: només els tutorials en poden tenir'
		);
		expect( validaMissio( n ) ).toContain( 'falta intro' );
	} );

	it.each( [
		[ 'buit', [] ],
		[ 'no és llista', {} ],
	] )( 'passos %s és invàlid', ( _n, passos ) => {
		expect( validaMissio( tutorial( { passos } ) ) ).toContain(
			'passos: ha de ser una llista no buida'
		);
	} );

	const amb = ( canvi ) => {
		const passos = PASSOS();
		canvi( passos[ 1 ] );
		return validaMissio( tutorial( { passos } ) );
	};

	it( 'rebutja ids duplicats i ids invàlids', () => {
		expect( amb( ( p ) => ( p.id = 'a' ) ) ).toContain( 'pas duplicat: a' );
		expect( amb( ( p ) => ( p.id = 'Mal Id' ) ) ).toContain(
			'pas 1: id invàlid'
		);
		expect( amb( ( p ) => delete p.id ) ).toContain( 'pas 1: id invàlid' );
	} );

	it( 'rebutja àncores desconegudes o absents', () => {
		expect( amb( ( p ) => ( p.ancora = 'inventada' ) ) ).toContain(
			'pas b: àncora desconeguda: inventada'
		);
		expect( amb( ( p ) => delete p.ancora ).length ).toBeGreaterThan( 0 );
	} );

	it( 'rebutja textos buits o massa llargs', () => {
		expect( amb( ( p ) => ( p.titol = '' ) ) ).toContain(
			'pas b: titol invàlid (1-60 caràcters)'
		);
		expect( amb( ( p ) => ( p.titol = 'x'.repeat( 61 ) ) ).length ).toBe(
			1
		);
		expect( amb( ( p ) => ( p.text = '   ' ) ) ).toContain(
			'pas b: text invàlid (1-280 caràcters)'
		);
		expect( amb( ( p ) => ( p.text = 'x'.repeat( 281 ) ) ).length ).toBe(
			1
		);
		expect( amb( ( p ) => ( p.text = 'x'.repeat( 280 ) ) ) ).toEqual( [] );
	} );

	it( 'rebutja continua mal format', () => {
		[
			'altre',
			null,
			[],
			5,
			{},
			{ esdeveniment: 3 },
			{ esdeveniment: 'a', x: {} },
		].forEach( ( c ) => {
			expect( amb( ( p ) => ( p.continua = c ) ).length ).toBeGreaterThan(
				0
			);
		} );
		expect( amb( ( p ) => delete p.continua ).length ).toBeGreaterThan( 0 );
	} );

	it( 'rebutja camps desconeguts al pas', () => {
		expect( amb( ( p ) => ( p.extra = 1 ) ) ).toContain(
			'pas b: camp desconegut: extra'
		);
	} );

	it( 'un disparador pas.entra ha d’apuntar a un pas existent', () => {
		expect(
			validaMissio(
				tutorial( { disparadors: [ mostra( 'k', 'zzz' ) ] } )
			)
		).toContain( 'disparador k: pas inexistent: zzz' );
	} );
} );

describe( 'motor: passos', () => {
	const m = () =>
		tutorial( {
			apps: { navegador: {} },
			disparadors: [
				mostra( 'k0', 'a' ),
				mostra( 'k1', 'b' ),
				mostra( 'k2', 'c' ),
			],
		} );

	it( 'arrenca al pas 0, amb la intro acabada i el pas 0 «entrat»', () => {
		const e = obre( m() );
		expect( e.pas ).toBe( 0 );
		expect( e.introAcabada ).toBe( true );
		expect( e.visibles ).toEqual( { k0: true } );
		expect( e.xat ).toEqual( [] );
	} );

	it( 'sense passos, el comportament no canvia', () => {
		const n = tutorial( { passos: undefined, intro: [ 'Hola' ] } );
		const e = obre( n );
		expect( e.introAcabada ).toBe( false );
		expect( e.xat ).toHaveLength( 1 );
	} );

	it( 'PAS_SEGUENT avança un pas «boto» i dispara pas.entra', () => {
		const mm = m();
		const e = reductor( mm, obre( mm ), { tipus: 'PAS_SEGUENT' } );
		expect( e.pas ).toBe( 1 );
		expect( e.visibles ).toEqual( { k0: true, k1: true } );
	} );

	it( 'PAS_SEGUENT no avança un pas amb continua d’esdeveniment', () => {
		const mm = m();
		const e1 = reductor( mm, obre( mm ), { tipus: 'PAS_SEGUENT' } );
		expect( reductor( mm, e1, { tipus: 'PAS_SEGUENT' } ) ).toBe( e1 );
	} );

	it( 'un esdeveniment que coincideix avança; un altre no', () => {
		const mm = m();
		const e1 = reductor( mm, obre( mm ), { tipus: 'PAS_SEGUENT' } );
		const mal = ev( mm, e1, 'app.obre', { app: 'parla' } );
		expect( mal.pas ).toBe( 1 );
		expect( ev( mm, e1, 'lupa.activa' ).pas ).toBe( 1 );
		const be = ev( mm, e1, 'app.obre', { app: 'navegador' } );
		expect( be.pas ).toBe( 2 );
		expect( be.visibles.k2 ).toBe( true );
	} );

	it( 'un esdeveniment no avança més d’un pas', () => {
		const passos = PASSOS();
		passos[ 2 ].continua = { esdeveniment: 'app.obre', app: 'navegador' };
		const mm = tutorial( { passos } );
		const e1 = reductor( mm, obre( mm ), { tipus: 'PAS_SEGUENT' } );
		const e2 = ev( mm, e1, 'app.obre', { app: 'navegador' } );
		expect( e2.pas ).toBe( 2 );
	} );

	it( 'pas.entra dispara un cop i no es repeteix ni fa bucle', () => {
		const mm = tutorial( {
			passos: [
				{
					...PASSOS()[ 0 ],
					continua: { esdeveniment: 'pas.entra', pas: 'a' },
				},
				PASSOS()[ 2 ],
			],
			disparadors: [
				{
					id: 'n',
					quan: { esdeveniment: 'pas.entra', pas: 'a' },
					efectes: [
						{
							tipus: 'notifica',
							app: 'parla',
							titol: 'x',
							text: 'y',
						},
					],
				},
			],
		} );
		const e = obre( mm );
		// El sintètic no avança passos encara que `continua` hi coincidiria.
		expect( e.pas ).toBe( 0 );
		expect( e.notificacions ).toHaveLength( 1 );
		expect( e.executats ).toEqual( [ 'n' ] );
		const e2 = ev( mm, e, 'pas.entra', { pas: 'a' } );
		expect( e2.notificacions ).toHaveLength( 1 );
	} );

	it( 'PAS_SALTA aplica els pas.entra pendents i acaba el tutorial', () => {
		const mm = m();
		const e = reductor( mm, obre( mm ), { tipus: 'PAS_SALTA' } );
		expect( e.pas ).toBe( 3 );
		expect( e.visibles ).toEqual( { k0: true, k1: true, k2: true } );
		expect( e.executats ).toEqual( [ 'k0', 'k1', 'k2' ] );
		// Idempotent: ja acabat.
		expect( reductor( mm, e, { tipus: 'PAS_SALTA' } ) ).toBe( e );
	} );

	it( 'PAS_SALTA des d’un pas intermedi no repeteix disparadors', () => {
		const mm = m();
		const e1 = reductor( mm, obre( mm ), { tipus: 'PAS_SEGUENT' } );
		const e = reductor( mm, e1, { tipus: 'PAS_SALTA' } );
		expect( e.executats ).toEqual( [ 'k0', 'k1', 'k2' ] );
		expect( e.pas ).toBe( 3 );
	} );

	it( 'PAS_SEGUENT i PAS_SALTA no fan res fora de joc o en pausa', () => {
		const mm = m();
		const bloc = estatInicial( mm );
		expect( reductor( mm, bloc, { tipus: 'PAS_SEGUENT' } ) ).toBe( bloc );
		expect( reductor( mm, bloc, { tipus: 'PAS_SALTA' } ) ).toBe( bloc );
	} );

	it( 'durant els passos no hi ha pistes per temps; després sí', () => {
		const mm = m();
		const e = obre( mm );
		const durant = avancaTemps( mm, e, SEGONS_PISTA * 3, SEGONS_PISTA );
		expect( durant.pistesDonades ).toBe( 0 );
		const fi = reductor( mm, e, { tipus: 'PAS_SALTA' } );
		const despres = avancaTemps( mm, fi, SEGONS_PISTA * 3, SEGONS_PISTA );
		expect( despres.pistesDonades ).toBe( 1 );
	} );

	it( 'un esdeveniment del jugador amb el tutorial acabat no avança', () => {
		const mm = m();
		const fi = reductor( mm, obre( mm ), { tipus: 'PAS_SALTA' } );
		expect( ev( mm, fi, 'app.obre', { app: 'navegador' } ).pas ).toBe( 3 );
	} );
} );
