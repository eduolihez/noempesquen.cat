import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validaMissio } from '../valida.js';

const llegeix = ( nom ) =>
	JSON.parse(
		readFileSync(
			new URL(
				`../../../../../missions/ca/${ nom }.json`,
				import.meta.url
			),
			'utf8'
		)
	);
const mon = llegeix( 'mon' );
const comprador = () => llegeix( 'remei-05-comprador' );
const inversio = () => llegeix( 'llissa-03-inversio' );
const webInversio = ( m ) =>
	Object.values( m.webs ).find( ( w ) => w.plantilla === 'inversio' );

describe( 'validaMissio: plantilles cobrament i inversio', () => {
	it( 'les missions reals són vàlides', () => {
		expect( validaMissio( comprador(), mon ) ).toEqual( [] );
		expect( validaMissio( inversio(), mon ) ).toEqual( [] );
	} );

	it( 'cobrament: rebutja formulari sense camps', () => {
		const m = comprador();
		m.webs[ 'revenda-cobra.com' ].formulari.camps = [];
		expect( validaMissio( m, mon ) ).toContain(
			'cobrament revenda-cobra.com: formulari sense camps'
		);
	} );

	it( 'cobrament: rebutja formulari sense esdeveniment', () => {
		const m = comprador();
		delete m.webs[ 'revenda-cobra.com' ].formulari.esdeveniment;
		expect( validaMissio( m, mon ) ).toContain(
			'cobrament revenda-cobra.com: formulari sense esdeveniment'
		);
	} );

	it( 'cobrament: rebutja «import» buit', () => {
		const m = comprador();
		m.webs[ 'revenda-cobra.com' ].import = ' ';
		expect( validaMissio( m, mon ) ).toContain(
			'cobrament revenda-cobra.com: camp «import» buit o absent'
		);
	} );

	it( 'inversio: rebutja «promesa» absent', () => {
		const m = inversio();
		const web = webInversio( m );
		delete web.promesa;
		delete web.promesa_senyal;
		expect(
			validaMissio( m, mon ).some( ( e ) =>
				e.endsWith( ': camp «promesa» buit o absent' )
			)
		).toBe( true );
	} );
} );

describe( 'validaMissio: notifica amb xat', () => {
	const ambXat = ( m, app, xat ) => {
		m.disparadors[ 0 ].efectes.push( {
			tipus: 'notifica',
			app,
			titol: 'x',
			text: 'x',
			xat,
			font: 'mobil',
		} );
		return validaMissio( m, mon );
	};

	it( 'rebutja un xat de Revenda inexistent', () => {
		expect( ambXat( comprador(), 'revenda', 'ningu' ) ).toContain(
			'notifica: xat inexistent a revenda: ningu'
		);
	} );

	it( 'rebutja un xat de Parla inexistent', () => {
		expect( ambXat( comprador(), 'parla', 'jordi' ) ).toContain(
			'notifica: xat inexistent a parla: jordi'
		);
	} );
} );

describe( 'validaMissio: món i ids', () => {
	it( 'rebutja un món sense llista de contactes', () => {
		expect( validaMissio( comprador(), { contactes: {} } ) ).toContain(
			'mon.contactes invàlid'
		);
	} );

	it( 'ignora ids de contacte que no són text', () => {
		const m = comprador();
		m.apps.revenda.xats[ 0 ].contacte = '5';
		expect(
			validaMissio( m, { ...mon, contactes: [ { id: 5 } ] } )
		).toContain( 'revenda.xats[0]: contacte inexistent «5»' );
	} );

	it( 'rebutja ids de missatge repetits entre apps', () => {
		const m = comprador();
		m.apps.parla = {
			xats: [
				{
					id: 'parla-x',
					missatges: [ { id: 'venda-1', de: 'ells', text: 'Hola' } ],
				},
			],
		};
		expect( validaMissio( m, mon ) ).toContain(
			'id repetit entre apps: venda-1'
		);
	} );

	it( 'Revenda exigeix http(s) als enllaços', () => {
		const m = comprador();
		m.apps.revenda.xats[ 0 ].missatges[ 2 ].cos[ 2 ].enllac.url = 'cerca:x';
		expect( validaMissio( m, mon ) ).toContain(
			'revenda.xats[0].missatges[2].cos[2]: url sense http(s) «cerca:x»'
		);
	} );
} );

describe( 'validaMissio: senyals', () => {
	it( 'compta les referències des de decisio i frases', () => {
		const m = comprador();
		m.senyals.push(
			{ id: 'a_decisio', titol: 'x', explicacio: 'x', reaccio: 'x' },
			{ id: 'a_frases', titol: 'x', explicacio: 'x', reaccio: 'x' }
		);
		m.decisio.opcions[ 0 ].senyal = 'a_decisio';
		m.frases.extra = { senyal: 'a_frases' };
		const errors = validaMissio( m, mon );
		expect( errors ).not.toContain( 'senyal sense referència: a_decisio' );
		expect( errors ).not.toContain( 'senyal sense referència: a_frases' );
		m.decisio.opcions[ 0 ].senyal = 'no_hi_es';
		expect( validaMissio( m, mon ) ).toContain(
			'senyal desconegut: no_hi_es'
		);
	} );

	it( 'no informa de «senyal duplicada: undefined»', () => {
		const m = comprador();
		m.senyals.push( { titol: 'x' }, { titol: 'y' } );
		expect( validaMissio( m, mon ) ).not.toContain(
			'senyal duplicada: undefined'
		);
		m.senyals.push( { ...m.senyals[ 0 ] } );
		expect( validaMissio( m, mon ) ).toContain(
			'senyal duplicada: no_vol_veure'
		);
	} );
} );
