<?php
/**
 * `llms.txt` per idioma (`/llms.txt` i `/ca/llms.txt`), servit sense regles de rewrite:
 * s'atén a `parse_request` si la ruta coincideix. Les URL les construeixen `nep_url_pagina`
 * i els vídeos publicats (sense contrasenya) de cada idioma.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'parse_request',
	static function ( $wp ) {
		$ruta = trim( (string) wp_parse_url( (string) ( $_SERVER['REQUEST_URI'] ?? '' ), PHP_URL_PATH ), '/' ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$base = trim( (string) wp_parse_url( home_url(), PHP_URL_PATH ), '/' );
		if ( '' !== $base && str_starts_with( $ruta, $base . '/' ) ) {
			$ruta = substr( $ruta, strlen( $base ) + 1 );
		}
		if ( 'llms.txt' !== $ruta && 'ca/llms.txt' !== $ruta ) {
			return;
		}
		unset( $wp );
		$idioma = 'ca/llms.txt' === $ruta ? 'ca' : 'es';
		$videos = array();
		foreach ( nep_seo_posts_fills( $idioma ) as $post ) {
			if ( '' === $post->post_password ) {
				$videos[] = array(
					'titol' => wp_strip_all_tags( get_the_title( $post ) ),
					'url'   => (string) get_permalink( $post ),
				);
			}
		}
		$text = nep_llms_text(
			array(
				'nom'           => get_bloginfo( 'name' ),
				'resum'         => __( 'Simulador gratuït d’estafes digitals per aprendre a detectar-les, amb vídeos curts subtitulats.', 'noempesquen' ),
				'videos'        => $videos,
				'url_videos'    => nep_url_pagina( 'videos', $idioma ),
				'url_simulador' => nep_url_pagina( 'simulador', $idioma ),
			)
		);
		status_header( 200 );
		header( 'Content-Type: text/plain; charset=utf-8' );
		header( 'X-Robots-Tag: noindex' );
		echo $text; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Text pla.
		exit;
	}
);
