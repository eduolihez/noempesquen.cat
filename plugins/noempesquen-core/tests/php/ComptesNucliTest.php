<?php
/**
 * Proves de les funcions pures de comptes.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

use PHPUnit\Framework\TestCase;

/**
 * Validació, saneig i fusió.
 */
final class ComptesNucliTest extends TestCase {

	public function test_email() {
		$this->assertTrue( nep_valida_email( 'a@b.cat' ) );
		$this->assertFalse( nep_valida_email( 'a b@c.cat' ) );
		$this->assertFalse( nep_valida_email( 'sense-arroba' ) );
		$this->assertFalse( nep_valida_email( str_repeat( 'a', 95 ) . '@b.cat' ) );
		$this->assertFalse( nep_valida_email( null ) );
	}

	public function test_contrasenya_limits() {
		$this->assertFalse( nep_valida_contrasenya( str_repeat( 'a', 9 ) ) );
		$this->assertTrue( nep_valida_contrasenya( str_repeat( 'a', 10 ) ) );
		$this->assertTrue( nep_valida_contrasenya( str_repeat( 'a', 128 ) ) );
		$this->assertFalse( nep_valida_contrasenya( str_repeat( 'a', 129 ) ) );
		$this->assertFalse( nep_valida_contrasenya( 1234567890 ) );
	}

	public function test_sanea_progres() {
		$ids = array( 'una', 'dos-tres' );
		$this->assertSame(
			array(
				'una'      => 3,
				'dos-tres' => 0,
			),
			nep_sanea_progres(
				array(
					'una'      => 3,
					'dos-tres' => 0,
				),
				$ids
			)
		);
		$this->assertSame( array(), nep_sanea_progres( array( 'altra' => 2 ), $ids ) );
		$this->assertSame( array(), nep_sanea_progres( array( 'una' => 4 ), $ids ) );
		$this->assertSame( array(), nep_sanea_progres( array( 'una' => -1 ), $ids ) );
		$this->assertSame( array(), nep_sanea_progres( array( 'una' => '2' ), $ids ) );
		$this->assertSame( array(), nep_sanea_progres( array( 'una' => 2.5 ), $ids ) );
		$this->assertSame( array(), nep_sanea_progres( 'x', $ids ) );
		$this->assertCount(
			1,
			nep_sanea_progres(
				array(
					'una'      => 1,
					'dos-tres' => 1,
				),
				array( 'una' )
			)
		);
	}

	public function test_fusiona() {
		$this->assertSame(
			array(
				'a' => 3,
				'b' => 2,
				'c' => 1,
			),
			nep_fusiona_progres(
				array(
					'a' => 3,
					'b' => 1,
				),
				array(
					'a' => 2,
					'b' => 2,
					'c' => 1,
				)
			)
		);
	}

	public function test_consentiment() {
		$this->assertTrue(
			nep_consentiment_valid(
				array(
					'acepta'       => true,
					'majoria_edat' => true,
				)
			)
		);
		$this->assertFalse( nep_consentiment_valid( array( 'acepta' => true ) ) );
		$this->assertFalse(
			nep_consentiment_valid(
				array(
					'acepta'       => true,
					'majoria_edat' => 'true',
				)
			)
		);
		$this->assertFalse(
			nep_consentiment_valid(
				array(
					'acepta'       => 1,
					'majoria_edat' => true,
				)
			)
		);
		$this->assertFalse( nep_consentiment_valid( null ) );
		$this->assertSame( '2026-10-31', NEP_VERSIO_CONSENTIMENT );
	}
}
