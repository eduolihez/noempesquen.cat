/**
 * Registre de plantilles de web (càrrega mandrosa). Cada plantilla rep
 * { dades, url, navega( url ), obrePestanya( url ), onHoverUrl }.
 * La tasca 11 substitueix els components provisionals.
 */
import { lazy } from '@wordpress/element';

export const WEBS = {
	posta: lazy( () => import( './posta/Posta' ) ),
	'llum-clara': lazy( () => import( './llum-clara/LlumClara' ) ),
};
