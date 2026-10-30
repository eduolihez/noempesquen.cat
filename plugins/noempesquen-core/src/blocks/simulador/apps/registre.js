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
import { IconaGaleria } from './galeria/icones';
import { IconaCamera } from './camera/icones';
import { IconaUllada } from './ullada/icones';
import { IconaCalculadora } from './calculadora/icones';
import { IconaRellotge } from './rellotge/icones';
import { IconaAjustos } from './ajustos/icones';

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

const galeria = {
	nom: __( 'Galeria', 'noempesquen' ),
	Icona: IconaGaleria,
	Component: lazy( () => import( './galeria/Galeria' ) ),
};

const camera = {
	nom: __( 'Càmera', 'noempesquen' ),
	Icona: IconaCamera,
	Component: lazy( () => import( './camera/Camera' ) ),
};

const ullada = {
	nom: __( 'Ullada', 'noempesquen' ),
	Icona: IconaUllada,
	Component: lazy( () => import( './ullada/Ullada' ) ),
};

const calculadora = {
	nom: __( 'Calculadora', 'noempesquen' ),
	Icona: IconaCalculadora,
	Component: lazy( () => import( './calculadora/Calculadora' ) ),
};

const rellotge = {
	nom: __( 'Rellotge', 'noempesquen' ),
	Icona: IconaRellotge,
	Component: lazy( () => import( './rellotge/Rellotge' ) ),
};

const ajustos = {
	nom: __( 'Ajustos', 'noempesquen' ),
	Icona: IconaAjustos,
	Component: lazy( () => import( './ajustos/Ajustos' ) ),
};

// Icona provisional (la substituirà `revenda/icones.js` a T1b).
const revenda = {
	nom: __( 'Revenda', 'noempesquen' ),
	Icona: IconaUllada,
	Component: lazy( () => import( './revenda/Revenda' ) ),
};

export const APPS_PC = { navegador, parla };

export const APPS_MOBIL = {
	missatges,
	parla: parlaMobil,
	navegador: navegadorMobil,
	'banc-solid': bancSolid,
	galeria,
	camera,
	ullada,
	calculadora,
	rellotge,
	ajustos,
	revenda,
};

/* Àlies per al codi del PC que encara importa `APPS`. */
export const APPS = APPS_PC;
