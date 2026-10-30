/**
 * Registre de plantilles de web (càrrega mandrosa). Cada plantilla rep
 * { dades, url, navega( url ), obrePestanya( url ), onHoverUrl }.
 * La tasca 11 substitueix els components provisionals.
 */
import { lazy } from '@wordpress/element';

export const WEBS = {
	posta: lazy( () => import( './posta/Posta' ) ),
	'llum-clara': lazy( () => import( './llum-clara/LlumClara' ) ),
	enviat: lazy( () => import( './enviat/Enviat' ) ),
	'banc-solid': lazy( () => import( './banc-solid/BancSolid' ) ),
	diari: lazy( () => import( './diari/Diari' ) ),
	sorteig: lazy( () => import( './sorteig/Sorteig' ) ),
	cobrament: lazy( () => import( './cobrament/Cobrament' ) ),
	inversio: lazy( () => import( './inversio/Inversio' ) ),
};
