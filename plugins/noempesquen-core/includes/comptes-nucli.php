<?php
/**
 * Funcions pures de comptes: validació i fusió de progrés.
 *
 * Sense WordPress ni base de dades; es proven amb PHPUnit.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

/** Versió del text de consentiment. */
const NEP_VERSIO_CONSENTIMENT = '2026-10-31';

/**
 * Valida el format d'un correu.
 *
 * @param mixed $email Correu.
 * @return bool
 */
function nep_valida_email( $email ) {
	if ( ! is_string( $email ) || '' === $email || strlen( $email ) > 100 || preg_match( '/\s/', $email ) ) {
		return false;
	}
	return false !== filter_var( $email, FILTER_VALIDATE_EMAIL );
}

/**
 * Valida la contrasenya: 10 a 128 caràcters, sense exigir símbols.
 *
 * @param mixed $pass Contrasenya.
 * @return bool
 */
function nep_valida_contrasenya( $pass ) {
	if ( ! is_string( $pass ) ) {
		return false;
	}
	$n = function_exists( 'mb_strlen' ) ? mb_strlen( $pass, 'UTF-8' ) : strlen( $pass );
	return $n >= 10 && $n <= 128;
}

/**
 * Sanea el progrés {id => 0..3} contra les missions publicades.
 *
 * @param mixed $entrada    Progrés rebut.
 * @param array $ids_valids Ids de missions vàlids.
 * @return array
 */
function nep_sanea_progres( $entrada, $ids_valids ) {
	if ( ! is_array( $entrada ) ) {
		return array();
	}
	$ids_valids = array_values( (array) $ids_valids );
	$sortida    = array();
	foreach ( $entrada as $id => $estrelles ) {
		if ( count( $sortida ) >= count( $ids_valids ) ) {
			break;
		}
		$id = (string) $id;
		if ( ! in_array( $id, $ids_valids, true ) || ! preg_match( '/' . NEP_PATRO_ID . '/D', $id ) ) {
			continue;
		}
		if ( ! is_int( $estrelles ) || $estrelles < 0 || $estrelles > 3 ) {
			continue;
		}
		$sortida[ $id ] = $estrelles;
	}
	return $sortida;
}

/**
 * Fusiona dos progressos: màxim per missió.
 *
 * @param array $a Progrés A.
 * @param array $b Progrés B.
 * @return array
 */
function nep_fusiona_progres( $a, $b ) {
	$sortida = is_array( $a ) ? $a : array();
	foreach ( is_array( $b ) ? $b : array() as $id => $estrelles ) {
		if ( ! isset( $sortida[ $id ] ) || $estrelles > $sortida[ $id ] ) {
			$sortida[ $id ] = $estrelles;
		}
	}
	return $sortida;
}

/**
 * Comprova el consentiment: accepta i majoria d'edat, tots dos booleans true.
 *
 * @param mixed $dades Dades rebudes.
 * @return bool
 */
function nep_consentiment_valid( $dades ) {
	return is_array( $dades )
		&& isset( $dades['acepta'], $dades['majoria_edat'] )
		&& true === $dades['acepta']
		&& true === $dades['majoria_edat'];
}
