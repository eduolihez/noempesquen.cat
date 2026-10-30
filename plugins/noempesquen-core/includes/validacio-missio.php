<?php
/**
 * Validació mínima del guió d'una missió al servidor.
 *
 * Funcions pures (sense crides a WordPress) perquè es puguin provar amb PHPUnit
 * sense carregar WordPress. Les regles completes són les de JS (`validaMissio`
 * a `src/blocks/simulador/nucli/valida.js`); aquí només n'hi ha un subconjunt,
 * i els fixtures de `missions/test-fixtures/` eviten que les dues derivin.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Descodifica el JSON del guió.
 *
 * @param string $json Text JSON.
 * @return array|null Guió com a array associatiu, o null si no és un objecte JSON vàlid.
 */
function nep_descodifica_guio( string $json ): ?array {
	$objecte = json_decode( $json );
	if ( ! is_object( $objecte ) ) {
		return null;
	}
	$guio = json_decode( $json, true );
	return is_array( $guio ) ? $guio : null;
}

/**
 * Valida el subconjunt mínim de regles d'un guió v2.
 *
 * @param array    $guio          Guió descodificat.
 * @param string   $dispositiu    Meta `nep_dispositiu` de l'entrada.
 * @param string   $personatge    Meta `nep_personatge` de l'entrada.
 * @param string[] $ids_existents Ids de guió d'altres entrades `nep_missio`.
 * @return string[] Errors en català (llista buida = vàlid).
 */
function nep_valida_guio( array $guio, string $dispositiu, string $personatge, array $ids_existents ): array {
	$errors = array();

	if ( ! array_key_exists( 'versio', $guio ) || 2 !== $guio['versio'] ) {
		$errors[] = 'La versió del guió ha de ser 2.';
	}

	$id = $guio['id'] ?? null;
	if ( ! is_string( $id ) || '' === $id ) {
		$errors[] = 'Falta l\'id de la missió.';
	} elseif ( ! preg_match( '/^[a-z0-9]+(-[a-z0-9]+)*$/', $id ) ) {
		$errors[] = 'L\'id només pot tenir minúscules, xifres i guions (p. ex. llissa-06-exemple).';
	} elseif ( in_array( $id, $ids_existents, true ) ) {
		$errors[] = sprintf( 'Ja hi ha una altra missió amb l\'id «%s».', $id );
	}

	$titol = $guio['titol'] ?? null;
	if ( ! is_string( $titol ) || '' === trim( $titol ) ) {
		$errors[] = 'Falta el títol de la missió.';
	}

	$guio_dispositiu = $guio['dispositiu'] ?? null;
	if ( ! in_array( $guio_dispositiu, array( 'pc', 'mobil' ), true ) ) {
		$errors[] = 'El dispositiu ha de ser «pc» o «mobil».';
	} elseif ( $guio_dispositiu !== $dispositiu ) {
		$errors[] = sprintf( 'El dispositiu del guió («%s») no coincideix amb el de la missió («%s»).', $guio_dispositiu, $dispositiu );
	}

	$guio_personatge = $guio['personatge'] ?? null;
	if ( ! in_array( $guio_personatge, array( 'llissa', 'remei' ), true ) ) {
		$errors[] = 'El personatge ha de ser «llissa» o «remei».';
	} elseif ( $guio_personatge !== $personatge ) {
		$errors[] = sprintf( 'El personatge del guió («%s») no coincideix amb el de la missió («%s»).', $guio_personatge, $personatge );
	}

	return $errors;
}
