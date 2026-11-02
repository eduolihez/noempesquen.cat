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
		$this->assertFalse(
			nep_consentiment_valid(
				array(
					'acepta'       => '1',
					'majoria_edat' => '1',
				)
			)
		);
		$this->assertFalse(
			nep_consentiment_valid(
				array(
					'acepta'       => true,
					'majoria_edat' => 1,
				)
			)
		);
		$this->assertFalse( nep_consentiment_valid( null ) );
		$this->assertSame( '2026-10-31', NEP_VERSIO_CONSENTIMENT );
	}

	public function test_token_genera() {
		$b = str_repeat( "", 32 );
		$this->assertSame( '7.' . str_repeat( '01', 32 ), nep_token_genera( 7, $b ) );
		$this->assertSame( '', nep_token_genera( 0, $b ) );
		$this->assertSame( '', nep_token_genera( 7, str_repeat( 'a', 31 ) ) );
		$this->assertSame( '', nep_token_genera( 7, str_repeat( 'a', 33 ) ) );
	}

	public function test_token_parseja() {
		$h = str_repeat( 'ab', 32 );
		$this->assertSame(
			array(
				'id'     => 42,
				'secret' => $h,
			),
			nep_token_parseja( '42.' . $h )
		);
		$invalids = array(
			'',
			null,
			array( '42.' . $h ),
			'42.' . strtoupper( $h ),
			'42.' . substr( $h, 1 ),
			'42.' . $h . 'a',
			'007.' . $h,
			'0.' . $h,
			'12345678901.' . $h,
			' 42.' . $h,
			'42.' . $h . "
",
			'42' . $h,
		);
		foreach ( $invalids as $i ) {
			$this->assertNull( nep_token_parseja( $i ) );
		}
	}

	public function test_token_hash() {
		$this->assertSame( hash_hmac( 'sha256', 's', 'sal' ), nep_token_hash( 's', 'sal' ) );
		$this->assertSame( nep_token_hash( 's', 'sal' ), nep_token_hash( 's', 'sal' ) );
		$this->assertNotSame( nep_token_hash( 's', 'sal' ), nep_token_hash( 's', 'altra' ) );
		$this->assertSame( '', nep_token_hash( 's', '' ) );
	}

	public function test_token_registre_i_valid() {
		$this->assertSame( 172800, NEP_TTL_VERIFICA );
		$this->assertSame( 3600, NEP_TTL_RECUPERA );
		$r = nep_token_registre( 'sec', 'sal', 1000, NEP_TTL_RECUPERA );
		$this->assertSame( 4600, $r['caduca'] );
		$this->assertSame( nep_token_hash( 'sec', 'sal' ), $r['hash'] );
		$this->assertTrue( nep_token_valid( $r, 'sec', 'sal', 1000 ) );
		$this->assertTrue( nep_token_valid( $r, 'sec', 'sal', 4600 ) );
		$this->assertFalse( nep_token_valid( $r, 'sec', 'sal', 4601 ) );
		$this->assertFalse( nep_token_valid( $r, 'mal', 'sal', 1000 ) );
		$this->assertFalse( nep_token_valid( $r, 'sec', '', 1000 ) );
		$this->assertFalse( nep_token_valid( null, 'sec', 'sal', 1000 ) );
		$this->assertFalse( nep_token_valid( $r, 'sec', 'sal', null ) );
		$this->assertFalse( nep_token_valid( $r, 'sec', 'sal', '1000' ) );
		$this->assertFalse( nep_token_valid( $r, null, 'sal', 1000 ) );
		$this->assertFalse( nep_token_valid( array( 'hash' => 'abc', 'caduca' => 5000 ), 'sec', 'sal', 1000 ) );
		$this->assertSame( array(), nep_token_registre( 'sec', '', 1000, 60 ) );
		$this->assertSame( array(), nep_token_registre( 'sec', 'sal', '1000', 60 ) );
		$this->assertSame( array(), nep_token_registre( 'sec', 'sal', 1000, null ) );
		$this->assertFalse( nep_token_valid( array( 'hash' => $r['hash'] ), 'sec', 'sal', 1000 ) );
		$this->assertFalse( nep_token_valid( array( 'hash' => 1, 'caduca' => 5000 ), 'sec', 'sal', 1000 ) );
		$this->assertFalse( nep_token_valid( array( 'hash' => $r['hash'], 'caduca' => '5000' ), 'sec', 'sal', 1000 ) );
	}
}
