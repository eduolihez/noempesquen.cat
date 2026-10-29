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

const parlaMobil = {
	nom: __( 'Parla', 'noempesquen' ),
	Icona: IconaParla,
	Component: lazy( () => import( './parla/ParlaMobil' ) ),
};

const navegadorMobil = {
	nom: __( 'Navegador', 'noempesquen' ),
	Icona: IconaNavegador,
	Component: lazy( () => import( './navegador/NavegadorMobil' ) ),
};

export const APPS_PC = { navegador, parla };

export const APPS_MOBIL = {
	missatges,
	parla: parlaMobil,
	navegador: navegadorMobil,
};

/* Àlies per al codi del PC que encara importa `APPS`. */
export const APPS = APPS_PC;
