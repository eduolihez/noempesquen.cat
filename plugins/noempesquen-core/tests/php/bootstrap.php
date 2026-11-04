<?php
/**
 * Arrencada de PHPUnit sense WordPress: només funcions pures.
 *
 * @package noempesquen-core
 */

if ( ! defined( 'ABSPATH' ) ) {
	// Sense això, el `defined( 'ABSPATH' ) || exit;` del codi provat aturaria PHPUnit en silenci.
	define( 'ABSPATH', __DIR__ . '/' );
}

require_once dirname( __DIR__, 2 ) . '/includes/validacio-missio.php';
require_once dirname( __DIR__, 2 ) . '/includes/estadistiques.php';
require_once dirname( __DIR__, 2 ) . '/includes/comptes-nucli.php';
require_once dirname( __DIR__, 2 ) . '/includes/contacte-nucli.php';
require_once dirname( __DIR__, 2 ) . '/includes/acces-admin-nucli.php';
require_once dirname( __DIR__, 2 ) . '/includes/idioma-nucli.php';
require_once dirname( __DIR__, 2 ) . '/includes/seo-idioma-nucli.php';
require_once dirname( __DIR__, 2 ) . '/includes/video-nucli.php';

if ( ! function_exists( 'esc_html' ) ) {
	/**
	 * Escapament mínim sense WordPress (proves).
	 *
	 * @param string $text Text.
	 * @return string
	 */
	function esc_html( $text ) {
		return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8' );
	}
}

if ( ! function_exists( 'esc_attr' ) ) {
	/**
	 * Escapament mínim d'atributs sense WordPress (proves).
	 *
	 * @param string $text Text.
	 * @return string
	 */
	function esc_attr( $text ) {
		return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8' );
	}
}

if ( ! function_exists( 'esc_url' ) ) {
	/**
	 * URL mínima sense WordPress (proves): només http(s) o relativa; la resta, buida.
	 *
	 * @param string $url URL.
	 * @return string
	 */
	function esc_url( $url ) {
		$url = trim( (string) $url );
		if ( '' === $url || ( preg_match( '/^[a-z][a-z0-9+.-]*:/i', $url ) && ! preg_match( '#^https?://#i', $url ) ) ) {
			return '';
		}
		return htmlspecialchars( $url, ENT_QUOTES, 'UTF-8' );
	}
}

if ( ! function_exists( 'wp_kses_post' ) ) {
	/**
	 * Filtre mínim sense WordPress (proves): treu etiquetes no permeses.
	 *
	 * @param string $html HTML.
	 * @return string
	 */
	function wp_kses_post( $html ) {
		$html = preg_replace( '#<(script|style)\b[^>]*>.*?</\1>#is', '', (string) $html );
		return strip_tags( $html, '<p><ul><ol><li><h3><h4><strong><em><a><br>' );
	}
}

if ( ! function_exists( '__' ) ) {
	/**
	 * Sense WordPress, la traducció és la identitat (el català és l'msgid).
	 *
	 * @param string $text    Text.
	 * @param string $domini  Domini.
	 * @return string
	 */
	function __( $text, $domini = 'default' ) { // phpcs:ignore Universal.NamingConventions.NoReservedKeywordParameterNames
		return $text;
	}
}
