<?php
/**
 * Galeria de vídeos: filles publicades de la pàgina `videos` de l'idioma actual.
 *
 * @var array $attributes
 */

defined( 'ABSPATH' ) || exit;

echo nep_video_render_galeria(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escapat a nep_video_html_galeria().
