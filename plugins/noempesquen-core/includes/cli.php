<?php
/**
 * Ordres WP-CLI: wp noempesquen importa-missions, wp nep demo-estadistiques, wp nep demo-videos
 */

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

/**
 * Importa (o actualitza) les missions JSON de `missions/<idioma>/` com a entrades "Missió"
 * amb la meta `nep_idioma`. Cada missió es busca per `(id, idioma)`.
 *
 * ## OPCIONS
 *
 * [--idioma=<idioma>]
 * : Només aquest idioma (`es` o `ca`). Per defecte, tots dos.
 *
 * ## EXEMPLES
 *
 *     wp noempesquen importa-missions
 *     wp noempesquen importa-missions --idioma=es
 */
WP_CLI::add_command(
	'noempesquen importa-missions',
	static function ( array $args, array $assoc_args ) {
		$idiomes = nep_idiomes_missio();
		if ( isset( $assoc_args['idioma'] ) ) {
			$triat = nep_idioma_valid( $assoc_args['idioma'] );
			if ( null === $triat ) {
				WP_CLI::error( '--idioma ha de ser «es» o «ca».' );
			}
			$idiomes = array( $triat );
		}
		$total = 0;
		foreach ( $idiomes as $idioma ) {
			$total += nep_importa_missions_idioma( $idioma );
		}
		WP_CLI::success( $total . ' fitxers processats.' );
	}
);

/**
 * Entrada `nep_missio` amb aquest id de guió i idioma (qualsevol estat excepte paperera).
 *
 * @param string $id     Id del guió.
 * @param string $idioma `es`|`ca`.
 * @return int Id de l'entrada o 0.
 */
function nep_cerca_missio( string $id, string $idioma ): int {
	$posts = get_posts(
		array(
			'post_type'      => 'nep_missio',
			'post_status'    => 'any',
			'posts_per_page' => -1,
			'fields'         => 'ids',
			'no_found_rows'  => true,
			'meta_query'     => nep_meta_query_idioma( $idioma ), // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- Ordre de CLI.
		)
	);
	foreach ( $posts as $post_id ) {
		$guio = nep_descodifica_guio( (string) get_post_meta( (int) $post_id, 'nep_guio', true ) );
		if ( $guio && ( $guio['id'] ?? null ) === $id ) {
			return (int) $post_id;
		}
	}
	return 0;
}

/**
 * Importa les missions d'un idioma.
 *
 * @param string $idioma `es`|`ca`.
 * @return int Fitxers processats.
 */
function nep_importa_missions_idioma( string $idioma ): int {
	// Sense mon.json (món compartit) ni plantilla-missio.json (plantilla de l'editor).
	$fitxers = nep_fitxers_missions_incloses( nep_carpeta_missions( NEP_PATH . 'missions/', $idioma ) );
	$ordre   = 0;

	foreach ( $fitxers as $fitxer ) {
		$missio = json_decode( (string) file_get_contents( $fitxer ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Fitxer local del plugin.
		if ( ! is_array( $missio ) || empty( $missio['id'] ) || ! is_string( $missio['id'] ) ) {
			WP_CLI::warning( 'JSON invàlid: ' . $idioma . '/' . basename( $fitxer ) );
			continue;
		}

		$existent = nep_cerca_missio( $missio['id'], $idioma );
		// El català conserva el slug d'abans; el castellà en té un de propi i fix.
		$slug  = sanitize_title( 'ca' === $idioma ? $missio['id'] : $missio['id'] . '-' . $idioma );
		$dades = array(
			'post_type'    => 'nep_missio',
			'post_status'  => 'publish',
			'post_title'   => $missio['titol'] ?? $missio['id'],
			'post_name'    => $slug,
			'post_excerpt' => $missio['resum'] ?? '',
			'menu_order'   => $ordre++,
		);

		if ( $existent ) {
			$dades['ID'] = $existent;
		}

		$id = wp_insert_post( $dades, true );
		if ( is_wp_error( $id ) ) {
			WP_CLI::warning( $id->get_error_message() );
			continue;
		}

		// L'idioma abans del guió: la protecció del guió publicat valida amb les metas desades.
		update_post_meta( $id, 'nep_idioma', $idioma );
		update_post_meta( $id, 'nep_dispositiu', sanitize_key( $missio['dispositiu'] ?? 'pc' ) );
		update_post_meta( $id, 'nep_personatge', sanitize_key( $missio['personatge'] ?? 'llissa' ) );
		update_post_meta( $id, 'nep_guio', wp_slash( wp_json_encode( $missio, JSON_UNESCAPED_UNICODE ) ) );

		WP_CLI::log( ( $existent ? 'Actualitzada: ' : 'Creada: ' ) . $idioma . '/' . $missio['id'] );
	}

	return count( $fitxers );
}

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

/** Meta que marca adjunts i pàgines creats per `wp nep demo-videos`. */
const NEP_META_DEMO_VIDEO = '_nep_demo_video';

/**
 * Adjunt de demostració (el torna a fer servir si ja existeix) a partir d'un fitxer dels fixtures.
 *
 * @param string $nom  Nom del fitxer a `tests/fixtures/videos/`.
 * @param string $mime Tipus MIME.
 * @return int Id de l'adjunt o 0.
 */
function nep_demo_video_adjunt( string $nom, string $mime ): int {
	$existents = get_posts(
		array(
			'post_type'      => 'attachment',
			'post_status'    => 'any',
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'meta_key'       => NEP_META_DEMO_VIDEO, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- Ordre de CLI.
			'meta_value'     => $nom, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value -- Ordre de CLI.
		)
	);
	if ( $existents ) {
		return (int) $existents[0];
	}
	$origen = NEP_PATH . 'tests/fixtures/videos/' . $nom;
	if ( ! is_readable( $origen ) ) {
		return 0;
	}
	// wp_upload_bits en lloc de media_handle_sideload: el .vtt no passa la comprovació per contingut.
	$pujat = wp_upload_bits( 'nep-demo-' . $nom, null, (string) file_get_contents( $origen ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Fitxer local del plugin.
	if ( ! empty( $pujat['error'] ) ) {
		return 0;
	}
	$id = wp_insert_attachment(
		array(
			'post_mime_type' => $mime,
			'post_title'     => 'Vídeo de mostra: ' . $nom,
			'post_status'    => 'inherit',
		),
		$pujat['file']
	);
	if ( ! $id || is_wp_error( $id ) ) {
		return 0;
	}
	if ( str_starts_with( $mime, 'video/' ) || str_starts_with( $mime, 'image/' ) ) {
		require_once ABSPATH . 'wp-admin/includes/image.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';
		wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $pujat['file'] ) );
	}
	update_post_meta( $id, NEP_META_DEMO_VIDEO, $nom );
	return (int) $id;
}

/**
 * Pàgines i adjunts de la demo de vídeos (marcats amb la meta).
 *
 * @param string $tipus `page` o `attachment`.
 * @return int[]
 */
function nep_demo_video_ids( string $tipus ): array {
	return array_map(
		'intval',
		get_posts(
			array(
				'post_type'      => $tipus,
				'post_status'    => 'any',
				'posts_per_page' => -1,
				'fields'         => 'ids',
				'meta_key'       => NEP_META_DEMO_VIDEO, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- Ordre de CLI.
			)
		)
	);
}

/**
 * Pàgina i vídeo de mostra (`/videos/video-demo/` i `/ca/videos/video-demo/`). Material generat
 * amb `node scripts/genera-video-mostra.mjs`; no és contingut real.
 *
 * ## OPCIONS
 *
 * [--esborra]
 * : Retira les pàgines i els adjunts de demostració en lloc de crear-los.
 *
 * ## EXEMPLES
 *
 *     wp nep demo-videos
 *     wp nep demo-videos --esborra
 */
WP_CLI::add_command(
	'nep demo-videos',
	static function ( array $args, array $assoc_args ) {
		if ( ! empty( $assoc_args['esborra'] ) ) {
			$total = 0;
			foreach ( array_merge( nep_demo_video_ids( 'page' ), nep_demo_video_ids( 'attachment' ) ) as $id ) {
				$total += wp_delete_post( $id, true ) ? 1 : 0;
			}
			WP_CLI::success( $total . ' elements de demostració esborrats.' );
			return;
		}
		$video  = nep_demo_video_adjunt( 'mostra.mp4', 'video/mp4' );
		$poster = nep_demo_video_adjunt( 'poster.png', 'image/png' );
		$sub_ca = nep_demo_video_adjunt( 'subtitols-ca.vtt', 'text/vtt' );
		$sub_es = nep_demo_video_adjunt( 'subtitols-es.vtt', 'text/vtt' );
		if ( ! $video || ! $poster || ! $sub_ca || ! $sub_es ) {
			WP_CLI::error( "No s'han pogut pujar els fitxers de tests/fixtures/videos/ (genera-los amb `node scripts/genera-video-mostra.mjs`)." );
		}
		$textos = array(
			'ca' => array(
				'titol' => 'Vídeo de mostra',
				'tema'  => 'Vídeo de mostra',
				'h'     => 'Això és un vídeo de mostra',
				'p'     => 'Aquest vídeo és només una prova per veure com es mostra la pàgina. No té cap contingut real.',
			),
			'es' => array(
				'titol' => 'Vídeo de muestra',
				'tema'  => 'Vídeo de muestra',
				'h'     => 'Este es un vídeo de muestra',
				'p'     => 'Este vídeo es solo una prueba para ver cómo se muestra la página. No tiene ningún contenido real.',
			),
		);
		foreach ( $textos as $idioma => $t ) {
			$pare = nep_seo_post( 'videos', $idioma );
			if ( ! $pare ) {
				WP_CLI::warning( 'Falta la pàgina «videos» (' . $idioma . '): salto.' );
				continue;
			}
			$atributs = array(
				'video'       => $video,
				'poster'      => $poster,
				'subtitolsCa' => $sub_ca,
				'subtitolsEs' => $sub_es,
				'durada'      => 6,
				'missio'      => 'llissa-01-factura',
				'tema'        => $t['tema'],
			);
			$contingut = '<!-- wp:noempesquen/video ' . wp_json_encode( $atributs ) . ' -->'
				. '<!-- wp:heading {"level":3} --><h3 class="wp-block-heading">' . esc_html( $t['h'] ) . '</h3><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html( $t['p'] ) . '</p><!-- /wp:paragraph -->'
				. '<!-- /wp:noempesquen/video -->';
			$existent  = get_posts(
				array(
					'post_type'      => 'page',
					'post_status'    => 'any',
					'post_parent'    => (int) $pare->ID,
					'name'           => 'video-demo',
					'posts_per_page' => 1,
					'fields'         => 'ids',
				)
			);
			if ( $existent ) {
				$id = (int) $existent[0];
				wp_update_post( wp_slash( array( 'ID' => $id, 'post_title' => $t['titol'], 'post_content' => $contingut, 'post_status' => 'publish' ) ) );
			} else {
				$id = nep_crea_pagina( 'video-demo', $t['titol'], $contingut, (int) $pare->ID );
			}
			if ( ! $id ) {
				WP_CLI::warning( "No s'ha pogut crear la pàgina demo ($idioma)." );
				continue;
			}
			update_post_meta( $id, NEP_META_DEMO_VIDEO, '1' );
			WP_CLI::log( ( $existent ? 'Actualitzada: ' : 'Creada: ' ) . get_permalink( $id ) );
		}
		WP_CLI::success( 'Vídeo de mostra a punt. Retira\'l amb `wp nep demo-videos --esborra`.' );
	}
);
