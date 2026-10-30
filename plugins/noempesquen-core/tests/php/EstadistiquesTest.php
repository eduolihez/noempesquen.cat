<?php
/**
 * Proves de les funcions pures d'estadístiques.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

use PHPUnit\Framework\TestCase;

/**
 * Agregats, hash de versió i SQL de la taula.
 */
final class EstadistiquesTest extends TestCase {

	/**
	 * Fila de prova.
	 *
	 * @param string $missio    Id.
	 * @param int    $estrelles Estrelles.
	 * @param string $decisio   Decisió ('' = cap).
	 * @param int    $n         Partides.
	 * @return array
	 */
	private static function fila( string $missio, int $estrelles, string $decisio, int $n ): array {
		return compact( 'missio', 'estrelles', 'decisio', 'n' );
	}

	public function test_mitjana_ponderada_i_decisio_mes_triada(): void {
		$r = nep_agrega_resultats(
			array(
				self::fila( 'm', 3, 'c', 6 ),
				self::fila( 'm', 1, 'a', 3 ),
				self::fila( 'm', 1, '', 1 ),
			),
			10
		);
		$this->assertTrue( $r['m']['suficient'] );
		$this->assertSame( 10, $r['m']['partides'] );
		// (6·3 + 3·1 + 1·1) / 10 = 2,2.
		$this->assertSame( 2.2, $r['m']['estrelles'] );
		$this->assertSame( 'c', $r['m']['decisio'] );
		// Percentatge sobre totes les partides (també la que no va decidir).
		$this->assertSame( 60, $r['m']['percentatge'] );
	}

	public function test_sota_el_llindar_no_revela_xifres(): void {
		$r = nep_agrega_resultats( array( self::fila( 'm', 3, 'a', 9 ) ), 10 );
		$this->assertSame(
			array(
				'suficient'   => false,
				'partides'    => null,
				'estrelles'   => null,
				'decisio'     => null,
				'percentatge' => null,
			),
			$r['m']
		);
	}

	public function test_llindar_exacte_es_suficient(): void {
		$r = nep_agrega_resultats( array( self::fila( 'm', 2, 'a', 4 ), self::fila( 'm', 2, 'a', 6 ) ), 10 );
		$this->assertTrue( $r['m']['suficient'] );
		$this->assertSame( 2.0, $r['m']['estrelles'] );
		$this->assertSame( 100, $r['m']['percentatge'] );
	}

	public function test_empat_tria_id_mes_petit(): void {
		$r = nep_agrega_resultats(
			array(
				self::fila( 'm', 1, 'c', 5 ),
				self::fila( 'm', 3, 'b', 5 ),
			),
			10
		);
		$this->assertSame( 'b', $r['m']['decisio'] );
		$this->assertSame( 50, $r['m']['percentatge'] );
	}

	public function test_sense_decisions_i_missions_separades(): void {
		$r = nep_agrega_resultats(
			array(
				self::fila( 'x', 1, '', 12 ),
				self::fila( 'y', 3, 'a', 2 ),
				self::fila( 'z', 3, 'a', 0 ),
			),
			10
		);
		$this->assertSame( array( 'x', 'y' ), array_keys( $r ) );
		$this->assertNull( $r['x']['decisio'] );
		$this->assertNull( $r['x']['percentatge'] );
		$this->assertSame( 1.0, $r['x']['estrelles'] );
		$this->assertFalse( $r['y']['suficient'] );
	}

	public function test_hash_canonic(): void {
		$a = array( 'id' => 'm', 'decisio' => array( 'opcions' => array( array( 'id' => 'a', 'text' => 'Sí/no àé' ), array( 'id' => 'b' ) ) ) );
		$b = array( 'decisio' => array( 'opcions' => array( array( 'text' => 'Sí/no àé', 'id' => 'a' ), array( 'id' => 'b' ) ) ), 'id' => 'm' );
		$this->assertMatchesRegularExpression( '/^[0-9a-f]{12}$/', nep_versio_hash( $a ) );
		// L'ordre de les claus no compta; el de les llistes sí.
		$this->assertSame( nep_versio_hash( $a ), nep_versio_hash( $b ) );
		$c                       = $a;
		$c['decisio']['opcions'] = array_reverse( $c['decisio']['opcions'] );
		$this->assertNotSame( nep_versio_hash( $a ), nep_versio_hash( $c ) );
		$d          = $a;
		$d['titol'] = 'Nou';
		$this->assertNotSame( nep_versio_hash( $a ), nep_versio_hash( $d ) );
	}

	public function test_hash_llanca_si_no_es_pot_codificar(): void {
		$this->expectException( JsonException::class );
		nep_versio_hash( array( 'x' => INF ) );
	}

	public function test_normalitza_ip(): void {
		$this->assertSame( '203.0.113.7', nep_normalitza_ip( '203.0.113.7' ) );
		$this->assertSame( '2001:db8:1:2::/64', nep_normalitza_ip( '2001:db8:1:2:aaaa:bbbb:cccc:dddd' ) );
		// Dues adreces del mateix /64 comparteixen clau.
		$this->assertSame( nep_normalitza_ip( '2001:db8:1:2::1' ), nep_normalitza_ip( '2001:DB8:1:2:ffff::9' ) );
		$this->assertNotSame( nep_normalitza_ip( '2001:db8:1:2::1' ), nep_normalitza_ip( '2001:db8:1:3::1' ) );
		$this->assertSame( '198.51.100.4', nep_normalitza_ip( '::ffff:198.51.100.4' ) );
		$this->assertSame( '', nep_normalitza_ip( '' ) );
		$this->assertSame( '', nep_normalitza_ip( 'no-es-una-ip' ) );
		$this->assertSame( '', nep_normalitza_ip( '1.2.3.4, 5.6.7.8' ) );
	}

	public function test_ids_opcions(): void {
		$this->assertSame( array( 'a', 'b' ), nep_ids_opcions( array( 'decisio' => array( 'opcions' => array( array( 'id' => 'a' ), array( 'id' => 'b' ), array( 'text' => 'x' ) ) ) ) ) );
		$this->assertSame( array(), nep_ids_opcions( array() ) );
	}

	public function test_sql_taula_sense_dades_personals(): void {
		$sql = nep_sql_taula_resultats( 'wp_nep_resultats', 'DEFAULT CHARSET=utf8mb4' );
		$this->assertStringContainsString( 'PRIMARY KEY  (id)', $sql );
		$this->assertStringContainsString( 'UNIQUE KEY resultat (missio,versio_hash,dia,estrelles,decisio)', $sql );
		$this->assertStringContainsString( "decisio varchar(32) NOT NULL DEFAULT ''", $sql );
		$this->assertDoesNotMatchRegularExpression( '/user|ip\b|time|hora/i', $sql );
	}
}
