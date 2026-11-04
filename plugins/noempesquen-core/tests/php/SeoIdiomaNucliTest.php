<?php
/**
 * Proves de la part pura del SEO multilingüe: pàgina del mapa, hreflang i canonical.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

use PHPUnit\Framework\TestCase;

/**
 * Hreflang recíproc amb x-default, sense hreflang fals i canonical per idioma.
 */
final class SeoIdiomaNucliTest extends TestCase {

	/**
	 * URL absoluta d'una pàgina com la construeix nep_url_pagina() (sense WordPress).
	 *
	 * @param string $clau   Clau.
	 * @param string $idioma Idioma.
	 * @return string
	 */
	private function url( string $clau, string $idioma ): string {
		return 'https://noempesquen.cat' . nep_ruta_idioma( nep_ruta_pagina( $clau, $idioma ), $idioma );
	}

	public function test_portada_i_pagina_ca_son_inici(): void {
		$this->assertSame( array( 'clau' => 'inici', 'idioma' => 'es' ), nep_seo_pagina( 'inicio', '', true ) );
		$this->assertSame( array( 'clau' => 'inici', 'idioma' => 'ca' ), nep_seo_pagina( 'ca', '', false ) );
	}

	public function test_pagines_per_slug_i_pare(): void {
		$this->assertSame( array( 'clau' => 'com-funciona', 'idioma' => 'es' ), nep_seo_pagina( 'como-funciona', '', false ) );
		$this->assertSame( array( 'clau' => 'com-funciona', 'idioma' => 'ca' ), nep_seo_pagina( 'com-funciona', 'ca', false ) );
		// Mateix slug als dos idiomes: el pare decideix.
		$this->assertSame( array( 'clau' => 'simulador', 'idioma' => 'es' ), nep_seo_pagina( 'simulador', '', false ) );
		$this->assertSame( array( 'clau' => 'simulador', 'idioma' => 'ca' ), nep_seo_pagina( 'simulador', 'ca', false ) );
	}

	public function test_sense_equivalent_no_hi_ha_pagina(): void {
		// Slug català a l'arrel (URL antiga amb 301), slug castellà sota /ca/, pàgina fora del mapa, néta.
		$this->assertNull( nep_seo_pagina( 'com-funciona', '', false ) );
		$this->assertNull( nep_seo_pagina( 'como-funciona', 'ca', false ) );
		$this->assertNull( nep_seo_pagina( 'politica-privacitat', '', false ) );
		$this->assertNull( nep_seo_pagina( 'simulador', 'altra', false ) );
		$this->assertNull( nep_seo_pagina( 'inicio', '', false ) );
	}

	public function test_hreflang_reciproc_amb_x_default(): void {
		foreach ( array_keys( nep_pagines() ) as $clau ) {
			$urls       = array(
				'es' => $this->url( $clau, 'es' ),
				'ca' => $this->url( $clau, 'ca' ),
			);
			$alternates = nep_seo_alternates( $urls );
			$this->assertSame(
				array(
					array( 'hreflang' => 'es', 'href' => $urls['es'] ),
					array( 'hreflang' => 'ca', 'href' => $urls['ca'] ),
					array( 'hreflang' => 'x-default', 'href' => $urls['es'] ),
				),
				$alternates,
				$clau
			);
		}
	}

	public function test_sense_parella_no_hi_ha_hreflang(): void {
		$this->assertSame( array(), nep_seo_alternates( array( 'es' => 'https://noempesquen.cat/' ) ) );
		$this->assertSame( array(), nep_seo_alternates( array( 'ca' => 'https://noempesquen.cat/ca/' ) ) );
		$this->assertSame( array(), nep_seo_alternates( array() ) );
	}

	public function test_canonical_per_idioma_no_es_creua(): void {
		// Cada idioma té la seva URL (canonical a si mateixa): /ca/… i l'arrel no coincideixen mai.
		foreach ( array_keys( nep_pagines() ) as $clau ) {
			$es = $this->url( $clau, 'es' );
			$ca = $this->url( $clau, 'ca' );
			$this->assertNotSame( $es, $ca, $clau );
			$this->assertStringStartsWith( 'https://noempesquen.cat/ca/', $ca, $clau );
			$this->assertStringStartsNotWith( 'https://noempesquen.cat/ca/', $es, $clau );
		}
		$this->assertSame( 'https://noempesquen.cat/', $this->url( 'inici', 'es' ) );
		$this->assertSame( 'https://noempesquen.cat/ca/', $this->url( 'inici', 'ca' ) );
	}

	public function test_filla_de_videos_es_i_ca(): void {
		$this->assertSame( array( 'clau' => 'videos', 'fill' => 'pesca-sms' ), nep_seo_fill( 'videos/pesca-sms' ) );
		$this->assertSame( array( 'clau' => 'videos', 'fill' => 'pesca-sms' ), nep_seo_fill( 'ca/videos/pesca-sms' ) );
		$this->assertSame( array( 'clau' => 'videos', 'fill' => 'pesca-sms' ), nep_seo_fill( '/ca/videos/pesca-sms/' ) );
	}

	public function test_parella_de_filla_es_ca_i_ca_es(): void {
		$this->assertSame( '/ca/videos/pesca-sms/', nep_seo_ruta_parella_fill( 'videos/pesca-sms' ) );
		$this->assertSame( '/videos/pesca-sms/', nep_seo_ruta_parella_fill( 'ca/videos/pesca-sms' ) );
		$this->assertSame( '/videos/x/', nep_seo_ruta_fill( 'x', 'es' ) );
		$this->assertSame( '/ca/videos/x/', nep_seo_ruta_fill( 'x', 'ca' ) );
	}

	public function test_slug_amb_caracters_rars(): void {
		// WordPress desa els slugs no ASCII codificats: es conserven tal qual, sense recodificar.
		$this->assertSame( array( 'clau' => 'videos', 'fill' => 'v%c3%adleo-n%c3%ba-2' ), nep_seo_fill( 'ca/videos/v%c3%adleo-n%c3%ba-2' ) );
		$this->assertSame( '/videos/v%c3%adleo-n%c3%ba-2/', nep_seo_ruta_parella_fill( 'ca/videos/v%c3%adleo-n%c3%ba-2' ) );
		$this->assertSame( '/ca/videos/a-b_c-1/', nep_seo_ruta_parella_fill( 'videos/a-b_c-1' ) );
		$this->assertNull( nep_seo_fill( 'videos/..' ) );
		$this->assertNull( nep_seo_fill( 'videos//' ) );
	}

	public function test_no_es_filla_de_videos(): void {
		foreach ( array( '', 'ca', 'videos', 'ca/videos', 'ca/simulador', 'simulador', 'videos/a/b', 'ca/videos/a/b', 'altre/videos/x', 'ca/ca/videos/x', 'misiones/x', 'ca/missions/x', 'VIDEOS/x' ) as $ruta ) {
			$this->assertNull( nep_seo_fill( $ruta ), $ruta );
			$this->assertNull( nep_seo_ruta_parella_fill( $ruta ), $ruta );
		}
	}

	public function test_hreflang_de_filla_amb_i_sense_parella(): void {
		$es = 'https://noempesquen.cat/videos/x/';
		$ca = 'https://noempesquen.cat/ca/videos/x/';
		$this->assertSame( nep_seo_alternates( array( 'es' => $es, 'ca' => $ca ) ), nep_seo_alternates_fill( array( 'es' => $es, 'ca' => $ca ), 'ca' ) );
		// Sense parella: només el seu propi hreflang, sense x-default.
		$this->assertSame( array( array( 'hreflang' => 'ca', 'href' => $ca ) ), nep_seo_alternates_fill( array( 'ca' => $ca ), 'ca' ) );
		$this->assertSame( array( array( 'hreflang' => 'es', 'href' => $es ) ), nep_seo_alternates_fill( array( 'es' => $es ), 'es' ) );
		$this->assertSame( array(), nep_seo_alternates_fill( array(), 'es' ) );
	}

	public function test_og_locale(): void {
		$this->assertSame( 'es_ES', nep_seo_og_locale( 'es' ) );
		$this->assertSame( 'ca_ES', nep_seo_og_locale( 'ca' ) );
	}
}
