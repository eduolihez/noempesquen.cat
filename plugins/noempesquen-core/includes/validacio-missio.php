<?php
/**
 * Validació mínima del guió d'una missió al servidor.
 *
 * Funcions pures (sense crides a WordPress) perquè es puguin provar amb PHPUnit
 * sense carregar WordPress. Les regles completes són les de JS (`validaMissio`
 * a `src/blocks/simulador/nucli/valida.js`); aquí només n'hi ha un subconjunt,
 * que JS també aplica, excepte les que necessiten dades de l'entrada (id
 * duplicat i meta diferent del guió). Els fixtures de `missions/test-fixtures/`
 * eviten que les dues derivin.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

/** Mida màxima del JSON del guió (bytes). */
const NEP_GUIO_MIDA_MAXIMA = 524288;

/** Nivells màxims d'imbricació del JSON del guió. */
const NEP_GUIO_PROFUNDITAT = 64;

/**
 * Descodifica el JSON del guió (una sola vegada, com a arrays).
 *
 * @param string      $json  Text JSON.
 * @param string|null $error Missatge en català si no es pot descodificar.
 * @return array|null Guió com a array associatiu, o null si no és un objecte JSON vàlid.
 */
function nep_descodifica_guio( string $json, ?string &$error = null ): ?array {
	$error = null;
	if ( strlen( $json ) > NEP_GUIO_MIDA_MAXIMA ) {
		$error = 'El guió és massa gran (màxim 512 KB).';
		return null;
	}
	$guio = json_decode( $json, true, NEP_GUIO_PROFUNDITAT );
	if ( JSON_ERROR_DEPTH === json_last_error() ) {
		$error = 'El guió té massa nivells d\'imbricació (màxim 64).';
		return null;
	}
	// Amb arrays, «{}» i «[]» donen el mateix: només s'accepta un objecte.
	if ( ! is_array( $guio ) || '{' !== substr( ltrim( $json ), 0, 1 ) ) {
		$error = 'El guió no és un JSON vàlid.';
		return null;
	}
	return $guio;
}

/**
 * La versió ha de ser el número 2. `2.0` compta com a 2 perquè JS no els
 * distingeix (`JSON.parse( '2.0' ) === 2`); el text «2» no.
 *
 * @param mixed $versio Valor del guió.
 * @return bool
 */
function nep_versio_valida( $versio ): bool {
	return ( is_int( $versio ) || is_float( $versio ) ) && 2.0 === (float) $versio;
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

	if ( ! nep_versio_valida( $guio['versio'] ?? null ) ) {
		$errors[] = 'La versió del guió ha de ser 2.';
	}

	$id = $guio['id'] ?? null;
	if ( ! is_string( $id ) || '' === $id ) {
		$errors[] = 'Falta l\'id de la missió.';
	} elseif ( ! preg_match( '/^[a-z0-9]+(-[a-z0-9]+)*$/D', $id ) ) {
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
