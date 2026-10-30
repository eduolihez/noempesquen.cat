import { describe, it, expect, vi } from 'vitest';
import { esUrlNavegable, propsEnllac } from '../enllac.js';

describe( 'enllaços simulats', () => {
	it( 'només accepta http i https', () => {
		expect( esUrlNavegable( 'https://posta.example/a' ) ).toBe( true );
		expect( esUrlNavegable( 'HTTP://x.cat' ) ).toBe( true );
		[
			'javascript:alert(1)',
			'data:text/html,x',
			'cerca:gats',
			'//x.cat',
			'',
			null,
			undefined,
			5,
		].forEach( ( v ) => expect( esUrlNavegable( v ) ).toBe( false ) );
	} );

	it( 'un enllaç vàlid té href i crida l’acció', () => {
		const accio = vi.fn();
		const p = propsEnllac( 'https://x.cat/', accio );
		expect( p.href ).toBe( 'https://x.cat/' );
		p.onClick( { preventDefault: () => {} } );
		expect( accio ).toHaveBeenCalledWith( 'https://x.cat/' );
	} );

	it( 'un enllaç no permès és inert', () => {
		const accio = vi.fn();
		const p = propsEnllac( 'javascript:alert(1)', accio );
		const e = { preventDefault: vi.fn(), button: 1 };
		expect( p.href ).toBeUndefined();
		p.onClick( e );
		p.onAuxClick( e );
		expect( accio ).not.toHaveBeenCalled();
		expect( e.preventDefault ).toHaveBeenCalledTimes( 2 );
	} );
} );
