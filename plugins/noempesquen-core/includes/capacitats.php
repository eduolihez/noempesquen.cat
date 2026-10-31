<?php
/**
 * Capacitats pròpies i versionat de la base de dades del plugin.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

// L'administrador (manage_options) té sempre les capacitats pròpies, encara que l'actualització no hagi corregut.
add_filter(
	'user_has_cap',
	static function ( $allcaps ) {
		if ( ! empty( $allcaps['manage_options'] ) ) {
			foreach ( nep_capacitats() as $cap ) {
				$allcaps[ $cap ] = true;
			}
		}
		return $allcaps;
	}
);

/**
 * Capacitats pròpies del plugin.
 *
 * @return string[]
 */
function nep_capacitats(): array {
	return array( 'nep_gestiona_missions', 'nep_veu_estadistiques' );
}

/**
 * Concedeix les capacitats pròpies a l'administrador (idempotent).
 */
function nep_assigna_capacitats(): void {
	$rol = get_role( 'administrator' );
	if ( ! $rol ) {
		return;
	}
	foreach ( nep_capacitats() as $cap ) {
		if ( ! $rol->has_cap( $cap ) ) {
			$rol->add_cap( $cap );
		}
	}
}

/**
 * Rutina d'activació i d'actualització: capacitats i taules pròpies (dbDelta).
 * Si la taula no es pot crear, no es desa la versió (es tornarà a provar).
 */
function nep_actualitza(): void {
	nep_assigna_capacitats();
	nep_crea_rol_jugador();
	if ( ! nep_crea_taula_resultats() ) {
		return;
	}
	delete_transient( 'nep_avis_taula' );
	update_option( 'nep_db_version', NEP_DB_VERSION );
}

// Avís a l'administrador si la taula d'estadístiques no s'ha pogut crear.
add_action(
	'admin_notices',
	static function () {
		if ( ! current_user_can( 'manage_options' ) || ! get_transient( 'nep_avis_taula' ) ) {
			return;
		}
		echo '<div class="notice notice-error"><p>' . esc_html__( 'No s\'ha pogut crear la taula d\'estadístiques de noempesquen. Revisa els permisos de la base de dades.', 'noempesquen' ) . '</p></div>';
	}
);

// Executa l'actualització si la versió guardada no coincideix (també després d'un desplegament per FTP/zip).
add_action(
	'plugins_loaded',
	static function () {
		if ( get_option( 'nep_db_version' ) !== NEP_DB_VERSION ) {
			nep_actualitza();
		}
	}
);

/**
 * Crea el rol del jugador amb compte (sense cap capacitat, ni `read`). Idempotent.
 */
function nep_crea_rol_jugador(): void {
	if ( ! get_role( 'nep_jugador' ) ) {
		add_role( 'nep_jugador', __( 'Jugador', 'noempesquen' ), array() );
	}
}

/**
 * Indica si l'usuari té el rol `nep_jugador`.
 *
 * @param WP_User|int|null $user Usuari; per defecte, l'actual.
 */
function nep_es_jugador( $user = null ): bool {
	if ( null === $user ) {
		$user = wp_get_current_user();
	} elseif ( is_numeric( $user ) ) {
		$user = get_userdata( (int) $user );
	}
	return $user instanceof WP_User && in_array( 'nep_jugador', (array) $user->roles, true );
}

/**
 * El jugador no veu wp-admin: es redirigeix al seu compte (AJAX, admin-post i
 * cron no es toquen). Com que el rol no té `read`, `wp-admin/menu.php` crida
 * `wp_die` abans d'`admin_init`; per això també penja d'`admin_page_access_denied`.
 */
function nep_redirigeix_jugador_admin(): void {
	if ( ! nep_es_jugador() || wp_doing_ajax() || wp_doing_cron() ) {
		return;
	}
	if ( 'admin-post.php' === basename( (string) wp_parse_url( (string) ( $_SERVER['SCRIPT_NAME'] ?? '' ), PHP_URL_PATH ) ) ) {
		return;
	}
	wp_safe_redirect( home_url( '/compte/' ) );
	exit;
}
add_action( 'admin_page_access_denied', 'nep_redirigeix_jugador_admin' );
add_action( 'admin_init', 'nep_redirigeix_jugador_admin' );

// Sense barra d'administració per al jugador.
add_filter(
	'show_admin_bar',
	static function ( $mostra ) {
		return nep_es_jugador() ? false : $mostra;
	}
);

// Després d'entrar, el jugador va al seu compte.
add_filter(
	'login_redirect',
	static function ( $desti, $demanada, $usuari ) {
		return nep_es_jugador( $usuari instanceof WP_User ? $usuari : null ) && $usuari instanceof WP_User ? home_url( '/compte/' ) : $desti;
	},
	10,
	3
);
