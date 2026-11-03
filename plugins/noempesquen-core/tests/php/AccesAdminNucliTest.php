<?php
/**
 * Proves de les funcions pures de l'accés amagat a l'administració.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

use PHPUnit\Framework\TestCase;

/**
 * Ruta secreta, reescriptura d'adreces i detecció de la petició.
 */
final class AccesAdminNucliTest extends TestCase {

	public function test_slug_per_defecte(): void {
		$this->assertSame( 'admin', nep_admin_slug() );
	}

	public function test_reescriu_login_amb_i_sense_consulta(): void {
		$this->assertSame( 'https://x.cat/admin/', nep_admin_reescriu_url( 'https://x.cat/wp-login.php', 'admin' ) );
		$this->assertSame(
			'https://x.cat/admin/?action=lostpassword',
			nep_admin_reescriu_url( 'https://x.cat/wp-login.php?action=lostpassword', 'admin' )
		);
		$this->assertSame( 'https://x.cat/blog/porta/?a=1', nep_admin_reescriu_url( 'https://x.cat/blog/wp-login.php?a=1', 'porta' ) );
	}

	public function test_no_toca_altres_adreces(): void {
		foreach ( array( 'https://x.cat/', 'https://x.cat/compte/', 'https://x.cat/wp-login.phpx', 'https://x.cat/wp-admin/' ) as $url ) {
			$this->assertSame( $url, nep_admin_reescriu_url( $url, 'admin' ) );
		}
	}

	public function test_detecta_la_ruta_secreta(): void {
		$this->assertTrue( nep_admin_es_ruta( '/admin', '/', 'admin' ) );
		$this->assertTrue( nep_admin_es_ruta( '/admin/', '/', 'admin' ) );
		$this->assertTrue( nep_admin_es_ruta( '/blog/admin/', '/blog', 'admin' ) );
		$this->assertFalse( nep_admin_es_ruta( '/admin/x', '/', 'admin' ) );
		$this->assertFalse( nep_admin_es_ruta( '/administrador', '/', 'admin' ) );
		$this->assertFalse( nep_admin_es_ruta( '/wp-admin/', '/', 'admin' ) );
		$this->assertFalse( nep_admin_es_ruta( '/', '/', 'admin' ) );
	}
}
