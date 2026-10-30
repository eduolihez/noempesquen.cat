<?php
/**
 * Desinstal·lació: neteja opcions, capacitats i taules pròpies.
 *
 * Es conserva el contingut: no s'esborren usuaris ni les missions (posts `nep_missio`).
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

global $wpdb;

// Opcions nep_*.
$nep_opcions = $wpdb->get_col(
	$wpdb->prepare( "SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s", $wpdb->esc_like( 'nep_' ) . '%' )
);
foreach ( $nep_opcions as $nep_opcio ) {
	delete_option( $nep_opcio );
}

// Capacitats pròpies a tots els rols.
foreach ( wp_roles()->role_objects as $nep_rol ) {
	$nep_rol->remove_cap( 'nep_gestiona_missions' );
	$nep_rol->remove_cap( 'nep_veu_estadistiques' );
}

// Taules pròpies (cap de moment; T7 hi afegirà nep_resultats).
// $wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}nep_resultats" );
