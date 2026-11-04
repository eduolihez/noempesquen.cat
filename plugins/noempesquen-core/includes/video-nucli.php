<?php
/**
 * Funcions pures dels blocs `noempesquen/video` i `noempesquen/galeria-videos`:
 * durada, pistes de subtítols, lectura dels atributs del bloc i HTML.
 *
 * Sense base de dades ni ganxos de WordPress; es proven amb PHPUnit (l'arrencada
 * defineix `__` i els `esc_*` mínims si no hi ha WordPress).
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

/** Etiquetes de les pistes: cada idioma amb el seu nom propi (no es tradueixen). */
const NEP_VIDEO_ETIQUETES_PISTA = array(
	'ca' => 'Català',
	'es' => 'Castellano',
);

/**
 * Segons vàlids (enter positiu) o 0.
 *
 * @param mixed $segons Valor brut.
 * @return int
 */
function nep_video_segons( $segons ): int {
	if ( is_string( $segons ) && ctype_digit( trim( $segons ) ) ) {
		$segons = (int) trim( $segons );
	}
	return is_int( $segons ) && $segons > 0 ? $segons : 0;
}

/**
 * Durada en format ISO 8601 per a `<time datetime>` (p. ex. `PT3M5S`), o '' si no n'hi ha.
 *
 * @param mixed $segons Segons.
 * @return string
 */
function nep_video_durada_iso( $segons ): string {
	$s = nep_video_segons( $segons );
	if ( 0 === $s ) {
		return '';
	}
	$h   = intdiv( $s, 3600 );
	$m   = intdiv( $s % 3600, 60 );
	$res = $s % 60;
	return 'PT' . ( $h ? $h . 'H' : '' ) . ( $m ? $m . 'M' : '' ) . ( $res ? $res . 'S' : '' );
}

/**
 * Durada llegible (`3 min 5 s`, `1 h 2 min`, `45 s`), o '' si no n'hi ha.
 *
 * @param mixed $segons Segons.
 * @return string
 */
function nep_video_durada_text( $segons ): string {
	$s = nep_video_segons( $segons );
	if ( 0 === $s ) {
		return '';
	}
	$parts = array();
	$h     = intdiv( $s, 3600 );
	$m     = intdiv( $s % 3600, 60 );
	$res   = $s % 60;
	if ( $h ) {
		/* translators: %d: hores. */
		$parts[] = sprintf( __( '%d h', 'noempesquen' ), $h );
	}
	if ( $m ) {
		/* translators: %d: minuts. */
		$parts[] = sprintf( __( '%d min', 'noempesquen' ), $m );
	}
	if ( $res ) {
		/* translators: %d: segons. */
		$parts[] = sprintf( __( '%d s', 'noempesquen' ), $res );
	}
	return implode( ' ', $parts );
}

/**
 * Pistes de subtítols que tenen fitxer, la de l'idioma de la pàgina primer i amb `default`.
 *
 * @param array<string, string> $fitxers URL del VTT per idioma (`ca`, `es`); buides s'ometen.
 * @param string                $idioma  Idioma de la pàgina.
 * @return array<int, array{srclang: string, label: string, src: string, default: bool}>
 */
function nep_video_pistes( array $fitxers, string $idioma ): array {
	$pistes = array();
	foreach ( NEP_VIDEO_ETIQUETES_PISTA as $codi => $etiqueta ) {
		$src = isset( $fitxers[ $codi ] ) && is_string( $fitxers[ $codi ] ) ? trim( $fitxers[ $codi ] ) : '';
		if ( '' === $src ) {
			continue;
		}
		$pistes[] = array(
			'srclang' => $codi,
			'label'   => $etiqueta,
			'src'     => $src,
			'default' => $codi === $idioma,
		);
	}
	usort( $pistes, static fn( $a, $b ) => (int) $b['default'] <=> (int) $a['default'] );
	return $pistes;
}

/**
 * Atributs del primer bloc `noempesquen/video` (també dins de grups) d'una sortida de `parse_blocks`.
 *
 * @param array $blocs Blocs analitzats.
 * @return array|null Atributs (pot ser un array buit) o null si no hi ha cap bloc de vídeo.
 */
function nep_video_atributs_blocs( array $blocs ): ?array {
	foreach ( $blocs as $bloc ) {
		if ( ! is_array( $bloc ) ) {
			continue;
		}
		if ( ( $bloc['blockName'] ?? null ) === 'noempesquen/video' ) {
			return is_array( $bloc['attrs'] ?? null ) ? $bloc['attrs'] : array();
		}
		if ( ! empty( $bloc['innerBlocks'] ) && is_array( $bloc['innerBlocks'] ) ) {
			$trobats = nep_video_atributs_blocs( $bloc['innerBlocks'] );
			if ( null !== $trobats ) {
				return $trobats;
			}
		}
	}
	return null;
}

/**
 * Id de missió només si és a la llista de missions existents (comparació estricta).
 *
 * @param mixed    $id  Id rebut de l'atribut.
 * @param string[] $ids Ids existents.
 * @return string|null
 */
function nep_video_missio_valida( $id, array $ids ): ?string {
	if ( ! is_string( $id ) || '' === $id ) {
		return null;
	}
	return in_array( $id, $ids, true ) ? $id : null;
}

/**
 * Línia de durada (`<time>`) o '' si no n'hi ha.
 *
 * @param mixed $segons Segons.
 * @return string
 */
function nep_video_html_durada( $segons ): string {
	$text = nep_video_durada_text( $segons );
	if ( '' === $text ) {
		return '';
	}
	return '<time datetime="' . esc_attr( nep_video_durada_iso( $segons ) ) . '">' . esc_html( $text ) . '</time>';
}

/**
 * HTML del bloc de vídeo.
 *
 * @param array $d {
 *     @type string      $atributs     Atributs del contenidor, ja escapats (get_block_wrapper_attributes).
 *     @type string      $titol        Títol de la pàgina: es pinta com a h1 i és l'`aria-label` del vídeo.
 *     @type string      $avis         Avís per a qui edita quan no hi ha vídeo (buit = no es pinta res).
 *     @type string      $video        URL del MP4 (obligatori; si és buit no es pinta res).
 *     @type string      $poster       URL de la imatge de portada.
 *     @type array       $pistes       Sortida de nep_video_pistes().
 *     @type int         $durada       Segons.
 *     @type string      $tema         Tema curt.
 *     @type string      $transcripcio HTML de la transcripció (blocs interiors).
 *     @type array|null  $missio       `{url, titol}` o null.
 * }
 * @return string
 */
function nep_video_html( array $d ): string {
	$video = esc_url( (string) ( $d['video'] ?? '' ) );
	if ( '' === $video ) {
		$avis = trim( (string) ( $d['avis'] ?? '' ) );
		if ( '' === $avis ) {
			return '';
		}
		return '<div ' . (string) ( $d['atributs'] ?? 'class="nep-video"' ) . '><p class="nep-video__avis">' . esc_html( $avis ) . '</p></div>';
	}
	$titol  = trim( (string) ( $d['titol'] ?? '' ) );
	$poster = esc_url( (string) ( $d['poster'] ?? '' ) );
	$pistes = is_array( $d['pistes'] ?? null ) ? $d['pistes'] : array();

	$h  = '<div ' . (string) ( $d['atributs'] ?? 'class="nep-video"' ) . '>';
	$h .= '' !== $titol ? '<h1 class="nep-video__titol">' . esc_html( $titol ) . '</h1>' : '';
	$h .= '<figure class="nep-video__figura"><div class="nep-video__marc">';
	$h .= '<video controls playsinline preload="metadata"' . ( '' !== $titol ? ' aria-label="' . esc_attr( $titol ) . '"' : '' ) . ( '' !== $poster ? ' poster="' . $poster . '"' : '' ) . '>';
	$h .= '<source src="' . $video . '" type="video/mp4">';
	foreach ( $pistes as $p ) {
		$src = esc_url( (string) ( $p['src'] ?? '' ) );
		if ( '' === $src ) {
			continue;
		}
		$h .= '<track kind="subtitles" srclang="' . esc_attr( (string) $p['srclang'] ) . '" label="' . esc_attr( (string) $p['label'] ) . '" src="' . $src . '"' . ( ! empty( $p['default'] ) ? ' default' : '' ) . '>';
	}
	$h .= '<p><a href="' . $video . '" download>' . esc_html( __( 'Descarrega el vídeo (MP4)', 'noempesquen' ) ) . '</a></p>';
	$h .= '</video></div>';

	$meta   = array();
	$durada = nep_video_html_durada( $d['durada'] ?? 0 );
	if ( '' !== $durada ) {
		$meta[] = '<span>' . esc_html( __( 'Durada:', 'noempesquen' ) ) . ' ' . $durada . '</span>';
	}
	$tema = trim( (string) ( $d['tema'] ?? '' ) );
	if ( '' !== $tema ) {
		$meta[] = '<span>' . esc_html( __( 'Tema:', 'noempesquen' ) ) . ' ' . esc_html( $tema ) . '</span>';
	}
	$baixades = '';
	foreach ( $pistes as $p ) {
		$src = esc_url( (string) ( $p['src'] ?? '' ) );
		if ( '' === $src ) {
			continue;
		}
		/* translators: %s: nom de l'idioma dels subtítols (Català, Castellano). */
		$text      = sprintf( __( 'Descarrega els subtítols: %s (VTT)', 'noempesquen' ), (string) $p['label'] );
		$baixades .= '<li><a href="' . $src . '" download hreflang="' . esc_attr( (string) $p['srclang'] ) . '">' . esc_html( $text ) . '</a></li>';
	}
	if ( $meta || '' !== $baixades ) {
		$h .= '<figcaption class="nep-video__info">';
		$h .= $meta ? '<p class="nep-video__meta">' . implode( ' ', $meta ) . '</p>' : '';
		$h .= '' !== $baixades ? '<ul class="nep-video__baixades">' . $baixades . '</ul>' : '';
		$h .= '</figcaption>';
	}
	$h .= '</figure>';

	$transcripcio = wp_kses_post( (string) ( $d['transcripcio'] ?? '' ) );
	if ( '' !== trim( strip_tags( $transcripcio ) ) ) {
		$h .= '<details class="nep-video__transcripcio"><summary><h2 class="nep-video__titol-transcripcio">' . esc_html( __( 'Transcripció', 'noempesquen' ) ) . '</h2></summary>';
		$h .= '<div class="nep-video__text">' . $transcripcio . '</div></details>';
	}

	$missio = is_array( $d['missio'] ?? null ) ? $d['missio'] : null;
	$url    = $missio ? esc_url( (string) ( $missio['url'] ?? '' ) ) : '';
	$titol  = $missio ? trim( (string) ( $missio['titol'] ?? '' ) ) : '';
	if ( '' !== $url && '' !== $titol ) {
		/* translators: %s: títol de la missió del simulador. */
		$text = sprintf( __( 'Juga la missió «%s» al simulador', 'noempesquen' ), $titol );
		$h   .= '<p class="nep-video__missio"><a class="nep-btn nep-btn--mar nep-btn--petit" href="' . $url . '">' . esc_html( $text ) . '</a></p>';
	}
	return $h . '</div>';
}

/**
 * HTML de la galeria de vídeos.
 *
 * @param array  $targetes Llista de `{url, titol, poster, durada, tema}`.
 * @param string $atributs Atributs del contenidor, ja escapats.
 * @return string
 */
function nep_video_html_galeria( array $targetes, string $atributs = 'class="nep-galeria-videos"' ): string {
	$items = '';
	foreach ( $targetes as $t ) {
		$url   = esc_url( (string) ( $t['url'] ?? '' ) );
		$titol = trim( (string) ( $t['titol'] ?? '' ) );
		if ( '' === $url || '' === $titol ) {
			continue;
		}
		$poster = esc_url( (string) ( $t['poster'] ?? '' ) );
		$items .= '<li class="nep-targeta-video">';
		$items .= '<div class="nep-targeta-video__poster">' . ( '' !== $poster ? '<img src="' . $poster . '" alt="" loading="lazy" decoding="async">' : '' ) . '</div>';
		$items .= '<h2 class="nep-targeta-video__titol"><a href="' . $url . '">' . esc_html( $titol ) . '</a></h2>';
		$meta   = array();
		$durada = nep_video_html_durada( $t['durada'] ?? 0 );
		if ( '' !== $durada ) {
			$meta[] = $durada;
		}
		$tema = trim( (string) ( $t['tema'] ?? '' ) );
		if ( '' !== $tema ) {
			$meta[] = esc_html( $tema );
		}
		$items .= $meta ? '<p class="nep-targeta-video__meta">' . implode( '<span aria-hidden="true"> · </span>', $meta ) . '</p>' : '';
		$items .= '</li>';
	}
	$h = '<div ' . $atributs . '>';
	if ( '' === $items ) {
		return $h . '<p class="nep-galeria-videos__buit">' . esc_html( __( 'Encara no hi ha cap vídeo.', 'noempesquen' ) ) . '</p></div>';
	}
	return $h . '<ul class="nep-galeria-videos__llista">' . $items . '</ul></div>';
}
