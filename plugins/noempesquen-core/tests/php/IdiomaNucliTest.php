<?php
/**
 * Proves de les funcions pures de l'idioma per petició.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

use PHPUnit\Framework\TestCase;

/**
 * Idioma per URL, REST/ajax amb llista blanca, locale i prefix d'enllaços.
 */
final class IdiomaNucliTest extends TestCase {

	public function test_ruta_ca(): void {
		foreach ( array( '/ca/', '/ca/x/', '/ca/simulador/', '/ca', '/ca/?a=1' ) as $uri ) {
			$this->assertSame( 'ca', nep_idioma_de_ruta( $uri, '/' ), $uri );
		}
	}

	public function test_ruta_es_sense_confondre_prefixos(): void {
		foreach ( array( '/', '/simulador/', '/cabra/', '/ca-x/', '/simulador/ca/', '', '/?lang=ca' ) as $uri ) {
			$this->assertSame( 'es', nep_idioma_de_ruta( $uri, '/' ), $uri );
		}
	}

	public function test_ruta_amb_subdirectori(): void {
		$this->assertSame( 'ca', nep_idioma_de_ruta( '/wp/ca/simulador/', '/wp' ) );
		$this->assertSame( 'es', nep_idioma_de_ruta( '/wp/simulador/', '/wp/' ) );
		$this->assertSame( 'es', nep_idioma_de_ruta( '/wpx/ca/', '/wp' ) );
	}

	public function test_pagines_ignoren_lang_i_capcalera(): void {
		$this->assertSame( 'es', nep_idioma_de_peticio( '/simulador/?lang=ca', '/', false, 'ca', 'ca' ) );
		$this->assertSame( 'ca', nep_idioma_de_peticio( '/ca/simulador/', '/', false, 'es', 'es' ) );
	}

	public function test_api_amb_lang_i_capcalera(): void {
		$this->assertSame( 'ca', nep_idioma_de_peticio( '/wp-json/x', '/', true, 'ca', null ) );
		$this->assertSame( 'ca', nep_idioma_de_peticio( '/wp-json/x', '/', true, null, 'CA' ) );
		$this->assertSame( 'es', nep_idioma_de_peticio( '/wp-json/x', '/', true, 'es', 'ca' ) );
		$this->assertSame( 'es', nep_idioma_de_peticio( '/wp-json/x', '/', true, null, null ) );
		$this->assertSame( 'es', nep_idioma_de_peticio( '/ca/wp-json/x', '/', true, null, null ) );
		$this->assertSame( 'es', nep_idioma_de_peticio( '/wp-json/x', '/', true, 'fr', 'en' ) );
		$this->assertSame( 'es', nep_idioma_de_peticio( '/wp-json/x', '/', true, array( 'ca' ), null ) );
		$this->assertSame( 'ca', nep_idioma_de_peticio( '/wp-json/x', '/', true, 'xx', 'ca' ) );
	}

	public function test_detecta_rest(): void {
		$this->assertTrue( nep_es_ruta_rest( '/wp-json/noempesquen/v1/missions', '/' ) );
		$this->assertTrue( nep_es_ruta_rest( '/?rest_route=/noempesquen/v1/', '/' ) );
		$this->assertTrue( nep_es_ruta_rest( '/wp/api/x', '/wp', 'api' ) );
		$this->assertFalse( nep_es_ruta_rest( '/wp-jsonx/', '/' ) );
		$this->assertFalse( nep_es_ruta_rest( '/simulador/', '/' ) );
	}

	public function test_locale_i_llista(): void {
		$this->assertSame( array( 'es', 'ca' ), nep_idiomes() );
		$this->assertSame( 'ca', nep_locale_idioma( 'ca' ) );
		$this->assertSame( 'es_ES', nep_locale_idioma( 'es' ) );
	}

	public function test_ruta_amb_prefix(): void {
		$this->assertSame( '/ca/simulador/', nep_ruta_idioma( '/simulador/', 'ca' ) );
		$this->assertSame( '/simulador/', nep_ruta_idioma( '/simulador/', 'es' ) );
		$this->assertSame( '/ca/', nep_ruta_idioma( '/', 'ca' ) );
		$this->assertSame( '/simulador/', nep_ruta_idioma( 'simulador/', 'es' ) );
	}

	public function test_majuscules_i_codificacio_donen_es(): void {
		$this->assertSame( 'es', nep_idioma_de_ruta( '/CA/simulador/', '/' ) );
		$this->assertSame( 'es', nep_idioma_de_ruta( '/%63a/simulador/', '/' ) );
	}

	public function test_locale_usuari_a_l_editor(): void {
		$this->assertTrue( nep_respecta_locale_usuari( 'user' ) );
		$this->assertFalse( nep_respecta_locale_usuari( 'user', 'ca' ) );
		$this->assertFalse( nep_respecta_locale_usuari( 'user', null, 'ca' ) );
		$this->assertFalse( nep_respecta_locale_usuari( 'site' ) );
		$this->assertFalse( nep_respecta_locale_usuari( null ) );
	}

	public function test_lang_html(): void {
		$this->assertSame( 'es-ES', nep_lang_html( 'es_ES' ) );
		$this->assertSame( 'ca', nep_lang_html( 'ca' ) );
	}

	public function test_ruta_pagina_per_idioma(): void {
		$this->assertSame( '/cuenta/', nep_ruta_pagina( 'compte', 'es' ) );
		$this->assertSame( '/compte/', nep_ruta_pagina( 'compte', 'ca' ) );
		$this->assertSame( '/ca/compte/', nep_ruta_idioma( nep_ruta_pagina( 'compte', 'ca' ), 'ca' ) );
		$this->assertSame( '/sobre-el-proyecto/', nep_ruta_pagina( 'projecte', 'es' ) );
		$this->assertSame( '/simulador/', nep_ruta_pagina( 'inexistent', 'ca' ) );
		$this->assertSame( '/', nep_ruta_pagina( 'inici', 'es' ) );
		$this->assertSame( '/ca/', nep_ruta_idioma( nep_ruta_pagina( 'inici', 'ca' ), 'ca' ) );
		$this->assertSame( '/como-funciona/', nep_ruta_pagina( 'com-funciona', 'es' ) );
		$this->assertSame( '/com-funciona/', nep_ruta_pagina( 'com-funciona', 'ca' ) );
		$this->assertSame( '/misiones/', nep_ruta_pagina( 'missions', 'es' ) );
		$this->assertSame( '/missions/', nep_ruta_pagina( 'missions', 'ca' ) );
	}

	public function test_pagines_font_unica(): void {
		$pagines = nep_pagines();
		$this->assertSame( array( 'inici', 'simulador', 'com-funciona', 'missions', 'compte', 'contacte', 'projecte' ), array_keys( $pagines ) );
		foreach ( $pagines as $slugs ) {
			$this->assertSame( array( 'es', 'ca' ), array_keys( $slugs ) );
		}
	}

	public function test_idioma_de_meta_usuari(): void {
		$this->assertSame( 'es', nep_idioma_de_meta_usuari( 'es' ) );
		$this->assertSame( 'ca', nep_idioma_de_meta_usuari( '' ) );
		$this->assertSame( 'ca', nep_idioma_de_meta_usuari( 'fr' ) );
	}
}
