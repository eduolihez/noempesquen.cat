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
 * Primer bloc `noempesquen/video` (també dins de grups) d'una sortida de `parse_blocks`.
 *
 * @param array $blocs Blocs analitzats.
 * @return array|null El bloc o null si no n'hi ha cap.
 */
function nep_video_bloc( array $blocs ): ?array {
	foreach ( $blocs as $bloc ) {
		if ( ! is_array( $bloc ) ) {
			continue;
		}
		if ( ( $bloc['blockName'] ?? null ) === 'noempesquen/video' ) {
			return $bloc;
		}
		if ( ! empty( $bloc['innerBlocks'] ) && is_array( $bloc['innerBlocks'] ) ) {
			$trobat = nep_video_bloc( $bloc['innerBlocks'] );
			if ( null !== $trobat ) {
				return $trobat;
			}
		}
	}
	return null;
}

/**
 * Atributs del primer bloc `noempesquen/video` (també dins de grups) d'una sortida de `parse_blocks`.
 *
 * @param array $blocs Blocs analitzats.
 * @return array|null Atributs (pot ser un array buit) o null si no hi ha cap bloc de vídeo.
 */
function nep_video_atributs_blocs( array $blocs ): ?array {
	$bloc = nep_video_bloc( $blocs );
	if ( null === $bloc ) {
		return null;
	}
	return is_array( $bloc['attrs'] ?? null ) ? $bloc['attrs'] : array();
}

/**
 * Text pla de la transcripció (blocs interiors del bloc de vídeo), amb un paràgraf per línia.
 *
 * @param array $blocs Blocs analitzats de la pàgina.
 * @return string
 */
function nep_video_transcripcio_text( array $blocs ): string {
	$bloc = nep_video_bloc( $blocs );
	if ( null === $bloc || empty( $bloc['innerBlocks'] ) || ! is_array( $bloc['innerBlocks'] ) ) {
		return '';
	}
	$linies = array();
	foreach ( $bloc['innerBlocks'] as $intern ) {
		$text = is_array( $intern ) ? trim( preg_replace( '/\s+/u', ' ', html_entity_decode( strip_tags( (string) ( $intern['innerHTML'] ?? '' ) ), ENT_QUOTES, 'UTF-8' ) ) ) : '';
		if ( '' !== $text ) {
			$linies[] = $text;
		}
	}
	return implode( "\n", $linies );
}

/**
 * Retalla un text pla a `$max` caràcters, sense partir paraules i amb punts suspensius.
 *
 * @param string $text Text.
 * @param int    $max  Longitud màxima (inclosos els punts suspensius).
 * @return string
 */
function nep_video_retalla( string $text, int $max ): string {
	if ( mb_strlen( $text ) <= $max ) {
		return $text;
	}
	$tall = mb_substr( $text, 0, $max - 1 );
	$pos  = mb_strrpos( $tall, ' ' );
	if ( false !== $pos && $pos > $max / 2 ) {
		$tall = mb_substr( $tall, 0, $pos );
	}
	return rtrim( $tall, " ,;:.\n" ) . '…';
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
	if ( $meta ) {
		$h .= '<figcaption class="nep-video__info"><p class="nep-video__meta">' . implode( ' ', $meta ) . '</p></figcaption>';
	}
	$h .= '</figure>';

	// La transcripció va oberta per defecte; el h2 és fora del <summary> (que només porta text pla).
	$transcripcio = wp_kses_post( (string) ( $d['transcripcio'] ?? '' ) );
	if ( '' !== trim( strip_tags( $transcripcio ) ) ) {
		$h .= '<h2 class="nep-video__titol-transcripcio">' . esc_html( __( 'Transcripció', 'noempesquen' ) ) . '</h2>';
		$h .= '<details class="nep-video__transcripcio" open><summary>' . esc_html( __( 'Transcripció', 'noempesquen' ) ) . '</summary>';
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
 * @param array  $targetes Llista de `{url, titol, poster, ample, alt, durada, tema}` (`ample`/`alt`: mides del pòster).
 * @param string $atributs Atributs del contenidor, ja escapats.
 * @param string $url_simulador URL del simulador per a l'estat buit (buit = sense enllaç).
 * @return string
 */
function nep_video_html_galeria( array $targetes, string $atributs = 'class="nep-galeria-videos"', string $url_simulador = '' ): string {
	$items = '';
	foreach ( $targetes as $t ) {
		$url   = esc_url( (string) ( $t['url'] ?? '' ) );
		$titol = trim( (string) ( $t['titol'] ?? '' ) );
		if ( '' === $url || '' === $titol ) {
			continue;
		}
		$poster = esc_url( (string) ( $t['poster'] ?? '' ) );
		$items .= '<li class="nep-targeta-video">';
		$ample  = nep_video_segons( $t['ample'] ?? 0 );
		$alt    = nep_video_segons( $t['alt'] ?? 0 );
		$mides  = $ample && $alt ? ' width="' . $ample . '" height="' . $alt . '"' : '';
		$items .= '<div class="nep-targeta-video__poster">' . ( '' !== $poster ? '<img src="' . $poster . '" alt=""' . $mides . ' loading="lazy" decoding="async">' : '' ) . '</div>';
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
		$h .= '<p class="nep-galeria-videos__buit">' . esc_html( __( 'Encara no hi ha cap vídeo. Aquí hi trobaràs vídeos curts amb subtítols i transcripció que expliquen com detectar estafes digitals.', 'noempesquen' ) ) . '</p>';
		$url = esc_url( $url_simulador );
		if ( '' !== $url ) {
			$h .= '<p class="nep-galeria-videos__buit-enllac"><a class="nep-btn nep-btn--mar" href="' . $url . '">' . esc_html( __( 'Mentrestant, prova el simulador', 'noempesquen' ) ) . '</a></p>';
		}
		return $h . '</div>';
	}
	return $h . '<ul class="nep-galeria-videos__llista">' . $items . '</ul></div>';
}

/**
 * Durada efectiva: la de les metadades de l'adjunt si n'hi ha; el camp manual `durada` només és de reserva.
 *
 * @param mixed $meta   Durada llegida de les metadades de l'adjunt (`length`).
 * @param mixed $manual Durada escrita a mà al bloc.
 * @return int Segons (0 si no se sap).
 */
function nep_video_durada_resol( $meta, $manual ): int {
	$segons = nep_video_segons( $meta );
	return $segons > 0 ? $segons : nep_video_segons( $manual );
}

/**
 * Dades del filtre `wp_check_filetype_and_ext` per a un `.vtt`: només si qui puja pot pujar fitxers,
 * si el nom acaba en `.vtt` i WordPress no n'ha reconegut ja l'extensió. Res més canvia.
 *
 * @param mixed  $dades   `{ext, type, proper_filename}` rebut del filtre.
 * @param mixed  $nom     Nom del fitxer.
 * @param bool   $pot_pujar Si l'usuari té `upload_files`.
 * @return mixed
 */
function nep_video_vtt_dades( $dades, $nom, bool $pot_pujar ) {
	if ( ! is_array( $dades ) || ! empty( $dades['ext'] ) || ! is_string( $nom ) || ! $pot_pujar ) {
		return $dades;
	}
	if ( 'vtt' === strtolower( pathinfo( $nom, PATHINFO_EXTENSION ) ) ) {
		$dades['ext']  = 'vtt';
		$dades['type'] = 'text/vtt';
	}
	return $dades;
}

/**
 * Objecte schema.org `VideoObject` d'una pàgina de vídeo, o null si no hi ha MP4.
 *
 * @param array $d {
 *     @type string $url         URL de la pàgina.
 *     @type string $titol       Títol.
 *     @type string $descripcio  Descripció (extracte o primer paràgraf).
 *     @type string $video       URL del MP4 (obligatori).
 *     @type string $poster      URL del pòster.
 *     @type string $data        Data de publicació ISO 8601.
 *     @type int    $durada      Segons.
 *     @type string $idioma      `es`|`ca`.
 *     @type string $transcripcio Text pla de la transcripció.
 * }
 * @return array<string, mixed>|null
 */
function nep_video_jsonld( array $d ): ?array {
	$video = trim( (string) ( $d['video'] ?? '' ) );
	$titol = trim( (string) ( $d['titol'] ?? '' ) );
	if ( '' === $video || '' === $titol ) {
		return null;
	}
	$descripcio = trim( (string) ( $d['descripcio'] ?? '' ) );
	$obj        = array(
		'@type'       => 'VideoObject',
		'name'        => $titol,
		'description' => '' !== $descripcio ? $descripcio : $titol,
	);
	if ( '' !== trim( (string) ( $d['poster'] ?? '' ) ) ) {
		$obj['thumbnailUrl'] = (string) $d['poster'];
	}
	if ( '' !== trim( (string) ( $d['data'] ?? '' ) ) ) {
		$obj['uploadDate'] = (string) $d['data'];
	}
	$iso = nep_video_durada_iso( $d['durada'] ?? 0 );
	if ( '' !== $iso ) {
		$obj['duration'] = $iso;
	}
	$obj['contentUrl'] = $video;
	if ( '' !== trim( (string) ( $d['idioma'] ?? '' ) ) ) {
		$obj['inLanguage'] = (string) $d['idioma'];
	}
	$text = trim( (string) ( $d['transcripcio'] ?? '' ) );
	if ( '' !== $text ) {
		$obj['transcript'] = nep_video_retalla( str_replace( "\n", ' ', $text ), 1500 );
	}
	if ( '' !== trim( (string) ( $d['url'] ?? '' ) ) ) {
		$obj['isPartOf'] = array( '@id' => (string) $d['url'] );
	}
	return $obj;
}

/**
 * `BreadcrumbList` Inici > Vídeos > pàgina (per a quan The SEO Framework no n'emet).
 *
 * @param array $passos Llista de `{nom, url}`; l'últim pot no tenir URL.
 * @return array<string, mixed>
 */
function nep_video_jsonld_molla( array $passos ): array {
	$items = array();
	foreach ( array_values( $passos ) as $i => $p ) {
		$item = array(
			'@type'    => 'ListItem',
			'position' => $i + 1,
			'name'     => (string) ( $p['nom'] ?? '' ),
		);
		if ( '' !== (string) ( $p['url'] ?? '' ) ) {
			$item['item'] = (string) $p['url'];
		}
		$items[] = $item;
	}
	return array(
		'@type'           => 'BreadcrumbList',
		'itemListElement' => $items,
	);
}

/**
 * Etiquetes Open Graph d'una pàgina de vídeo, en ordre: `og:type` = `video.other` i `og:video*`.
 *
 * @param array $d `{video, durada, ample, alt}` (segons i píxels; el que falti s'omet).
 * @return array<int, array{0: string, 1: string}> Parelles propietat → contingut.
 */
function nep_video_og( array $d ): array {
	$video = trim( (string) ( $d['video'] ?? '' ) );
	if ( '' === $video ) {
		return array();
	}
	$etiq = array(
		array( 'og:type', 'video.other' ),
		array( 'og:video', $video ),
	);
	if ( str_starts_with( $video, 'https://' ) ) {
		$etiq[] = array( 'og:video:secure_url', $video );
	}
	$etiq[] = array( 'og:video:type', 'video/mp4' );
	foreach ( array(
		'og:video:width'    => $d['ample'] ?? 0,
		'og:video:height'   => $d['alt'] ?? 0,
		'og:video:duration' => $d['durada'] ?? 0,
	) as $clau => $valor ) {
		if ( nep_video_segons( $valor ) > 0 ) {
			$etiq[] = array( $clau, (string) nep_video_segons( $valor ) );
		}
	}
	return $etiq;
}

/**
 * Text de `llms.txt` (Markdown): web, vídeos publicats i simulador.
 *
 * @param array $d `{nom, resum, videos: [{titol, url}], url_videos, url_simulador}`.
 * @return string
 */
function nep_llms_text( array $d ): string {
	$t = '# ' . trim( (string) ( $d['nom'] ?? '' ) ) . "\n\n";
	if ( '' !== trim( (string) ( $d['resum'] ?? '' ) ) ) {
		$t .= '> ' . trim( (string) $d['resum'] ) . "\n\n";
	}
	$t .= "## Simulador\n\n- [" . __( 'Simulador d’estafes digitals', 'noempesquen' ) . '](' . (string) ( $d['url_simulador'] ?? '' ) . ")\n\n";
	$t .= "## Vídeos\n\n- [" . __( 'Tots els vídeos', 'noempesquen' ) . '](' . (string) ( $d['url_videos'] ?? '' ) . ")\n";
	foreach ( (array) ( $d['videos'] ?? array() ) as $v ) {
		$t .= '- [' . str_replace( array( '[', ']' ), '', (string) $v['titol'] ) . '](' . (string) $v['url'] . ")\n";
	}
	return $t;
}
