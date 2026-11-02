<?php
/**
 * Accés a l'administració amagat darrere d'una ruta pròpia (per defecte /admin).
 *
 * Redueix soroll i força bruta automatitzada contra wp-login.php. No és una
 * mesura de seguretat per si sola: la protecció real és la contrasenya forta,
 * el límit d'intents i la verificació en dos passos.
 *
 * Constants opcionals a wp-config.php:
 * - NEP_ADMIN_SLUG: altra ruta (només lletres, xifres i guions). Per defecte «admin».
 * - NEP_ADMIN_VISIBLE: true per desactivar-ho del tot (sortida d'emergència).
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/acces-admin-nucli.php';

/**
 * Camí de la petició actual, sense consulta.
 *
 * @return string
 */
function nep_admin_cami_peticio(): string {
	$uri = isset( $_SERVER['REQUEST_URI'] ) ? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) : '';
	$cami = wp_parse_url( $uri, PHP_URL_PATH );
	return is_string( $cami ) ? $cami : '';
}

/**
 * Respon un 404 senzill i acaba (sense revelar res de l'administració).
 */
function nep_admin_404(): void {
	nocache_headers();
	wp_die(
		esc_html__( 'La pàgina que busques no existeix.', 'noempesquen' ),
		esc_html__( 'No trobat', 'noempesquen' ),
		array( 'response' => 404 )
	);
}

/**
 * Activa els ganxos (només si no està desactivat).
 */
function nep_admin_inicia(): void {
	if ( ! nep_admin_ocult_actiu() ) {
		return;
	}

	$slug = nep_admin_slug();

	// Totes les adreces generades cap a wp-login.php apunten a la ruta secreta.
	$reescriu = static function ( $url ) use ( $slug ) {
		return is_string( $url ) ? nep_admin_reescriu_url( $url, $slug ) : $url;
	};
	add_filter( 'site_url', $reescriu, 100 );
	add_filter( 'network_site_url', $reescriu, 100 );
	add_filter( 'wp_redirect', $reescriu, 100 );

	// WordPress redirigeix /login, /dashboard i /admin cap a l'administració: fora.
	remove_action( 'template_redirect', 'wp_redirect_admin_locations', 1000 );

	add_action(
		'wp_loaded',
		static function () use ( $slug ) {
			global $pagenow;

			$base = (string) wp_parse_url( home_url( '/' ), PHP_URL_PATH );
			$cami = nep_admin_cami_peticio();

			// La ruta secreta serveix el formulari d'entrada de WordPress.
			if ( nep_admin_es_ruta( $cami, $base, $slug ) ) {
				$pagenow = 'wp-login.php'; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
				require_once ABSPATH . 'wp-login.php';
				exit;
			}

			// wp-login.php directe: 404, tret de la contrasenya d'entrades protegides.
			if ( 'wp-login.php' === $pagenow ) {
				// phpcs:ignore WordPress.Security.NonceVerification.Recommended
				$accio = isset( $_REQUEST['action'] ) ? sanitize_key( wp_unslash( $_REQUEST['action'] ) ) : '';
				if ( 'postpass' !== $accio ) {
					nep_admin_404();
				}
			}

			// Administració sense sessió: 404 (admin-ajax i admin-post es mantenen).
			if ( is_admin() && ! is_user_logged_in() && ! wp_doing_ajax() && 'admin-post.php' !== $pagenow ) {
				nep_admin_404();
			}
		},
		9
	);
}
add_action( 'plugins_loaded', 'nep_admin_inicia', 1 );
