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
 * Filla directa de la pàgina `videos` a partir de la ruta de la pàgina (`get_page_uri()`).
 *
 * Castellà: `videos/<slug>`; català: `ca/videos/<slug>`. El slug és el `post_name` tal
 * com el desa WordPress (els caràcters no ASCII ja hi són codificats amb `%`), i és el
 * mateix als dos idiomes. La pàgina `videos`, les nétes o qualsevol altra ruta: null.
 *
 * @param string $ruta Ruta de la pàgina, amb o sense barres als extrems.
 * @return array{clau: string, fill: string}|null
 */
function nep_seo_fill( string $ruta ): ?array {
	$segments = explode( '/', trim( $ruta, '/' ) );
	$idioma   = 'es';
	if ( 'ca' === $segments[0] ) {
		$idioma = 'ca';
		array_shift( $segments );
	}
	if ( 2 !== count( $segments ) || nep_pagines()['videos'][ $idioma ] !== $segments[0] ) {
		return null;
	}
	$fill = $segments[1];
	if ( '' === $fill || '.' === $fill || '..' === $fill ) {
		return null;
	}
	return array(
		'clau' => 'videos',
		'fill' => $fill,
	);
}

/**
 * Ruta (amb prefix d'idioma) d'una filla de `videos`: `/videos/<slug>/` o `/ca/videos/<slug>/`.
 *
 * @param string $fill   Slug de la filla.
 * @param string $idioma `es`|`ca`.
 * @return string
 */
function nep_seo_ruta_fill( string $fill, string $idioma ): string {
	$idioma = 'ca' === $idioma ? 'ca' : 'es';
	return nep_ruta_idioma( '/' . nep_pagines()['videos'][ $idioma ] . '/' . $fill . '/', $idioma );
}

/**
 * Ruta de la parella d'una filla de `videos` a l'altre idioma (mateix slug), o null si
 * la ruta no és d'una filla.
 *
 * @param string $ruta Ruta de la pàgina (`videos/x` → `/ca/videos/x/`; `ca/videos/x` → `/videos/x/`).
 * @return string|null
 */
function nep_seo_ruta_parella_fill( string $ruta ): ?string {
	$fill = nep_seo_fill( $ruta );
	if ( ! $fill ) {
		return null;
	}
	$altre = 'ca' === nep_idioma_de_ruta( '/' . ltrim( $ruta, '/' ) ) ? 'es' : 'ca';
	return nep_seo_ruta_fill( $fill['fill'], $altre );
}

/**
 * Hreflang d'una filla de `videos`: amb parella, el joc complet (nep_seo_alternates());
 * sense parella publicada, només el seu propi hreflang (sense x-default).
 *
 * @param array<string, string> $urls   URL absoluta en cada idioma on existeix.
 * @param string                $idioma Idioma de la pàgina actual.
 * @return array<int, array{hreflang: string, href: string}>
 */
function nep_seo_alternates_fill( array $urls, string $idioma ): array {
	$complet = nep_seo_alternates( $urls );
	if ( $complet ) {
		return $complet;
	}
	if ( empty( $urls[ $idioma ] ) || ! is_string( $urls[ $idioma ] ) ) {
		return array();
	}
	return array(
		array(
			'hreflang' => $idioma,
			'href'     => $urls[ $idioma ],
		),
	);
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
