import { describe, test, expect } from 'vitest';
import {
	FASE,
	estatInicial,
	reductor,
	puntuacio,
	validaMissio,
} from '../motor';
import llissa from '../../../../../missions/llissa-01-factura.json';
import remei from '../../../../../missions/remei-01-paquet.json';

const juga = ( missio, accions ) =>
	accions.reduce(
		( e, a ) => reductor( missio, e, a ),
		estatInicial( missio )
	);

describe.each( [
	[ 'llissa', llissa ],
	[ 'remei', remei ],
] )( 'missió %s', ( _nom, missio ) => {
	test( 'és vàlida', () => {
		expect( validaMissio( missio ) ).toEqual( [] );
	} );

	test( "la intro avança fins a l'exploració", () => {
		const accions = missio.intro.map( () => ( {
			tipus: 'SEGUENT_INTRO',
		} ) );
		const e = juga( missio, accions );
		expect( e.fase ).toBe( FASE.EXPLORA );
		expect( e.bombolla ).toBe( missio.instruccions );
	} );

	test( 'partida perfecta = 3 estrelles i puntuació màxima', () => {
		const correcta = missio.decisio.opcions.find(
			( o ) => o.valor === 'correcta'
		);
		const e = juga( missio, [
			{ tipus: 'SALTA_INTRO' },
			{
				tipus: 'OBRE',
				id: missio.missatges.find( ( m ) => m.objectiu ).id,
			},
			{ tipus: 'LUPA' },
			...missio.senyals.map( ( s ) => ( {
				tipus: 'INSPECCIONA',
				senyal: s.id,
			} ) ),
			{ tipus: 'VULL_DECIDIR' },
			{ tipus: 'TRIA', id: correcta.id },
			{ tipus: 'VEURE_RESULTAT' },
		] );
		const p = puntuacio( missio, e );
		expect( e.fase ).toBe( FASE.RESULTAT );
		expect( p.punts ).toBe( p.maxim );
		expect( p.estrelles ).toBe( 3 );
	} );

	test( 'un senyal repetit no suma dues vegades', () => {
		const s = missio.senyals[ 0 ].id;
		const e = juga( missio, [
			{ tipus: 'SALTA_INTRO' },
			{ tipus: 'INSPECCIONA', senyal: s },
			{ tipus: 'INSPECCIONA', senyal: s },
		] );
		expect( e.trobats ).toEqual( [ s ] );
	} );

	test( 'inspeccionar una cosa normal compta com a fals positiu', () => {
		const e = juga( missio, [
			{ tipus: 'SALTA_INTRO' },
			{ tipus: 'INSPECCIONA', senyal: null },
		] );
		expect( e.falsos ).toBe( 1 );
		expect( missio.frases.normal ).toContain( e.bombolla );
	} );

	test( "picar l'enllaç porta a la conseqüència i resta punts sense baixar de 0", () => {
		const e = juga( missio, [
			{ tipus: 'SALTA_INTRO' },
			{ tipus: 'PICA' },
		] );
		expect( e.fase ).toBe( FASE.CONSEQUENCIA );
		expect( e.haPicat ).toBe( true );
		expect( puntuacio( missio, e ).punts ).toBe( 0 );
		expect( puntuacio( missio, e ).estrelles ).toBe( 1 );
	} );

	test( 'no es pot inspeccionar durant la intro', () => {
		const e = juga( missio, [
			{ tipus: 'INSPECCIONA', senyal: missio.senyals[ 0 ].id },
		] );
		expect( e.trobats ).toEqual( [] );
	} );

	test( 'reiniciar torna a l’estat inicial', () => {
		const e = juga( missio, [
			{ tipus: 'SALTA_INTRO' },
			{ tipus: 'PICA' },
			{ tipus: 'REINICIA' },
		] );
		expect( e ).toEqual( estatInicial( missio ) );
	} );
} );

test( 'validaMissio detecta senyals inexistents', () => {
	const trencada = JSON.parse( JSON.stringify( llissa ) );
	trencada.missatges[ 1 ].cos[ 0 ][ 0 ].senyal = 'no-existeix';
	expect( validaMissio( trencada ) ).toContain(
		'senyal desconegut: no-existeix'
	);
} );
