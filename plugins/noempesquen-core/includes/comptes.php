<?php
/**
 * Endpoints REST dels comptes de jugador (namespace noempesquen/v1, rutes /compte).
 *
 * Tot opera sobre l'usuari actual (get_current_user_id()); cap ruta permet
 * veure dades d'un altre jugador. No s'envia cap correu ni es registra la
 * contrasenya enlloc.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

/*
 * Límits configurables a wp-config.php.
 */

/** Fallades de login permeses per finestra (per IP i per correu). */
if ( ! defined( 'NEP_COMPTE_LIMIT_ENTRA' ) ) {
	define( 'NEP_COMPTE_LIMIT_ENTRA', 8 );
}

/** Finestra del límit de login, en segons. */
if ( ! defined( 'NEP_COMPTE_FINESTRA_ENTRA' ) ) {
	define( 'NEP_COMPTE_FINESTRA_ENTRA', 15 * MINUTE_IN_SECONDS );
}

/** Altes permeses per IP i finestra. */
if ( ! defined( 'NEP_COMPTE_LIMIT_REGISTRE' ) ) {
	define( 'NEP_COMPTE_LIMIT_REGISTRE', 5 );
}

/** Finestra del límit d'altes, en segons. */
if ( ! defined( 'NEP_COMPTE_FINESTRA_REGISTRE' ) ) {
	define( 'NEP_COMPTE_FINESTRA_REGISTRE', HOUR_IN_SECONDS );
}

/** Mida màxima del cos de les peticions de compte, en bytes. */
if ( ! defined( 'NEP_COMPTE_MIDA_MAX' ) ) {
	define( 'NEP_COMPTE_MIDA_MAX', 8192 );
}

/*
 * Altes totals per hora (totes les IP): mitigació sense captcha ni verificació
 * de correu (D1). Configurable a wp-config.php.
 */
if ( ! defined( 'NEP_COMPTE_LIMIT_REGISTRE_GLOBAL' ) ) {
	define( 'NEP_COMPTE_LIMIT_REGISTRE_GLOBAL', 200 );
}

/*
 * Notes de seguretat acceptades (vegeu docs/decisions.md):
 * - El límit per correu de /entra pot bloquejar temporalment el propietari.
 * - Els comptadors (transients) no són atòmics: sota concurrència alta el
 *   límit es pot superar en uns pocs intents.
 * - `Secure` de la galeta depèn d'is_ssl(): cal comprovar-ho en producció
 *   darrere del proxy (Varnish).
 * - L'alta envia un correu de verificació; el compte funciona sense verificar.
 */

/** Verificacions per IP i finestra. */
if ( ! defined( 'NEP_COMPTE_LIMIT_VERIFICA' ) ) {
	define( 'NEP_COMPTE_LIMIT_VERIFICA', 20 );
}

/** Finestra del límit de verificació, en segons. */
if ( ! defined( 'NEP_COMPTE_FINESTRA_VERIFICA' ) ) {
	define( 'NEP_COMPTE_FINESTRA_VERIFICA', 15 * MINUTE_IN_SECONDS );
}

/** Reenviaments de la verificació per usuari i finestra. */
if ( ! defined( 'NEP_COMPTE_LIMIT_REENVIA' ) ) {
	define( 'NEP_COMPTE_LIMIT_REENVIA', 3 );
}

/** Finestra del límit de reenviament, en segons. */
if ( ! defined( 'NEP_COMPTE_FINESTRA_REENVIA' ) ) {
	define( 'NEP_COMPTE_FINESTRA_REENVIA', HOUR_IN_SECONDS );
}

/** Sol·licituds de recuperació per IP i finestra. */
if ( ! defined( 'NEP_COMPTE_LIMIT_RECUPERA_IP' ) ) {
	define( 'NEP_COMPTE_LIMIT_RECUPERA_IP', 5 );
}

/** Sol·licituds de recuperació per correu i finestra. */
if ( ! defined( 'NEP_COMPTE_LIMIT_RECUPERA_EMAIL' ) ) {
	define( 'NEP_COMPTE_LIMIT_RECUPERA_EMAIL', 3 );
}

/** Finestra del límit de sol·licitud de recuperació, en segons. */
if ( ! defined( 'NEP_COMPTE_FINESTRA_RECUPERA' ) ) {
	define( 'NEP_COMPTE_FINESTRA_RECUPERA', HOUR_IN_SECONDS );
}

/** Intents de restabliment per IP i finestra. */
if ( ! defined( 'NEP_COMPTE_LIMIT_RESTABLEIX' ) ) {
	define( 'NEP_COMPTE_LIMIT_RESTABLEIX', 10 );
}

/** Finestra del límit de restabliment, en segons. */
if ( ! defined( 'NEP_COMPTE_FINESTRA_RESTABLEIX' ) ) {
	define( 'NEP_COMPTE_FINESTRA_RESTABLEIX', 15 * MINUTE_IN_SECONDS );
}

add_action(
	'rest_api_init',
	static function () {
		register_rest_route(
			'noempesquen/v1',
			'/compte/registre',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => '__return_true',
				'callback'            => 'nep_rest_compte_registre',
			)
		);
		register_rest_route(
			'noempesquen/v1',
			'/compte/entra',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => '__return_true',
				'callback'            => 'nep_rest_compte_entra',
			)
		);
		register_rest_route(
			'noempesquen/v1',
			'/compte/verifica',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => '__return_true',
				'callback'            => 'nep_rest_compte_verifica',
			)
		);
		register_rest_route(
			'noempesquen/v1',
			'/compte/reenvia-verificacio',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => 'nep_compte_permis',
				'callback'            => 'nep_rest_compte_reenvia_verificacio',
			)
		);
		register_rest_route(
			'noempesquen/v1',
			'/compte/recupera',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => '__return_true',
				'callback'            => 'nep_rest_compte_recupera',
			)
		);
		register_rest_route(
			'noempesquen/v1',
			'/compte/restableix',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => '__return_true',
				'callback'            => 'nep_rest_compte_restableix',
			)
		);
		register_rest_route(
			'noempesquen/v1',
			'/compte/surt',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => 'is_user_logged_in',
				'callback'            => 'nep_rest_compte_surt',
			)
		);
		register_rest_route(
			'noempesquen/v1',
			'/compte/progres',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'permission_callback' => 'nep_compte_permis',
					'callback'            => 'nep_rest_compte_progres',
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'permission_callback' => 'nep_compte_permis',
					'callback'            => 'nep_rest_compte_desa_progres',
				),
			)
		);
		register_rest_route(
			'noempesquen/v1',
			'/compte/exporta',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => 'nep_compte_permis',
				'callback'            => 'nep_rest_compte_exporta',
			)
		);
		register_rest_route(
			'noempesquen/v1',
			'/compte',
			array(
				'methods'             => WP_REST_Server::DELETABLE,
				'permission_callback' => 'nep_compte_permis',
				'callback'            => 'nep_rest_compte_esborra',
			)
		);
	}
);

// Sense cau en cap resposta de les rutes de compte (també errors i 401).
add_filter(
	'rest_post_dispatch',
	static function ( $resposta, $server, $request ) {
		if ( $resposta instanceof WP_HTTP_Response && $request instanceof WP_REST_Request && str_starts_with( $request->get_route(), '/noempesquen/v1/compte' ) ) {
			$resposta->header( 'Cache-Control', 'no-store' );
		}
		return $resposta;
	},
	10,
	3
);

/**
 * Permís de les rutes privades: sessió iniciada i rol `nep_jugador`.
 *
 * @return bool
 */
function nep_compte_permis(): bool {
	return is_user_logged_in() && nep_es_jugador( wp_get_current_user() );
}

/**
 * Error genèric d'una ruta de compte.
 *
 * @param string $codi    Codi `nep_*`.
 * @param string $missatge Missatge per a l'usuari.
 * @param int    $estat   Codi HTTP.
 * @return WP_Error
 */
function nep_compte_error( string $codi, string $missatge, int $estat ): WP_Error {
	return new WP_Error( $codi, $missatge, array( 'status' => $estat ) );
}

/**
 * Error de massa intents (429).
 *
 * @return WP_Error
 */
function nep_compte_massa_intents(): WP_Error {
	return nep_compte_error( 'nep_massa_intents', __( 'Massa intents. Torna-ho a provar més tard.', 'noempesquen' ), 429 );
}

/**
 * Diu si el cos supera la mida màxima.
 *
 * @param WP_REST_Request $request Petició.
 * @return bool
 */
function nep_compte_massa_gran( WP_REST_Request $request ): bool {
	return strlen( (string) $request->get_body() ) > NEP_COMPTE_MIDA_MAX;
}

/**
 * Diu si una clau de límit (`nep_clau_limit`) ja ha arribat al màxim.
 *
 * @param string $clau  Nom del transient.
 * @param int    $limit Màxim per finestra.
 * @return bool
 */
function nep_compte_limit_ple( string $clau, int $limit ): bool {
	$estat = get_transient( $clau );
	return is_array( $estat ) && ( $estat['fi'] ?? 0 ) > time() && ( $estat['n'] ?? 0 ) >= $limit;
}

/**
 * Suma un intent a una clau de límit.
 *
 * @param string $clau     Nom del transient.
 * @param int    $finestra Durada de la finestra, en segons.
 */
function nep_compte_suma_intent( string $clau, int $finestra ): void {
	$ara   = time();
	$estat = get_transient( $clau );
	if ( ! is_array( $estat ) || ( $estat['fi'] ?? 0 ) <= $ara ) {
		$estat = array(
			'n'  => 0,
			'fi' => $ara + $finestra,
		);
	}
	++$estat['n'];
	set_transient( $clau, $estat, max( 1, $estat['fi'] - $ara ) );
}

/**
 * Paràmetres del cos JSON. Només s'accepta `Content-Type: application/json`
 * (evita formularis entre llocs i contrasenyes a la query string).
 *
 * @param WP_REST_Request $request Petició.
 * @return array|WP_Error Paràmetres o error 415.
 */
function nep_compte_cos_json( WP_REST_Request $request ) {
	if ( ! $request->is_json_content_type() ) {
		return nep_compte_error( 'nep_tipus_contingut', __( 'Format de petició no admès.', 'noempesquen' ), 415 );
	}
	$params = $request->get_json_params();
	return is_array( $params ) ? $params : array();
}

/**
 * Hash fictici (mateix algorisme que els reals) per igualar el temps de
 * resposta quan el correu no és d'un jugador. Es genera una sola vegada.
 *
 * @return string
 */
function nep_compte_hash_fals(): string {
	$hash = get_option( 'nep_hash_fals' );
	/*
	 * wp_password_needs_rehash() existeix des de WP 6.8 (el plugin admet 6.6).
	 * Abans, l'algorisme no canvia (phpass) i el hash desat és estable; en
	 * actualitzar a 6.8+ la funció ja hi és i el regenera amb el nou.
	 */
	$caduc = function_exists( 'wp_password_needs_rehash' ) && is_string( $hash ) && '' !== $hash && wp_password_needs_rehash( $hash );
	if ( ! is_string( $hash ) || '' === $hash || $caduc ) {
		$hash = wp_hash_password( wp_generate_password( 32, true, true ) );
		update_option( 'nep_hash_fals', $hash, false );
	}
	return $hash;
}

/**
 * Ids de les missions jugables (els mateixos que accepta /resultat).
 *
 * @return string[]
 */
function nep_compte_ids_missions(): array {
	return array_map( 'strval', array_keys( nep_missions_jugables() ) );
}

/**
 * Progrés desat de l'usuari, sanejat.
 *
 * @param int $id Usuari.
 * @return array
 */
function nep_compte_progres_desat( int $id ): array {
	return nep_sanea_progres( get_user_meta( $id, 'nep_progres', true ), nep_compte_ids_missions() );
}

/**
 * Converteix el progrés en objecte JSON (també quan és buit).
 *
 * @param array $progres Progrés.
 * @return array|stdClass
 */
function nep_compte_objecte( array $progres ) {
	return array() === $progres ? new stdClass() : $progres;
}

/**
 * Inicia la sessió i torna la resposta amb el nonce nou.
 *
 * El nonce depèn del testimoni de sessió, que WordPress llegeix de
 * `$_COOKIE`; `wp_set_auth_cookie` no l'actualitza, així que es copia la
 * galeta nova a `$_COOKIE` perquè el nonce serveixi a la petició següent.
 *
 * @param int  $id     Usuari.
 * @param bool $signon Cert si cal fer `wp_signon` (ja validat).
 * @param array $credencials Credencials per a `wp_signon`.
 * @return WP_User|WP_Error
 */
function nep_compte_inicia_sessio( int $id, bool $signon = false, array $credencials = array() ) {
	$copia = static function ( $galeta ) {
		$_COOKIE[ LOGGED_IN_COOKIE ] = $galeta;
	};
	add_action( 'set_logged_in_cookie', $copia );
	if ( $signon ) {
		// Marca l'entrada pròpia: el filtre de wp-login.php no la bloqueja.
		add_filter( 'nep_login_propi', '__return_true' );
		$usuari = wp_signon( $credencials, is_ssl() );
		remove_filter( 'nep_login_propi', '__return_true' );
	} else {
		wp_set_auth_cookie( $id, false, is_ssl() );
		$usuari = get_userdata( $id );
	}
	remove_action( 'set_logged_in_cookie', $copia );
	if ( ! $usuari instanceof WP_User ) {
		return nep_compte_error( 'nep_credencials', __( 'Correu o contrasenya incorrectes.', 'noempesquen' ), 401 );
	}
	wp_set_current_user( $usuari->ID );
	return $usuari;
}

/**
 * Sessió anterior d'aquest navegador (si n'hi ha), per destruir-la quan
 * se n'inicia una de nova. Cal llegir-la abans d'iniciar la nova.
 *
 * @return callable Destrueix la sessió anterior.
 */
function nep_compte_sessio_previa(): callable {
	$previa   = wp_parse_auth_cookie( '', 'logged_in' );
	$id_previ = (int) wp_validate_auth_cookie( '', 'logged_in' );
	return static function () use ( $previa, $id_previ ): void {
		if ( $id_previ && is_array( $previa ) && ! empty( $previa['token'] ) ) {
			WP_Session_Tokens::get_instance( $id_previ )->destroy( $previa['token'] );
		}
	};
}

/**
 * Diu si el correu de l'usuari ja està verificat.
 *
 * @param int $id Usuari.
 * @return bool
 */
function nep_compte_verificat( int $id ): bool {
	return (bool) get_user_meta( $id, 'nep_email_verificat', true );
}

/**
 * Resposta de sessió iniciada.
 *
 * @param array $progres Progrés.
 * @param int   $id      Usuari.
 * @return WP_REST_Response
 */
function nep_compte_resposta_connectat( array $progres, int $id ): WP_REST_Response {
	return rest_ensure_response(
		array(
			'connectat' => true,
			'nonce'     => wp_create_nonce( 'wp_rest' ),
			'progres'   => nep_compte_objecte( $progres ),
			'verificat' => nep_compte_verificat( $id ),
		)
	);
}

/**
 * Genera un token de verificació nou (invalida l'anterior), el desa com a hash
 * i envia el correu. Torna si el correu s'ha enviat.
 *
 * @param int $id Usuari.
 * @return bool
 */
function nep_compte_envia_verificacio( int $id ): bool {
	$bytes    = random_bytes( 32 );
	$token    = nep_token_genera( $id, $bytes );
	$parsejat = nep_token_parseja( $token );
	if ( null === $parsejat ) {
		return false;
	}
	$registre = nep_token_registre( $parsejat['secret'], wp_salt( 'auth' ), time(), NEP_TTL_VERIFICA );
	if ( array() === $registre ) {
		return false;
	}
	update_user_meta( $id, 'nep_token_verifica', $registre );
	return nep_correu_verificacio( $id, $token );
}

/**
 * Registra al log del servidor per què s'ha rebutjat una alta (només un codi, mai dades).
 *
 * @param string $causa Codi curt de la causa.
 */
function nep_compte_log_alta( $causa ) {
	// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	error_log( '[noempesquen] alta rebutjada: ' . preg_replace( '/[^a-z0-9_]/i', '', (string) $causa ) );
}

/**
 * Alta d'un compte de jugador (POST /compte/registre).
 *
 * @param WP_REST_Request $request Petició.
 * @return WP_REST_Response|WP_Error
 */
function nep_rest_compte_registre( WP_REST_Request $request ) {
	$generic = nep_compte_error( 'nep_alta_invalida', __( 'No s\'ha pogut crear el compte. Revisa les dades.', 'noempesquen' ), 400 );
	if ( nep_compte_massa_gran( $request ) ) {
		nep_compte_log_alta( 'cos_gran' );
		return $generic;
	}
	$cos = nep_compte_cos_json( $request );
	if ( is_wp_error( $cos ) ) {
		nep_compte_log_alta( 'cos_no_json' );
		return $cos;
	}
	$clau_ip     = nep_clau_limit( 'registre|' . nep_ip_client() );
	$clau_global = nep_clau_limit( 'registre-global' );
	if ( nep_compte_limit_ple( $clau_ip, NEP_COMPTE_LIMIT_REGISTRE ) || nep_compte_limit_ple( $clau_global, (int) NEP_COMPTE_LIMIT_REGISTRE_GLOBAL ) ) {
		return nep_compte_massa_intents();
	}
	nep_compte_suma_intent( $clau_ip, NEP_COMPTE_FINESTRA_REGISTRE );

	$email = $cos['email'] ?? null;
	$pass  = $cos['contrasenya'] ?? null;
	$dades = array(
		'acepta'       => $cos['acepta'] ?? null,
		'majoria_edat' => $cos['majoria_edat'] ?? null,
	);
	if ( ! nep_valida_email( $email ) ) {
		nep_compte_log_alta( 'email_invalid' );
		return $generic;
	}
	if ( ! nep_valida_contrasenya( $pass ) ) {
		nep_compte_log_alta( 'contrasenya_invalida' );
		return $generic;
	}
	if ( ! nep_consentiment_valid( $dades ) ) {
		nep_compte_log_alta( 'consentiment_invalid' );
		return $generic;
	}
	// El comptador global només suma cossos vàlids (les peticions buides no l'omplen).
	nep_compte_suma_intent( $clau_global, HOUR_IN_SECONDS );
	if ( email_exists( $email ) ) {
		// Mateix cost que una alta real: el temps no revela si el correu existeix.
		wp_hash_password( $pass );
		nep_compte_log_alta( 'email_existent' );
		return $generic;
	}

	$login = '';
	for ( $i = 0; $i < 5 && '' === $login; $i++ ) {
		$prova = 'nep_' . strtolower( wp_generate_password( 12, false ) );
		if ( ! username_exists( $prova ) ) {
			$login = $prova;
		}
	}
	if ( '' === $login ) {
		nep_compte_log_alta( 'sense_login' );
		return $generic;
	}
	$id = wp_insert_user(
		array(
			'user_login' => $login,
			'user_email' => $email,
			'user_pass'  => $pass,
			'role'       => 'nep_jugador',
		)
	);
	if ( is_wp_error( $id ) ) {
		nep_compte_log_alta( 'insert_' . $id->get_error_code() );
		return $generic;
	}
	update_user_meta(
		$id,
		'nep_consentiment',
		array(
			'versio' => NEP_VERSIO_CONSENTIMENT,
			'data'   => gmdate( 'c' ),
		)
	);
	$destrueix_previa = nep_compte_sessio_previa();
	$usuari           = nep_compte_inicia_sessio( (int) $id );
	if ( is_wp_error( $usuari ) ) {
		nep_compte_log_alta( 'sessio_' . $usuari->get_error_code() );
		return $generic;
	}
	$destrueix_previa();
	// Si el correu falla, l'alta continua: el jugador pot demanar-ne un altre.
	nep_compte_envia_verificacio( (int) $id );
	return nep_compte_resposta_connectat( array(), (int) $id );
}

/**
 * Entrada d'un jugador (POST /compte/entra).
 *
 * @param WP_REST_Request $request Petició.
 * @return WP_REST_Response|WP_Error
 */
function nep_rest_compte_entra( WP_REST_Request $request ) {
	$generic = nep_compte_error( 'nep_credencials', __( 'Correu o contrasenya incorrectes.', 'noempesquen' ), 401 );
	if ( nep_compte_massa_gran( $request ) ) {
		return $generic;
	}
	$cos = nep_compte_cos_json( $request );
	if ( is_wp_error( $cos ) ) {
		return $cos;
	}
	$email      = $cos['email'] ?? null;
	$pass       = $cos['contrasenya'] ?? null;
	$email      = is_string( $email ) ? strtolower( trim( $email ) ) : '';
	$clau_ip    = nep_clau_limit( 'entra|' . nep_ip_client() );
	$clau_email = nep_clau_limit( 'entra-email|' . $email );
	if ( nep_compte_limit_ple( $clau_ip, NEP_COMPTE_LIMIT_ENTRA ) || nep_compte_limit_ple( $clau_email, NEP_COMPTE_LIMIT_ENTRA ) ) {
		return nep_compte_massa_intents();
	}

	$usuari = nep_valida_email( $email ) && is_string( $pass ) && '' !== $pass ? get_user_by( 'email', $email ) : false;
	// Sessió anterior d'aquest navegador (si n'hi ha): es destrueix en entrar.
	$destrueix_previa = nep_compte_sessio_previa();
	// Només jugadors: un administrador no entra per aquí (ni rep galeta).
	if ( $usuari instanceof WP_User && nep_es_jugador( $usuari ) ) {
		$usuari = nep_compte_inicia_sessio(
			$usuari->ID,
			true,
			array(
				'user_login'    => $usuari->user_login,
				'user_password' => $pass,
				'remember'      => false,
			)
		);
	} else {
		// Mateix cost que una comprovació real: el temps no revela el correu.
		wp_check_password( is_string( $pass ) ? $pass : '', nep_compte_hash_fals() );
		$usuari = $generic;
	}
	if ( is_wp_error( $usuari ) ) {
		nep_compte_suma_intent( $clau_ip, NEP_COMPTE_FINESTRA_ENTRA );
		nep_compte_suma_intent( $clau_email, NEP_COMPTE_FINESTRA_ENTRA );
		return $generic;
	}
	$destrueix_previa();
	return nep_compte_resposta_connectat( nep_compte_progres_desat( $usuari->ID ), (int) $usuari->ID );
}

/**
 * Verifica el correu amb el token de l'enllaç (POST /compte/verifica).
 *
 * @param WP_REST_Request $request Petició.
 * @return WP_REST_Response|WP_Error
 */
function nep_rest_compte_verifica( WP_REST_Request $request ) {
	$generic = nep_compte_error( 'nep_token_invalid', __( 'L\'enllaç no és vàlid o ha caducat.', 'noempesquen' ), 400 );
	if ( nep_compte_massa_gran( $request ) ) {
		return $generic;
	}
	$cos = nep_compte_cos_json( $request );
	if ( is_wp_error( $cos ) ) {
		return $cos;
	}
	$clau = nep_clau_limit( 'verifica|' . nep_ip_client() );
	if ( nep_compte_limit_ple( $clau, (int) NEP_COMPTE_LIMIT_VERIFICA ) ) {
		return nep_compte_massa_intents();
	}
	nep_compte_suma_intent( $clau, NEP_COMPTE_FINESTRA_VERIFICA );

	$token = nep_token_parseja( $cos['token'] ?? null );
	if ( null === $token ) {
		return $generic;
	}
	// El hash es calcula sempre (també sense usuari ni meta) per igualar el temps.
	nep_token_hash( $token['secret'], wp_salt( 'auth' ) );
	$usuari   = get_userdata( $token['id'] );
	$registre = $usuari instanceof WP_User ? get_user_meta( $usuari->ID, 'nep_token_verifica', true ) : null;
	if ( ! $usuari instanceof WP_User || ! nep_es_jugador( $usuari ) || ! nep_token_valid( $registre, $token['secret'], wp_salt( 'auth' ), time() ) ) {
		return $generic;
	}
	update_user_meta( $usuari->ID, 'nep_email_verificat', time() );
	delete_user_meta( $usuari->ID, 'nep_token_verifica' );
	return rest_ensure_response( array( 'verificat' => true ) );
}

/**
 * Reenvia el correu de verificació (POST /compte/reenvia-verificacio).
 *
 * @return WP_REST_Response|WP_Error
 */
function nep_rest_compte_reenvia_verificacio() {
	$id = get_current_user_id();
	if ( nep_compte_verificat( $id ) ) {
		return rest_ensure_response( array( 'verificat' => true ) );
	}
	$clau = nep_clau_limit( 'reenvia|' . $id );
	if ( nep_compte_limit_ple( $clau, (int) NEP_COMPTE_LIMIT_REENVIA ) ) {
		return nep_compte_massa_intents();
	}
	nep_compte_suma_intent( $clau, NEP_COMPTE_FINESTRA_REENVIA );
	$enviat = nep_compte_envia_verificacio( $id );
	return rest_ensure_response(
		array(
			'verificat' => false,
			'enviat'    => $enviat,
		)
	);
}

/**
 * Genera un token de recuperació nou (invalida l'anterior), el desa com a hash
 * i envia el correu. Torna si el correu s'ha enviat.
 *
 * @param int $id Usuari.
 * @return bool
 */
function nep_compte_envia_recuperacio( int $id ): bool {
	$token    = nep_token_genera( $id, random_bytes( 32 ) );
	$parsejat = nep_token_parseja( $token );
	if ( null === $parsejat ) {
		return false;
	}
	$registre = nep_token_registre( $parsejat['secret'], wp_salt( 'auth' ), time(), NEP_TTL_RECUPERA );
	if ( array() === $registre ) {
		return false;
	}
	update_user_meta( $id, 'nep_token_recupera', $registre );
	return nep_correu_recuperacio( $id, $token );
}

/**
 * Demana l'enllaç de recuperació (POST /compte/recupera). La resposta és sempre
 * la mateixa: no revela si el correu existeix, és d'un jugador o està verificat.
 *
 * @param WP_REST_Request $request Petició.
 * @return WP_REST_Response|WP_Error
 */
function nep_rest_compte_recupera( WP_REST_Request $request ) {
	$resposta = static fn() => rest_ensure_response( array( 'enviat' => true ) );
	if ( nep_compte_massa_gran( $request ) ) {
		return $resposta();
	}
	$cos = nep_compte_cos_json( $request );
	if ( is_wp_error( $cos ) ) {
		return $cos;
	}
	$email      = $cos['email'] ?? null;
	$email      = is_string( $email ) ? strtolower( trim( $email ) ) : '';
	$clau_ip    = nep_clau_limit( 'recupera|' . nep_ip_client() );
	$clau_email = nep_clau_limit( 'recupera-email|' . $email );
	if ( nep_compte_limit_ple( $clau_ip, (int) NEP_COMPTE_LIMIT_RECUPERA_IP ) || nep_compte_limit_ple( $clau_email, (int) NEP_COMPTE_LIMIT_RECUPERA_EMAIL ) ) {
		return nep_compte_massa_intents();
	}
	// Es compten tots els intents, existeixi o no el correu.
	nep_compte_suma_intent( $clau_ip, (int) NEP_COMPTE_FINESTRA_RECUPERA );
	nep_compte_suma_intent( $clau_email, (int) NEP_COMPTE_FINESTRA_RECUPERA );

	$usuari = nep_valida_email( $email ) ? get_user_by( 'email', $email ) : false;
	if ( $usuari instanceof WP_User && nep_es_jugador( $usuari ) && nep_compte_verificat( (int) $usuari->ID ) ) {
		nep_compte_envia_recuperacio( (int) $usuari->ID );
	} else {
		// Treball equivalent (token, hash i cost de contrasenya) sense desar ni enviar res.
		$fals = nep_token_parseja( nep_token_genera( 1, random_bytes( 32 ) ) );
		nep_token_registre( $fals['secret'] ?? '', wp_salt( 'auth' ), time(), NEP_TTL_RECUPERA );
		wp_check_password( '', nep_compte_hash_fals() );
	}
	return $resposta();
}

/**
 * Canvia la contrasenya amb el token de l'enllaç (POST /compte/restableix).
 * No inicia sessió: el jugador entra després amb /compte/entra.
 *
 * @param WP_REST_Request $request Petició.
 * @return WP_REST_Response|WP_Error
 */
function nep_rest_compte_restableix( WP_REST_Request $request ) {
	$generic = nep_compte_error( 'nep_token_invalid', __( 'L\'enllaç no és vàlid o ha caducat.', 'noempesquen' ), 400 );
	if ( nep_compte_massa_gran( $request ) ) {
		return $generic;
	}
	$cos = nep_compte_cos_json( $request );
	if ( is_wp_error( $cos ) ) {
		return $cos;
	}
	$clau = nep_clau_limit( 'restableix|' . nep_ip_client() );
	if ( nep_compte_limit_ple( $clau, (int) NEP_COMPTE_LIMIT_RESTABLEIX ) ) {
		return nep_compte_massa_intents();
	}
	nep_compte_suma_intent( $clau, (int) NEP_COMPTE_FINESTRA_RESTABLEIX );

	// La contrasenya es valida abans de tocar el token: una de curta no el consumeix.
	$pass = $cos['contrasenya'] ?? null;
	if ( ! nep_valida_contrasenya( $pass ) ) {
		return nep_compte_error( 'nep_contrasenya_invalida', __( 'La contrasenya ha de tenir entre 10 i 128 caràcters.', 'noempesquen' ), 400 );
	}
	$token = nep_token_parseja( $cos['token'] ?? null );
	if ( null === $token ) {
		return $generic;
	}
	// El hash es calcula sempre per igualar el temps.
	nep_token_hash( $token['secret'], wp_salt( 'auth' ) );
	$usuari   = get_userdata( $token['id'] );
	$registre = $usuari instanceof WP_User ? get_user_meta( $usuari->ID, 'nep_token_recupera', true ) : null;
	if ( ! $usuari instanceof WP_User || ! nep_es_jugador( $usuari ) || ! nep_token_valid( $registre, $token['secret'], wp_salt( 'auth' ), time() ) ) {
		return $generic;
	}
	$id = (int) $usuari->ID;
	wp_set_password( $pass, $id );
	delete_user_meta( $id, 'nep_token_recupera' );
	delete_user_meta( $id, 'nep_token_verifica' );
	update_user_meta( $id, 'nep_email_verificat', time() );
	// Cap sessió anterior (ni d'aquest navegador ni d'altres) continua vàlida.
	WP_Session_Tokens::get_instance( $id )->destroy_all();
	return rest_ensure_response( array( 'restablert' => true ) );
}

/**
 * Tanca la sessió actual (POST /compte/surt).
 *
 * @return WP_REST_Response
 */
function nep_rest_compte_surt(): WP_REST_Response {
	wp_destroy_current_session();
	wp_clear_auth_cookie();
	wp_set_current_user( 0 );
	return rest_ensure_response( array( 'connectat' => false ) );
}

/**
 * Progrés de l'usuari actual (GET /compte/progres).
 *
 * @return WP_REST_Response
 */
function nep_rest_compte_progres(): WP_REST_Response {
	$id = get_current_user_id();
	return rest_ensure_response(
		array(
			'progres'   => nep_compte_objecte( nep_compte_progres_desat( $id ) ),
			'verificat' => nep_compte_verificat( $id ),
		)
	);
}

/**
 * Desa el progrés fusionat, sense baixar mai estrelles (PUT /compte/progres).
 *
 * @param WP_REST_Request $request Petició.
 * @return WP_REST_Response|WP_Error
 */
function nep_rest_compte_desa_progres( WP_REST_Request $request ) {
	if ( nep_compte_massa_gran( $request ) ) {
		return nep_compte_error( 'nep_massa_gran', __( 'Les dades són massa grans.', 'noempesquen' ), 413 );
	}
	$id      = get_current_user_id();
	$ids     = nep_compte_ids_missions();
	$entrada = nep_sanea_progres( $request->get_param( 'progres' ), $ids );
	$progres = nep_fusiona_progres( nep_compte_progres_desat( $id ), $entrada );
	update_user_meta( $id, 'nep_progres', $progres );
	return rest_ensure_response( array( 'progres' => nep_compte_objecte( $progres ) ) );
}

/**
 * Exporta les dades de l'usuari actual (GET /compte/exporta).
 *
 * @return WP_REST_Response
 */
function nep_rest_compte_exporta(): WP_REST_Response {
	$usuari = wp_get_current_user();
	$cons   = get_user_meta( $usuari->ID, 'nep_consentiment', true );
	return rest_ensure_response(
		array(
			'email'         => $usuari->user_email,
			'consentiment'  => array(
				'versio' => is_array( $cons ) ? (string) ( $cons['versio'] ?? '' ) : '',
				'data'   => is_array( $cons ) ? (string) ( $cons['data'] ?? '' ) : '',
			),
			'progres'       => nep_compte_objecte( nep_compte_progres_desat( $usuari->ID ) ),
			'creat'         => gmdate( 'c', (int) strtotime( $usuari->user_registered . ' UTC' ) ),
		)
	);
}

/**
 * Esborra el compte de l'usuari actual amb la seva contrasenya (DELETE /compte).
 *
 * @param WP_REST_Request $request Petició.
 * @return WP_REST_Response|WP_Error
 */
function nep_rest_compte_esborra( WP_REST_Request $request ) {
	$generic = nep_compte_error( 'nep_contrasenya', __( 'No s\'ha pogut esborrar el compte. Revisa la contrasenya.', 'noempesquen' ), 403 );
	$usuari  = wp_get_current_user();
	$id      = (int) $usuari->ID;
	if ( nep_compte_massa_gran( $request ) ) {
		return $generic;
	}
	$cos = nep_compte_cos_json( $request );
	if ( is_wp_error( $cos ) ) {
		return $cos;
	}
	$clau = nep_clau_limit( 'esborra|' . $id );
	if ( nep_compte_limit_ple( $clau, NEP_COMPTE_LIMIT_ENTRA ) ) {
		return nep_compte_massa_intents();
	}
	$pass = $cos['contrasenya'] ?? null;
	if ( ! is_string( $pass ) || '' === $pass || ! wp_check_password( $pass, $usuari->user_pass, $id ) ) {
		nep_compte_suma_intent( $clau, NEP_COMPTE_FINESTRA_ENTRA );
		return $generic;
	}
	require_once ABSPATH . 'wp-admin/includes/user.php';
	if ( is_multisite() ) {
		require_once ABSPATH . 'wp-admin/includes/ms.php';
		$esborrat = wpmu_delete_user( $id );
		if ( $esborrat ) {
			// wpmu_delete_user no dispara delete_user.
			nep_esborra_metes_compte( $id );
		}
	} else {
		// delete_user executa nep_esborra_metes_compte(); les sessions s'esborren amb l'usuari.
		$esborrat = wp_delete_user( $id );
	}
	if ( ! $esborrat ) {
		return nep_compte_error( 'nep_error_esborra', __( 'No s\'ha pogut esborrar el compte. Torna-ho a provar més tard.', 'noempesquen' ), 500 );
	}
	delete_transient( $clau );
	wp_clear_auth_cookie();
	wp_set_current_user( 0 );
	return rest_ensure_response( array( 'esborrat' => true ) );
}

// XML-RPC desactivat: cap camí d'entrada sense els límits de /compte/entra.
add_filter( 'xmlrpc_enabled', '__return_false' );

/**
 * Un jugador no fa servir /wp/v2/users* (canviaria correu o contrasenya sense
 * l'actual). `rest_request_before_callbacks` també s'aplica a /batch/v1.
 *
 * @param mixed           $resposta Resposta prèvia.
 * @param array           $handler  Gestor de la ruta.
 * @param WP_REST_Request $request  Petició.
 * @return mixed
 */
function nep_bloqueja_users_jugador( $resposta, $handler, $request ) {
	if ( $request instanceof WP_REST_Request && str_starts_with( $request->get_route(), '/wp/v2/users' ) && is_user_logged_in() && nep_es_jugador( wp_get_current_user() ) ) {
		return nep_compte_error( 'nep_sense_permis', __( 'No tens permís per fer això.', 'noempesquen' ), 403 );
	}
	return $resposta;
}
add_filter( 'rest_request_before_callbacks', 'nep_bloqueja_users_jugador', 10, 3 );

/**
 * Sense contrasenyes d'aplicació per als jugadors (l'autenticació Basic
 * saltaria els límits de /compte/entra).
 *
 * @param bool    $disponible Valor previ.
 * @param WP_User $usuari     Usuari.
 * @return bool
 */
function nep_app_passwords_jugador( $disponible, $usuari ) {
	return nep_es_jugador( $usuari ) ? false : $disponible;
}
add_filter( 'wp_is_application_passwords_available_for_user', 'nep_app_passwords_jugador', 10, 2 );

/**
 * wp-login.php (i qualsevol `wp_authenticate` aliè a /compte/entra): un jugador
 * no hi entra mai, i els errors de credencials són genèrics perquè no revelin
 * si el correu o l'usuari existeixen.
 *
 * @param WP_User|WP_Error|null $usuari        Resultat dels filtres anteriors.
 * @param string                $identificador Usuari o correu.
 * @param string                $contrasenya   Contrasenya enviada.
 * @return WP_User|WP_Error|null
 */
function nep_filtra_login_jugador( $usuari, $identificador, $contrasenya = '' ) {
	if ( apply_filters( 'nep_login_propi', false ) ) {
		return $usuari;
	}
	$identificador = is_string( $identificador ) ? trim( $identificador ) : '';
	if ( '' === $identificador ) {
		return $usuari;
	}
	$generic  = nep_compte_error( 'nep_credencials', __( 'Correu o contrasenya incorrectes.', 'noempesquen' ), 401 );
	$objectiu = $usuari instanceof WP_User ? $usuari : get_user_by( 'login', $identificador );
	if ( ! $objectiu instanceof WP_User ) {
		$objectiu = get_user_by( 'email', $identificador );
	}
	if ( $objectiu instanceof WP_User && nep_es_jugador( $objectiu ) ) {
		return $generic;
	}
	if ( is_wp_error( $usuari ) && array_intersect( $usuari->get_error_codes(), array( 'invalid_username', 'invalid_email', 'incorrect_password' ) ) ) {
		if ( array_intersect( $usuari->get_error_codes(), array( 'invalid_username', 'invalid_email' ) ) ) {
			// Usuari inexistent: mateix cost que comprovar una contrasenya real.
			wp_check_password( is_string( $contrasenya ) ? $contrasenya : '', nep_compte_hash_fals() );
		}
		return $generic;
	}
	return $usuari;
}
add_filter( 'authenticate', 'nep_filtra_login_jugador', 100, 3 );

/**
 * Sense recuperació de contrasenya per als jugadors (D1). El missatge és el
 * mateix per a un correu inexistent i per a un jugador: no enumera correus.
 * Per a comptes no jugadors (personal del lloc) el nucli segueix enviant el
 * correu i la resposta canvia: igualar-la trencaria la recuperació de
 * l'equip; s'accepta (vegeu docs/decisions.md).
 *
 * @param WP_Error      $errors    Errors acumulats.
 * @param WP_User|false $user_data Usuari trobat o false.
 * @return WP_Error
 */
function nep_filtra_recuperacio( $errors, $user_data ) {
	if ( ! $user_data instanceof WP_User || nep_es_jugador( $user_data ) ) {
		// Substitueix els errors del nucli (p. ex. `invalid_email`), que distingirien els casos.
		return new WP_Error( 'nep_sense_recuperacio', __( 'No es pot recuperar la contrasenya d\'aquest compte des d\'aquí.', 'noempesquen' ) );
	}
	return $errors;
}
add_filter( 'lostpassword_errors', 'nep_filtra_recuperacio', 10, 2 );
