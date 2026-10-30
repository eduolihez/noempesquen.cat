<?php
/**
 * Proves de `nep_valida_guio` amb els fixtures compartits amb Vitest.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Validació mínima del guió al servidor.
 */
final class ValidacioMissioTest extends TestCase {

	private const MISSIONS = __DIR__ . '/../../missions/';

	/**
	 * Llegeix un JSON com a array.
	 *
	 * @param string $fitxer Camí.
	 * @return array
	 */
	private static function llegeix( string $fitxer ): array {
		$dades = json_decode( (string) file_get_contents( $fitxer ), true );
		self::assertIsArray( $dades, $fitxer );
		return $dades;
	}

	/**
	 * Missions reals (excepte mon.json).
	 *
	 * @return array<string, array{string}>
	 */
	public static function reals(): array {
		$casos = array();
		foreach ( glob( self::MISSIONS . '*.json' ) as $fitxer ) {
			if ( 'mon.json' !== basename( $fitxer ) ) {
				$casos[ basename( $fitxer ) ] = array( $fitxer );
			}
		}
		return $casos;
	}

	/**
	 * Fixtures invàlids.
	 *
	 * @return array<string, array{string}>
	 */
	public static function invalides(): array {
		$casos = array();
		foreach ( glob( self::MISSIONS . 'test-fixtures/invalides/*.json' ) as $fitxer ) {
			$casos[ basename( $fitxer ) ] = array( $fitxer );
		}
		return $casos;
	}

	public function test_hi_ha_prou_casos(): void {
		$this->assertNotEmpty( self::reals() );
		$this->assertGreaterThanOrEqual( 8, count( self::invalides() ) );
	}

	#[DataProvider( 'reals' )]
	public function test_missio_real_es_valida( string $fitxer ): void {
		$guio = self::llegeix( $fitxer );
		$this->assertSame( array(), nep_valida_guio( $guio, $guio['dispositiu'], $guio['personatge'], array() ) );
	}

	#[DataProvider( 'reals' )]
	public function test_id_d_una_missio_inclosa_es_permes( string $fitxer ): void {
		// La remota substitueix la inclosa amb el mateix id (nucli/missions.js): només compten les altres entrades.
		$guio = self::llegeix( $fitxer );
		$this->assertSame( array(), nep_valida_guio( $guio, $guio['dispositiu'], $guio['personatge'], array( 'una-altra' ) ) );
	}

	#[DataProvider( 'invalides' )]
	public function test_fixture_invalid_dona_l_error_esperat( string $fitxer ): void {
		$fixture = self::llegeix( $fitxer );
		$meta    = $fixture['_meta'];
		$guio    = array_filter( $fixture, static fn( $clau ) => ! str_starts_with( (string) $clau, '_' ), ARRAY_FILTER_USE_KEY );
		$errors  = nep_valida_guio( $guio, $meta['dispositiu'], $meta['personatge'], $meta['ids_existents'] );

		$this->assertNotEmpty( $errors );
		$this->assertStringContainsString( $fixture['_esperat'], implode( "\n", $errors ) );
	}

	public function test_descodifica_rebutja_el_que_no_es_un_objecte(): void {
		$this->assertNull( nep_descodifica_guio( '{no json' ) );
		$this->assertNull( nep_descodifica_guio( '[1,2]' ) );
		$this->assertNull( nep_descodifica_guio( '"text"' ) );
		$this->assertNull( nep_descodifica_guio( '' ) );
		$this->assertSame( array( 'a' => 1 ), nep_descodifica_guio( '{"a":1}' ) );
	}

	public function test_versio_ha_de_ser_l_enter_2(): void {
		$guio = self::llegeix( self::MISSIONS . 'llissa-01-factura.json' );
		$guio['versio'] = '2';
		$this->assertNotEmpty( nep_valida_guio( $guio, 'pc', 'llissa', array() ) );
	}
}
