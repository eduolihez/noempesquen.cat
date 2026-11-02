import { describe, it, expect } from 'vitest';
import { validaMissio } from '../../nucli/valida.js';
import mon from '../../../../../missions/mon.json';
import {
	guiaPc,
	guiaMobil,
} from '../../../../../../../tests/e2e/missions-guia.js';

// El spec e2e les serveix com a remotes: si no fossin vàlides,
// `combinaMissions` les descartaria en silenci i l'overlay no sortiria.
describe( 'missions de prova de guia-tutorial.spec.js', () => {
	it.each( [
		[ 'PC', guiaPc ],
		[ 'mòbil', guiaMobil ],
	] )( '%s és vàlida', ( _, crea ) => {
		expect( validaMissio( crea(), mon ) ).toEqual( [] );
	} );
} );
