<?php
/**
 * Vídeos: subtítols VTT a la biblioteca i dades dels blocs `noempesquen/video`
 * i `noempesquen/galeria-videos` (adjunts, missió enllaçada, filles de `videos`).
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/video-nucli.php';

/*
 * WP core ja accepta `.vtt` a upload_mimes (comprovat a wp-env, WP 7.1); només cal el reconeixement per contingut.
 */
// finfo veu un .vtt com a text/plain: si WP no l'ha reconegut, s'accepta com a text/vtt.
add_filter(
	'wp_check_filetype_and_ext',
	static function ( $dades, $fitxer, $nom ) {
		unset( $fitxer );
		if ( ! is_array( $dades ) || ! empty( $dades['ext'] ) || ! is_string( $nom ) || ! current_user_can( 'upload_files' ) ) {
			return $dades;
		}
		if ( 'vtt' === strtolower( pathinfo( $nom, PATHINFO_EXTENSION ) ) ) {
			$dades['ext']  = 'vtt';
			$dades['type'] = 'text/vtt';
		}
		return $dades;
	},
	10,
	3
);

/**
 * URL d'un adjunt si existeix i el seu MIME comença pel prefix esperat; si no, ''.
 *
 * @param mixed  $id     Id de l'adjunt (atribut del bloc).
 * @param string $prefix Prefix MIME (`video/mp4`, `image/`, `text/vtt`).
 * @return string
 */
function nep_video_url_adjunt( $id, string $prefix ): string {
	$id = is_numeric( $id ) ? (int) $id : 0;
	if ( $id <= 0 || 'attachment' !== get_post_type( $id ) ) {
		return '';
	}
	if ( ! str_starts_with( (string) get_post_mime_type( $id ), $prefix ) ) {
		return '';
	}
	$url = wp_get_attachment_url( $id );
	return is_string( $url ) ? $url : '';
}

/**
 * Durada del bloc: l'atribut o, si no n'hi ha, la que WP llegeix del MP4.
 *
 * @param array $atributs Atributs del bloc.
 * @return int Segons (0 si no se sap).
 */
function nep_video_durada( array $atributs ): int {
	$segons = nep_video_segons( $atributs['durada'] ?? 0 );
	if ( $segons > 0 || empty( $atributs['video'] ) || ! is_numeric( $atributs['video'] ) ) {
		return $segons;
	}
	$meta = wp_get_attachment_metadata( (int) $atributs['video'] );
	return is_array( $meta ) ? nep_video_segons( $meta['length'] ?? 0 ) : 0;
}

/**
 * Enllaç al simulador amb el títol de la missió, si l'id és d'una missió inclosa.
 *
 * @param mixed  $id     Id de la missió (atribut `missio`).
 * @param string $idioma `es`|`ca`.
 * @return array{url: string, titol: string}|null
 */
function nep_video_missio( $id, string $idioma ): ?array {
	// Primer la llista blanca: l'atribut no entra mai en una ruta sense validar.
	$id = nep_video_missio_valida( $id, nep_ids_missions_incloses( $idioma ) );
	if ( null === $id ) {
		return null;
	}
	$titol = '';
	foreach ( nep_fitxers_missions_incloses( nep_carpeta_missions( NEP_PATH . 'missions/', $idioma ) ) as $fitxer ) {
		$guio = nep_descodifica_guio( (string) file_get_contents( $fitxer ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Fitxer local del plugin.
		if ( $guio && ( $guio['id'] ?? null ) === $id && is_string( $guio['titol'] ?? null ) ) {
			$titol = $guio['titol'];
			break;
		}
	}
	if ( '' === $titol ) {
		return null;
	}
	return array(
		'url'   => nep_url_pagina( 'simulador', $idioma ),
		'titol' => $titol,
	);
}

/**
 * HTML del bloc `noempesquen/video` (render.php).
 *
 * @param array  $atributs Atributs del bloc.
 * @param string $contingut Blocs interiors renderitzats (transcripció).
 * @return string
 */
function nep_video_render( array $atributs, string $contingut ): string {
	$idioma = nep_idioma_actual();
	return nep_video_html(
		array(
			'atributs'     => get_block_wrapper_attributes( array( 'class' => 'nep-video' ) ),
			'video'        => nep_video_url_adjunt( $atributs['video'] ?? 0, 'video/mp4' ),
			'poster'       => nep_video_url_adjunt( $atributs['poster'] ?? 0, 'image/' ),
			'pistes'       => nep_video_pistes(
				array(
					'ca' => nep_video_url_adjunt( $atributs['subtitolsCa'] ?? 0, 'text/vtt' ),
					'es' => nep_video_url_adjunt( $atributs['subtitolsEs'] ?? 0, 'text/vtt' ),
				),
				$idioma
			),
			'durada'       => nep_video_durada( $atributs ),
			'tema'         => is_string( $atributs['tema'] ?? null ) ? $atributs['tema'] : '',
			'transcripcio' => $contingut,
			'missio'       => nep_video_missio( $atributs['missio'] ?? '', $idioma ),
		)
	);
}

/**
 * HTML del bloc `noempesquen/galeria-videos`: filles publicades de `videos` de l'idioma actual,
 * per `menu_order` i després de la més nova a la més antiga.
 *
 * @return string
 */
function nep_video_render_galeria(): string {
	$targetes = array();
	$pare     = nep_seo_post( 'videos', nep_idioma_actual() );
	$fills    = $pare ? get_posts(
		array(
			'post_type'      => 'page',
			'post_status'    => 'publish',
			'post_parent'    => (int) $pare->ID,
			'posts_per_page' => 100,
			'orderby'        => array(
				'menu_order' => 'ASC',
				'date'       => 'DESC',
			),
		)
	) : array();
	foreach ( $fills as $post ) {
		$atributs   = nep_video_atributs_blocs( parse_blocks( $post->post_content ) ) ?? array();
		$poster     = nep_video_segons( $atributs['poster'] ?? 0 );
		$poster_url = $poster && str_starts_with( (string) get_post_mime_type( $poster ), 'image/' )
			? wp_get_attachment_image_url( $poster, 'medium_large' ) : '';
		$targetes[] = array(
			'url'    => get_permalink( $post ),
			'titol'  => get_the_title( $post ),
			'poster' => is_string( $poster_url ) ? $poster_url : '',
			'durada' => nep_video_durada( $atributs ),
			'tema'   => is_string( $atributs['tema'] ?? null ) ? $atributs['tema'] : '',
		);
	}
	return nep_video_html_galeria( $targetes, get_block_wrapper_attributes( array( 'class' => 'nep-galeria-videos' ) ) );
}
