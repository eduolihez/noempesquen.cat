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
		$pagina = nep_seo_pagina_actual();
		if ( ! $pagina ) {
			return;
		}
		$alternates = nep_seo_alternates( nep_seo_urls( $pagina['clau'] ) );
		foreach ( $alternates as $enllac ) {
			printf( '<link rel="alternate" hreflang="%s" href="%s">' . "\n", esc_attr( $enllac['hreflang'] ), esc_url( $enllac['href'] ) );
		}
		if ( ! defined( 'THE_SEO_FRAMEWORK_VERSION' ) ) {
			printf( '<meta property="og:locale" content="%s">' . "\n", esc_attr( nep_seo_og_locale( $pagina['idioma'] ) ) );
		}
		if ( $alternates ) {
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
 * (`/wp-sitemap-es-1.xml`, `/wp-sitemap-ca-1.xml`). The SEO Framework, si hi és,
 * desactiva el del nucli quan fa servir el seu (un sol fitxer sense idiomes): aquí es
 * força el del nucli, que TSF continua filtrant i anunciant a `robots.txt`.
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
	return array_values( array_unique( $ids ) );
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
