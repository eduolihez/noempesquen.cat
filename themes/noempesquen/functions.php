<?php
/**
 * Tema No em pesquen.
 */

defined( 'ABSPATH' ) || exit;

/*
 * Sense load_theme_textdomain(): els textos del tema comparteixen el domini
 * `noempesquen` i el catàleg del plugin (languages/ del plugin). Registrar aquí
 * una ruta buida per al mateix domini podria tapar-lo (docs/i18n-tema.md).
 */
add_action(
	'after_setup_theme',
	static function () {
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
		// Suggeriment d'idioma: només a la portada i el simulador en castellà (patterns/capcalera.php).
		if ( 'es' === nep_tema_idioma() && ( is_front_page() || 'simulador' === nep_tema_clau_actual() ) ) {
			$js = get_template_directory() . '/assets/suggeriment-idioma.js';
			wp_enqueue_script(
				'noempesquen-suggeriment-idioma',
				get_template_directory_uri() . '/assets/suggeriment-idioma.js',
				array(),
				file_exists( $js ) ? (string) filemtime( $js ) : null,
				array(
					'in_footer' => true,
					'strategy'  => 'defer',
				)
			);
		}
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

/**
 * Pàgines del web amb el slug de cada idioma (les catalanes són filles de `/ca/`).
 * La font és `nep_pagines()` del plugin; la llista d'aquí només és la reserva si
 * el plugin no està actiu.
 *
 * @return array<string, array{es: string, ca: string}>
 */
function nep_tema_pagines(): array {
	if ( function_exists( 'nep_pagines' ) ) {
		return nep_pagines();
	}
	return array(
		'inici'        => array(
			'es' => '',
			'ca' => '',
		),
		'simulador'    => array(
			'es' => 'simulador',
			'ca' => 'simulador',
		),
		'com-funciona' => array(
			'es' => 'como-funciona',
			'ca' => 'com-funciona',
		),
		'missions'     => array(
			'es' => 'misiones',
			'ca' => 'missions',
		),
		'compte'       => array(
			'es' => 'cuenta',
			'ca' => 'compte',
		),
		'contacte'     => array(
			'es' => 'contacto',
			'ca' => 'contacte',
		),
		'projecte'     => array(
			'es' => 'sobre-el-proyecto',
			'ca' => 'sobre-el-projecte',
		),
	);
}

/**
 * Idioma de la petició (`es`|`ca`); `es` si el plugin no hi és.
 *
 * @return string
 */
function nep_tema_idioma(): string {
	return function_exists( 'nep_idioma_actual' ) ? nep_idioma_actual() : 'es';
}

/**
 * URL d'una pàgina del web en un idioma.
 *
 * @param string      $clau   Clau de nep_tema_pagines().
 * @param string|null $idioma `es`|`ca`; per defecte, el de la petició.
 * @param string      $ancora Àncora sense `#` (opcional).
 * @return string
 */
function nep_tema_url( string $clau, ?string $idioma = null, string $ancora = '' ): string {
	$idioma  = 'ca' === $idioma || 'es' === $idioma ? $idioma : nep_tema_idioma();
	$pagines = nep_tema_pagines();
	$slug    = $pagines[ $clau ][ $idioma ] ?? '';
	$ruta    = '' === $slug ? '/' : '/' . $slug . '/';
	if ( function_exists( 'nep_url' ) ) {
		$url = nep_url( $ruta, $idioma );
	} else {
		$url = home_url( 'ca' === $idioma ? '/ca' . $ruta : $ruta );
	}
	return '' === $ancora ? $url : $url . '#' . $ancora;
}

/**
 * Clau de la pàgina actual (la portada i `/ca/` són `inici`; les desconegudes, també).
 *
 * @return string
 */
function nep_tema_clau_actual(): string {
	if ( is_front_page() ) {
		return 'inici';
	}
	$objecte = get_queried_object();
	if ( ! $objecte instanceof WP_Post || 'page' !== $objecte->post_type ) {
		return 'inici';
	}
	foreach ( nep_tema_pagines() as $clau => $slugs ) {
		if ( in_array( $objecte->post_name, $slugs, true ) ) {
			return $clau;
		}
	}
	return 'inici';
}

/*
 * Un sol enllaç «Salta al contingut»: el del tema (patterns/capcalera.php, #contingut).
 * Es treu el del nucli per a temes de blocs (wp_footer fins a 6.3, wp_enqueue_scripts
 * des de 6.4), que quedava duplicat al Tab.
 */
remove_action( 'wp_footer', 'the_block_template_skip_link' );
remove_action( 'wp_enqueue_scripts', 'wp_enqueue_block_template_skip_link' );

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
