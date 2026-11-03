<?php
/**
 * Correus dels comptes de jugador: enviament i plantilles (text pla, sense
 * seguiment). Mai es registra cap adreça ni cap token.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Remitent del correu (filtre `nep_correu_remitent`).
 *
 * @return string
 */
function nep_correu_remitent(): string {
	$host = wp_parse_url( home_url(), PHP_URL_HOST );
	$host = is_string( $host ) && '' !== $host ? $host : 'localhost';
	return (string) apply_filters( 'nep_correu_remitent', 'no-reply@' . $host );
}

/**
 * Envia un correu en text pla UTF-8.
 *
 * @param string $a        Destinatari.
 * @param string $assumpte Assumpte.
 * @param string $cos      Cos en text pla.
 * @return bool
 */
function nep_correu_envia( $a, $assumpte, $cos ): bool {
	$remitent = nep_correu_remitent();
	$capcaleres = array(
		'Content-Type: text/plain; charset=UTF-8',
		'From: No em pesquen <' . $remitent . '>',
	);
	$ok = (bool) wp_mail( $a, $assumpte, $cos, $capcaleres );
	if ( ! $ok ) {
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( '[noempesquen] correu no enviat: nep_correu_error' );
	}
	return $ok;
}

/**
 * Envia el correu de verificació amb l'enllaç del token.
 *
 * @param int    $id_usuari Usuari.
 * @param string $token     Token "<id>.<hex>".
 * @return bool
 */
function nep_correu_verificacio( $id_usuari, $token ): bool {
	$usuari = get_userdata( (int) $id_usuari );
	if ( ! $usuari instanceof WP_User || ! is_string( $token ) || '' === $token ) {
		return false;
	}
	$enllac = home_url( '/compte/?verifica=' . $token );
	$cos    = __( 'Hola!', 'noempesquen' ) . "\n\n"
		. __( 'Confirma el teu correu per acabar de crear el compte a No em pesquen:', 'noempesquen' ) . "\n\n"
		. $enllac . "\n\n"
		. __( 'L\'enllaç caduca d\'aquí a 48 hores i només es pot fer servir un cop.', 'noempesquen' ) . "\n\n"
		. __( 'Si no has creat tu el compte, ignora aquest missatge: no passarà res.', 'noempesquen' ) . "\n";
	return nep_correu_envia( $usuari->user_email, __( 'Confirma el teu correu a No em pesquen', 'noempesquen' ), $cos );
}

/**
 * Envia el correu de recuperació de contrasenya amb l'enllaç del token.
 * No esmenta la contrasenya actual.
 *
 * @param int    $id_usuari Usuari.
 * @param string $token     Token "<id>.<hex>".
 * @return bool
 */
function nep_correu_recuperacio( $id_usuari, $token ): bool {
	$usuari = get_userdata( (int) $id_usuari );
	if ( ! $usuari instanceof WP_User || ! is_string( $token ) || '' === $token ) {
		return false;
	}
	$enllac = home_url( '/compte/?restableix=' . $token );
	$cos    = __( 'Hola!', 'noempesquen' ) . "\n\n"
		. __( 'Has demanat restablir la contrasenya del teu compte a No em pesquen. Tria\'n una de nova amb aquest enllaç:', 'noempesquen' ) . "\n\n"
		. $enllac . "\n\n"
		. __( 'L\'enllaç caduca d\'aquí a 1 hora i només es pot fer servir un cop.', 'noempesquen' ) . "\n\n"
		. __( 'Si no ho has demanat tu, ignora aquest missatge: no passarà res.', 'noempesquen' ) . "\n";
	return nep_correu_envia( $usuari->user_email, __( 'Restableix la contrasenya a No em pesquen', 'noempesquen' ), $cos );
}
