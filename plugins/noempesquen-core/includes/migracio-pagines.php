<?php
/**
 * Migració de pàgines a ES (arrel) + CA (filles de `/ca/`). Idempotent i versionada
 * (opció `nep_versio_pagines`), sense WP-CLI: corre a `init` quan la versió desada
 * no coincideix (també després de pujar el zip) i a l'activació.
 *
 * - Les pàgines catalanes antigues a l'arrel es reparenten a `ca` conservant ID i slug.
 * - El simulador (mateix slug als dos idiomes) es queda a l'arrel com a ES i se'n crea
 *   la còpia `ca/simulador`.
 * - Una pàgina que ja existeix al seu camí no es toca (contingut editat a mà).
 * - Els 301 de les URLs velles són a `.htaccess`, no aquí.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

/** Versió de la migració de pàgines (opció `nep_versio_pagines`). */
const NEP_VERSIO_PAGINES = 1;

/**
 * Títol i contingut de cada pàgina per idioma. El contingut només cal on la plantilla
 * pinta `post-content` (simulador, compte); la resta surt dels patterns del tema
 * (contacte inclou el bloc al pattern).
 *
 * @return array<string, array{titol: array{es: string, ca: string}, contingut: string}>
 */
function nep_pagines_dades(): array {
	return array(
		'inici'        => array(
			'titol'     => array(
				'es' => 'Inicio',
				'ca' => 'Inici',
			),
			'contingut' => '',
		),
		'simulador'    => array(
			'titol'     => array(
				'es' => 'Simulador',
				'ca' => 'Simulador',
			),
			'contingut' => '<!-- wp:noempesquen/simulador {"align":"wide"} /-->',
		),
		'com-funciona' => array(
			'titol'     => array(
				'es' => 'Cómo funciona',
				'ca' => 'Com funciona',
			),
			'contingut' => '',
		),
		'missions'     => array(
			'titol'     => array(
				'es' => 'Misiones',
				'ca' => 'Missions',
			),
			'contingut' => '',
		),
		'compte'       => array(
			'titol'     => array(
				'es' => 'Mi cuenta',
				'ca' => 'El meu compte',
			),
			'contingut' => '<!-- wp:noempesquen/compte /-->',
		),
		'contacte'     => array(
			'titol'     => array(
				'es' => 'Contacto',
				'ca' => 'Contacte',
			),
			'contingut' => '',
		),
		'projecte'     => array(
			'titol'     => array(
				'es' => 'Sobre el proyecto',
				'ca' => 'Sobre el projecte',
			),
			'contingut' => '',
		),
	);
}

/**
 * Crea una pàgina publicada.
 *
 * @param string $slug      Slug.
 * @param string $titol     Títol.
 * @param string $contingut Contingut de blocs.
 * @param int    $pare      ID de la pàgina pare (0 = arrel).
 * @return int ID o 0 si ha fallat.
 */
function nep_crea_pagina( string $slug, string $titol, string $contingut, int $pare ): int {
	$id = wp_insert_post(
		wp_slash(
			array(
				'post_type'    => 'page',
				'post_status'  => 'publish',
				'post_name'    => $slug,
				'post_title'   => $titol,
				'post_content' => $contingut,
				'post_parent'  => $pare,
				'post_author'  => 0,
			)
		),
		true
	);
	return is_wp_error( $id ) ? 0 : (int) $id;
}

/**
 * Migra les pàgines a l'estructura ES/CA. Retorna el registre d'accions (només slugs).
 *
 * @return string[]
 */
function nep_migra_pagines(): array {
	$registre = array();
	$dades    = nep_pagines_dades();

	// a) Pàgina pare `ca` (plantilla `page-ca.html` pel slug).
	$pare = get_page_by_path( 'ca' );
	if ( ! $pare ) {
		$id_pare = nep_crea_pagina( 'ca', $dades['inici']['titol']['ca'], '', 0 );
		if ( ! $id_pare || 'ca' !== get_post_field( 'post_name', $id_pare ) ) {
			$registre[] = 'error:ca';
			return $registre;
		}
		$registre[] = 'creada:ca';
	} else {
		$id_pare = (int) $pare->ID;
	}

	foreach ( nep_pagines() as $clau => $slugs ) {
		if ( 'inici' === $clau ) {
			continue;
		}
		$titols    = $dades[ $clau ]['titol'];
		$contingut = $dades[ $clau ]['contingut'];

		// b) Catalana: filla de `ca`. Si n'hi ha una d'antiga a l'arrel (i no és la ES), es reparenta.
		$cami_ca = 'ca/' . $slugs['ca'];
		if ( ! get_page_by_path( $cami_ca ) ) {
			$antiga = $slugs['ca'] !== $slugs['es'] ? get_page_by_path( $slugs['ca'] ) : null;
			if ( $antiga && 0 === (int) $antiga->post_parent ) {
				$ok         = wp_update_post(
					array(
						'ID'          => $antiga->ID,
						'post_parent' => $id_pare,
					),
					true
				);
				$registre[] = ( is_wp_error( $ok ) ? 'error:' : 'reparentada:' ) . $cami_ca;
			} else {
				$id         = nep_crea_pagina( $slugs['ca'], $titols['ca'], $contingut, $id_pare );
				$registre[] = ( $id ? 'creada:' : 'error:' ) . $cami_ca;
			}
		} elseif ( $slugs['ca'] !== $slugs['es'] && get_page_by_path( $slugs['ca'] ) ) {
			$registre[] = 'duplicada:' . $slugs['ca'];
		}

		// c) Castellana a l'arrel, només si no existeix.
		if ( ! get_page_by_path( $slugs['es'] ) ) {
			$id         = nep_crea_pagina( $slugs['es'], $titols['es'], $contingut, 0 );
			$registre[] = ( $id ? 'creada:' : 'error:' ) . $slugs['es'];
		}
	}

	// d) Portada ES: pàgina `inicio`, només si el lloc no té ja una portada estàtica vàlida.
	$portada = (int) get_option( 'page_on_front' );
	if ( 'page' !== get_option( 'show_on_front' ) || ! $portada || ! get_post( $portada ) || $portada === $id_pare ) {
		$inicio = get_page_by_path( 'inicio' );
		$id     = $inicio ? (int) $inicio->ID : nep_crea_pagina( 'inicio', $dades['inici']['titol']['es'], '', 0 );
		if ( $id ) {
			update_option( 'page_on_front', $id );
			update_option( 'show_on_front', 'page' );
			$registre[] = 'portada:inicio';
		} else {
			$registre[] = 'error:inicio';
		}
	}

	return $registre;
}

/**
 * Executa la migració si la versió desada no és l'actual, amb un candau perquè dues
 * peticions simultànies no dupliquin pàgines. Fa flush de rewrites i buida la
 * memòria cau de patterns del tema.
 */
function nep_actualitza_pagines(): void {
	if ( (int) get_option( 'nep_versio_pagines', 0 ) >= NEP_VERSIO_PAGINES ) {
		return;
	}
	$candau = 'nep_migracio_pagines_bloqueig';
	if ( ! nep_pren_candau( $candau, 300 ) ) {
		return;
	}
	// Sense kses: si migra una petició anònima, reparentar no ha de filtrar el contingut existent.
	kses_remove_filters();
	try {
		$registre = nep_migra_pagines();
		$errors   = array_filter( $registre, static fn( $r ) => str_starts_with( $r, 'error:' ) );
		if ( ! $errors ) {
			update_option( 'nep_versio_pagines', NEP_VERSIO_PAGINES );
		}
		flush_rewrite_rules( false );
		$tema = wp_get_theme();
		if ( method_exists( $tema, 'delete_pattern_cache' ) ) {
			$tema->delete_pattern_cache();
		}
		if ( $registre ) {
			error_log( '[noempesquen] migració de pàgines: ' . implode( ', ', $registre ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Només slugs.
		}
	} finally {
		kses_init();
		delete_option( $candau );
	}
}

/**
 * Pren un candau atòmic a la taula d'opcions (`add_option` fa `ON DUPLICATE KEY
 * UPDATE` i no serveix). Un candau més vell que `$caducitat` segons es pot robar.
 *
 * @param string $nom       Nom de l'opció.
 * @param int    $caducitat Segons.
 * @return bool Si s'ha pres.
 */
function nep_pren_candau( string $nom, int $caducitat ): bool {
	global $wpdb;
	$ara   = (string) time();
	$files = $wpdb->query( $wpdb->prepare( "INSERT IGNORE INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, %s, 'off')", $nom, $ara ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
	if ( 1 === $files ) {
		wp_cache_delete( $nom, 'options' );
		wp_cache_delete( 'notoptions', 'options' );
		return true;
	}
	$vell = $wpdb->get_var( $wpdb->prepare( "SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", $nom ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
	if ( null === $vell || time() - (int) $vell < $caducitat ) {
		return false;
	}
	$files = $wpdb->query( $wpdb->prepare( "UPDATE {$wpdb->options} SET option_value = %s WHERE option_name = %s AND option_value = %s", $ara, $nom, $vell ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
	wp_cache_delete( $nom, 'options' );
	return 1 === $files;
}
add_action( 'init', 'nep_actualitza_pagines', 99 );

/*
 * Sense endevinar URLs als 404 de `/ca/…`: si una pàgina catalana encara no existeix,
 * `redirect_guess_404_permalink` podria enviar a la URL vella de l'arrel i el 301 de
 * `.htaccess` la tornaria a `/ca/…` (bucle).
 */
add_filter(
	'do_redirect_guess_404_permalink',
	static function ( $endevina ) {
		$uri  = isset( $_SERVER['REQUEST_URI'] ) ? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) : '/'; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Només es compara.
		$base = (string) wp_parse_url( home_url(), PHP_URL_PATH );
		return 'ca' === nep_idioma_de_ruta( $uri, $base ) ? false : $endevina;
	}
);
