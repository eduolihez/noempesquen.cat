import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validaMissio } from '../valida.js';

const llegeix = ( nom ) =>
	JSON.parse(
		readFileSync(
			new URL( `../../../../../missions/${ nom }`, import.meta.url ),
			'utf8'
		)
	);
const mon = llegeix( 'mon.json' );

// Missió PC real a la qual s'afegeix un anunci al Diari i la seva denúncia.
const fixture = () => {
	const m = llegeix( 'llissa-01-factura.json' );
	m.senyals.push(
		{ id: 'patrocinat', nom: 'x', pista: 'x' },
		{ id: 'promesa', nom: 'x', pista: 'x' }
	);
	m.webs[ 'diaridelbarri.cat' ] = {
		plantilla: 'diari',
		https: true,
		anunci: {
			id: 'anunci-carla',
			etiqueta: 'Contingut patrocinat',
			etiqueta_senyal: 'patrocinat',
			avatar: { nom: 'Carla Montsant', inicials: 'CM' },
			titol: 'El truc de la Carla',
			cos: [
				[ { t: 'Multiplica 250 €', senyal: 'promesa' } ],
				[
					{
						enllac: {
							text: 'Descobreix-ho',
							url: 'https://invest-rapid.top/carla',
						},
					},
				],
			],
		},
	};
	m.disparadors.push( {
		quan: { esdeveniment: 'publicacio.denuncia', id: 'anunci-carla' },
		efectes: [ { tipus: 'guia-diu', text: 'Ben fet.' } ],
	} );
	return m;
};
const anunci = ( m ) => m.webs[ 'diaridelbarri.cat' ].anunci;
const errors = ( m ) => validaMissio( m, mon );

describe( 'validaMissio: webs.<host>.anunci', () => {
	it( 'accepta un anunci vàlid', () => {
		expect( errors( fixture() ) ).toEqual( [] );
	} );

	it( "compta les senyals de l'anunci com a referenciades", () => {
		const m = fixture();
		delete anunci( m ).etiqueta_senyal;
		expect( errors( m ) ).toContain(
			'senyal sense referència: patrocinat'
		);
	} );

	it( "rebutja un id duplicat amb una publicació d'Ullada", () => {
		const m = fixture();
		anunci( m ).id = 'u01';
		m.disparadors.at( -1 ).quan.id = 'u01';
		expect( errors( m ) ).toContain(
			'diaridelbarri.cat.anunci: id duplicat «u01»'
		);
	} );

	it( 'rebutja un id duplicat entre anuncis', () => {
		const m = fixture();
		m.webs[ 'www.diaridelbarri.cat' ] = {
			...m.webs[ 'diaridelbarri.cat' ],
		};
		expect( errors( m ) ).toContain(
			'www.diaridelbarri.cat.anunci: id duplicat «anunci-carla»'
		);
	} );

	it( 'rebutja una senyal inexistent', () => {
		const m = fixture();
		anunci( m ).cos[ 0 ][ 0 ].senyal = 'fantasma';
		expect( errors( m ) ).toContain( 'senyal desconegut: fantasma' );
	} );

	it( 'rebutja un enllaç sense http(s)', () => {
		const m = fixture();
		anunci( m ).cos[ 1 ][ 0 ].enllac.url = 'invest-rapid.top/carla';
		expect( errors( m ) ).toContain(
			"url d'enllaç no permesa: invest-rapid.top/carla"
		);
	} );

	it( "rebutja l'anunci fora de la plantilla diari", () => {
		const m = fixture();
		m.webs[ 'diaridelbarri.cat' ].plantilla = 'enviat';
		const e = errors( m );
		expect( e ).toContain(
			'diaridelbarri.cat.anunci: només admès a la plantilla diari'
		);
		expect( e ).toContain(
			'denuncia: publicació inexistent: anunci-carla'
		);
	} );

	it( 'rebutja camps obligatoris absents', () => {
		const m = fixture();
		delete anunci( m ).etiqueta;
		anunci( m ).avatar = { nom: 'Carla' };
		anunci( m ).cos = 'text';
		const e = errors( m );
		expect( e ).toContain(
			'diaridelbarri.cat.anunci: camp «etiqueta» buit o absent'
		);
		expect( e ).toContain(
			'diaridelbarri.cat.anunci: «avatar» ha de tenir nom i inicials'
		);
		expect( e ).toContain(
			'diaridelbarri.cat.anunci: «cos» ha de ser una llista de paràgrafs'
		);
	} );

	it( 'rebutja una denúncia amb id inexistent', () => {
		const m = fixture();
		m.disparadors.at( -1 ).quan.id = 'cap';
		expect( errors( m ) ).toContain(
			'denuncia: publicació inexistent: cap'
		);
	} );
} );
