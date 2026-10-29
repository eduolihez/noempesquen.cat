import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validaMissio } from '../valida.js';

const ruta = new URL(
	'../../../../../missions/llissa-01-factura.json',
	import.meta.url
);
const factura = JSON.parse( readFileSync( ruta, 'utf8' ) );
const copia = () => structuredClone( factura );

describe( 'validaMissio v2', () => {
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
} );
