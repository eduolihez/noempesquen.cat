<?php
/**
 * Prova d'integració dels comptes de jugador: rol `nep_jugador` sense capacitats,
 * `nep_es_jugador` i neteja d'rol i metes (uninstall).
 *
 * Execució: wp-env run tests-cli wp eval-file wp-content/plugins/noempesquen-core/tests/php/integracio-comptes.php
 * (o inclosa des d'integracio.php, que ja defineix $nep_comprova).
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

require_once ABSPATH . 'wp-admin/includes/user.php';

$nep_autonom = ! isset( $nep_comprova );
if ( $nep_autonom ) {
	$nep_fallades = 0;
	$nep_comprova = static function ( bool $ok, string $nom ) use ( &$nep_fallades ): void {
		if ( $ok ) {
			WP_CLI::log( "ok  - $nom" );
		} else {
			WP_CLI::log( "ERR - $nom" );
			++$nep_fallades;
		}
	};
}

// El rol existeix després de l'actualització i no té cap capacitat.
nep_actualitza();
nep_actualitza();
$nep_rol = get_role( 'nep_jugador' );
$nep_comprova( null !== $nep_rol, 'rol nep_jugador existeix després de nep_actualitza() (idempotent)' );
$nep_comprova( $nep_rol && array() === array_filter( $nep_rol->capabilities ), 'nep_jugador no té capacitats' );
$nep_comprova( '4' === NEP_DB_VERSION && '4' === get_option( 'nep_db_version' ), 'NEP_DB_VERSION és 4' );

// nep_es_jugador.
$nep_jug_id = (int) wp_insert_user(
	array(
		'user_login' => 'nep_jug_' . wp_rand( 10000, 99999 ),
		'user_pass'  => wp_generate_password(),
		'role'       => 'nep_jugador',
	)
);
$nep_adm = get_userdata( 1 );
$nep_comprova( nep_es_jugador( new WP_User( $nep_jug_id ) ) && nep_es_jugador( $nep_jug_id ), 'nep_es_jugador: jugador → true' );
$nep_comprova( ! nep_es_jugador( $nep_adm ) && ! nep_es_jugador( 0 ), 'nep_es_jugador: administrador i invàlid → false' );
wp_set_current_user( $nep_jug_id );
$nep_comprova( false === apply_filters( 'show_admin_bar', true ), 'jugador: sense barra d\'administració' );
$nep_comprova( home_url( '/compte/' ) === apply_filters( 'login_redirect', 'x', '', new WP_User( $nep_jug_id ) ), 'jugador: login_redirect → /compte/' );
$nep_comprova( ! current_user_can( 'read' ), 'jugador: sense read' );
wp_set_current_user( 1 );
$nep_comprova( true === apply_filters( 'show_admin_bar', true ), 'administrador: conserva la barra' );

// Neteja: rol i metes desapareixen, l'usuari es conserva.
update_user_meta( $nep_jug_id, 'nep_progres', 'x' );
update_user_meta( $nep_jug_id, 'nep_consentiment', '1' );
if ( ! function_exists( 'nep_neteja_jugadors' ) ) {
	defined( 'WP_UNINSTALL_PLUGIN' ) || define( 'WP_UNINSTALL_PLUGIN', 'noempesquen-core/noempesquen-core.php' );
	define( 'NEP_PROVA_NETEJA', true );
	require_once dirname( __DIR__, 2 ) . '/uninstall.php';
}
nep_neteja_jugadors();
$nep_comprova( null === get_role( 'nep_jugador' ), 'neteja: rol eliminat' );
$nep_comprova( '' === get_user_meta( $nep_jug_id, 'nep_progres', true ) && '' === get_user_meta( $nep_jug_id, 'nep_consentiment', true ), 'neteja: metes eliminades' );
$nep_comprova( false !== get_userdata( $nep_jug_id ), 'neteja: l\'usuari es conserva' );

wp_delete_user( $nep_jug_id );
nep_actualitza();

if ( $nep_autonom ) {
	if ( $nep_fallades > 0 ) {
		WP_CLI::error( "$nep_fallades comprovacions fallades." );
	}
	WP_CLI::success( 'Comptes correctes.' );
}
