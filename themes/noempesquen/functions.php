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

add_action(
	'wp_enqueue_scripts',
	static function () {
		$ruta = get_template_directory() . '/assets/tema.css';
		wp_enqueue_style(
			'noempesquen-tema',
			get_template_directory_uri() . '/assets/tema.css',
			array(),
			file_exists( $ruta ) ? (string) filemtime( $ruta ) : null
		);
	}
);

// Elimina soroll del <head>.
remove_action( 'wp_head', 'wp_generator' );
remove_action( 'wp_head', 'rsd_link' );
remove_action( 'wp_head', 'wlwmanifest_link' );
remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles' );
