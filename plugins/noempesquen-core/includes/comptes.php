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

/** Fallades de login permeses per finestra (per IP i per correu). */
const NEP_COMPTE_LIMIT_ENTRA = 8;

/** Finestra del límit de login, en segons. */
const NEP_COMPTE_FINESTRA_ENTRA = 15 * MINUTE_IN_SECONDS;

/** Altes permeses per IP i finestra. */
const NEP_COMPTE_LIMIT_REGISTRE = 5;

/** Finestra del límit d'altes, en segons. */
const NEP_COMPTE_FINESTRA_REGISTRE = HOUR_IN_SECONDS;

/** Mida màxima del cos de les peticions de compte, en bytes. */
const NEP_COMPTE_MIDA_MAX = 8192;

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
 * - L'alta no verifica el correu (D1).
 */

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
 * Resposta de sessió iniciada.
 *
 * @param array $progres Progrés.
 * @return WP_REST_Response
 */
function nep_compte_resposta_connectat( array $progres ): WP_REST_Response {
	return rest_ensure_response(
		array(
			'connectat' => true,
			'nonce'     => wp_create_nonce( 'wp_rest' ),
			'progres'   => nep_compte_objecte( $progres ),
		)
	);
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
		return $generic;
	}
	$cos = nep_compte_cos_json( $request );
	if ( is_wp_error( $cos ) ) {
		return $cos;
	}
	$clau_ip     = nep_clau_limit( 'registre|' . nep_ip_client() );
	$clau_global = nep_clau_limit( 'registre-global' );
	if ( nep_compte_limit_ple( $clau_ip, NEP_COMPTE_LIMIT_REGISTRE ) || nep_compte_limit_ple( $clau_global, (int) NEP_COMPTE_LIMIT_REGISTRE_GLOBAL ) ) {
		return nep_compte_massa_intents();
	}
	nep_compte_suma_intent( $clau_ip, NEP_COMPTE_FINESTRA_REGISTRE );
	nep_compte_suma_intent( $clau_global, HOUR_IN_SECONDS );

	$email = $cos['email'] ?? null;
	$pass  = $cos['contrasenya'] ?? null;
	$dades = array(
		'acepta'       => $cos['acepta'] ?? null,
		'majoria_edat' => $cos['majoria_edat'] ?? null,
	);
	if ( ! nep_valida_email( $email ) || ! nep_valida_contrasenya( $pass ) || ! nep_consentiment_valid( $dades ) ) {
		return $generic;
	}
	if ( email_exists( $email ) ) {
		// Mateix cost que una alta real: el temps no revela si el correu existeix.
		wp_hash_password( $pass );
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
	$usuari = nep_compte_inicia_sessio( (int) $id );
	if ( is_wp_error( $usuari ) ) {
		return $generic;
	}
	return nep_compte_resposta_connectat( array() );
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
	$previa   = wp_parse_auth_cookie( '', 'logged_in' );
	$id_previ = (int) wp_validate_auth_cookie( '', 'logged_in' );
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
	if ( $id_previ && is_array( $previa ) && ! empty( $previa['token'] ) ) {
		WP_Session_Tokens::get_instance( $id_previ )->destroy( $previa['token'] );
	}
	return nep_compte_resposta_connectat( nep_compte_progres_desat( $usuari->ID ) );
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
	return rest_ensure_response( array( 'progres' => nep_compte_objecte( nep_compte_progres_desat( get_current_user_id() ) ) ) );
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
 * @return WP_User|WP_Error|null
 */
function nep_filtra_login_jugador( $usuari, $identificador ) {
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
		return $generic;
	}
	return $usuari;
}
add_filter( 'authenticate', 'nep_filtra_login_jugador', 100, 2 );

/**
 * Sense recuperació de contrasenya per als jugadors (D1). El missatge és el
 * mateix per a un correu inexistent i per a un jugador: no enumera correus.
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
