<?php
/**
 * SEO de la secció de vídeos: títol, descripció i imatge del llistat, i a les filles
 * `og:type` = `video.other`, `og:video*`, `og:image` (pòster) i JSON-LD `VideoObject`.
 *
 * Amb The SEO Framework (TSF) s'hi integra amb els seus filtres (mai duplica etiquetes ni
 * `<script>`; TSF ja emet el `BreadcrumbList`). Sense TSF, només es pinta l'`og:video*` i el
 * JSON-LD (amb molla de pa) a `wp_head`. Funcions pures a `video-nucli.php`.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Idioma del llistat `videos` si la consulta (o `$args['id']` de TSF) és aquesta pàgina; si no, null.
 *
 * @param array|null $args Arguments de consulta de TSF (`id`) o null.
 * @return string|null `es`|`ca`.
 */
function nep_seo_videos_llistat( ?array $args = null ): ?string {
	$id = isset( $args['id'] ) ? (int) $args['id'] : (int) get_queried_object_id();
	if ( $id <= 0 || ( null === $args && ! is_page() ) ) {
		return null;
	}
	foreach ( nep_idiomes() as $idioma ) {
		$pare = nep_seo_post( 'videos', $idioma );
		if ( $pare && (int) $pare->ID === $id ) {
			return $idioma;
		}
	}
	return null;
}

/**
 * Dades d'una pàgina de vídeo per a SEO (null si no és una filla de `videos`, està protegida o no té MP4).
 *
 * @param WP_Post $post Pàgina.
 * @return array<string, mixed>|null
 */
function nep_seo_video_dades( WP_Post $post ): ?array {
	static $memo = array();
	if ( array_key_exists( $post->ID, $memo ) ) {
		return $memo[ $post->ID ];
	}
	$memo[ $post->ID ] = null;
	$fill              = nep_seo_fill_post( $post );
	if ( ! $fill || 'publish' !== $post->post_status || '' !== $post->post_password ) {
		return null;
	}
	$blocs    = parse_blocks( $post->post_content );
	$atributs = nep_video_atributs_blocs( $blocs );
	$video    = null === $atributs ? '' : nep_video_url_adjunt( $atributs['video'] ?? 0, 'video/mp4' );
	if ( null === $atributs || '' === $video ) {
		return null;
	}
	$meta       = wp_get_attachment_metadata( (int) $atributs['video'] );
	$poster_id  = nep_video_segons( $atributs['poster'] ?? 0 );
	$poster     = '' !== nep_video_url_adjunt( $poster_id, 'image/' ) ? wp_get_attachment_image_src( $poster_id, 'full' ) : false;
	$text       = nep_video_transcripcio_text( $blocs );
	$descripcio = trim( wp_strip_all_tags( $post->post_excerpt ) );
	if ( '' === $descripcio && '' !== $text ) {
		$descripcio = nep_video_retalla( (string) strtok( $text, "\n" ), 300 );
	}
	$memo[ $post->ID ] = array(
		'url'          => (string) get_permalink( $post ),
		'titol'        => wp_strip_all_tags( get_the_title( $post ) ),
		'descripcio'   => $descripcio,
		'video'        => $video,
		'poster'       => is_array( $poster ) ? (string) $poster[0] : '',
		'poster_id'    => $poster_id,
		'poster_ample' => is_array( $poster ) ? (int) $poster[1] : 0,
		'poster_alt'   => is_array( $poster ) ? (int) $poster[2] : 0,
		'data'         => (string) get_post_time( 'c', true, $post ),
		'durada'       => nep_video_durada( $atributs ),
		'ample'        => is_array( $meta ) ? nep_video_segons( $meta['width'] ?? 0 ) : 0,
		'alt'          => is_array( $meta ) ? nep_video_segons( $meta['height'] ?? 0 ) : 0,
		'idioma'       => $fill['idioma'],
		'transcripcio' => $text,
	);
	return $memo[ $post->ID ];
}

/**
 * Dades SEO de la filla de vídeo de la petició actual, o null.
 *
 * @param array|null $args Arguments de TSF (`id`) o null.
 * @return array<string, mixed>|null
 */
function nep_seo_video_actual( ?array $args = null ): ?array {
	$id = isset( $args['id'] ) ? (int) $args['id'] : (int) get_queried_object_id();
	if ( $id <= 0 || ( null === $args && ! is_page() ) ) {
		return null;
	}
	$post = get_post( $id );
	return $post instanceof WP_Post && 'page' === $post->post_type ? nep_seo_video_dades( $post ) : null;
}

/** Títol del llistat (el de la pàgina, sense la marca: TSF l'hi afegeix). */
add_filter(
	'the_seo_framework_title_from_custom_field',
	static function ( $titol, $args = null ) {
		if ( '' === (string) $titol && null !== nep_seo_videos_llistat( is_array( $args ) ? $args : null ) ) {
			return __( 'Vídeos sobre estafes digitals amb subtítols', 'noempesquen' );
		}
		return $titol;
	},
	10,
	2
);

/** Meta description del llistat. */
add_filter(
	'the_seo_framework_custom_field_description',
	static function ( $descripcio, $args = null ) {
		if ( '' === (string) $descripcio && null !== nep_seo_videos_llistat( is_array( $args ) ? $args : null ) ) {
			return __( 'Vídeos curts amb subtítols i transcripció per aprendre a detectar estafes digitals abans que et pesquin. Després, practica al simulador.', 'noempesquen' );
		}
		return $descripcio;
	},
	10,
	2
);

/**
 * Imatge social (`og:image`, `twitter:image`) quan l'editor no n'ha triada cap:
 * el pòster a les filles i el logotip del tema al llistat.
 */
add_filter(
	'the_seo_framework_generated_image_details',
	static function ( $detalls, $args = null ) {
		if ( ! empty( $detalls ) ) {
			return $detalls;
		}
		$args  = is_array( $args ) ? $args : null;
		$video = nep_seo_video_actual( $args );
		if ( $video && '' !== $video['poster'] ) {
			return array(
				array(
					'url'    => $video['poster'],
					'id'     => (int) $video['poster_id'],
					'width'  => (int) $video['poster_ample'],
					'height' => (int) $video['poster_alt'],
					'alt'    => $video['titol'],
				),
			);
		}
		if ( null !== nep_seo_videos_llistat( $args ) ) {
			return array(
				array(
					'url'    => get_theme_file_uri( 'assets/img/favicon-512.png' ),
					'id'     => 0,
					'width'  => 512,
					'height' => 512,
					'alt'    => '',
				),
			);
		}
		return $detalls;
	},
	10,
	2
);

/** `og:type` = `video.other` i `og:video*` a les etiquetes de TSF (a continuació d'`og:type`). */
add_filter(
	'the_seo_framework_meta_render_data',
	static function ( $etiquetes ) {
		$video = is_array( $etiquetes ) ? nep_seo_video_actual() : null;
		if ( ! $video ) {
			return $etiquetes;
		}
		$nou = array();
		foreach ( $etiquetes as $clau => $dades ) {
			if ( 'og:type' === $clau ) {
				foreach ( nep_video_og( $video ) as $i => $par ) {
					$nou[ 0 === $i ? 'og:type' : 'og:video:' . $i ] = array(
						'attributes' => array(
							'property' => $par[0],
							'content'  => $par[1],
						),
					);
				}
				continue;
			}
			$nou[ $clau ] = $dades;
		}
		return $nou;
	}
);

/**
 * JSON-LD: el `VideoObject` s'afegeix al `@graph` de TSF (mai un segon `<script>`).
 *
 * @param array $video Dades de nep_seo_video_dades().
 * @return array|null
 */
function nep_seo_video_objecte( array $video ): ?array {
	$obj = nep_video_jsonld( $video );
	if ( ! $obj ) {
		return null;
	}
	return array( '@id' => $video['url'] . '#/schema/VideoObject' ) + $obj;
}

add_filter(
	'the_seo_framework_schema_graph_data',
	static function ( $graf, $args = null ) {
		$video = is_array( $graf ) ? nep_seo_video_actual( is_array( $args ) ? $args : null ) : null;
		$obj   = $video ? nep_seo_video_objecte( $video ) : null;
		if ( $obj ) {
			$graf[] = $obj;
		}
		return $graf;
	},
	10,
	2
);

/** Sense TSF: etiquetes `og:video*` i JSON-LD (`VideoObject` + molla de pa) a `wp_head`. */
add_action(
	'wp_head',
	static function () {
		if ( defined( 'THE_SEO_FRAMEWORK_VERSION' ) ) {
			return;
		}
		$video = nep_seo_video_actual();
		$obj   = $video ? nep_seo_video_objecte( $video ) : null;
		if ( ! $video || ! $obj ) {
			return;
		}
		foreach ( nep_video_og( $video ) as $par ) {
			printf( '<meta property="%s" content="%s">' . "\n", esc_attr( $par[0] ), esc_attr( $par[1] ) );
		}
		if ( '' !== $video['poster'] ) {
			printf( '<meta property="og:image" content="%s">' . "\n", esc_url( $video['poster'] ) );
		}
		$graf = array(
			'@context' => 'https://schema.org',
			'@graph'   => array(
				$obj,
				nep_video_jsonld_molla(
					array(
						array(
							'nom' => get_bloginfo( 'name' ),
							'url' => home_url( '/' ),
						),
						array(
							'nom' => __( 'Vídeos', 'noempesquen' ),
							'url' => nep_url_pagina( 'videos', $video['idioma'] ),
						),
						array( 'nom' => $video['titol'] ),
					)
				),
			),
		);
		echo '<script type="application/ld+json">' . str_replace( '</', '<\/', (string) wp_json_encode( $graf, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) ) . "</script>\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON propi, `</` escapat.
	},
	3
);
