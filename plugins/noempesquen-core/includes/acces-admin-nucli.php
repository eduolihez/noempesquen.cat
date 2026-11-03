<?php
/**
 * Funcions pures de l'accés amagat a l'administració (sense WordPress).
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Ruta secreta d'accés, sense barres.
 *
 * @return string
 */
function nep_admin_slug(): string {
	$slug = defined( 'NEP_ADMIN_SLUG' ) ? strtolower( (string) NEP_ADMIN_SLUG ) : 'admin';
	$slug = trim( $slug, '/' );
	if ( ! preg_match( '/^[a-z0-9-]{2,40}$/', $slug ) || in_array( $slug, array( 'wp-admin', 'wp-login', 'wp-login-php' ), true ) ) {
		return 'admin';
	}
	return $slug;
}

/**
 * Indica si l'ocultació està activa.
 *
 * @return bool
 */
function nep_admin_ocult_actiu(): bool {
	return ! ( defined( 'NEP_ADMIN_VISIBLE' ) && NEP_ADMIN_VISIBLE );
}

/**
 * Canvia l'adreça de wp-login.php per la ruta secreta (manté la consulta).
 *
 * @param string $url  Adreça.
 * @param string $slug Ruta secreta.
 * @return string
 */
function nep_admin_reescriu_url( string $url, string $slug ): string {
	return preg_replace( '#/wp-login\.php(?=$|[?\#/])#', '/' . $slug . '/', $url, 1 ) ?? $url;
}

/**
 * Indica si un camí de petició és la ruta secreta.
 *
 * @param string $cami Camí de la petició (sense consulta).
 * @param string $base Camí base del web (p. ex. «/» o «/blog»).
 * @param string $slug Ruta secreta.
 * @return bool
 */
function nep_admin_es_ruta( string $cami, string $base, string $slug ): bool {
	$cami = '/' . trim( rawurldecode( $cami ), '/' );
	$base = '/' . trim( $base, '/' );
	$ruta = ( '/' === $base ? '' : $base ) . '/' . $slug;
	return $cami === $ruta;
}
