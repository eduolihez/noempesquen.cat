<?php
/**
 * Desinstal·lació: neteja opcions, transients, capacitats i taules pròpies.
 *
 * Es conserva el contingut: no s'esborren usuaris ni les missions (posts `nep_missio`).
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

/**
 * Elimina el rol de jugador i les metes de compte del lloc actual (els usuaris es conserven).
 */
function nep_neteja_jugadors(): void {
	remove_role( 'nep_jugador' );
	foreach ( array( 'nep_progres', 'nep_consentiment', 'nep_token_verifica', 'nep_email_verificat', 'nep_token_recupera', 'nep_idioma' ) as $meta ) {
		delete_metadata( 'user', 0, $meta, '', true );
	}
}

/**
 * Neteja opcions, transients, capacitats i taules del lloc actual.
 */
function nep_neteja_lloc(): void {
	global $wpdb;

	// Llista explícita d'opcions conegudes (afegir-hi les noves).
	foreach ( array( 'nep_db_version', 'nep_sal_dia', 'nep_hash_fals', 'nep_versio_missions' ) as $opcio ) {
		delete_option( $opcio );
	}

	// Transients propis: límit d'enviaments (`nep_rl_*`), avisos (`nep_avis_*`) i cau de missions.
	delete_transient( 'nep_cau_missions' );
	foreach ( array( 'nep_rl_', 'nep_avis_' ) as $prefix ) {
		foreach ( array( '_transient_', '_transient_timeout_' ) as $tipus ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Esborrar transients propis per prefix en desinstal·lar.
			$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s", $wpdb->esc_like( $tipus . $prefix ) . '%' ) );
		}
	}

	// Capacitats pròpies a tots els rols.
	foreach ( wp_roles()->role_objects as $rol ) {
		$rol->remove_cap( 'nep_gestiona_missions' );
		$rol->remove_cap( 'nep_veu_estadistiques' );
	}

	nep_neteja_jugadors();

	// Taula d'estadístiques agregades (una per lloc).
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Esborrar la taula pròpia en desinstal·lar.
	$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}nep_resultats" );
}

// Quan el carrega el test d'integració (WP-CLI) només es defineixen les funcions; fora de WP-CLI la constant no té efecte.
if ( defined( 'NEP_PROVA_NETEJA' ) && defined( 'WP_CLI' ) && WP_CLI ) {
	return;
}

if ( is_multisite() ) {
	foreach ( get_sites( array( 'fields' => 'ids', 'number' => 0 ) ) as $nep_lloc ) {
		switch_to_blog( $nep_lloc );
		try {
			nep_neteja_lloc();
		} finally {
			restore_current_blog();
		}
	}
} else {
	nep_neteja_lloc();
}
