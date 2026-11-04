<?php
/**
 * SEO multilingüe: `hreflang`, `og:locale:alternate` i un sitemap per idioma.
 *
 * El canonical, el títol, `og:locale` i el JSON-LD (amb `inLanguage`) ja els posa
 * The SEO Framework (o, sense ell, `rel_canonical` del nucli): aquí no es dupliquen.
 * Ho explica `docs/despliegue-i18n.md` («SEO»).
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/seo-idioma-nucli.php';

/**
 * Pàgina publicada del mapa en un idioma (`inici` ES és la portada; `inici` CA, la pàgina `ca`).
 *
 * @param string $clau   Clau de nep_pagines().
 * @param string $idioma `es`|`ca`.
 * @return WP_Post|null
 */
function nep_seo_post( string $clau, string $idioma ): ?WP_Post {
	$pagines = nep_pagines();
	if ( ! isset( $pagines[ $clau ] ) ) {
		return null;
	}
	if ( 'inici' === $clau ) {
		$post = 'ca' === $idioma ? get_page_by_path( 'ca' ) : get_post( (int) get_option( 'page_on_front' ) );
	} else {
		$slug = $pagines[ $clau ][ $idioma ];
		$post = get_page_by_path( 'ca' === $idioma ? 'ca/' . $slug : $slug );
		// Una pàgina ES ha de ser a l'arrel (no una filla de `ca` amb el mateix slug).
		if ( $post instanceof WP_Post && 'es' === $idioma && 0 !== (int) $post->post_parent ) {
			$post = null;
		}
	}
	return $post instanceof WP_Post && 'page' === $post->post_type && 'publish' === $post->post_status ? $post : null;
}

/**
 * URLs de les pàgines equivalents (només les que existeixen).
 *
 * @param string $clau Clau de nep_pagines().
 * @return array<string, string> Idioma → URL absoluta.
 */
function nep_seo_urls( string $clau ): array {
	$urls = array();
	foreach ( nep_idiomes() as $idioma ) {
		if ( nep_seo_post( $clau, $idioma ) ) {
			$urls[ $idioma ] = nep_url_pagina( $clau, $idioma );
		}
	}
	return $urls;
}

/**
 * Filla publicada de la pàgina `videos` d'un idioma (`/videos/<fill>/` o `/ca/videos/<fill>/`).
 *
 * @param string $fill   Slug de la filla.
 * @param string $idioma `es`|`ca`.
 * @return WP_Post|null
 */
function nep_seo_post_fill( string $fill, string $idioma ): ?WP_Post {
	$pare = nep_seo_post( 'videos', $idioma );
	if ( ! $pare || '' === $fill ) {
		return null;
	}
	$post = get_page_by_path( ltrim( nep_seo_ruta_fill( $fill, $idioma ), '/' ) );
	return $post instanceof WP_Post && 'page' === $post->post_type && 'publish' === $post->post_status
		&& (int) $post->post_parent === (int) $pare->ID ? $post : null;
}

/**
 * Filla de `videos` que és una pàgina (`fill` i `idioma`), o null.
 *
 * @param WP_Post $post Pàgina.
 * @return array{clau: string, fill: string, idioma: string}|null
 */
function nep_seo_fill_post( WP_Post $post ): ?array {
	if ( 'page' !== $post->post_type || ! $post->post_parent ) {
		return null;
	}
	$ruta = get_page_uri( $post );
	$fill = is_string( $ruta ) ? nep_seo_fill( $ruta ) : null;
	if ( ! $fill ) {
		return null;
	}
	$fill['idioma'] = nep_idioma_de_ruta( '/' . $ruta );
	return $fill;
}

/**
 * Hreflang d'una filla de `videos`: URLs de la filla i de la parella (si està publicada).
 *
 * @param WP_Post $post Pàgina filla.
 * @return array<int, array{hreflang: string, href: string}>
 */
function nep_seo_alternates_post_fill( WP_Post $post ): array {
	$fill = nep_seo_fill_post( $post );
	if ( ! $fill ) {
		return array();
	}
	$urls = array();
	foreach ( nep_idiomes() as $idioma ) {
		$germana = nep_seo_post_fill( $fill['fill'], $idioma );
		if ( $germana ) {
			$urls[ $idioma ] = (string) get_permalink( $germana );
		}
	}
	return nep_seo_alternates_fill( $urls, $fill['idioma'] );
}

/**
 * URL de la pàgina actual en un altre idioma quan és una filla de `videos`: la parella si
 * està publicada; si no, la pàgina `videos` d'aquell idioma. Null si no és una filla.
 *
 * @param string $idioma `es`|`ca`.
 * @return string|null
 */
function nep_seo_url_fill_actual( string $idioma ): ?string {
	$post = is_page() ? get_queried_object() : null;
	$fill = $post instanceof WP_Post ? nep_seo_fill_post( $post ) : null;
	if ( ! $fill ) {
		return null;
	}
	$parella = nep_seo_post_fill( $fill['fill'], $idioma );
	return $parella ? (string) get_permalink( $parella ) : nep_url_pagina( 'videos', $idioma );
}

/**
 * Clau i idioma de la petició actual, o null si no és una pàgina del mapa.
 *
 * @return array{clau: string, idioma: string}|null
 */
function nep_seo_pagina_actual(): ?array {
	if ( is_front_page() && 'page' === get_option( 'show_on_front' ) ) {
		return nep_seo_pagina( '', '', true );
	}
	if ( ! is_page() ) {
		return null;
	}
	$post = get_queried_object();
	if ( ! $post instanceof WP_Post ) {
		return null;
	}
	$pare = $post->post_parent ? (string) get_post_field( 'post_name', $post->post_parent ) : '';
	return nep_seo_pagina( $post->post_name, $pare, false );
}

/**
 * `<link rel="alternate" hreflang>` i `og:locale:alternate` a les pàgines amb equivalent.
 * Sense The SEO Framework, també `og:locale`.
 */
add_action(
	'wp_head',
	static function () {
		$objecte = is_page() ? get_queried_object() : null;
		$fill    = $objecte instanceof WP_Post ? nep_seo_fill_post( $objecte ) : null;
		if ( $fill ) {
			// Filla de `videos`: sense parella, només el seu hreflang (i cap og:locale:alternate).
			$pagina     = $fill;
			$alternates = nep_seo_alternates_post_fill( $objecte );
			$parella    = count( $alternates ) > 1;
		} else {
			$pagina = nep_seo_pagina_actual();
			if ( ! $pagina ) {
				return;
			}
			$alternates = nep_seo_alternates( nep_seo_urls( $pagina['clau'] ) );
			$parella    = (bool) $alternates;
		}
		foreach ( $alternates as $enllac ) {
			printf( '<link rel="alternate" hreflang="%s" href="%s">' . "\n", esc_attr( $enllac['hreflang'] ), esc_url( $enllac['href'] ) );
		}
		if ( ! defined( 'THE_SEO_FRAMEWORK_VERSION' ) ) {
			printf( '<meta property="og:locale" content="%s">' . "\n", esc_attr( nep_seo_og_locale( $pagina['idioma'] ) ) );
		}
		if ( $parella ) {
			foreach ( nep_idiomes() as $idioma ) {
				if ( $idioma !== $pagina['idioma'] ) {
					printf( '<meta property="og:locale:alternate" content="%s">' . "\n", esc_attr( nep_seo_og_locale( $idioma ) ) );
				}
			}
		}
	},
	2
);

/*
 * Sitemaps: el del nucli de WordPress, amb un proveïdor per idioma
 * (`/wp-sitemap-es-1.xml`, `/wp-sitemap-ca-1.xml`). The SEO Framework (TSF), si hi és,
 * té el seu propi sitemap (un sol fitxer, sense idiomes) i desactiva el del nucli;
 * aquí es força `sitemaps_output = 0` perquè TSF no el generi i quedi el del nucli.
 * L'anunci a `robots.txt` només hi surt si el fitxer és virtual: amb un `robots.txt`
 * físic a l'arrel no hi ha cap línia `Sitemap:` (cal afegir-la a mà).
 */
add_filter(
	'the_seo_framework_get_options',
	static function ( $opcions ) {
		if ( is_array( $opcions ) ) {
			$opcions['sitemaps_output'] = 0;
		}
		return $opcions;
	}
);

/**
 * IDs de les pàgines que van als sitemaps per idioma (o que no hi han d'anar mai:
 * pàgines catalanes antigues que encara són a l'arrel). Es treuen del sitemap de pàgines.
 *
 * @return int[]
 */
function nep_seo_ids_mapa(): array {
	$ids = array();
	foreach ( nep_pagines() as $clau => $slugs ) {
		foreach ( nep_idiomes() as $idioma ) {
			$post = nep_seo_post( $clau, $idioma );
			if ( $post ) {
				$ids[] = (int) $post->ID;
			}
		}
		$antiga = $slugs['ca'] !== $slugs['es'] && '' !== $slugs['ca'] ? get_page_by_path( $slugs['ca'] ) : null;
		if ( $antiga instanceof WP_Post && 0 === (int) $antiga->post_parent ) {
			$ids[] = (int) $antiga->ID;
		}
	}
	foreach ( nep_idiomes() as $idioma ) {
		foreach ( nep_seo_posts_fills( $idioma ) as $post ) {
			$ids[] = (int) $post->ID;
		}
	}
	return array_values( array_unique( $ids ) );
}

/**
 * Filles publicades de la pàgina `videos` d'un idioma (per al sitemap d'aquell idioma).
 *
 * @param string $idioma `es`|`ca`.
 * @return WP_Post[]
 */
function nep_seo_posts_fills( string $idioma ): array {
	$pare = nep_seo_post( 'videos', $idioma );
	if ( ! $pare ) {
		return array();
	}
	return get_posts(
		array(
			'post_type'      => 'page',
			'post_status'    => 'publish',
			'post_parent'    => (int) $pare->ID,
			'has_password'   => false,
			'posts_per_page' => -1,
			'orderby'        => 'menu_order title',
			'order'          => 'ASC',
		)
	);
}

add_filter(
	'wp_sitemaps_posts_query_args',
	static function ( $args, $tipus ) {
		if ( 'page' === $tipus ) {
			$args['post__not_in'] = array_merge( (array) ( $args['post__not_in'] ?? array() ), nep_seo_ids_mapa() );
		}
		return $args;
	},
	10,
	2
);

add_action(
	'wp_sitemaps_init',
	static function () {
		require_once __DIR__ . '/class-nep-sitemap-idioma.php';
		foreach ( nep_idiomes() as $idioma ) {
			wp_register_sitemap_provider( $idioma, new Nep_Sitemap_Idioma( $idioma ) );
		}
	}
);
