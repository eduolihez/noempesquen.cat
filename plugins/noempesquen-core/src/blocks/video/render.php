<?php
/**
 * Vídeo amb subtítols, transcripció (blocs interiors) i enllaç a la missió.
 * Sense vídeo vàlid no es pinta res a la pàgina pública.
 *
 * @var array  $attributes
 * @var string $content
 */

defined( 'ABSPATH' ) || exit;

echo nep_video_render( is_array( $attributes ) ? $attributes : array(), (string) $content ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escapat a nep_video_html().
