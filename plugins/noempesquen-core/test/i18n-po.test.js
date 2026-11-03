import { describe, expect, it } from 'vitest';
import { parsePo, serialitzaPo } from '../../../scripts/i18n-po.mjs';
import { fusiona, CAPCALERA } from '../../../scripts/i18n-merge.mjs';
import { areaDe } from '../../../scripts/i18n-parts.mjs';

const frag = ( refs, id, str, flags = '' ) =>
	`#: ${ refs }\n${ flags }msgid "${ id }"\nmsgstr "${ str }"\n`;

describe( 'i18n-po', () => {
	it( 'parsea contexto, plurales, multilínea y escapes', () => {
		const t =
			'msgid ""\nmsgstr ""\n"Language: es_ES\\n"\n\n' +
			'#. translators: x\n#: a.js:3\nmsgctxt "c"\nmsgid "Hola \\"tu\\""\nmsgid_plural "Holas"\nmsgstr[0] "uno"\nmsgstr[1] ""\n"dos\\n"\n';
		const { capcalera, entrades } = parsePo( t );
		expect( capcalera.msgstr[ 0 ] ).toContain( 'es_ES' );
		expect( entrades[ 0 ] ).toMatchObject( {
			msgctxt: 'c',
			msgid: 'Hola "tu"',
			msgid_plural: 'Holas',
			refs: [ 'a.js:3' ],
			extrets: [ 'translators: x' ],
		} );
		expect( entrades[ 0 ].msgstr ).toEqual( [ 'uno', 'dos\n' ] );
	} );

	it( 'serializa y reparsea sin pérdida', () => {
		const { entrades } = parsePo( frag( 'b.js:2', 'A\\nB', 'C\\nD' ) );
		const otra = parsePo( serialitzaPo( CAPCALERA, entrades ) ).entrades;
		expect( otra ).toEqual( entrades );
	} );

	it( 'fusiona, ordena por referencia y une repeticiones idénticas', () => {
		const { entrades, errors } = fusiona( [
			{
				nom: 'x',
				text:
					frag( 'z.js:1', 'Z', 'z' ) +
					'\n' +
					frag( 'a.js:10', 'A', 'a' ),
			},
			{ nom: 'y', text: frag( 'a.js:2', 'A', 'a' ) },
		] );
		expect( errors ).toEqual( [] );
		expect( entrades.map( ( e ) => e.msgid ) ).toEqual( [ 'A', 'Z' ] );
		expect( entrades[ 0 ].refs ).toEqual( [ 'a.js:2', 'a.js:10' ] );
	} );

	it( 'falla con duplicado discrepante, vacío o fuzzy', () => {
		const r = fusiona( [
			{ nom: 'x', text: frag( 'a.js:1', 'A', 'uno' ) },
			{
				nom: 'y',
				text:
					frag( 'b.js:1', 'A', 'dos' ) +
					'\n' +
					frag( 'b.js:2', 'B', '' ),
			},
			{
				nom: 'z',
				text: '#: c.js:1\n#, fuzzy\nmsgid "C"\nmsgstr "c"\n',
			},
		] );
		expect( r.errors ).toHaveLength( 3 );
	} );

	it( 'asigna área por primera referencia', () => {
		const e = ( r ) => ( { refs: r } );
		const S = 'src/blocks/simulador/';
		expect( areaDe( e( [ S + 'apps/x.js:1' ] ) ) ).toBe( 'apps' );
		expect( areaDe( e( [ S + 'webs/x.js:1', S + 'apps/y.js:2' ] ) ) ).toBe(
			'apps'
		);
		expect( areaDe( e( [ S + 'ui/x.js:1' ] ) ) ).toBe( 'resto' );
		expect( areaDe( e( [ 'includes/x.php:1' ] ) ) ).toBe( 'altres' );
	} );
} );
