/**
 * Registre de les apps de cada sistema: nom visible, icona i component
 * (càrrega mandrosa). Tots dos registres tenen el mateix contracte:
 * { nom, Icona, Component }.
 */
import { lazy } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { IconaNavegador, IconaParla } from '../ui/icones';
import { IconaMissatges } from './missatges/icones';

const navegador = {
	nom: __( 'Navegador', 'noempesquen' ),
	Icona: IconaNavegador,
	Component: lazy( () => import( './navegador/Navegador' ) ),
};

const parla = {
	nom: __( 'Parla', 'noempesquen' ),
	Icona: IconaParla,
	Component: lazy( () => import( './parla/Parla' ) ),
};

const missatges = {
	nom: __( 'Missatges', 'noempesquen' ),
	Icona: IconaMissatges,
	Component: lazy( () => import( './missatges/Missatges' ) ),
};

export const APPS_PC = { navegador, parla };

export const APPS_MOBIL = {
	missatges,
	// T5: la closca mòbil de Parla substituirà el component del PC.
	parla,
	// T6: la closca mòbil del Navegador substituirà el component del PC.
	navegador,
};

/* Àlies per al codi del PC que encara importa `APPS`. */
export const APPS = APPS_PC;
