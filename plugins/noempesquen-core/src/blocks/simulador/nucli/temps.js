// Constantes de tiempo del simulador (ms salvo indicación). Módulo puro.

export const MS_TICK = 1000;
export const MS_ESCRIU = 600;
export const MS_PULSACIO_LLARGA = 500;
export const RETARD_PISTA = 450;
export const SEGONS_PISTA = 60;

export const MS_AVIS_POSTA = 7000;
export const MS_AVIS_REVENDA = 4000;
export const MS_AVIS_PARLA = 4000;
export const DURADA_AVIS_TANCA = 2500;

export const MAX_TOASTS = 3;
export const MAX_BANNERS = 2;

export const MS_ENTRE_AVISOS = 700;
// Cap avís programat surt abans d'acabar la intro + aquest marge.
export const MS_TRAS_INTRO = 1500;
// Ritme mínim entre avisos consecutius d'un mateix disparador d'origen
// (mateix `quan`), per nivell: el nivell 1 respira més.
export const MS_MIN_AVISOS_NIVELL_1 = 4000;
export const MS_MIN_AVISOS_NIVELL_2_3 = 2500;
export const MS_AVIS_BASE = 4000;
export const MS_AVIS_PER_CARACTER = 60;
export const MS_AVIS_MAX = 9000;
export const MS_SORTIDA = 120; // = $t-rapid (_moviment.scss)
export const MS_XIP_LUPA = 1800; // xip «Pista trobada» / «Sembla normal»
