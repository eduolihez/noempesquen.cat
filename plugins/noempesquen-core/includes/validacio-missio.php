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

	if ( array_key_exists( 'passos', $guio ) ) {
		$errors = array_merge( $errors, nep_valida_passos( $guio['passos'] ) );
	}

	return $errors;
}

/** Tope de passos d'un tutorial (el mateix que `MAX_PASSOS` de valida.js). */
const NEP_MAX_PASSOS = 40;

/**
 * Passos del tutorial: subconjunt de les regles de valida.js (llista de
 * 1 a 40 passos, camps permesos, títol ≤ 60 i text ≤ 280 caràcters). Les
 * àncores, els esdeveniments i el dispositiu només els comprova el client.
 *
 * @param mixed $passos Valor de `passos`.
 * @return string[] Errors en català.
 */
function nep_valida_passos( $passos ): array {
	if ( ! is_array( $passos ) || ! array_is_list( $passos ) || ! $passos ) {
		return array( 'Els passos han de ser una llista no buida.' );
	}
	if ( count( $passos ) > NEP_MAX_PASSOS ) {
		return array( sprintf( 'Com a màxim hi pot haver %d passos.', NEP_MAX_PASSOS ) );
	}
	$errors   = array();
	$permesos = array( 'id', 'ancora', 'titol', 'text', 'continua' );
	foreach ( $passos as $i => $pas ) {
		$num = $i + 1;
		if ( ! is_array( $pas ) || array_is_list( $pas ) ) {
			$errors[] = sprintf( 'El pas %d no és vàlid.', $num );
			continue;
		}
		foreach ( array_diff( array_keys( $pas ), $permesos ) as $camp ) {
			$errors[] = sprintf( 'El pas %d té un camp desconegut: %s.', $num, $camp );
		}
		foreach ( array( 'titol' => 60, 'text' => 280 ) as $camp => $max ) {
			$v = $pas[ $camp ] ?? null;
			if ( ! is_string( $v ) || '' === trim( $v ) || mb_strlen( $v ) > $max ) {
				$errors[] = sprintf( 'El pas %d: %s invàlid (1-%d caràcters).', $num, $camp, $max );
			}
		}
	}
	return $errors;
}

/** Fitxers de /missions que no són missions jugables. */
const NEP_FITXERS_NO_MISSIO = array( 'mon.json', 'plantilla-missio.json' );

/**
 * Fitxers de les missions incloses: `*.json` de la carpeta, sense el món
 * compartit (`mon.json`) ni la plantilla de l'editor (`plantilla-missio.json`).
 *
 * @param string $carpeta Carpeta de les missions (amb la barra final).
 * @return string[]
 */
function nep_fitxers_missions_incloses( string $carpeta ): array {
	return array_values(
		array_filter(
			glob( $carpeta . '*.json' ) ?: array(),
			static fn( $f ) => ! in_array( basename( $f ), NEP_FITXERS_NO_MISSIO, true )
		)
	);
}

/**
 * Id en minúscules, sense accents ni símbols (patró de `nep_valida_guio`).
 *
 * @param string $text Text de partida (títol o id).
 * @return string Id vàlid o '' si no en queda res.
 */
function nep_slug_id( string $text ): string {
	if ( function_exists( 'remove_accents' ) ) {
		$text = remove_accents( $text );
	} elseif ( class_exists( 'Normalizer' ) ) {
		$text = (string) preg_replace( '/\p{Mn}+/u', '', (string) Normalizer::normalize( $text, Normalizer::FORM_D ) );
	}
	$text = strtolower( $text );
	return trim( (string) preg_replace( '/[^a-z0-9]+/', '-', $text ), '-' );
}

/**
 * Id únic a partir d'una base: hi afegeix -2, -3... si ja és ocupat.
 *
 * @param string   $base    Text de partida.
 * @param string[] $ocupats Ids de les missions incloses i de les del panell.
 * @return string
 */
function nep_proposa_id_missio( string $base, array $ocupats ): string {
	$base = nep_slug_id( $base );
	$base = '' === $base ? 'missio-nova' : $base;
	$id   = $base;
	for ( $n = 2; in_array( $id, $ocupats, true ); $n++ ) {
		$id = $base . '-' . $n;
	}
	return $id;
}
