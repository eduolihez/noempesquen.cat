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

// Punt de partida: el lloc català antic (pàgines a l'arrel, portada d'entrades).
$nep_neteja_pagines();
$nep_velles = array();
foreach ( array(
	'simulador'         => '<!-- wp:noempesquen/simulador {"align":"wide"} /-->',
	'com-funciona'      => '',
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

nep_actualitza_pagines();

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
