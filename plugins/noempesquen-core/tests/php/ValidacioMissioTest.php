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
		foreach ( nep_fitxers_missions_incloses( self::MISSIONS ) as $fitxer ) {
			$casos[ basename( $fitxer ) ] = array( $fitxer );
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

	/**
	 * Fixtures vàlids (casos límit que han de passar a PHP i a JS).
	 *
	 * @return array<string, array{string}>
	 */
	public static function valides(): array {
		$casos = array();
		foreach ( glob( self::MISSIONS . 'test-fixtures/valides/*.json' ) as $fitxer ) {
			$casos[ basename( $fitxer ) ] = array( $fitxer );
		}
		return $casos;
	}

	public function test_la_plantilla_es_valida_i_no_es_inclosa(): void {
		$guio = self::llegeix( self::MISSIONS . 'plantilla-missio.json' );
		$this->assertSame( array(), nep_valida_guio( $guio, $guio['dispositiu'], $guio['personatge'], array() ) );
		$noms = array_map( 'basename', nep_fitxers_missions_incloses( self::MISSIONS ) );
		$this->assertNotContains( 'plantilla-missio.json', $noms );
		$this->assertNotContains( 'mon.json', $noms );
		$this->assertContains( 'llissa-01-factura.json', $noms );
	}

	public function test_proposa_id_unic_i_valid(): void {
		$this->assertSame( 'llissa-01-factura-copia', nep_proposa_id_missio( 'llissa-01-factura-copia', array( 'llissa-01-factura' ) ) );
		$this->assertSame( 'prova-3', nep_proposa_id_missio( 'Prova', array( 'prova', 'prova-2' ) ) );
		$this->assertSame( 'missio-nova', nep_proposa_id_missio( '¡!', array() ) );
		$this->assertMatchesRegularExpression( '/^[a-z0-9]+(-[a-z0-9]+)*$/D', nep_proposa_id_missio( '  Àlex   i Llissa! ', array() ) );
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
	public function test_missio_real_passa_pel_descodificador( string $fitxer ): void {
		$guio = nep_descodifica_guio( (string) file_get_contents( $fitxer ), $error );
		$this->assertIsArray( $guio, (string) $error );
		$this->assertSame( array(), nep_valida_guio( $guio, $guio['dispositiu'], $guio['personatge'], array() ) );
	}

	#[DataProvider( 'valides' )]
	public function test_fixture_valid_es_valid( string $fitxer ): void {
		$fixture = nep_descodifica_guio( (string) file_get_contents( $fitxer ) );
		$meta    = $fixture['_meta'];
		$guio    = array_filter( $fixture, static fn( $clau ) => ! str_starts_with( (string) $clau, '_' ), ARRAY_FILTER_USE_KEY );
		$this->assertSame( array(), nep_valida_guio( $guio, $meta['dispositiu'], $meta['personatge'], $meta['ids_existents'] ) );
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

	public function test_descodifica_rebutja_massa_gran_i_massa_profund(): void {
		$gran = '{"a":"' . str_repeat( 'x', NEP_GUIO_MIDA_MAXIMA ) . '"}';
		$this->assertNull( nep_descodifica_guio( $gran, $error ) );
		$this->assertStringContainsString( 'massa gran', (string) $error );

		$profund = str_repeat( '{"a":', 70 ) . '1' . str_repeat( '}', 70 );
		$this->assertNull( nep_descodifica_guio( $profund, $error ) );
		$this->assertStringContainsString( 'massa nivells', (string) $error );

		$this->assertNull( nep_descodifica_guio( '{no json', $error ) );
		$this->assertSame( 'El guió no és un JSON vàlid.', $error );
	}

	public function test_versio_ha_de_ser_el_numero_2(): void {
		$guio = self::llegeix( self::MISSIONS . 'llissa-01-factura.json' );
		foreach ( array( '2', 1, 2.5, null, true ) as $versio ) {
			$guio['versio'] = $versio;
			$this->assertNotEmpty( nep_valida_guio( $guio, 'pc', 'llissa', array() ), var_export( $versio, true ) );
		}
		$guio['versio'] = 2.0;
		$this->assertSame( array(), nep_valida_guio( $guio, 'pc', 'llissa', array() ) );
	}

	public function test_id_amb_salt_de_linia_final_falla(): void {
		$guio       = self::llegeix( self::MISSIONS . 'llissa-01-factura.json' );
		$guio['id'] = $guio['id'] . "\n";
		$this->assertNotEmpty( nep_valida_guio( $guio, 'pc', 'llissa', array() ) );
	}
}
