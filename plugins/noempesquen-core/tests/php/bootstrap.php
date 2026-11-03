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
