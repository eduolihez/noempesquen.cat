<?php
/**
 * Integració: migració de pàgines ES/CA (T09c). S'inclou des d'integracio.php.
 *
 * Parteix de les pàgines catalanes antigues a l'arrel, migra, torna a migrar
 * (mateix estat) i comprova que no es trepitja una pàgina editada a mà. Deixa
 * l'entorn de proves amb l'estructura migrada (és l'estat vàlid).
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

$nep_slugs_pagines = array( 'ca', 'inicio' );
foreach ( nep_pagines() as $nep_slugs_p ) {
	$nep_slugs_pagines = array_merge( $nep_slugs_pagines, array_filter( array_values( $nep_slugs_p ) ) );
}
$nep_neteja_pagines = static function () use ( $nep_slugs_pagines ): void {
	$ids = get_posts(
		array(
			'post_type'      => 'page',
			'post_status'    => 'any',
			'post_name__in'  => array_unique( $nep_slugs_pagines ),
			'posts_per_page' => -1,
			'fields'         => 'ids',
		)
	);
	foreach ( $ids as $id ) {
		wp_delete_post( $id, true );
	}
};

$nep_estat_pagines = static function (): array {
	$estat = array();
	foreach ( get_posts(
		array(
			'post_type'      => 'page',
			'post_status'    => 'any',
			'posts_per_page' => -1,
			'orderby'        => 'ID',
			'order'          => 'ASC',
		)
	) as $p ) {
		$estat[ get_page_uri( $p ) ] = $p->ID . '|' . md5( $p->post_content );
	}
	ksort( $estat );
	return $estat;
};

wp_set_current_user( 1 );

// Primera execució en un lloc buit: es creen totes les pàgines.
$nep_neteja_pagines();
update_option( 'show_on_front', 'posts' );
update_option( 'page_on_front', 0 );
delete_option( 'nep_versio_pagines' );
nep_actualitza_pagines();
$nep_comprova( get_page_by_path( 'ca' ) instanceof WP_Post, 'pàgines (lloc buit): pàgina `ca` creada' );
foreach ( nep_pagines() as $nep_clau_p => $nep_slugs_p ) {
	if ( 'inici' !== $nep_clau_p ) {
		$nep_comprova( get_page_by_path( 'ca/' . $nep_slugs_p['ca'] ) && get_page_by_path( $nep_slugs_p['es'] ), "pàgines (lloc buit): parella $nep_clau_p creada" );
	}
}
$nep_comprova( has_block( 'noempesquen/simulador', get_page_by_path( 'simulador' ) ) && has_block( 'noempesquen/simulador', get_page_by_path( 'ca/simulador' ) ), 'pàgines (lloc buit): bloc del simulador en ES i CA' );
$nep_comprova( 'page' === get_option( 'show_on_front' ) && get_page_by_path( 'inicio' )->ID === (int) get_option( 'page_on_front' ), 'pàgines (lloc buit): portada = `inicio`' );
$nep_comprova( NEP_VERSIO_PAGINES === (int) get_option( 'nep_versio_pagines' ), 'pàgines (lloc buit): versió desada' );

// Punt de partida: el lloc català antic (pàgines a l'arrel, portada d'entrades).
$nep_neteja_pagines();
$nep_velles = array();
$nep_html_a_ma = '<!-- wp:html --><iframe src="https://example.org/" title="Prova"></iframe><!-- /wp:html -->';
foreach ( array(
	'simulador'         => '<!-- wp:noempesquen/simulador {"align":"wide"} /-->',
	'com-funciona'      => $nep_html_a_ma,
	'missions'          => '',
	'compte'            => '<!-- wp:noempesquen/compte /-->',
	'contacte'          => '',
	'sobre-el-projecte' => '',
) as $nep_slug_v => $nep_contingut_v ) {
	$nep_velles[ $nep_slug_v ] = nep_crea_pagina( $nep_slug_v, ucfirst( $nep_slug_v ), $nep_contingut_v, 0 );
}
update_option( 'show_on_front', 'posts' );
update_option( 'page_on_front', 0 );
delete_option( 'nep_versio_pagines' );

// Migra una petició anònima (com a producció): kses no ha de tocar el contingut.
wp_set_current_user( 0 );
nep_actualitza_pagines();
wp_set_current_user( 1 );
$nep_comprova( get_post_field( 'post_content', $nep_velles['com-funciona'] ) === $nep_html_a_ma, 'pàgines: reparentar en una petició anònima conserva l\'HTML editat a mà' );

$nep_pare = get_page_by_path( 'ca' );
$nep_comprova( $nep_pare instanceof WP_Post && 0 === (int) $nep_pare->post_parent, 'pàgines: existeix la pàgina pare `ca` a l\'arrel' );
foreach ( nep_pagines() as $nep_clau_p => $nep_slugs_p ) {
	if ( 'inici' === $nep_clau_p ) {
		continue;
	}
	$nep_ca = get_page_by_path( 'ca/' . $nep_slugs_p['ca'] );
	$nep_es = get_page_by_path( $nep_slugs_p['es'] );
	$nep_comprova( $nep_ca instanceof WP_Post && 'publish' === $nep_ca->post_status, "pàgines: existeix /ca/{$nep_slugs_p['ca']}/" );
	$nep_comprova( $nep_es instanceof WP_Post && 0 === (int) $nep_es->post_parent, "pàgines: existeix /{$nep_slugs_p['es']}/" );
	$nep_comprova( $nep_ca && $nep_es && $nep_ca->ID !== $nep_es->ID, "pàgines: $nep_clau_p té pàgina ES i CA diferents" );
}
foreach ( array( 'com-funciona', 'missions', 'compte', 'contacte', 'sobre-el-projecte' ) as $nep_slug_v ) {
	$nep_ca = get_page_by_path( 'ca/' . $nep_slug_v );
	$nep_comprova( $nep_ca && $nep_ca->ID === $nep_velles[ $nep_slug_v ], "pàgines: /$nep_slug_v/ antiga reparentada a /ca/ conservant l'ID" );
	$nep_comprova( null === get_page_by_path( $nep_slug_v ), "pàgines: ja no hi ha /$nep_slug_v/ a l'arrel" );
}
$nep_comprova( get_page_by_path( 'simulador' )->ID === $nep_velles['simulador'], 'pàgines: /simulador/ es queda a l\'arrel (ES) amb el mateix ID' );
$nep_comprova( has_block( 'noempesquen/simulador', get_page_by_path( 'ca/simulador' ) ), 'pàgines: /ca/simulador/ té el bloc del simulador' );
$nep_comprova( has_block( 'noempesquen/compte', get_page_by_path( 'cuenta' ) ), 'pàgines: /cuenta/ té el bloc del compte' );
$nep_comprova( 'page' === get_option( 'show_on_front' ) && get_page_by_path( 'inicio' )->ID === (int) get_option( 'page_on_front' ), 'pàgines: portada ES = pàgina `inicio`' );
$nep_comprova( NEP_VERSIO_PAGINES === (int) get_option( 'nep_versio_pagines' ), 'pàgines: versió desada' );
$nep_comprova( false === get_option( 'nep_migracio_pagines_bloqueig' ), 'pàgines: candau alliberat' );
$nep_comprova( 'ca/compte' === get_page_uri( get_page_by_path( 'ca/compte' ) ), 'pàgines: get_page_uri de /ca/compte/' );
$nep_comprova( str_ends_with( wp_parse_url( nep_url_pagina( 'compte', 'ca' ), PHP_URL_PATH ), '/ca/compte/' ), 'pàgines: nep_url_pagina compte ca' );
$nep_comprova( str_contains( nep_url_simulador( 'ca' ), '/ca/simulador/?lang=ca' ), 'pàgines: nep_url_simulador(ca) → /ca/simulador/' );
$nep_comprova( ! str_contains( nep_url_simulador( 'es' ), '/ca/' ) && str_contains( nep_url_simulador( 'es' ), '/simulador/?lang=es' ), 'pàgines: nep_url_simulador(es) → /simulador/' );
$nep_comprova( ! str_contains( nep_url_simulador(), '/ca/' ), 'pàgines: nep_url_simulador() sense idioma → arrel' );

// Segona execució (versió esborrada): mateix estat, cap acció.
$nep_abans = $nep_estat_pagines();
delete_option( 'nep_versio_pagines' );
nep_actualitza_pagines();
$nep_comprova( $nep_abans === $nep_estat_pagines(), 'pàgines: la segona execució deixa el mateix estat (idempotent)' );
$nep_comprova( array() === array_filter( nep_migra_pagines(), static fn( $r ) => ! str_starts_with( $r, 'duplicada:' ) ), 'pàgines: la segona migració no fa cap acció' );

// Una pàgina ES editada a mà no es trepitja.
$nep_cuenta = get_page_by_path( 'cuenta' );
wp_update_post(
	array(
		'ID'           => $nep_cuenta->ID,
		'post_content' => '<!-- wp:noempesquen/compte /--><!-- wp:paragraph --><p>Editat</p><!-- /wp:paragraph -->',
	)
);
delete_option( 'nep_versio_pagines' );
nep_actualitza_pagines();
$nep_comprova( str_contains( get_post_field( 'post_content', $nep_cuenta->ID ), 'Editat' ), 'pàgines: el contingut editat a mà es conserva' );

// Amb el candau agafat (una altra petició migrant), no es fa res.
delete_option( 'nep_versio_pagines' );
add_option( 'nep_migracio_pagines_bloqueig', time(), '', false );
nep_actualitza_pagines();
$nep_comprova( false === get_option( 'nep_versio_pagines' ), 'pàgines: amb el candau agafat no migra' );
delete_option( 'nep_migracio_pagines_bloqueig' );
nep_actualitza_pagines();
$nep_comprova( NEP_VERSIO_PAGINES === (int) get_option( 'nep_versio_pagines' ), 'pàgines: sense candau, migra i desa la versió' );

// Filles de `videos` amb el mateix slug als dos idiomes: hreflang, selector i sitemap.
$nep_videos_es = nep_seo_post( 'videos', 'es' );
$nep_videos_ca = nep_seo_post( 'videos', 'ca' );
$nep_comprova( $nep_videos_es && $nep_videos_ca, 'vídeos: existeixen /videos/ i /ca/videos/' );
$nep_fill_es = nep_crea_pagina( 'prova-video-nep', 'Prova ES', '', (int) $nep_videos_es->ID );
$nep_fill_ca = nep_crea_pagina( 'prova-video-nep', 'Prova CA', '', (int) $nep_videos_ca->ID );
$nep_url_es  = (string) get_permalink( $nep_fill_es );
$nep_url_ca  = (string) get_permalink( $nep_fill_ca );
$nep_comprova( str_ends_with( $nep_url_es, '/videos/prova-video-nep/' ) && ! str_contains( $nep_url_es, '/ca/' ), 'vídeos: URL de la filla ES' );
$nep_comprova( str_ends_with( $nep_url_ca, '/ca/videos/prova-video-nep/' ), 'vídeos: URL de la filla CA' );
$nep_comprova( array( 'clau' => 'videos', 'fill' => 'prova-video-nep', 'idioma' => 'ca' ) === nep_seo_fill_post( get_post( $nep_fill_ca ) ), 'vídeos: la filla CA es reconeix' );
$nep_comprova( null === nep_seo_fill_post( $nep_videos_ca ) && null === nep_seo_fill_post( get_page_by_path( 'ca/simulador' ) ), 'vídeos: /ca/videos/ i /ca/simulador/ no són filles' );

$nep_esperat = array(
	array( 'hreflang' => 'es', 'href' => $nep_url_es ),
	array( 'hreflang' => 'ca', 'href' => $nep_url_ca ),
	array( 'hreflang' => 'x-default', 'href' => $nep_url_es ),
);
$nep_comprova( $nep_esperat === nep_seo_alternates_post_fill( get_post( $nep_fill_es ) ), 'vídeos: hreflang de la filla ES (parella CA)' );
$nep_comprova( $nep_esperat === nep_seo_alternates_post_fill( get_post( $nep_fill_ca ) ), 'vídeos: hreflang de la filla CA (parella ES)' );
$nep_comprova( wp_get_canonical_url( $nep_fill_ca ) === $nep_url_ca && wp_get_canonical_url( $nep_fill_es ) === $nep_url_es, 'vídeos: el canonical de cada filla és la seva URL (la del hreflang)' );
$nep_comprova( 3 === count( nep_seo_alternates( nep_seo_urls( 'simulador' ) ) ), 'vídeos: les altres pàgines del mapa conserven el hreflang' );

// Selector d'idioma: a la parella.
query_posts( array( 'page_id' => $nep_fill_es ) );
$nep_comprova( nep_seo_url_fill_actual( 'ca' ) === $nep_url_ca, 'vídeos: el selector de la filla ES va a la parella CA' );
wp_reset_query();

require_once dirname( __DIR__, 2 ) . '/includes/class-nep-sitemap-idioma.php';
$nep_sitemap_es = wp_list_pluck( ( new Nep_Sitemap_Idioma( 'es' ) )->get_url_list( 1 ), 'loc' );
$nep_sitemap_ca = wp_list_pluck( ( new Nep_Sitemap_Idioma( 'ca' ) )->get_url_list( 1 ), 'loc' );
$nep_comprova( in_array( $nep_url_es, $nep_sitemap_es, true ) && ! in_array( $nep_url_ca, $nep_sitemap_es, true ), 'vídeos: la filla ES és al sitemap ES (i la CA no)' );
$nep_comprova( in_array( $nep_url_ca, $nep_sitemap_ca, true ) && ! in_array( $nep_url_es, $nep_sitemap_ca, true ), 'vídeos: la filla CA és al sitemap CA (i la ES no)' );
$nep_comprova( array() === array_diff( array( $nep_fill_es, $nep_fill_ca ), nep_seo_ids_mapa() ), 'vídeos: les filles surten del sitemap de pàgines del nucli' );

// Sense parella publicada: només el seu propi hreflang, fora del sitemap i el selector va a /videos/.
wp_update_post( array( 'ID' => $nep_fill_es, 'post_status' => 'draft' ) );
$nep_comprova( array( array( 'hreflang' => 'ca', 'href' => $nep_url_ca ) ) === nep_seo_alternates_post_fill( get_post( $nep_fill_ca ) ), 'vídeos: sense parella, només el hreflang propi' );
$nep_comprova( ! in_array( $nep_url_es, wp_list_pluck( ( new Nep_Sitemap_Idioma( 'es' ) )->get_url_list( 1 ), 'loc' ), true ), 'vídeos: l\'esborrany no és al sitemap' );
query_posts( array( 'page_id' => $nep_fill_ca ) );
$nep_comprova( nep_seo_url_fill_actual( 'es' ) === nep_url_pagina( 'videos', 'es' ), 'vídeos: sense parella, el selector va a /videos/ (no a la portada)' );
wp_reset_query();

// Neteja (abans que les pàgines pare: esborrar un pare puja les filles un nivell).
wp_delete_post( $nep_fill_es, true );
wp_delete_post( $nep_fill_ca, true );
