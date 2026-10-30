/**
 * Registre de les apps de cada sistema: nom visible, icona i component
 * (càrrega mandrosa). Tots dos registres tenen el mateix contracte:
 * { nom, Icona, Component }.
 */
import { lazy } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { IconaNavegador, IconaParla } from '../ui/icones';
import { IconaMissatges } from './missatges/icones';
import { IconaBancSolid } from './banc-solid/icones';

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

const bancSolid = {
	nom: __( 'Banc Sòlid', 'noempesquen' ),
	Icona: IconaBancSolid,
	Component: lazy( () => import( './banc-solid/BancSolid' ) ),
};

export const APPS_PC = { navegador, parla };

export const APPS_MOBIL = {
	missatges,
	parla: parlaMobil,
	navegador: navegadorMobil,
	'banc-solid': bancSolid,
};

/* Àlies per al codi del PC que encara importa `APPS`. */
export const APPS = APPS_PC;
