<?php
/**
 * Estadístiques agregades i anònimes de les partides acabades.
 *
 * Cada partida suma 1 a un comptador per (missió, versió del guió, dia,
 * estrelles, decisió). A la taula no hi ha res que identifiqui ningú: ni
 * usuari, ni IP, ni hora (només el dia). El límit d'enviaments sí que fa
 * servir la IP, seudonimitzada (HMAC amb sal diària) en un transient que
 * caduca en una hora com a màxim i que no es relaciona amb les files.
 * Les funcions pures (sense WordPress) es proven amb PHPUnit; la resta
 * necessita WordPress.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

/** Enviaments màxims per clau (IP seudonimitzada) i finestra. Ajustable. */
const NEP_RESULTATS_LIMIT = 30;

/** Enviaments màxims de tothom junt per finestra (fre contra inundacions des de moltes IP). Ajustable. */
const NEP_RESULTATS_LIMIT_GLOBAL = 2000;

/** Transient del comptador global. */
const NEP_CLAU_LIMIT_GLOBAL = 'nep_rl_global';

/** Transient amb el cau de les missions jugables. */
const NEP_CAU_MISSIONS = 'nep_cau_missions';

/** Durada de la finestra del límit, en segons (1 hora). */
const NEP_RESULTATS_FINESTRA = 3600;

/** Patró d'id de missió (el mateix que `nep_valida_guio`). `\z`: cap salt de línia final (el `$` de PCRE l'admet). */
const NEP_PATRO_ID = '^[a-z0-9]+(-[a-z0-9]+)*\z';

/** Partides mínimes per mostrar xifres d'una missió al panell. */
const NEP_RESULTATS_K = 10;

/**
 * SQL de la taula per a dbDelta (sintaxi estricta: un camp per línia, dos
 * espais després de PRIMARY KEY). `decisio` és '' quan no n'hi ha: amb NULL
 * la clau única no col·lidiria mai i l'UPSERT afegiria files.
 *
 * @param string $taula           Nom complet de la taula.
 * @param string $charset_collate Charset i collation de la base de dades.
 * @return string
 */
function nep_sql_taula_resultats( string $taula, string $charset_collate ): string {
	return "CREATE TABLE {$taula} (
id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
missio varchar(64) NOT NULL,
versio_hash varchar(12) NOT NULL,
dia date NOT NULL,
estrelles tinyint(3) unsigned NOT NULL,
decisio varchar(32) NOT NULL DEFAULT '',
n int(10) unsigned NOT NULL DEFAULT 0,
PRIMARY KEY  (id),
UNIQUE KEY resultat (missio,versio_hash,dia,estrelles,decisio),
KEY dia (dia)
) {$charset_collate};";
}

/**
 * Guió en forma canònica: claus dels objectes ordenades (les llistes no).
 *
 * @param mixed $valor Valor descodificat.
 * @return mixed
 */
function nep_canonic( $valor ) {
	if ( ! is_array( $valor ) ) {
		return $valor;
	}
	$valor = array_map( 'nep_canonic', $valor );
	if ( ! array_is_list( $valor ) ) {
		ksort( $valor, SORT_STRING );
	}
	return $valor;
}

/**
 * Hash de versió d'un guió: 12 primers hex del sha1 del JSON canònic.
 * El calcula sempre el servidor, mai el client. Si el guió no es pot
 * codificar llança l'excepció (abans tots els guions fallits compartien el
 * hash de la cadena buida).
 *
 * @param array $guio Guió descodificat.
 * @return string
 * @throws JsonException Si el guió no es pot codificar.
 */
function nep_versio_hash( array $guio ): string {
	$json = json_encode( nep_canonic( $guio ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR );
	return substr( sha1( $json ), 0, 12 );
}

/**
 * Normalitza la IP per al límit: una IPv6 compta pel seu /64 (un sol client
 * en sol tenir un de sencer); una IPv4 (també mapejada en IPv6) tal com és.
 * Una adreça no vàlida torna ''.
 *
 * @param string $ip Adreça.
 * @return string
 */
function nep_normalitza_ip( string $ip ): string {
	if ( false !== filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 ) ) {
		return $ip;
	}
	if ( false === filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6 ) ) {
		return '';
	}
	$bin = (string) inet_pton( $ip );
	if ( str_starts_with( $bin, str_repeat( "\0", 10 ) . "\xff\xff" ) ) {
		return (string) inet_ntop( substr( $bin, 12 ) );
	}
	return inet_ntop( substr( $bin, 0, 8 ) . str_repeat( "\0", 8 ) ) . '/64';
}

/**
 * Ids de les opcions de la decisió d'un guió.
 *
 * @param array $guio Guió descodificat.
 * @return string[]
 */
function nep_ids_opcions( array $guio ): array {
	$opcions = $guio['decisio']['opcions'] ?? array();
	if ( ! is_array( $opcions ) ) {
		return array();
	}
	$ids = array();
	foreach ( $opcions as $opcio ) {
		if ( is_array( $opcio ) && isset( $opcio['id'] ) && is_string( $opcio['id'] ) ) {
			$ids[] = $opcio['id'];
		}
	}
	return $ids;
}

/**
 * Agrega les files per missió.
 *
 * - `estrelles`: mitjana ponderada per `n`.
 * - `decisio`: la més triada entre les partides amb decisió; en empat, l'id
 *   més petit (ordre de text). `percentatge` es calcula sobre **totes** les
 *   partides de la missió (també les que no van arribar a decidir).
 * - Amb menys de `$k` partides, `suficient` és fals i no es torna cap xifra
 *   (ni el nombre de partides).
 * - Amb `$opcions`, una decisió que no hi és (opció esborrada o sense text)
 *   no compta per a la més triada; la partida sí.
 *
 * @param array                        $files   Files `missio`, `estrelles`, `decisio`, `n` (de qualsevol període).
 * @param int                          $k       Partides mínimes per mostrar xifres.
 * @param array<string, string[]>|null $opcions Ids d'opció vàlids per missió (null = totes).
 * @return array<string, array{suficient: bool, partides: ?int, estrelles: ?float, decisio: ?string, percentatge: ?int}>
 */
function nep_agrega_resultats( array $files, int $k, ?array $opcions = null ): array {
	$acumulat = array();
	foreach ( $files as $fila ) {
		$missio = (string) ( $fila['missio'] ?? '' );
		$n      = (int) ( $fila['n'] ?? 0 );
		if ( '' === $missio || $n <= 0 ) {
			continue;
		}
		$acumulat[ $missio ] ??= array(
			'partides'  => 0,
			'suma'      => 0,
			'decisions' => array(),
		);
		$acumulat[ $missio ]['partides'] += $n;
		$acumulat[ $missio ]['suma']     += $n * (int) ( $fila['estrelles'] ?? 0 );
		$decisio                          = (string) ( $fila['decisio'] ?? '' );
		if ( '' !== $decisio && ( null === $opcions || in_array( $decisio, $opcions[ $missio ] ?? array(), true ) ) ) {
			$acumulat[ $missio ]['decisions'][ $decisio ] = ( $acumulat[ $missio ]['decisions'][ $decisio ] ?? 0 ) + $n;
		}
	}

	$resultat = array();
	foreach ( $acumulat as $missio => $a ) {
		if ( $a['partides'] < $k ) {
			$resultat[ $missio ] = array(
				'suficient'   => false,
				'partides'    => null,
				'estrelles'   => null,
				'decisio'     => null,
				'percentatge' => null,
			);
			continue;
		}
		$decisio = null;
		$vots    = 0;
		$ids     = array_keys( $a['decisions'] );
		sort( $ids, SORT_STRING );
		foreach ( $ids as $id ) {
			if ( $a['decisions'][ $id ] > $vots ) {
				$decisio = (string) $id;
				$vots    = $a['decisions'][ $id ];
			}
		}
		$resultat[ $missio ] = array(
			'suficient'   => true,
			'partides'    => $a['partides'],
			'estrelles'   => round( $a['suma'] / $a['partides'], 1 ),
			'decisio'     => $decisio,
			'percentatge' => null === $decisio ? null : (int) round( 100 * $vots / $a['partides'] ),
		);
	}
	ksort( $resultat, SORT_STRING );
	return $resultat;
}

/**
 * Separa les files de la versió actual del guió de cada missió de la resta
 * (versions anteriors o missions que ja no es juguen).
 *
 * @param array                 $files  Files amb `missio`, `versio_hash` i `n`.
 * @param array<string, string> $hashes Hash actual per missió.
 * @return array{actuals: array, antigues: int} Files actuals i partides que no compten.
 */
function nep_files_versio_actual( array $files, array $hashes ): array {
	$actuals  = array();
	$antigues = 0;
	foreach ( $files as $fila ) {
		$missio = (string) ( $fila['missio'] ?? '' );
		if ( isset( $hashes[ $missio ] ) && $hashes[ $missio ] === (string) ( $fila['versio_hash'] ?? '' ) ) {
			$actuals[] = $fila;
		} else {
			$antigues += max( 0, (int) ( $fila['n'] ?? 0 ) );
		}
	}
	return array(
		'actuals'  => $actuals,
		'antigues' => $antigues,
	);
}

/**
 * Franja de partides per mostrar: «<10», «10-19», «20-49» o «50+».
 *
 * @param int $n Partides.
 * @return string
 */
function nep_franja_partides( int $n ): string {
	if ( $n < 10 ) {
		return '<10';
	}
	if ( $n < 20 ) {
		return '10-19';
	}
	return $n < 50 ? '20-49' : '50+';
}

/**
 * Franja de 10 punts d'un percentatge: «0-9 %», …, «90-100 %».
 *
 * @param int $p Percentatge (0-100).
 * @return string
 */
function nep_franja_percentatge( int $p ): string {
	$p   = max( 0, min( 100, $p ) );
	$des = min( 90, intdiv( $p, 10 ) * 10 );
	return $des . '-' . ( 90 === $des ? 100 : $des + 9 ) . ' %';
}

/**
 * Nom complet de la taula.
 *
 * @return string
 */
function nep_taula_resultats(): string {
	global $wpdb;
	return $wpdb->prefix . 'nep_resultats';
}

/**
 * Crea o actualitza la taula (des de `nep_actualitza()`).
 *
 * dbDelta no diu si ha fallat: es comprova després que la taula existeixi.
 *
 * @return bool Cert si la taula existeix.
 */
function nep_crea_taula_resultats(): bool {
	global $wpdb;
	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	$taula = nep_taula_resultats();
	dbDelta( nep_sql_taula_resultats( $taula, $wpdb->get_charset_collate() ) );
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Comprovació de l'esquema just després de dbDelta.
	if ( $taula === $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $wpdb->esc_like( $taula ) ) ) ) {
		return true;
	}
	error_log( 'noempesquen: no s\'ha pogut crear la taula d\'estadístiques: ' . $wpdb->last_error ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Error d'esquema per a l'administrador.
	set_transient( 'nep_avis_taula', 1, DAY_IN_SECONDS );
	return false;
}

/**
 * Missions jugables (les mateixes que veu el client): les incloses
 * (`missions/*.json`, sense `mon.json`) i les publicades al panell, que
 * substitueixen per id les incloses.
 *
 * Es desa en un transient (una hora com a màxim) que s'esborra quan canvia
 * una missió del panell; la signatura dels fitxers inclosos (nom i data)
 * l'invalida també després d'un desplegament.
 *
 * @return array<string, array> Guió per id.
 */
function nep_missions_jugables(): array {
	$fitxers = array_filter(
		glob( NEP_PATH . 'missions/*.json' ) ?: array(),
		static fn( $f ) => 'mon.json' !== basename( $f )
	);
	$firma   = md5( implode( '|', array_map( static fn( $f ) => basename( $f ) . ':' . filemtime( $f ), $fitxers ) ) );
	$cau     = get_transient( NEP_CAU_MISSIONS );
	if ( is_array( $cau ) && ( $cau['firma'] ?? '' ) === $firma && is_array( $cau['missions'] ?? null ) ) {
		return $cau['missions'];
	}

	$missions = array();
	foreach ( $fitxers as $fitxer ) {
		$guio = nep_descodifica_guio( (string) file_get_contents( $fitxer ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Fitxer local del plugin.
		if ( $guio && isset( $guio['id'] ) && is_string( $guio['id'] ) ) {
			$missions[ $guio['id'] ] = $guio;
		}
	}

	$posts = get_posts(
		array(
			'post_type'      => 'nep_missio',
			'post_status'    => 'publish',
			'posts_per_page' => -1, // Totes: si en faltés una, els seus resultats es rebutjarien.
			'orderby'        => 'menu_order',
			'order'          => 'ASC',
			'fields'         => 'ids',
			'no_found_rows'  => true,
		)
	);
	foreach ( $posts as $post_id ) {
		$guio = nep_descodifica_guio( (string) get_post_meta( $post_id, 'nep_guio', true ) );
		if ( $guio && isset( $guio['id'] ) && is_string( $guio['id'] ) && preg_match( '/' . NEP_PATRO_ID . '/D', $guio['id'] ) ) {
			$missions[ $guio['id'] ] = $guio;
		}
	}
	set_transient(
		NEP_CAU_MISSIONS,
		array(
			'firma'    => $firma,
			'missions' => $missions,
		),
		HOUR_IN_SECONDS
	);
	return $missions;
}

/**
 * Esborra el cau de missions jugables.
 */
function nep_buida_cau_missions(): void {
	delete_transient( NEP_CAU_MISSIONS );
}

/**
 * Sal del dia per al límit d'enviaments (`data|aleatori`). Es regenera quan
 * canvia la data, de manera que la clau d'ahir no es pot relacionar amb la d'avui.
 *
 * @return string
 */
function nep_sal_dia(): string {
	$avui = gmdate( 'Y-m-d' );
	$sal  = (string) get_option( 'nep_sal_dia', '' );
	if ( ! str_starts_with( $sal, $avui . '|' ) ) {
		$sal = $avui . '|' . wp_generate_password( 32, false );
		update_option( 'nep_sal_dia', $sal, false );
	}
	return $sal;
}

/**
 * Nom del transient del límit per a una IP: un seudònim (HMAC amb la sal
 * d'autenticació del lloc i la sal del dia), mai la IP. Sense les dues sals
 * no es pot recalcular; el transient caduca en una hora com a màxim.
 *
 * @param string $ip Adreça del client.
 * @return string
 */
function nep_clau_limit( string $ip ): string {
	return 'nep_rl_' . substr( hash_hmac( 'sha256', $ip, wp_salt( 'auth' ) . nep_sal_dia() ), 0, 32 );
}

/**
 * IP del client per al límit, ja normalitzada (`nep_normalitza_ip`).
 *
 * Es fa servir REMOTE_ADDR. Darrere d'un proxy o CDN, REMOTE_ADDR és el del
 * proxy (tothom compartiria el límit). No es llegeix cap X-Forwarded-For a
 * cegues perquè el client el pot falsejar. Al desplegament: si hi ha un
 * proxy o CDN de confiança, afegir un filtre `nep_ip_client` que torni la
 * capçalera que posa aquest proxy (p. ex. CF-Connecting-IP) només quan
 * REMOTE_ADDR és una de les seves adreces.
 *
 * @return string
 */
function nep_ip_client(): string {
	$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	/**
	 * IP del client per al límit d'enviaments de /resultat.
	 *
	 * @param string $ip REMOTE_ADDR.
	 */
	return nep_normalitza_ip( (string) apply_filters( 'nep_ip_client', $ip ) );
}

/**
 * Compta un enviament i diu si encara és dins dels límits: el de la IP
 * (`NEP_RESULTATS_LIMIT`) i el global (`NEP_RESULTATS_LIMIT_GLOBAL`), tots dos
 * per finestra d'una hora. Si un és ple no es compta a cap.
 *
 * @return bool Cert si l'enviament es pot registrar.
 */
function nep_dins_limit(): bool {
	$ara    = time();
	$limits = array(
		nep_clau_limit( nep_ip_client() ) => NEP_RESULTATS_LIMIT,
		NEP_CLAU_LIMIT_GLOBAL             => NEP_RESULTATS_LIMIT_GLOBAL,
	);
	$estats = array();
	foreach ( $limits as $clau => $limit ) {
		$estat = get_transient( $clau );
		if ( ! is_array( $estat ) || ( $estat['fi'] ?? 0 ) <= $ara ) {
			$estat = array(
				'n'  => 0,
				'fi' => $ara + NEP_RESULTATS_FINESTRA,
			);
		}
		if ( $estat['n'] >= $limit ) {
			return false;
		}
		$estats[ $clau ] = $estat;
	}
	foreach ( $estats as $clau => $estat ) {
		++$estat['n'];
		set_transient( $clau, $estat, max( 1, $estat['fi'] - $ara ) );
	}
	return true;
}

/**
 * Registra una partida acabada (endpoint POST /resultat).
 *
 * @param WP_REST_Request $request Petició.
 * @return WP_REST_Response|WP_Error
 */
function nep_rest_resultat( WP_REST_Request $request ) {
	if ( ! nep_dins_limit() ) {
		return new WP_Error( 'nep_massa_enviaments', __( 'Massa enviaments. Torna-ho a provar més tard.', 'noempesquen' ), array( 'status' => 429 ) );
	}

	$missions = nep_missions_jugables();
	$id       = (string) $request['missio'];
	if ( ! isset( $missions[ $id ] ) ) {
		return new WP_Error( 'nep_missio_desconeguda', __( 'Missió desconeguda.', 'noempesquen' ), array( 'status' => 400 ) );
	}
	$guio    = $missions[ $id ];
	$decisio = isset( $request['decisio'] ) ? (string) $request['decisio'] : '';
	if ( '' !== $decisio && ! in_array( $decisio, nep_ids_opcions( $guio ), true ) ) {
		return new WP_Error( 'nep_decisio_desconeguda', __( 'Decisió desconeguda.', 'noempesquen' ), array( 'status' => 400 ) );
	}

	try {
		$hash = nep_versio_hash( $guio ); // Només el de la missió demanada.
	} catch ( JsonException $e ) {
		error_log( 'noempesquen: no es pot calcular el hash de la missió ' . $id ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Guió del servidor corrupte.
		return new WP_Error( 'nep_error_desant', __( 'No s\'ha pogut desar el resultat.', 'noempesquen' ), array( 'status' => 500 ) );
	}

	global $wpdb;
	$taula = nep_taula_resultats();
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Comptador agregat (UPSERT); no hi ha API ni cau aplicable.
	$desat = $wpdb->query(
		$wpdb->prepare(
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Nom de taula intern.
			"INSERT INTO {$taula} (missio, versio_hash, dia, estrelles, decisio, n) VALUES (%s, %s, %s, %d, %s, 1) ON DUPLICATE KEY UPDATE n = n + 1",
			$id,
			$hash,
			gmdate( 'Y-m-d' ),
			(int) $request['estrelles'],
			$decisio
		)
	);
	if ( false === $desat ) {
		// Sense cap dada de la petició (l'error de MySQL pot repetir els valors).
		error_log( 'noempesquen: no s\'ha pogut desar un resultat a ' . $taula ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Error de BD per a l'administrador.
		return new WP_Error( 'nep_error_desant', __( 'No s\'ha pogut desar el resultat.', 'noempesquen' ), array( 'status' => 500 ) );
	}
	return new WP_REST_Response( null, 204 );
}

if ( function_exists( 'add_action' ) ) {
	// Invalidació del cau de missions. `save_post` de REST arriba abans d'escriure la meta: també es buida en canviar `nep_guio`.
	add_action( 'save_post_nep_missio', 'nep_buida_cau_missions' );
	foreach ( array( 'trashed_post', 'untrashed_post', 'deleted_post' ) as $nep_accio ) {
		add_action(
			$nep_accio,
			static function ( $post_id, $post = null ) {
				$tipus = $post instanceof WP_Post ? $post->post_type : get_post_type( (int) $post_id );
				if ( 'nep_missio' === $tipus ) {
					nep_buida_cau_missions();
				}
			},
			10,
			2
		);
	}
	foreach ( array( 'added_post_meta', 'updated_post_meta', 'deleted_post_meta' ) as $nep_accio ) {
		add_action(
			$nep_accio,
			static function ( $meta_id, $post_id, $meta_key ) {
				if ( 'nep_guio' === $meta_key ) {
					nep_buida_cau_missions();
				}
			},
			10,
			3
		);
	}

	add_action(
		'rest_api_init',
		static function () {
			// Anònim: sense nonce ni galetes. Només es fan servir aquests tres camps.
			register_rest_route(
				'noempesquen/v1',
				'/resultat',
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'permission_callback' => '__return_true',
					'callback'            => 'nep_rest_resultat',
					'args'                => array(
						'missio'    => array(
							'type'      => 'string',
							'required'  => true,
							'maxLength' => 64,
							'pattern'   => NEP_PATRO_ID,
						),
						// El motor dona sempre d'1 a 3 estrelles: 0 no pot venir d'una partida real.
						'estrelles' => array(
							'type'     => 'integer',
							'required' => true,
							'minimum'  => 1,
							'maximum'  => 3,
						),
						'decisio'   => array(
							'type'      => 'string',
							'maxLength' => 32,
						),
					),
				)
			);
		}
	);

	// Sense cau en cap resposta de la ruta (també els 400 de validació i el 429).
	add_filter(
		'rest_post_dispatch',
		static function ( $resposta, $server, $request ) {
			if ( $resposta instanceof WP_HTTP_Response && $request instanceof WP_REST_Request && '/noempesquen/v1/resultat' === $request->get_route() ) {
				$resposta->header( 'Cache-Control', 'no-store' );
			}
			return $resposta;
		},
		10,
		3
	);
}
