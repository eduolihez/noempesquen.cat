/**
 * Registre de les apps del PC: nom visible, icona i component (càrrega mandrosa).
 */
import { lazy } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { IconaNavegador, IconaParla } from '../ui/icones';

export const APPS = {
	navegador: {
		nom: __( 'Navegador', 'noempesquen' ),
		Icona: IconaNavegador,
		Component: lazy( () => import( './navegador/Navegador' ) ),
	},
	parla: {
		nom: __( 'Parla', 'noempesquen' ),
		Icona: IconaParla,
		Component: lazy( () => import( './parla/Parla' ) ),
	},
};
