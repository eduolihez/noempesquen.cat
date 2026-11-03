/**
 * Plugin local d'ESLint: `nep/no-literal-ui`.
 *
 * Prohibeix text visible al jugador fora de `__()`/`_n()`/`_x()` (el català és el msgid).
 * Es comprova:
 *  - text JSX (`<p>Hola</p>`);
 *  - atributs JSX: aria-label, aria-description, title, alt, placeholder, label;
 *  - propietats d'objecte de text visible: nom, titol, text, etiqueta, missatge,
 *    descripcio, assumpte, remitent, resum, ajuda, pista, avis, data, concepte;
 *  - constants amb nom TEXT_*, ERROR_*, DATA_*, DIES_* o MES (cadena o llista de cadenes).
 * Només compten cadenes amb alguna lletra. Un valor és vàlid si és una crida a
 * `__`, `_n`, `_x`, `sprintf` o `createInterpolateElement`, o no és cadena literal.
 * Excepcions: tests, `valida.js` (eina d'autor), `idioma.js`. Per a un fals positiu
 * concret: `// eslint-disable-next-line nep/no-literal-ui -- motiu`.
 */
const ATRIBUTS = new Set( [
	'aria-label',
	'aria-description',
	'title',
	'alt',
	'placeholder',
	'label',
] );
const PROPIETATS = new Set( [
	'nom',
	'titol',
	'text',
	'etiqueta',
	'missatge',
	'descripcio',
	'assumpte',
	'remitent',
	'resum',
	'ajuda',
	'pista',
	'avis',
	'data',
	'concepte',
] );
const CONSTANTS = /^(TEXT_|ERROR_|DATA_|DIES_)|^MES$/;

const teLletres = ( s ) => /\p{L}/u.test( s );

function textDe( node ) {
	if ( ! node ) {
		return null;
	}
	if ( node.type === 'Literal' && typeof node.value === 'string' ) {
		return node.value;
	}
	if ( node.type === 'TemplateLiteral' ) {
		return node.quasis.map( ( q ) => q.value.cooked ).join( '' );
	}
	return null;
}

const rule = {
	meta: {
		type: 'problem',
		schema: [],
		messages: {
			literal:
				'Text visible fora de __(): envolta «{{ text }}» amb __(), _n() o _x() (domini «noempesquen»).',
		},
	},
	create( context ) {
		const informa = ( node, text ) =>
			context.report( {
				node,
				messageId: 'literal',
				data: { text: text.trim().slice( 0, 40 ) },
			} );
		const comprova = ( node ) => {
			const t = textDe( node );
			if ( t !== null && teLletres( t ) ) {
				informa( node, t );
			}
		};
		return {
			JSXText( node ) {
				if ( teLletres( node.value ) ) {
					informa( node, node.value );
				}
			},
			JSXAttribute( node ) {
				if ( ! node.name || ! ATRIBUTS.has( node.name.name ) ) {
					return;
				}
				const v = node.value;
				if ( v && v.type === 'JSXExpressionContainer' ) {
					comprova( v.expression );
				} else {
					comprova( v );
				}
			},
			VariableDeclarator( node ) {
				if (
					node.id.type !== 'Identifier' ||
					! CONSTANTS.test( node.id.name )
				) {
					return;
				}
				if ( node.init?.type === 'ArrayExpression' ) {
					node.init.elements.forEach( comprova );
				} else {
					comprova( node.init );
				}
			},
			Property( node ) {
				if (
					node.parent.type !== 'ObjectExpression' ||
					node.computed ||
					! node.key
				) {
					return;
				}
				const k = node.key.name ?? node.key.value;
				if ( PROPIETATS.has( k ) ) {
					comprova( node.value );
				}
			},
		};
	},
};

module.exports = { rules: { 'no-literal-ui': rule } };
