<?php
/**
 * Desinstal·lació: neteja opcions, capacitats i taules pròpies.
 *
 * Es conserva el contingut: no s'esborren usuaris ni les missions (posts `nep_missio`).
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

/**
 * Neteja opcions i capacitats del lloc actual.
 */
function nep_neteja_lloc(): void {
	// Llista explícita d'opcions conegudes (afegir-hi les noves).
	foreach ( array( 'nep_db_version' ) as $opcio ) {
		delete_option( $opcio );
	}

	// Capacitats pròpies a tots els rols.
	foreach ( wp_roles()->role_objects as $rol ) {
		$rol->remove_cap( 'nep_gestiona_missions' );
		$rol->remove_cap( 'nep_veu_estadistiques' );
	}
}

if ( is_multisite() ) {
	foreach ( get_sites( array( 'fields' => 'ids', 'number' => 0 ) ) as $nep_lloc ) {
		switch_to_blog( $nep_lloc );
		nep_neteja_lloc();
		restore_current_blog();
	}
} else {
	nep_neteja_lloc();
}

// Taules pròpies (cap de moment; T7 hi afegirà nep_resultats).
// $wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}nep_resultats" );
