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
