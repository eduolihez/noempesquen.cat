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
