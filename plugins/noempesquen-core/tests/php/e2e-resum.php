<?php
/**
 * Ajuda dels e2e del resum públic (tests/e2e/resum-estadistiques.spec.js):
 *   wp eval-file .../tests/php/e2e-resum.php insereix <missio>
 *   wp eval-file .../tests/php/e2e-resum.php neteja <missio>
 * `insereix` posa 12 partides reals amb «a» i 8 amb «b» (versió actual);
 * `neteja` esborra totes les files de la missió. Totes dues buiden el cau del resum.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

// phpcs:disable WordPress.DB
global $wpdb;
$nep_accio  = (string) ( $args[0] ?? '' );
$nep_missio = (string) ( $args[1] ?? '' );
if ( ! preg_match( '/' . NEP_PATRO_ID . '/D', $nep_missio ) || ! str_starts_with( $nep_missio, 'prova-' ) ) {
	WP_CLI::error( 'Cal una missió de prova (prova-...).' );
}
$nep_taula = nep_taula_resultats();
$nep_info  = nep_info_missions_jugables()[ $nep_missio ] ?? null;
if ( 'insereix' === $nep_accio ) {
	if ( ! $nep_info ) {
		WP_CLI::error( 'Missió no jugable: ' . $nep_missio );
	}
	foreach ( array( 'a' => 12, 'b' => 8 ) as $nep_decisio => $nep_n ) {
		$wpdb->insert(
			$nep_taula,
			array(
				'missio'      => $nep_missio,
				'versio_hash' => $nep_info['hash'],
				'dia'         => gmdate( 'Y-m-d' ),
				'estrelles'   => 2,
				'decisio'     => $nep_decisio,
				'demo'        => 0,
				'n'           => $nep_n,
			)
		);
	}
} elseif ( 'neteja' === $nep_accio ) {
	$wpdb->query( $wpdb->prepare( "DELETE FROM {$nep_taula} WHERE missio = %s", $nep_missio ) );
} else {
	WP_CLI::error( 'Acció desconeguda.' );
}
if ( $nep_info ) {
	delete_transient( nep_clau_resum( $nep_missio, $nep_info['hash'] ) );
}
WP_CLI::log( 'files: ' . (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$nep_taula} WHERE missio = %s", $nep_missio ) ) );
