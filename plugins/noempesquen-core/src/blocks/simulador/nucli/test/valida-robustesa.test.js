import { describe, expect, it } from 'vitest';
import { validaMissio } from '../valida';

const base = {
	versio: 2,
	id: 'x',
	titol: 't',
	dispositiu: 'pc',
	personatge: 'p',
	intro: [ 'a' ],
};

const CAMPS = [
	'senyals',
	'disparadors',
	'efectes',
	'opcions',
	'apps',
	'webs',
	'frases',
	'decisio',
];
const VALORS_MALFORMATS = [ null, 5, 'x', [ null ], {}, [ 5 ] ];

describe( 'validaMissio amb entrades malformades', () => {
	CAMPS.forEach( ( camp ) => {
		VALORS_MALFORMATS.forEach( ( valor ) => {
			it( `no llança amb ${ camp } = ${ JSON.stringify( valor ) }`, () => {
				expect( () =>
					validaMissio( { ...base, [ camp ]: valor } )
				).not.toThrow();
				expect(
					validaMissio( { ...base, [ camp ]: valor } )
				).toBeInstanceOf( Array );
			} );
		} );
	} );

	it( 'no llança amb disparadors i opcions niuats malformats', () => {
		[
			{ disparadors: [ { efectes: null } ] },
			{ disparadors: [ null, { efectes: [ null ] } ] },
			{ decisio: { opcions: [ null ] } },
			{ decisio: { opcions: null } },
		].forEach( ( extra ) => {
			expect( () => validaMissio( { ...base, ...extra } ) ).not.toThrow();
		} );
	} );

	it( 'rebutja apps i webs que no són objectes', () => {
		[ 'apps', 'webs' ].forEach( ( camp ) => {
			[ null, 5, 'x', [] ].forEach( ( valor ) => {
				expect(
					validaMissio( { ...base, [ camp ]: valor } )
				).toContain( `${ camp } invàlid` );
			} );
		} );
	} );
} );
