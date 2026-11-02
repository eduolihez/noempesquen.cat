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
	$ids_valids = array_values( array_unique( (array) $ids_valids ) );
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

/** Vigència del token de verificació del correu (48 h). */
const NEP_TTL_VERIFICA = 172800;

/** Vigència del token de recuperació de contrasenya (1 h). */
const NEP_TTL_RECUPERA = 3600;

/**
 * Genera un token "<id>.<hex>" a partir de 32 bytes aleatoris donats.
 *
 * @param int    $id_usuari      Id d'usuari (> 0).
 * @param string $bytes_aleatoris Exactament 32 bytes.
 * @return string Token o cadena buida si l'entrada no és vàlida.
 */
function nep_token_genera( $id_usuari, $bytes_aleatoris ) {
	if ( ! is_int( $id_usuari ) || $id_usuari <= 0 || ! is_string( $bytes_aleatoris ) || 32 !== strlen( $bytes_aleatoris ) ) {
		return '';
	}
	return $id_usuari . '.' . bin2hex( $bytes_aleatoris );
}

/**
 * Analitza un token.
 *
 * @param mixed $token Token rebut.
 * @return array|null array( 'id' => int, 'secret' => string ) o null.
 */
function nep_token_parseja( $token ) {
	if ( ! is_string( $token ) || ! preg_match( '/^([1-9][0-9]{0,9})\.([0-9a-f]{64})$/D', $token, $m ) ) {
		return null;
	}
	return array(
		'id'     => (int) $m[1],
		'secret' => $m[2],
	);
}

/**
 * Hash HMAC-SHA256 del secret.
 *
 * @param string $secret Secret.
 * @param string $sal    Sal del servidor.
 * @return string Hash o cadena buida si no hi ha sal.
 */
function nep_token_hash( $secret, $sal ) {
	if ( ! is_string( $secret ) || ! is_string( $sal ) || '' === $sal ) {
		return '';
	}
	return hash_hmac( 'sha256', $secret, $sal );
}

/**
 * Registre a desar a user meta (mai el secret).
 *
 * @param string $secret Secret.
 * @param string $sal    Sal.
 * @param int    $ara    Instant actual (Unix).
 * @param int    $ttl    Vigència en segons.
 * @return array
 */
function nep_token_registre( $secret, $sal, $ara, $ttl ) {
	return array(
		'hash'   => nep_token_hash( $secret, $sal ),
		'caduca' => $ara + $ttl,
	);
}

/**
 * Valida un secret contra el registre desat.
 *
 * @param mixed  $registre Registre desat.
 * @param string $secret   Secret rebut.
 * @param string $sal      Sal.
 * @param int    $ara      Instant actual (Unix).
 * @return bool
 */
function nep_token_valid( $registre, $secret, $sal, $ara ) {
	if ( ! is_array( $registre ) || ! isset( $registre['hash'], $registre['caduca'] )
		|| ! is_string( $registre['hash'] ) || ! is_int( $registre['caduca'] ) || $ara > $registre['caduca'] ) {
		return false;
	}
	$esperat = nep_token_hash( $secret, $sal );
	return '' !== $esperat && hash_equals( $registre['hash'], $esperat );
}
