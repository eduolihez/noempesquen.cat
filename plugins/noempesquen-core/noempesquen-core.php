<?php
/**
 * Plugin Name:       No em pesquen – Nucli
 * Description:       Simulador, missions i comprovador del projecte noempesquen.cat.
 * Version:           0.1.0
 * Requires at least: 6.6
 * Requires PHP:      8.1
 * Author:            Eduardo Olivares Hernández
 * License:           GPL-2.0-or-later
 * Text Domain:       noempesquen
 * Domain Path:       /languages
 */

defined( 'ABSPATH' ) || exit;

define( 'NEP_VERSION', '0.1.0' );
define( 'NEP_DB_VERSION', '4' );
define( 'NEP_PATH', plugin_dir_path( __FILE__ ) );
define( 'NEP_URL', plugin_dir_url( __FILE__ ) );

require_once NEP_PATH . 'includes/capacitats.php';
require_once NEP_PATH . 'includes/validacio-missio.php';
require_once NEP_PATH . 'includes/cpt-missio.php';
require_once NEP_PATH . 'includes/editor-missio.php';
require_once NEP_PATH . 'includes/rest.php';
require_once NEP_PATH . 'includes/estadistiques.php';
require_once NEP_PATH . 'includes/comptes-nucli.php';
require_once NEP_PATH . 'includes/comptes.php';
require_once NEP_PATH . 'includes/comptes-privacitat.php';
require_once NEP_PATH . 'includes/admin-estadistiques.php';
require_once NEP_PATH . 'includes/cli.php';

register_activation_hook( __FILE__, 'nep_actualitza' );

/**
 * Registra els blocs compilats a /build.
 */
add_action(
	'init',
	static function () {
		foreach ( array( 'simulador', 'compte' ) as $bloc ) {
			$block_dir = NEP_PATH . 'build/blocks/' . $bloc;
			if ( file_exists( $block_dir . '/block.json' ) ) {
				register_block_type( $block_dir );
			}
		}
	}
);
