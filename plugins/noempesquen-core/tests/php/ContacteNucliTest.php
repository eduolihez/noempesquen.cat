<?php
/**
 * Proves de les funcions pures del formulari de contacte.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

use PHPUnit\Framework\TestCase;

/**
 * Saneig, validació, camp trampa i capçaleres.
 */
final class ContacteNucliTest extends TestCase {

	/**
	 * Dades vàlides de base.
	 *
	 * @param array $canvis Camps a sobreescriure.
	 * @return array
	 */
	private function base( array $canvis = array() ): array {
		return array_merge(
			array(
				'nom'        => 'Carla',
				'correu'     => 'carla@exemple.cat',
				'assumpte'   => 'Dubte',
				'missatge'   => 'Tinc un dubte sobre una missió.',
				'privacitat' => true,
			),
			$canvis
		);
	}

	public function test_dades_valides() {
		$r = nep_contacte_valida( $this->base() );
		$this->assertTrue( $r['valid'] );
		$this->assertSame( array(), $r['errors'] );
		$this->assertSame( 'Carla', $r['dades']['nom'] );
	}

	public function test_buits_obligatoris() {
		$r = nep_contacte_valida( array() );
		$this->assertFalse( $r['valid'] );
		$this->assertSame( array( 'nom', 'correu', 'assumpte', 'missatge', 'privacitat' ), array_keys( $r['errors'] ) );
		$this->assertFalse( nep_contacte_valida( null )['valid'] );
	}

	public function test_nom_limits() {
		$this->assertTrue( nep_contacte_valida( $this->base( array( 'nom' => str_repeat( 'à', 80 ) ) ) )['valid'] );
		$this->assertArrayHasKey( 'nom', nep_contacte_valida( $this->base( array( 'nom' => str_repeat( 'a', 81 ) ) ) )['errors'] );
		$this->assertArrayHasKey( 'nom', nep_contacte_valida( $this->base( array( 'nom' => '   ' ) ) )['errors'] );
		$this->assertArrayHasKey( 'nom', nep_contacte_valida( $this->base( array( 'nom' => array( 'x' ) ) ) )['errors'] );
	}

	public function test_correu() {
		$this->assertTrue( nep_contacte_email_valid( 'a@b.cat' ) );
		$this->assertFalse( nep_contacte_email_valid( 'sense-arroba' ) );
		$this->assertFalse( nep_contacte_email_valid( "a@b.cat\r\nBcc: x@y.cat" ) );
		$this->assertFalse( nep_contacte_email_valid( str_repeat( 'a', 95 ) . '@b.cat' ) );
		$this->assertFalse( nep_contacte_email_valid( null ) );
		$this->assertArrayHasKey( 'correu', nep_contacte_valida( $this->base( array( 'correu' => 'no-es-correu' ) ) )['errors'] );
	}

	public function test_assumpte_llista_blanca() {
		foreach ( nep_contacte_assumptes() as $a ) {
			$this->assertTrue( nep_contacte_valida( $this->base( array( 'assumpte' => $a ) ) )['valid'] );
		}
		$this->assertArrayHasKey( 'assumpte', nep_contacte_valida( $this->base( array( 'assumpte' => 'Spam' ) ) )['errors'] );
		$this->assertArrayHasKey( 'assumpte', nep_contacte_valida( $this->base( array( 'assumpte' => 'dubte' ) ) )['errors'] );
	}

	public function test_missatge_limits() {
		$this->assertArrayHasKey( 'missatge', nep_contacte_valida( $this->base( array( 'missatge' => str_repeat( 'a', 9 ) ) ) )['errors'] );
		$this->assertTrue( nep_contacte_valida( $this->base( array( 'missatge' => str_repeat( 'a', 10 ) ) ) )['valid'] );
		$this->assertTrue( nep_contacte_valida( $this->base( array( 'missatge' => str_repeat( 'a', 2000 ) ) ) )['valid'] );
		$this->assertArrayHasKey( 'missatge', nep_contacte_valida( $this->base( array( 'missatge' => str_repeat( 'a', 2001 ) ) ) )['errors'] );
	}

	public function test_privacitat_nomes_true_estricte() {
		foreach ( array( false, 1, '1', 'true', null ) as $v ) {
			$this->assertArrayHasKey( 'privacitat', nep_contacte_valida( $this->base( array( 'privacitat' => $v ) ) )['errors'] );
		}
	}

	public function test_neteja_etiquetes_i_salts() {
		$r = nep_contacte_valida( $this->base( array( 'nom' => "Ca<b>rla</b>\r\nBcc: x@y.cat" ) ) );
		$this->assertSame( 'Carla Bcc: x@y.cat', $r['dades']['nom'] );
		$this->assertStringNotContainsString( "\n", nep_contacte_assumpte_correu( $r['dades'] ) );
		$m = nep_contacte_valida( $this->base( array( 'missatge' => "Hola<script>x</script>\r\n\r\n\r\n\r\nque tal?" ) ) );
		$this->assertSame( "Holax\n\nque tal?", $m['dades']['missatge'] );
	}

	public function test_assumpte_i_cos() {
		$d = nep_contacte_valida( $this->base() )['dades'];
		$this->assertSame( '[No em pesquen] Dubte: Carla', nep_contacte_assumpte_correu( $d ) );
		$this->assertStringContainsString( 'carla@exemple.cat', nep_contacte_cos_correu( $d ) );
	}

	public function test_camp_trampa() {
		$this->assertFalse( nep_contacte_es_robot( $this->base() ) );
		$this->assertFalse( nep_contacte_es_robot( $this->base( array( 'web' => '' ) ) ) );
		$this->assertFalse( nep_contacte_es_robot( $this->base( array( 'web' => '  ' ) ) ) );
		$this->assertTrue( nep_contacte_es_robot( $this->base( array( 'web' => 'http://spam' ) ) ) );
		$this->assertTrue( nep_contacte_es_robot( $this->base( array( 'web' => array( 'x' ) ) ) ) );
		$this->assertTrue( nep_contacte_es_robot( $this->base( array( 'web' => 0 ) ) ) );
		$this->assertFalse( nep_contacte_es_robot( null ) );
	}

	public function test_capcaleres() {
		$this->assertSame( array( 'Reply-To: a@b.cat' ), nep_contacte_capcaleres( 'a@b.cat' ) );
		$this->assertSame( array(), nep_contacte_capcaleres( "a@b.cat\nBcc: x@y.cat" ) );
		$this->assertSame( array(), nep_contacte_capcaleres( 'no-valid' ) );
	}
}
