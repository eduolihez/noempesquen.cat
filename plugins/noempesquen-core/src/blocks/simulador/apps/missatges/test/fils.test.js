import { describe, it, expect } from 'vitest';
import {
	contacteDe,
	filsVisibles,
	senseEsborrats,
	contactesLocalitzables,
	textPla,
	destinsReenvia,
	darrerRebut,
	destiResposta,
} from '../fils.js';

const mon = {
	contactes: [
		{ id: 'pau', nom: 'Pau', rol: 'fill' },
		{ id: 'numero_desconegut', nom: '+44 7700 900461', rol: 'desconegut' },
	],
	missatges: {
		fils: [
			{
				id: 'pau',
				nom: 'Pau',
				missatges: [
					{ de: 'ella', text: 'Hola', hora: '18:02' },
					{ de: 'jo', text: 'Ei', hora: '18:10' },
				],
			},
			{
				id: 'mare',
				nom: 'Mama',
				missatges: [ { de: 'ella', text: 'Pa', hora: 'dl. 21:05' } ],
			},
		],
	},
	parla: {
		xats: [
			{ id: 'marta', nom: 'Marta' },
			{ id: 'familia', nom: 'Família' },
			{ id: 'pau', nom: 'Pau' },
		],
	},
};

const sms = {
	id: 's2',
	objectiu: true,
	ocult: true,
	remitent: { nom: '+44 7700 900461', senyal: 'remitent' },
	hora: '19:47',
	cos: [
		[
			{ t: "Envia't: " },
			{ t: 'paquet retingut.', senyal: 'paquet' },
			{
				enllac: { text: 'enviat-entrega.top/c/4471', url: 'https://x' },
				senyal: 'enllac',
			},
		],
	],
};
const missio = { apps: { missatges: { missatges: [ sms ] } } };

describe( 'contacteDe', () => {
	it( 'troba el contacte pel nom o número', () => {
		expect( contacteDe( mon, '+44 7700 900461' ) ).toBe(
			'numero_desconegut'
		);
		expect( contacteDe( mon, 'Ningú' ) ).toBeNull();
		expect( contacteDe( undefined, 'Pau' ) ).toBeNull();
	} );
} );

describe( 'filsVisibles', () => {
	it( 'amaga el SMS ocult fins que el motor el mostra', () => {
		const fils = filsVisibles( { visibles: {} }, mon, missio );
		expect( fils.map( ( f ) => f.id ) ).toEqual( [ 'pau', 'mare' ] );
	} );

	it( 'mostra el SMS com a fil propi del contacte, el primer', () => {
		const fils = filsVisibles( { visibles: { s2: true } }, mon, missio );
		expect( fils.map( ( f ) => f.id ) ).toEqual( [
			'numero_desconegut',
			'pau',
			'mare',
		] );
		const [ fil ] = fils;
		expect( fil.contacte ).toBe( 'numero_desconegut' );
		expect( fil.senyal ).toBe( 'remitent' );
		expect( fil.missatges ).toEqual( [
			{
				id: 's2',
				de: 'ella',
				hora: '19:47',
				cos: sms.cos,
				missio: true,
			},
		] );
	} );

	it( 'dona id estable als missatges de farciment', () => {
		const fils = filsVisibles( { visibles: {} }, mon, missio );
		expect( fils[ 0 ].missatges.map( ( m ) => m.id ) ).toEqual( [
			'pau-0',
			'pau-1',
		] );
	} );

	it( 'un remitent sense contacte rep un id de número', () => {
		const altre = {
			apps: {
				missatges: {
					missatges: [ { ...sms, remitent: { nom: '600 000 000' } } ],
				},
			},
		};
		const fils = filsVisibles( { visibles: { s2: true } }, mon, altre );
		expect( fils[ 0 ].id ).toBe( 'num:600 000 000' );
	} );

	it( 'aguanta dades buides', () => {
		expect( filsVisibles( { visibles: {} }, {}, {} ) ).toEqual( [] );
	} );
} );

describe( 'senseEsborrats', () => {
	it( 'treu missatges i els fils que queden buits', () => {
		const fils = filsVisibles( { visibles: { s2: true } }, mon, missio );
		const resta = senseEsborrats( fils, new Set( [ 's2', 'pau-0' ] ) );
		expect( resta.map( ( f ) => f.id ) ).toEqual( [ 'pau', 'mare' ] );
		expect( resta[ 0 ].missatges.map( ( m ) => m.id ) ).toEqual( [
			'pau-1',
		] );
	} );
} );

describe( 'contactesLocalitzables', () => {
	it( 'manté el número encara que la conversa estigui esborrada', () => {
		const fils = filsVisibles( { visibles: { s2: true } }, mon, missio );
		const contactes = contactesLocalitzables( fils, mon );
		expect( contactes.map( ( c ) => c.id ) ).toEqual( [
			'numero_desconegut',
			'mare',
			'pau',
		] );
		expect( contactes[ 0 ] ).toMatchObject( {
			senyal: 'remitent',
			rol: 'desconegut',
		} );
	} );
} );

describe( 'textPla', () => {
	it( 'aplana segments i enllaços', () => {
		expect( textPla( sms ) ).toBe(
			"Envia't: paquet retingut.enviat-entrega.top/c/4471"
		);
		expect( textPla( { text: 'Hola' } ) ).toBe( 'Hola' );
		expect( textPla( null ) ).toBe( '' );
	} );
} );

describe( 'destinsReenvia', () => {
	it( 'dona Família, Pau i Marta amb el nom de Parla', () => {
		expect( destinsReenvia( mon ) ).toEqual( [
			{ id: 'familia', nom: 'Família' },
			{ id: 'pau', nom: 'Pau' },
			{ id: 'marta', nom: 'Marta' },
		] );
		expect( destinsReenvia( {} )[ 0 ] ).toEqual( {
			id: 'familia',
			nom: 'familia',
		} );
	} );
} );

describe( 'darrerRebut', () => {
	it( 'ignora els missatges propis', () => {
		const fils = filsVisibles( { visibles: {} }, mon, missio );
		expect( darrerRebut( fils[ 0 ] ).id ).toBe( 'pau-0' );
		expect( darrerRebut( { missatges: [] } ) ).toBeNull();
	} );
} );

describe( 'destiResposta', () => {
	const fils = filsVisibles( { visibles: { s2: true } }, mon, missio );
	const [ sms2, pau ] = fils;

	it( 'respon al missatge triat si és del fil', () => {
		expect( destiResposta( sms2, 's2' ) ).toBe( 's2' );
	} );

	it( "ignora un triat d'un altre fil i va a l'últim rebut", () => {
		expect( destiResposta( pau, 's2' ) ).toBe( 'pau-0' );
		expect( destiResposta( sms2, 'pau-0' ) ).toBe( 's2' );
	} );

	it( 'sense triat, l’últim rebut; sense rebuts, null', () => {
		expect( destiResposta( pau, null ) ).toBe( 'pau-0' );
		expect( destiResposta( { missatges: [] }, null ) ).toBeNull();
	} );
} );
