<?php
/**
 * Ordres WP-CLI: wp noempesquen importa-missions
 */

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

/**
 * Importa (o actualitza) les missions JSON de la carpeta /missions com a entrades "Missió".
 *
 * ## EXEMPLES
 *
 *     wp noempesquen importa-missions
 */
WP_CLI::add_command(
	'noempesquen importa-missions',
	static function () {
		$fitxers = glob( NEP_PATH . 'missions/*.json' ) ?: array();
		$ordre   = 0;

		foreach ( $fitxers as $fitxer ) {
			$missio = json_decode( (string) file_get_contents( $fitxer ), true );
			if ( ! is_array( $missio ) || empty( $missio['id'] ) ) {
				WP_CLI::warning( 'JSON invàlid: ' . basename( $fitxer ) );
				continue;
			}

			$existent = get_posts(
				array(
					'post_type'   => 'nep_missio',
					'name'        => sanitize_title( $missio['id'] ),
					'post_status' => 'any',
					'numberposts' => 1,
				)
			);

			$dades = array(
				'post_type'    => 'nep_missio',
				'post_status'  => 'publish',
				'post_title'   => $missio['titol'] ?? $missio['id'],
				'post_name'    => sanitize_title( $missio['id'] ),
				'post_excerpt' => $missio['resum'] ?? '',
				'menu_order'   => $ordre++,
			);

			if ( $existent ) {
				$dades['ID'] = $existent[0]->ID;
			}

			$id = wp_insert_post( $dades, true );
			if ( is_wp_error( $id ) ) {
				WP_CLI::warning( $id->get_error_message() );
				continue;
			}

			update_post_meta( $id, 'nep_dispositiu', sanitize_key( $missio['dispositiu'] ?? 'pc' ) );
			update_post_meta( $id, 'nep_personatge', sanitize_key( $missio['personatge'] ?? 'llissa' ) );
			update_post_meta( $id, 'nep_guio', wp_slash( wp_json_encode( $missio, JSON_UNESCAPED_UNICODE ) ) );

			WP_CLI::log( ( $existent ? 'Actualitzada: ' : 'Creada: ' ) . $missio['id'] );
		}

		WP_CLI::success( count( $fitxers ) . ' fitxers processats.' );
	}
);
