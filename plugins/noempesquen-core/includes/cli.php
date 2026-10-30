<?php
/**
 * Ordres WP-CLI: wp noempesquen importa-missions, wp nep demo-estadistiques
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
			// mon.json és el món compartit (contactes, webs, correus), no una missió.
			if ( 'mon.json' === basename( $fitxer ) ) {
				continue;
			}

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

/**
 * Dades de demostració del panell d'estadístiques (files amb `demo` = 1).
 *
 * ## OPCIONS
 *
 * <accio>
 * : `sembra` (substitueix les demo que hi hagués) o `esborra` (només les demo).
 * ---
 * options:
 *   - sembra
 *   - esborra
 * ---
 *
 * [--partides=<n>]
 * : Partides per missió jugable, repartides pels darrers 30 dies.
 * ---
 * default: 60
 * ---
 *
 * [--llavor=<n>]
 * : Llavor del generador (la mateixa llavor dona les mateixes files).
 * ---
 * default: 2026
 * ---
 *
 * ## EXEMPLES
 *
 *     wp nep demo-estadistiques sembra --partides=80
 *     wp nep demo-estadistiques esborra
 */
WP_CLI::add_command(
	'nep demo-estadistiques',
	static function ( array $args, array $assoc_args ) {
		if ( 'esborra' === ( $args[0] ?? '' ) ) {
			$esborrades = nep_esborra_demo();
			if ( false === $esborrades ) {
				WP_CLI::error( 'No s\'han pogut esborrar les dades de demostració.' );
			}
			WP_CLI::success( $esborrades . ' files de demostració esborrades.' );
			return;
		}
		if ( 'sembra' !== ( $args[0] ?? '' ) ) {
			WP_CLI::error( 'Ús: wp nep demo-estadistiques sembra [--partides=<n>] [--llavor=<n>] | esborra' );
		}
		$partides = (int) ( $assoc_args['partides'] ?? 60 );
		if ( $partides < 1 || $partides > 10000 ) {
			WP_CLI::error( '--partides ha de ser entre 1 i 10000.' );
		}
		$sembrades = nep_sembra_demo( $partides, (int) ( $assoc_args['llavor'] ?? 2026 ) );
		if ( false === $sembrades ) {
			WP_CLI::error( 'No s\'han pogut sembrar les dades de demostració.' );
		}
		WP_CLI::success( $sembrades . ' partides de demostració sembrades. Esborra-les amb `wp nep demo-estadistiques esborra` abans de publicar.' );
	}
);
