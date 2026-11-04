<?php
/**
 * Proveïdor de sitemap del nucli per a les pàgines d'un idioma (`/wp-sitemap-<idioma>-1.xml`).
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Llista les pàgines de nep_pagines() que existeixen en un idioma.
 */
class Nep_Sitemap_Idioma extends WP_Sitemaps_Provider {

	/**
	 * Idioma del proveïdor.
	 *
	 * @var string
	 */
	private string $idioma;

	/**
	 * Constructor.
	 *
	 * @param string $idioma `es`|`ca`.
	 */
	public function __construct( string $idioma ) {
		$this->idioma      = $idioma;
		$this->name        = $idioma;
		$this->object_type = 'page';
	}

	/**
	 * URLs del sitemap (una sola pàgina).
	 *
	 * @param int    $page_num       Número de pàgina.
	 * @param string $object_subtype Sense ús.
	 * @return array<int, array{loc: string, lastmod?: string}>
	 */
	public function get_url_list( $page_num, $object_subtype = '' ) {
		if ( 1 !== (int) $page_num ) {
			return array();
		}
		$llista = array();
		foreach ( array_keys( nep_pagines() ) as $clau ) {
			$post = nep_seo_post( $clau, $this->idioma );
			if ( ! $post ) {
				continue;
			}
			$llista[] = array(
				'loc'     => nep_url_pagina( $clau, $this->idioma ),
				'lastmod' => wp_date( DATE_W3C, strtotime( $post->post_modified_gmt . ' UTC' ) ),
			);
		}
		// Filles de `videos` (un vídeo per pàgina).
		foreach ( nep_seo_posts_fills( $this->idioma ) as $post ) {
			$llista[] = array(
				'loc'     => (string) get_permalink( $post ),
				'lastmod' => wp_date( DATE_W3C, strtotime( $post->post_modified_gmt . ' UTC' ) ),
			);
		}
		return $llista;
	}

	/**
	 * Nombre de pàgines del sitemap.
	 *
	 * @param string $object_subtype Sense ús.
	 * @return int
	 */
	public function get_max_num_pages( $object_subtype = '' ) {
		return 1;
	}
}
