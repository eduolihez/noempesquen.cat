<?php
/**
 * Proves de les funcions pures dels blocs de vídeo.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

use PHPUnit\Framework\TestCase;

/**
 * Durada, pistes, atributs, missió, escapament i galeria.
 */
final class VideoNucliTest extends TestCase {

	public function test_durada_llegible_i_iso() {
		$this->assertSame( '3 min 5 s', nep_video_durada_text( 185 ) );
		$this->assertSame( 'PT3M5S', nep_video_durada_iso( 185 ) );
		$this->assertSame( '45 s', nep_video_durada_text( 45 ) );
		$this->assertSame( '2 min', nep_video_durada_text( 120 ) );
		$this->assertSame( 'PT2M', nep_video_durada_iso( 120 ) );
		$this->assertSame( '1 h 2 min 3 s', nep_video_durada_text( 3723 ) );
		$this->assertSame( 'PT1H2M3S', nep_video_durada_iso( 3723 ) );
		$this->assertSame( '1 min 30 s', nep_video_durada_text( '90' ) );
	}

	public function test_durada_buida_o_invalida() {
		foreach ( array( 0, -5, null, '', 'abc', '1.5', 2.5, array() ) as $valor ) {
			$this->assertSame( '', nep_video_durada_text( $valor ) );
			$this->assertSame( '', nep_video_durada_iso( $valor ) );
			$this->assertSame( '', nep_video_html_durada( $valor ) );
		}
	}

	public function test_pistes_idioma_de_la_pagina_primer_i_default() {
		$fitxers = array(
			'ca' => 'https://exemple.cat/ca.vtt',
			'es' => 'https://exemple.cat/es.vtt',
		);
		$es      = nep_video_pistes( $fitxers, 'es' );
		$this->assertSame( array( 'es', 'ca' ), array_column( $es, 'srclang' ) );
		$this->assertSame( array( true, false ), array_column( $es, 'default' ) );
		$this->assertSame( 'Castellano', $es[0]['label'] );

		$ca = nep_video_pistes( $fitxers, 'ca' );
		$this->assertSame( array( 'ca', 'es' ), array_column( $ca, 'srclang' ) );
		$this->assertSame( array( true, false ), array_column( $ca, 'default' ) );
		$this->assertSame( 'Català', $ca[0]['label'] );
	}

	public function test_pistes_nomes_amb_fitxer() {
		$p = nep_video_pistes( array( 'ca' => 'https://exemple.cat/ca.vtt', 'es' => '' ), 'es' );
		$this->assertCount( 1, $p );
		$this->assertSame( 'ca', $p[0]['srclang'] );
		$this->assertFalse( $p[0]['default'] );
		$this->assertSame( array(), nep_video_pistes( array(), 'ca' ) );
		$this->assertSame( array(), nep_video_pistes( array( 'fr' => 'https://exemple.cat/fr.vtt', 'ca' => null ), 'ca' ) );
	}

	public function test_atributs_del_bloc_tambe_dins_de_grups() {
		$blocs = array(
			array(
				'blockName'   => 'core/paragraph',
				'attrs'       => array(),
				'innerBlocks' => array(),
			),
			array(
				'blockName'   => 'core/group',
				'attrs'       => array(),
				'innerBlocks' => array(
					array(
						'blockName'   => 'noempesquen/video',
						'attrs'       => array(
							'poster' => 7,
							'durada' => 90,
						),
						'innerBlocks' => array(),
					),
				),
			),
		);
		$this->assertSame( array( 'poster' => 7, 'durada' => 90 ), nep_video_atributs_blocs( $blocs ) );
		$this->assertNull( nep_video_atributs_blocs( array( $blocs[0] ) ) );
		$this->assertSame(
			array(),
			nep_video_atributs_blocs(
				array(
					array(
						'blockName' => 'noempesquen/video',
						'attrs'     => null,
					),
				)
			)
		);
	}

	public function test_missio_inexistent() {
		$ids = array( 'llissa-01-factura', 'remei-01-paquet' );
		$this->assertSame( 'llissa-01-factura', nep_video_missio_valida( 'llissa-01-factura', $ids ) );
		$this->assertNull( nep_video_missio_valida( 'no-existeix', $ids ) );
		$this->assertNull( nep_video_missio_valida( '../../wp-config', $ids ) );
		$this->assertNull( nep_video_missio_valida( '', $ids ) );
		$this->assertNull( nep_video_missio_valida( null, $ids ) );
		$this->assertNull( nep_video_missio_valida( 0, array( '0' ) ) );

		$html = nep_video_html(
			array(
				'video'  => 'https://exemple.cat/v.mp4',
				'missio' => null,
			)
		);
		$this->assertStringNotContainsString( 'nep-video__missio', $html );
	}

	public function test_html_complet() {
		$html = nep_video_html(
			array(
				'video'        => 'https://exemple.cat/v.mp4',
				'poster'       => 'https://exemple.cat/p.jpg',
				'pistes'       => nep_video_pistes(
					array(
						'ca' => 'https://exemple.cat/ca.vtt',
						'es' => 'https://exemple.cat/es.vtt',
					),
					'ca'
				),
				'durada'       => 185,
				'tema'         => 'Pesca per correu',
				'transcripcio' => '<p>Hola</p>',
				'missio'       => array(
					'url'   => 'https://exemple.cat/ca/simulador/',
					'titol' => 'La factura de la llum',
				),
			)
		);
		$this->assertStringContainsString( '<video controls playsinline preload="metadata" poster="https://exemple.cat/p.jpg">', $html );
		$this->assertStringContainsString( '<source src="https://exemple.cat/v.mp4" type="video/mp4">', $html );
		$this->assertStringContainsString( '<track kind="subtitles" srclang="ca" label="Català" src="https://exemple.cat/ca.vtt" default>', $html );
		$this->assertStringContainsString( '<track kind="subtitles" srclang="es" label="Castellano" src="https://exemple.cat/es.vtt">', $html );
		$this->assertLessThan( strpos( $html, 'srclang="es"' ), strpos( $html, 'srclang="ca"' ) );
		$this->assertStringNotContainsString( 'autoplay', $html );
		$this->assertStringContainsString( '<time datetime="PT3M5S">3 min 5 s</time>', $html );
		$this->assertStringContainsString( 'Pesca per correu', $html );
		$this->assertStringContainsString( 'href="https://exemple.cat/ca.vtt" download', $html );
		$this->assertStringContainsString( '<details class="nep-video__transcripcio"><summary><h2 class="nep-video__titol-transcripcio">Transcripció</h2></summary>', $html );
		$this->assertStringContainsString( '<p>Hola</p>', $html );
		$this->assertStringContainsString( 'href="https://exemple.cat/ca/simulador/"', $html );
		$this->assertStringContainsString( 'La factura de la llum', $html );
	}

	public function test_atributs_buits_no_trenquen() {
		$this->assertSame( '', nep_video_html( array() ) );
		$this->assertSame( '', nep_video_html( array( 'video' => '' ) ) );
		$this->assertSame( '', nep_video_html( array( 'video' => 'javascript:alert(1)' ) ) );

		$html = nep_video_html( array( 'video' => 'https://exemple.cat/v.mp4' ) );
		$this->assertStringContainsString( '<video controls playsinline preload="metadata">', $html );
		$this->assertStringNotContainsString( '<track', $html );
		$this->assertStringNotContainsString( 'poster=', $html );
		$this->assertStringNotContainsString( '<figcaption', $html );
		$this->assertStringNotContainsString( '<details', $html );

		$sense_text = nep_video_html(
			array(
				'video'        => 'https://exemple.cat/v.mp4',
				'transcripcio' => "<p> </p>\n",
			)
		);
		$this->assertStringNotContainsString( '<details', $sense_text );
	}

	public function test_escapament() {
		$html = nep_video_html(
			array(
				'video'        => 'https://exemple.cat/v.mp4?a=1&b="x"',
				'poster'       => 'javascript:alert(1)',
				'pistes'       => array(
					array(
						'srclang' => 'ca"><script>',
						'label'   => '<b>Català</b>',
						'src'     => 'https://exemple.cat/ca.vtt',
						'default' => true,
					),
				),
				'tema'         => '<script>alert(1)</script>',
				'transcripcio' => '<p>Text</p><script>alert(1)</script>',
				'missio'       => array(
					'url'   => 'https://exemple.cat/simulador/',
					'titol' => '<img src=x onerror=alert(1)>',
				),
			)
		);
		$this->assertStringNotContainsString( '<script', $html );
		$this->assertStringNotContainsString( '<img', $html );
		$this->assertStringNotContainsString( '<b>', $html );
		$this->assertStringNotContainsString( 'javascript:', $html );
		$this->assertStringNotContainsString( 'poster=', $html );
		$this->assertStringContainsString( '&amp;b=&quot;x&quot;', $html );
		$this->assertStringContainsString( '&lt;script&gt;alert(1)&lt;/script&gt;', $html );
		$this->assertStringContainsString( '<p>Text</p>', $html );
	}

	public function test_galeria() {
		$buida = nep_video_html_galeria( array() );
		$this->assertStringContainsString( 'Encara no hi ha cap vídeo.', $buida );
		$this->assertStringNotContainsString( '<ul', $buida );

		$html = nep_video_html_galeria(
			array(
				array(
					'url'    => 'https://exemple.cat/videos/u/',
					'titol'  => 'Primer <i>vídeo</i>',
					'poster' => 'https://exemple.cat/p.jpg',
					'durada' => 65,
					'tema'   => 'Correu',
				),
				array(
					'url'   => '',
					'titol' => 'Sense enllaç',
				),
				array(
					'url'   => 'https://exemple.cat/videos/dos/',
					'titol' => 'Segon',
				),
			)
		);
		$this->assertSame( 2, substr_count( $html, '<li class="nep-targeta-video">' ) );
		$this->assertStringContainsString( '<ul class="nep-galeria-videos__llista">', $html );
		$this->assertStringContainsString( '<img src="https://exemple.cat/p.jpg" alt=""', $html );
		$this->assertStringContainsString( 'Primer &lt;i&gt;vídeo&lt;/i&gt;', $html );
		$this->assertStringContainsString( '<time datetime="PT1M5S">1 min 5 s</time>', $html );
		$this->assertStringNotContainsString( 'Sense enllaç', $html );
		$this->assertLessThan( strpos( $html, 'Segon' ), strpos( $html, 'Primer' ) );
	}

	public function test_titol_h1_i_aria_label() {
		$html = nep_video_html(
			array(
				'video'        => 'https://exemple.cat/v.mp4',
				'titol'        => 'Pesca <b>per</b> correu',
				'transcripcio' => '<p>Hola</p>',
			)
		);
		$this->assertSame( 1, substr_count( $html, '<h1' ) );
		$this->assertStringContainsString( '<h1 class="nep-video__titol">Pesca &lt;b&gt;per&lt;/b&gt; correu</h1>', $html );
		$this->assertLessThan( strpos( $html, '<video' ), strpos( $html, '<h1' ) );
		$this->assertStringContainsString( 'aria-label="Pesca &lt;b&gt;per&lt;/b&gt; correu"', $html );
		$this->assertStringContainsString( '<summary><h2 class="nep-video__titol-transcripcio">', $html );
	}

	public function test_sense_titol_no_hi_ha_h1_ni_aria_label() {
		$html = nep_video_html( array( 'video' => 'https://exemple.cat/v.mp4' ) );
		$this->assertStringNotContainsString( '<h1', $html );
		$this->assertStringNotContainsString( 'aria-label', $html );
	}

	public function test_sense_video_nomes_pinta_avis_si_n_hi_ha() {
		$this->assertSame( '', nep_video_html( array( 'video' => '' ) ) );
		$html = nep_video_html(
			array(
				'video'  => '',
				'titol'  => 'T',
				'avis'   => 'Aquest bloc no té cap vídeo.',
				'atributs' => 'class="nep-video"',
			)
		);
		$this->assertStringContainsString( '<p class="nep-video__avis">Aquest bloc no té cap vídeo.</p>', $html );
		$this->assertStringNotContainsString( '<h1', $html );
		$this->assertStringNotContainsString( '<video', $html );
	}
}
