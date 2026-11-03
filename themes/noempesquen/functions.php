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

// Pantalla d'entrada a l'administració (/admin) amb l'estil del tema.
add_action(
	'login_enqueue_scripts',
	static function () {
		$ruta = get_template_directory() . '/assets/login.css';
		wp_enqueue_style(
			'noempesquen-login',
			get_template_directory_uri() . '/assets/login.css',
			array(),
			file_exists( $ruta ) ? (string) filemtime( $ruta ) : null
		);
	}
);
add_filter(
	'login_headerurl',
	static function () {
		return home_url( '/' );
	}
);
add_filter(
	'login_headertext',
	static function () {
		return get_bloginfo( 'name' );
	}
);

// Elimina soroll del <head>.
remove_action( 'wp_head', 'wp_generator' );
remove_action( 'wp_head', 'rsd_link' );
remove_action( 'wp_head', 'wlwmanifest_link' );
remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles' );

/**
 * Icona del web: si no n'hi ha cap configurada a l'Aparença, usa la del tema
 * (el mateix peix del logotip). Això també cobreix /favicon.ico, el login i
 * l'administració, que d'altra manera mostrarien el logotip de WordPress.
 */
add_filter(
	'get_site_icon_url',
	static function ( $url ) {
		// Un valor propi (Aparença) es respecta; el logotip per defecte de WordPress no.
		if ( ! empty( $url ) && false === strpos( $url, '/wp-includes/images/' ) ) {
			return $url;
		}
		return get_template_directory_uri() . '/assets/img/favicon-512.png';
	}
);

// Versió vectorial per als navegadors que la accepten (nítida a qualsevol mida).
add_action(
	'wp_head',
	static function () {
		printf(
			'<link rel="icon" href="%s" type="image/svg+xml" sizes="any">' . "\n",
			esc_url( get_template_directory_uri() . '/assets/img/favicon.svg' )
		);
	},
	1
);
