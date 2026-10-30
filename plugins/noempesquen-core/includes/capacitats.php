<?php
/**
 * Capacitats pròpies i versionat de la base de dades del plugin.
 */

defined( 'ABSPATH' ) || exit;

define( 'NEP_DB_VERSION', '1' );

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
 * Rutina d'activació i d'actualització. T7 hi afegirà aquí el dbDelta de les taules.
 */
function nep_actualitza(): void {
	nep_assigna_capacitats();
	// Punt d'extensió: crear/actualitzar taules pròpies (dbDelta) aquí.
	update_option( 'nep_db_version', NEP_DB_VERSION );
}

/**
 * Executa l'actualització si la versió guardada no coincideix (també després d'un desplegament per FTP/zip).
 */
add_action(
	'plugins_loaded',
	static function () {
		if ( get_option( 'nep_db_version' ) !== NEP_DB_VERSION ) {
			nep_actualitza();
		}
	}
);
