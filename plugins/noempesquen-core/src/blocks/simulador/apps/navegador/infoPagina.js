/**
 * Què mostra una pestanya per a una URL: nova pestanya, cerca, web o error.
 */
import { __ } from '@wordpress/i18n';
import { WEBS } from '../../webs/registre';
import { NOVA_PESTANYA, hostname, resolWeb, textCerca } from './historial';
import {
	FaviconDiari,
	FaviconLlumClara,
	FaviconMon,
	FaviconPosta,
} from './icones';

const FAVICONS = { posta: FaviconPosta, 'llum-clara': FaviconLlumClara };

/* Favicons de les dreceres de la nova pestanya, per hostname. */
export const FAVICONS_HOST = {
	'posta.cat': FaviconPosta,
	'llumclara.cat': FaviconLlumClara,
	'diaridelbarri.cat': FaviconDiari,
};

/**
 * @param {string} url    URL de la pestanya.
 * @param {Object} missio Missió (amb `webs`).
 * @return {{tipus:string, titol:string, host:?string, web:?Object, Favicon:?Function, seguretat:?string, text:?string}} Pàgina.
 */
export function infoPagina( url, missio ) {
	if ( url === NOVA_PESTANYA ) {
		return {
			tipus: 'nova',
			titol: __( 'Pestanya nova', 'noempesquen' ),
			Favicon: null,
		};
	}
	const cerca = textCerca( url );
	if ( cerca !== null ) {
		return { tipus: 'cerca', titol: cerca, text: cerca, Favicon: null };
	}
	const host = hostname( url );
	const web = resolWeb( url, missio );
	if ( web && WEBS[ web.plantilla ] ) {
		const segur = url.startsWith( 'https:' ) && web.dades.https !== false;
		return {
			tipus: 'web',
			titol: web.dades.titol ?? host,
			host,
			web,
			Favicon: FAVICONS[ web.plantilla ] ?? FaviconMon,
			seguretat: segur ? 'segur' : 'insegur',
		};
	}
	return {
		tipus: 'error',
		titol: host ?? url,
		host: host ?? url,
		Favicon: FaviconMon,
		seguretat: 'info',
	};
}
