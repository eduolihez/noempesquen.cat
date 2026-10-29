<?php
/**
 * Tema No em pesquen.
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'after_setup_theme',
	static function () {
		load_theme_textdomain( 'noempesquen', get_template_directory() . '/languages' );
		add_theme_support( 'wp-block-styles' );
		add_theme_support( 'editor-styles' );
	}
);

// Elimina soroll del <head>.
remove_action( 'wp_head', 'wp_generator' );
remove_action( 'wp_head', 'rsd_link' );
remove_action( 'wp_head', 'wlwmanifest_link' );
remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles' );
