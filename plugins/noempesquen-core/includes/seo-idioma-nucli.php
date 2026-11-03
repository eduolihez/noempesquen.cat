<?php
/**
 * SEO multilingüe, part pura (sense WordPress): quina pàgina del mapa és la petició
 * i quins `hreflang` li toquen.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/idioma-nucli.php';

/**
 * Clau i idioma d'una pàgina a partir del slug i del pare.
 *
 * Les castellanes són a l'arrel; les catalanes, filles de la pàgina `ca`. La portada
 * (ES) i la pàgina `ca` (arrel) són `inici`. Qualsevol altra combinació (pàgina fora
 * del mapa, slug català a l'arrel, néta de `ca`...) no té equivalent: null.
 *
 * @param string $slug    Slug de la pàgina (`post_name`).
 * @param string $pare    Slug del pare (`''` si és a l'arrel).
 * @param bool   $portada Si és la portada estàtica del lloc.
 * @return array{clau: string, idioma: string}|null
 */
function nep_seo_pagina( string $slug, string $pare, bool $portada ): ?array {
	if ( $portada ) {
		return array(
			'clau'   => 'inici',
			'idioma' => 'es',
		);
	}
	if ( '' === $pare && 'ca' === $slug ) {
		return array(
			'clau'   => 'inici',
			'idioma' => 'ca',
		);
	}
	if ( '' !== $pare && 'ca' !== $pare ) {
		return null;
	}
	$idioma = 'ca' === $pare ? 'ca' : 'es';
	foreach ( nep_pagines() as $clau => $slugs ) {
		if ( 'inici' !== $clau && $slugs[ $idioma ] === $slug ) {
			return array(
				'clau'   => $clau,
				'idioma' => $idioma,
			);
		}
	}
	return null;
}

/**
 * Enllaços `<link rel="alternate" hreflang>` d'una pàgina: un per idioma (inclosa ella
 * mateixa) i `x-default` cap al castellà. Si falta algun idioma, cap (sense hreflang fals).
 *
 * @param array<string, string> $urls URL absoluta de la pàgina en cada idioma (`es`, `ca`).
 * @return array<int, array{hreflang: string, href: string}>
 */
function nep_seo_alternates( array $urls ): array {
	$enllacos = array();
	foreach ( nep_idiomes() as $idioma ) {
		if ( empty( $urls[ $idioma ] ) || ! is_string( $urls[ $idioma ] ) ) {
			return array();
		}
		$enllacos[] = array(
			'hreflang' => $idioma,
			'href'     => $urls[ $idioma ],
		);
	}
	$enllacos[] = array(
		'hreflang' => 'x-default',
		'href'     => $urls[ nep_idiomes()[0] ],
	);
	return $enllacos;
}

/**
 * Locale d'Open Graph d'un idioma (`es_ES`, `ca_ES`).
 *
 * @param string $idioma `es`|`ca`.
 * @return string
 */
function nep_seo_og_locale( string $idioma ): string {
	return 'ca' === $idioma ? 'ca_ES' : 'es_ES';
}
