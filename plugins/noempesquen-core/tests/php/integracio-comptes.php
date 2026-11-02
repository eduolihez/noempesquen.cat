<?php
/**
 * Prova d'integració dels comptes de jugador: rol `nep_jugador` sense capacitats,
 * `nep_es_jugador` i neteja d'rol i metes (uninstall).
 *
 * Execució: wp-env run tests-cli wp eval-file wp-content/plugins/noempesquen-core/tests/php/integracio-comptes.php
 * (o inclosa des d'integracio.php, que ja defineix $nep_comprova).
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

require_once ABSPATH . 'wp-admin/includes/user.php';

$nep_autonom = ! isset( $nep_comprova );
if ( $nep_autonom ) {
	$nep_fallades = 0;
	$nep_comprova = static function ( bool $ok, string $nom ) use ( &$nep_fallades ): void {
		if ( $ok ) {
			WP_CLI::log( "ok  - $nom" );
		} else {
			WP_CLI::log( "ERR - $nom" );
			++$nep_fallades;
		}
	};
}

// El rol existeix després de l'actualització i no té cap capacitat.
nep_actualitza();
nep_actualitza();
$nep_rol = get_role( 'nep_jugador' );
$nep_comprova( null !== $nep_rol, 'rol nep_jugador existeix després de nep_actualitza() (idempotent)' );
$nep_comprova( $nep_rol && array() === array_filter( $nep_rol->capabilities ), 'nep_jugador no té capacitats' );
$nep_comprova( '4' === NEP_DB_VERSION && '4' === get_option( 'nep_db_version' ), 'NEP_DB_VERSION és 4' );

// nep_es_jugador.
$nep_jug_id = (int) wp_insert_user(
	array(
		'user_login' => 'nep_jug_' . wp_rand( 10000, 99999 ),
		'user_pass'  => wp_generate_password(),
		'role'       => 'nep_jugador',
	)
);
$nep_adm = get_userdata( 1 );
$nep_comprova( nep_es_jugador( new WP_User( $nep_jug_id ) ) && nep_es_jugador( $nep_jug_id ), 'nep_es_jugador: jugador → true' );
$nep_comprova( ! nep_es_jugador( $nep_adm ) && ! nep_es_jugador( 0 ), 'nep_es_jugador: administrador i invàlid → false' );
wp_set_current_user( $nep_jug_id );
$nep_comprova( false === apply_filters( 'show_admin_bar', true ), 'jugador: sense barra d\'administració' );
$nep_comprova( home_url( '/compte/' ) === apply_filters( 'login_redirect', 'x', '', new WP_User( $nep_jug_id ) ), 'jugador: login_redirect → /compte/' );
$nep_comprova( ! current_user_can( 'read' ), 'jugador: sense read' );
// Un jugador amb sessió no toca /wp/v2/users* (correu o contrasenya sense la
// actual) ni crea contrasenyes d'aplicació (Basic saltaria els límits).
$nep_jug_obj = get_userdata( $nep_jug_id );
$nep_email_0 = $nep_jug_obj->user_email;
$nep_hash_0  = $nep_jug_obj->user_pass;
$nep_u       = new WP_REST_Request( 'PUT', '/wp/v2/users/me' );
$nep_u->set_header( 'Content-Type', 'application/json' );
$nep_u->set_body( wp_json_encode( array( 'email' => 'canvi' . wp_rand( 1000, 9999 ) . '@exemple.cat', 'password' => 'nova-contrasenya-123' ) ) );
$r = rest_do_request( $nep_u );
clean_user_cache( $nep_jug_id );
$nep_jug_obj = get_userdata( $nep_jug_id );
$nep_comprova( 403 === $r->get_status() && $nep_email_0 === $nep_jug_obj->user_email && $nep_hash_0 === $nep_jug_obj->user_pass, 'jugador: PUT /wp/v2/users/me → 403 i res canviat' );
$r = rest_do_request( new WP_REST_Request( 'GET', '/wp/v2/users/me' ) );
$nep_comprova( 403 === $r->get_status(), 'jugador: GET /wp/v2/users/me → 403' );
$nep_ap = new WP_REST_Request( 'POST', '/wp/v2/users/me/application-passwords' );
$nep_ap->set_header( 'Content-Type', 'application/json' );
$nep_ap->set_body( wp_json_encode( array( 'name' => 'prova' ) ) );
$r = rest_do_request( $nep_ap );
$nep_comprova( 403 === $r->get_status() && array() === WP_Application_Passwords::get_user_application_passwords( $nep_jug_id ), 'jugador: no crea contrasenyes d\'aplicació (REST)' );
$nep_comprova( false === wp_is_application_passwords_available_for_user( $nep_jug_id ), 'jugador: contrasenyes d\'aplicació no disponibles' );
wp_set_current_user( 1 );
$nep_comprova( true === apply_filters( 'show_admin_bar', true ), 'administrador: conserva la barra' );
$nep_comprova( 200 === rest_do_request( new WP_REST_Request( 'GET', '/wp/v2/users/me' ) )->get_status(), 'administrador: /wp/v2/users/me segueix funcionant' );

// --- Endpoints REST de compte ---------------------------------------------
global $wpdb;
// Petició JSON com la del front; la galeta de sessió es captura (no s'envia).
$nep_json = static function ( string $metode, string $ruta, array $cos = array(), array $capcaleres = array() ): WP_REST_Response {
	$peticio = new WP_REST_Request( $metode, $ruta );
	$peticio->set_header( 'Content-Type', 'application/json' );
	foreach ( $capcaleres as $nom => $valor ) {
		$peticio->set_header( $nom, $valor );
	}
	if ( $cos ) {
		$peticio->set_body( wp_json_encode( $cos ) );
	}
	// Com serve_request(): aplica rest_post_dispatch (capçaleres de les rutes).
	return apply_filters( 'rest_post_dispatch', rest_do_request( $peticio ), rest_get_server(), $peticio );
};
$nep_ip_prova = '';
$nep_filtre_ip = static function () use ( &$nep_ip_prova ) {
	return $nep_ip_prova;
};
$nep_nova_ip = static function () use ( &$nep_ip_prova ): void {
	$nep_ip_prova = '10.' . wp_rand( 1, 254 ) . '.' . wp_rand( 1, 254 ) . '.' . wp_rand( 1, 254 );
};
$nep_galeta = '';
$nep_captura = static function ( $galeta ) use ( &$nep_galeta ) {
	$nep_galeta = $galeta;
};
add_filter( 'nep_ip_client', $nep_filtre_ip );
add_filter( 'send_auth_cookies', '__return_false' );

// Correu: es captura amb pre_wp_mail (no s'envia res); `$nep_mail_falla` el fa fallar.
$nep_mails          = array();
$nep_mail_falla     = false;
$nep_captura_correu = static function ( $previ, $atts ) use ( &$nep_mails, &$nep_mail_falla ) {
	$nep_mails[] = $atts;
	return ! $nep_mail_falla;
};
add_filter( 'pre_wp_mail', $nep_captura_correu, 10, 2 );
add_action( 'set_logged_in_cookie', $nep_captura );

// Simula la petició següent del navegador: només amb la galeta i el nonce rebuts.
$nep_peticio_seguent = static function ( string $nonce ) use ( &$nep_galeta ): bool {
	global $wp_rest_auth_cookie;
	wp_set_current_user( 0 );
	$_COOKIE = array( LOGGED_IN_COOKIE => $nep_galeta );
	wp_set_current_user( (int) wp_validate_auth_cookie( $nep_galeta, 'logged_in' ) );
	$wp_rest_auth_cookie          = true;
	$_SERVER['HTTP_X_WP_NONCE']   = $nonce;
	$ok                           = true === rest_cookie_check_errors( null );
	$_SERVER['HTTP_X_WP_NONCE']   = 'nonce-dolent';
	$ok                           = $ok && is_wp_error( rest_cookie_check_errors( null ) );
	$wp_rest_auth_cookie          = false;
	unset( $_SERVER['HTTP_X_WP_NONCE'] );
	return $ok && get_current_user_id() > 0;
};

$nep_ids_m   = array_keys( nep_missions_jugables() );
$nep_m1      = (string) $nep_ids_m[0];
$nep_m2      = (string) ( $nep_ids_m[1] ?? $nep_ids_m[0] );
$nep_pass    = 'contrasenya-de-prova';
$nep_email1  = 'nep' . wp_rand( 100000, 999999 ) . '@exemple.cat';
$nep_alta    = static fn( string $email, array $extra = array() ) => array_merge(
	array(
		'email'        => $email,
		'contrasenya'  => $nep_pass,
		'acepta'       => true,
		'majoria_edat' => true,
	),
	$extra
);

// 1. Crítica: el nonce de l'alta serveix a la petició següent sense recarregar.
$_COOKIE = array();
wp_set_current_user( 0 );
$nep_nova_ip();
$r     = $nep_json( 'POST', '/noempesquen/v1/compte/registre', $nep_alta( $nep_email1 ) );
$nonce = (string) ( $r->get_data()['nonce'] ?? '' );
$nep_comprova( 200 === $r->get_status() && true === $r->get_data()['connectat'] && '' !== $nonce, 'registre: 200 amb connectat i nonce' );
$nep_comprova( '' !== $nep_galeta && $nep_peticio_seguent( $nonce ), 'registre: el nonce retornat val amb la galeta nova (X-WP-Nonce)' );
$r = $nep_json( 'PUT', '/noempesquen/v1/compte/progres', array( 'progres' => array( $nep_m1 => 1 ) ), array( 'X-WP-Nonce' => $nonce ) );
$nep_comprova( 200 === $r->get_status() && 1 === ( (array) $r->get_data()['progres'] )[ $nep_m1 ], 'registre: PUT progres amb el nonce funciona sense recarregar' );
$nep_comprova( 'no-store' === ( $r->get_headers()['Cache-Control'] ?? '' ), 'compte: Cache-Control no-store' );
$nep_jug1 = get_user_by( 'email', $nep_email1 );

// 2. Alta: validació i missatge genèric.
$nep_nova_ip();
wp_set_current_user( 0 );
$r1 = $nep_json( 'POST', '/noempesquen/v1/compte/registre', $nep_alta( 'a' . $nep_email1, array( 'acepta' => false ) ) );
$r2 = $nep_json( 'POST', '/noempesquen/v1/compte/registre', $nep_alta( 'b' . $nep_email1, array( 'majoria_edat' => null ) ) );
$r3 = $nep_json( 'POST', '/noempesquen/v1/compte/registre', $nep_alta( 'correu-dolent' ) );
$r4 = $nep_json( 'POST', '/noempesquen/v1/compte/registre', $nep_alta( 'c' . $nep_email1, array( 'contrasenya' => '123456789' ) ) );
$r5 = $nep_json( 'POST', '/noempesquen/v1/compte/registre', $nep_alta( $nep_email1 ) );
$nep_comprova( 400 === $r1->get_status() && 400 === $r2->get_status(), 'registre: sense acepta o majoria_edat → 400' );
$nep_comprova( 400 === $r3->get_status() && 400 === $r4->get_status(), 'registre: correu dolent o contrasenya de 9 → 400' );
$nep_comprova( 400 === $r5->get_status() && $r5->get_data()['message'] === $r1->get_data()['message'], 'registre: correu duplicat → mateix missatge genèric' );
$nep_comprova( false === get_user_by( 'email', 'a' . $nep_email1 ), 'registre: alta rebutjada no crea usuari' );
$nep_cons = $nep_jug1 ? get_user_meta( $nep_jug1->ID, 'nep_consentiment', true ) : null;
$nep_comprova( $nep_jug1 && nep_es_jugador( $nep_jug1 ) && str_starts_with( $nep_jug1->user_login, 'nep_' ) && is_array( $nep_cons ) && NEP_VERSIO_CONSENTIMENT === $nep_cons['versio'], 'registre: rol nep_jugador i meta nep_consentiment' );
$r = $nep_json( 'POST', '/noempesquen/v1/compte/registre', $nep_alta( 'd' . $nep_email1 ) );
$nep_comprova( 429 === $r->get_status() && 'nep_massa_intents' === $r->get_data()['code'], 'registre: la sisena alta de la IP → 429' );

// 3. Entrada.
$nep_nova_ip();
wp_set_current_user( 0 );
$_COOKIE = array();
$r = $nep_json( 'POST', '/noempesquen/v1/compte/entra', array( 'email' => $nep_email1, 'contrasenya' => 'incorrecta-123' ) );
$nep_comprova( 401 === $r->get_status() && 0 === get_current_user_id(), 'entra: contrasenya incorrecta → 401' );
$nep_msg_401 = $r->get_data()['message'];
$r = $nep_json( 'POST', '/noempesquen/v1/compte/entra', array( 'email' => 'ningu' . $nep_email1, 'contrasenya' => $nep_pass ) );
$nep_comprova( 401 === $r->get_status() && $nep_msg_401 === $r->get_data()['message'], 'entra: correu inexistent → mateix 401' );
$nep_email_adm = 'adm' . $nep_email1;
$nep_adm_id    = (int) wp_insert_user(
	array(
		'user_login' => 'nep_adm_' . wp_rand( 10000, 99999 ),
		'user_email' => $nep_email_adm,
		'user_pass'  => $nep_pass,
		'role'       => 'administrator',
	)
);
$nep_galeta = '';
$r          = $nep_json( 'POST', '/noempesquen/v1/compte/entra', array( 'email' => $nep_email_adm, 'contrasenya' => $nep_pass ) );
$nep_comprova( 401 === $r->get_status() && '' === $nep_galeta && 0 === get_current_user_id(), 'entra: un administrador no entra per /compte/entra' );
wp_delete_user( $nep_adm_id );
$r     = $nep_json( 'POST', '/noempesquen/v1/compte/entra', array( 'email' => $nep_email1, 'contrasenya' => $nep_pass ) );
$nonce = (string) ( $r->get_data()['nonce'] ?? '' );
$nep_comprova( 200 === $r->get_status() && 1 === ( (array) $r->get_data()['progres'] )[ $nep_m1 ], 'entra: correcta → 200 amb el progrés desat' );
$nep_comprova( $nep_peticio_seguent( $nonce ) && get_current_user_id() === $nep_jug1->ID, 'entra: el nonce retornat val amb la galeta nova' );

// 4. Progrés: sanejat i fusió.
$nep_put = static fn( array $p ) => (array) $nep_json( 'PUT', '/noempesquen/v1/compte/progres', array( 'progres' => $p ) )->get_data()['progres'];
$p       = $nep_put( array( $nep_m1 => 2, 'missio-inexistent' => 3 ) );
$nep_comprova( 2 === $p[ $nep_m1 ] && ! isset( $p['missio-inexistent'] ), 'progres: missió inexistent descartada' );
$p = $nep_put( array( $nep_m1 => 4 ) );
$nep_comprova( 2 === $p[ $nep_m1 ], 'progres: 4 estrelles descartades' );
$p = $nep_put( array( $nep_m1 => 1, $nep_m2 => 3 ) );
$nep_comprova( 2 === $p[ $nep_m1 ] && 3 === $p[ $nep_m2 ], 'progres: mai baixa estrelles' );
$r = $nep_json( 'GET', '/noempesquen/v1/compte/progres' );
$nep_comprova( $p === (array) $r->get_data()['progres'], 'progres: GET torna el desat' );

// 7. Exportació.
$r = $nep_json( 'GET', '/noempesquen/v1/compte/exporta' );
$d = $r->get_data();
$nep_comprova( array( 'consentiment', 'creat', 'email', 'progres' ) === ( static function ( $k ) { sort( $k ); return $k; } )( array_keys( $d ) ) && $nep_email1 === $d['email'] && array( 'versio', 'data' ) === array_keys( $d['consentiment'] ), 'exporta: només correu, consentiment, progrés i data' );
$nep_comprova( 'no-store' === ( $r->get_headers()['Cache-Control'] ?? '' ), 'exporta: Cache-Control no-store' );

// Sortida: destrueix la sessió actual.
$r = $nep_json( 'POST', '/noempesquen/v1/compte/surt' );
$nep_comprova( 200 === $r->get_status() && false === $r->get_data()['connectat'] && 0 === get_current_user_id() && false === wp_validate_auth_cookie( $nep_galeta, 'logged_in' ), 'surt: tanca i destrueix la sessió' );

// 8. Anònim contra les rutes privades.
wp_set_current_user( 0 );
$nep_anonim = true;
foreach ( array( array( 'GET', '/compte/progres' ), array( 'PUT', '/compte/progres' ), array( 'DELETE', '/compte' ), array( 'GET', '/compte/exporta' ) ) as $nep_ruta ) {
	$r          = $nep_json( $nep_ruta[0], '/noempesquen/v1' . $nep_ruta[1], array( 'progres' => array( $nep_m1 => 3 ), 'contrasenya' => $nep_pass ) );
	$nep_anonim = $nep_anonim && in_array( $r->get_status(), array( 401, 403 ), true ) && 'no-store' === ( $r->get_headers()['Cache-Control'] ?? '' );
}
$nep_comprova( $nep_anonim, 'anònim: progres, exporta i DELETE compte → 401/403' );
$r = $nep_json( 'GET', '/wp/v2/users' );
$nep_comprova( ! in_array( $nep_jug1->ID, array_column( (array) $r->get_data(), 'id' ), true ), 'anònim: /wp/v2/users no llista jugadors' );
$r = $nep_json( 'GET', '/wp/v2/users/' . $nep_jug1->ID );
$nep_comprova( in_array( $r->get_status(), array( 401, 403, 404 ), true ), 'anònim: /wp/v2/users/<jugador> no s\'exposa' );

// 5. Límit: el novè intent fallit de login → 429.
$nep_nova_ip();
$nep_email5 = 'rl' . $nep_email1;
$nep_codis  = array();
for ( $i = 1; $i <= 9; $i++ ) {
	$nep_codis[] = $nep_json( 'POST', '/noempesquen/v1/compte/entra', array( 'email' => $nep_email5, 'contrasenya' => 'incorrecta-' . $i ) )->get_status();
}
$nep_comprova( array_fill( 0, 8, 401 ) === array_slice( $nep_codis, 0, 8 ) && 429 === $nep_codis[8], 'entra: el novè intent fallit → 429' );

// 9. Ronda de seguretat de la 3B.
// X-Forwarded-For no canvia la clau del límit (només REMOTE_ADDR).
remove_filter( 'nep_ip_client', $nep_filtre_ip );
$nep_remot                       = $_SERVER['REMOTE_ADDR'] ?? null;
$_SERVER['REMOTE_ADDR']          = '10.20.30.40';
$nep_clau_a                      = nep_clau_limit( 'entra|' . nep_ip_client() );
$_SERVER['HTTP_X_FORWARDED_FOR'] = '203.0.113.9';
$nep_clau_b                      = nep_clau_limit( 'entra|' . nep_ip_client() );
unset( $_SERVER['HTTP_X_FORWARDED_FOR'] );
$_SERVER['REMOTE_ADDR'] = $nep_remot;
add_filter( 'nep_ip_client', $nep_filtre_ip );
$nep_comprova( $nep_clau_a === $nep_clau_b, 'límit: X-Forwarded-For no canvia la clau' );

// Només cos JSON: formulari → 415; contrasenya a la query string → ignorada.
$nep_nova_ip();
wp_set_current_user( 0 );
$_COOKIE = array();
$nep_form = new WP_REST_Request( 'POST', '/noempesquen/v1/compte/entra' );
$nep_form->set_header( 'Content-Type', 'application/x-www-form-urlencoded' );
$nep_form->set_body_params( array( 'email' => $nep_email1, 'contrasenya' => $nep_pass ) );
$r = rest_do_request( $nep_form );
$nep_comprova( 415 === $r->get_status() && 0 === get_current_user_id(), 'entra: cos de formulari → 415' );
$nep_query = new WP_REST_Request( 'POST', '/noempesquen/v1/compte/entra' );
$nep_query->set_header( 'Content-Type', 'application/json' );
$nep_query->set_query_params( array( 'email' => $nep_email1, 'contrasenya' => $nep_pass ) );
$r = rest_do_request( $nep_query );
$nep_comprova( 401 === $r->get_status() && 0 === get_current_user_id(), 'entra: contrasenya a la query string → ignorada (401)' );

// Hash fictici amb el mateix algorisme que els reals.
$nep_hash_fals = (string) get_option( 'nep_hash_fals' );
$nep_comprova( '' !== $nep_hash_fals && substr( $nep_hash_fals, 0, 4 ) === substr( wp_hash_password( 'x' ), 0, 4 ), 'entra: hash fictici amb el mateix algorisme' );

// /entra destrueix la sessió anterior del navegador (petició sense nonce: usuari 0).
$nep_galeta = '';
$nep_json( 'POST', '/noempesquen/v1/compte/entra', array( 'email' => $nep_email1, 'contrasenya' => $nep_pass ) );
$nep_galeta_vella = $nep_galeta;
$_COOKIE          = array( LOGGED_IN_COOKIE => $nep_galeta_vella );
wp_set_current_user( 0 );
$nep_json( 'POST', '/noempesquen/v1/compte/entra', array( 'email' => $nep_email1, 'contrasenya' => $nep_pass ) );
$nep_comprova( '' !== $nep_galeta_vella && $nep_galeta !== $nep_galeta_vella && false === wp_validate_auth_cookie( $nep_galeta_vella, 'logged_in' ) && false !== wp_validate_auth_cookie( $nep_galeta, 'logged_in' ), 'entra: destrueix la sessió anterior' );

// wp-login.php, XML-RPC i recuperació de contrasenya.
$nep_ok_login = is_wp_error( wp_authenticate( $nep_jug1->user_login, $nep_pass ) ) && is_wp_error( wp_authenticate( $nep_email1, $nep_pass ) );
$nep_err_jug  = wp_authenticate( $nep_email1, $nep_pass );
$nep_err_cap  = wp_authenticate( 'ningu' . $nep_email1, 'x' );
$nep_comprova( $nep_ok_login && $nep_err_jug->get_error_message() === $nep_err_cap->get_error_message(), 'wp-login: un jugador no entra i el missatge és genèric' );
$nep_comprova( false === apply_filters( 'xmlrpc_enabled', true ), 'xmlrpc: desactivat' );
$nep_rp_jug = retrieve_password( $nep_jug1->user_login );
$nep_rp_cap = retrieve_password( 'ningu' . $nep_email1 );
$nep_comprova( is_wp_error( $nep_rp_jug ) && is_wp_error( $nep_rp_cap ) && $nep_rp_jug->get_error_message() === $nep_rp_cap->get_error_message(), 'lostpassword: mateix missatge per a jugador i inexistent' );

// Límit global d'altes per hora.
$nep_nova_ip();
set_transient(
	nep_clau_limit( 'registre-global' ),
	array(
		'n'  => (int) NEP_COMPTE_LIMIT_REGISTRE_GLOBAL,
		'fi' => time() + 60,
	),
	60
);
$r = $nep_json( 'POST', '/noempesquen/v1/compte/registre', $nep_alta( 'g' . $nep_email1 ) );
delete_transient( nep_clau_limit( 'registre-global' ) );
$nep_comprova( 429 === $r->get_status() && false === get_user_by( 'email', 'g' . $nep_email1 ), 'registre: límit global per hora → 429' );
$nep_nova_ip();
$nep_json( 'POST', '/noempesquen/v1/compte/registre', $nep_alta( 'correu-dolent' ) );
$nep_comprova( false === get_transient( nep_clau_limit( 'registre-global' ) ), 'registre: un cos invàlid no suma al límit global' );

// L'alta també destrueix la sessió anterior del navegador.
$nep_nova_ip();
$_COOKIE    = array();
$nep_galeta = '';
wp_set_current_user( 0 );
$nep_json( 'POST', '/noempesquen/v1/compte/entra', array( 'email' => $nep_email1, 'contrasenya' => $nep_pass ) );
$nep_galeta_vella = $nep_galeta;
$_COOKIE          = array( LOGGED_IN_COOKIE => $nep_galeta_vella );
wp_set_current_user( 0 );
$nep_email_s = 's' . $nep_email1;
$nep_json( 'POST', '/noempesquen/v1/compte/registre', $nep_alta( $nep_email_s ) );
$nep_comprova( '' !== $nep_galeta_vella && $nep_galeta !== $nep_galeta_vella && false === wp_validate_auth_cookie( $nep_galeta_vella, 'logged_in' ) && false !== get_user_by( 'email', $nep_email_s ), 'registre: destrueix la sessió anterior' );
$nep_usuari_s = get_user_by( 'email', $nep_email_s );
if ( $nep_usuari_s ) {
	wp_delete_user( $nep_usuari_s->ID );
}
delete_transient( nep_clau_limit( 'registre-global' ) );

// Verificació del correu.
$nep_token_de = static function ( array $correu ): string {
	return preg_match( '/\/compte\/\?verifica=(\d+\.[0-9a-f]{64})/', (string) $correu['message'], $m ) ? $m[1] : '';
};
$nep_verifica = static fn( $token ) => $nep_json( 'POST', '/noempesquen/v1/compte/verifica', array( 'token' => $token ) );
$nep_reenvia  = static fn() => $nep_json( 'POST', '/noempesquen/v1/compte/reenvia-verificacio' );
$nep_resum    = static fn( WP_REST_Response $r ) => array( $r->get_status(), $r->get_data()['code'] ?? '', $r->get_data()['message'] ?? '' );

$nep_nova_ip();
$_COOKIE     = array();
$nep_mails   = array();
$nep_email_v = 'v' . $nep_email1;
wp_set_current_user( 0 );
$r      = $nep_json( 'POST', '/noempesquen/v1/compte/registre', $nep_alta( $nep_email_v ) );
$nep_v  = get_user_by( 'email', $nep_email_v );
$nep_t1 = $nep_mails ? $nep_token_de( $nep_mails[0] ) : '';
$nep_comprova( 200 === $r->get_status() && false === $r->get_data()['verificat'] && 1 === count( $nep_mails ) && $nep_email_v === $nep_mails[0]['to'], 'verificació: l\'alta envia un correu al destinatari i torna verificat=false' );
$nep_comprova( '' !== $nep_t1 && ! str_contains( wp_json_encode( $r->get_data() ), substr( $nep_t1, -64 ) ), 'verificació: enllaç ?verifica= al correu i el token no surt a la resposta REST' );
$nep_comprova( str_contains( $nep_mails[0]['message'], '48' ) && str_contains( implode( ' ', (array) $nep_mails[0]['headers'] ), 'text/plain' ), 'verificació: correu en text pla amb la caducitat' );
$nep_reg = get_user_meta( $nep_v->ID, 'nep_token_verifica', true );
$nep_comprova( is_array( $nep_reg ) && ! str_contains( maybe_serialize( $nep_reg ), substr( $nep_t1, -64 ) ) && $nep_reg['caduca'] > time() + NEP_TTL_VERIFICA - 60, 'verificació: el meta té el hash i la caducitat, mai el secret en clar' );
$nep_comprova( ! metadata_exists( 'user', $nep_v->ID, 'nep_email_verificat' ), 'verificació: l\'alta no deixa el compte verificat' );

// Reenviament: invalida l'anterior, límit de 3 per hora.
$r1     = $nep_reenvia();
$nep_t2 = $nep_token_de( end( $nep_mails ) );
$nep_comprova( 200 === $r1->get_status() && false === $r1->get_data()['verificat'] && true === $r1->get_data()['enviat'] && 2 === count( $nep_mails ) && '' !== $nep_t2 && $nep_t2 !== $nep_t1, 'reenvia: envia un token nou' );
$nep_msgs   = array();
$nep_msgs[] = $nep_resum( $nep_verifica( $nep_t1 ) );
$nep_comprova( 400 === $nep_msgs[0][0] && 'nep_token_invalid' === $nep_msgs[0][1], 'reenvia: el token anterior queda invalidat' );
$nep_reenvia();
$r3     = $nep_reenvia();
$nep_t3 = $nep_token_de( end( $nep_mails ) );
$r4     = $nep_reenvia();
$nep_comprova( 200 === $r3->get_status() && 4 === count( $nep_mails ) && 429 === $r4->get_status() && 'nep_massa_intents' === $r4->get_data()['code'], 'reenvia: el quart de l\'hora → 429 i no envia' );

// Si wp_mail falla, el reenviament torna 200 amb enviat=false.
$nep_nova_ip();
$nep_email_g = 'g' . $nep_email1;
$nep_json( 'POST', '/noempesquen/v1/compte/registre', $nep_alta( $nep_email_g ) );
$nep_g = get_user_by( 'email', $nep_email_g );
wp_set_current_user( $nep_g->ID );
$nep_mail_falla = true;
$r              = $nep_reenvia();
$nep_mail_falla = false;
$nep_comprova( 200 === $r->get_status() && false === $r->get_data()['verificat'] && false === $r->get_data()['enviat'], 'reenvia: si el correu falla → 200 amb enviat=false' );
wp_delete_user( $nep_g->ID );
wp_set_current_user( $nep_v->ID );

// Tokens invàlids: tots amb el mateix 400.
$nep_nova_ip();
$nep_email_w = 'w' . $nep_email1;
$nep_json( 'POST', '/noempesquen/v1/compte/registre', $nep_alta( $nep_email_w ) );
$nep_w        = get_user_by( 'email', $nep_email_w );
$nep_tw       = $nep_token_de( end( $nep_mails ) );
$nep_secret_w = substr( $nep_tw, -64 );
$nep_secret_v = substr( $nep_t3, -64 );
wp_set_current_user( 0 );
$nep_nova_ip();
$nep_mal = array(
	'manipulat'     => substr( $nep_t3, 0, -1 ) . ( '0' === substr( $nep_t3, -1 ) ? '1' : '0' ),
	'altre usuari'  => $nep_v->ID . '.' . $nep_secret_w,
	'id inexistent' => '999999999.' . $nep_secret_v,
	'format'        => 'no-es-un-token',
	'buit'          => '',
	'no cadena'     => array( 'x' ),
);
foreach ( $nep_mal as $nep_t ) {
	$nep_msgs[] = $nep_resum( $nep_verifica( $nep_t ) );
}
// Usuari NO jugador (editor) amb un registre vàlid i el token real: rebutjat per rol.
$nep_ed_id = (int) wp_insert_user(
	array(
		'user_login' => 'nep_ed_' . wp_rand( 10000, 99999 ),
		'user_pass'  => wp_generate_password(),
		'role'       => 'editor',
	)
);
$nep_ed_sec = bin2hex( random_bytes( 32 ) );
update_user_meta( $nep_ed_id, 'nep_token_verifica', nep_token_registre( $nep_ed_sec, wp_salt( 'auth' ), time(), NEP_TTL_VERIFICA ) );
$nep_msgs[] = $nep_resum( $nep_verifica( $nep_ed_id . '.' . $nep_ed_sec ) );
$nep_comprova( ! metadata_exists( 'user', $nep_ed_id, 'nep_email_verificat' ) && metadata_exists( 'user', $nep_ed_id, 'nep_token_verifica' ), 'verifica: usuari no jugador amb token real no es verifica' );
wp_delete_user( $nep_ed_id );
// Caducat (manipulant el meta).
$nep_reg_w           = get_user_meta( $nep_w->ID, 'nep_token_verifica', true );
$nep_reg_w['caduca'] = time() - 1;
update_user_meta( $nep_w->ID, 'nep_token_verifica', $nep_reg_w );
$nep_msgs[] = $nep_resum( $nep_verifica( $nep_tw ) );
$nep_comprova( count( $nep_msgs ) === count( $nep_mal ) + 3 && 1 === count( array_unique( array_map( 'wp_json_encode', $nep_msgs ) ) ) && 400 === $nep_msgs[0][0] && 'nep_token_invalid' === $nep_msgs[0][1], 'verifica: manipulat, d\'un altre usuari, inexistent, no jugador (token real), caducat, mal format o antic → mateix 400' );
$nep_comprova( ! metadata_exists( 'user', $nep_v->ID, 'nep_email_verificat' ) && ! metadata_exists( 'user', $nep_w->ID, 'nep_email_verificat' ), 'verifica: cap intent invàlid verifica res' );

// Correcte i d'un sol ús; no inicia sessió.
wp_set_current_user( 0 );
$r  = $nep_verifica( $nep_t3 );
$r2 = $nep_verifica( $nep_t3 );
$nep_comprova( 200 === $r->get_status() && array( 'verificat' => true ) === $r->get_data() && 0 === get_current_user_id() && 'no-store' === ( $r->get_headers()['Cache-Control'] ?? '' ), 'verifica: correcte → 200 {verificat:true} sense iniciar sessió' );
$nep_comprova( (int) get_user_meta( $nep_v->ID, 'nep_email_verificat', true ) > time() - 60 && ! metadata_exists( 'user', $nep_v->ID, 'nep_token_verifica' ) && 400 === $r2->get_status(), 'verifica: desa la data, esborra el token i no es pot reutilitzar' );
// Reenviar un compte ja verificat no envia res.
$nep_mails_abans = count( $nep_mails );
wp_set_current_user( $nep_v->ID );
$r = $nep_reenvia();
$nep_comprova( 200 === $r->get_status() && true === $r->get_data()['verificat'] && count( $nep_mails ) === $nep_mails_abans, 'reenvia: ja verificat → 200 {verificat:true} sense enviar' );
// verificat apareix a entra i a GET progres; un anònim no reenvia.
wp_set_current_user( 0 );
$_COOKIE = array();
$r       = $nep_json( 'POST', '/noempesquen/v1/compte/entra', array( 'email' => $nep_email_v, 'contrasenya' => $nep_pass ) );
$nep_comprova( 200 === $r->get_status() && true === $r->get_data()['verificat'], 'entra: inclou verificat=true' );
$r = $nep_json( 'GET', '/noempesquen/v1/compte/progres' );
$nep_comprova( true === ( $r->get_data()['verificat'] ?? null ), 'progres: GET inclou verificat' );
wp_set_current_user( 0 );
$nep_comprova( in_array( $nep_reenvia()->get_status(), array( 401, 403 ), true ), 'reenvia: anònim → 401/403' );
// Formulari → 415; límit per IP.
$nep_form = new WP_REST_Request( 'POST', '/noempesquen/v1/compte/verifica' );
$nep_form->set_header( 'Content-Type', 'application/x-www-form-urlencoded' );
$nep_form->set_body_params( array( 'token' => $nep_t3 ) );
$nep_comprova( 415 === rest_do_request( $nep_form )->get_status(), 'verifica: cos de formulari → 415' );
$nep_nova_ip();
$nep_codis = array();
for ( $i = 1; $i <= 21; $i++ ) {
	$nep_codis[] = $nep_verifica( 'x' )->get_status();
}
$nep_comprova( array_fill( 0, 20, 400 ) === array_slice( $nep_codis, 0, 20 ) && 429 === $nep_codis[20], 'verifica: el 21è intent de la IP → 429' );

// Si wp_mail falla, l'alta no falla.
$nep_nova_ip();
$nep_mail_falla = true;
$nep_email_f    = 'f' . $nep_email1;
wp_set_current_user( 0 );
$r              = $nep_json( 'POST', '/noempesquen/v1/compte/registre', $nep_alta( $nep_email_f ) );
$nep_mail_falla = false;
$nep_f          = get_user_by( 'email', $nep_email_f );
$nep_comprova( 200 === $r->get_status() && true === $r->get_data()['connectat'] && false !== $nep_f, 'registre: si el correu falla, l\'alta segueix OK' );

// Privacitat: l'exportador porta la data de verificació, mai el token; l'esborrat neteja les metes.
$nep_txt = wp_json_encode( nep_exporta_dades_personals( $nep_email_v ) );
$nep_comprova( str_contains( $nep_txt, gmdate( 'Y-m-d', (int) get_user_meta( $nep_v->ID, 'nep_email_verificat', true ) ) ), 'privacitat: l\'exportador inclou la data de verificació' );
$nep_exp_w = wp_json_encode( nep_exporta_dades_personals( $nep_email_w ) );
$nep_comprova( metadata_exists( 'user', $nep_w->ID, 'nep_token_verifica' ) && ! str_contains( $nep_exp_w, $nep_secret_w ) && ! str_contains( $nep_exp_w, (string) $nep_reg_w['hash'] ), 'privacitat: l\'exportador mai inclou el token ni el seu hash' );
update_user_meta( $nep_v->ID, 'nep_token_verifica', $nep_reg_w );
$nep_comprova( true === nep_esborra_metes_compte( $nep_v->ID ) && ! metadata_exists( 'user', $nep_v->ID, 'nep_token_verifica' ) && ! metadata_exists( 'user', $nep_v->ID, 'nep_email_verificat' ), 'privacitat: nep_esborra_metes_compte esborra token i verificació' );
update_user_meta( $nep_w->ID, 'nep_email_verificat', time() );
$nep_ids_v = array( $nep_v->ID, $nep_w->ID, $nep_f ? $nep_f->ID : 0 );
foreach ( $nep_ids_v as $nep_id_v ) {
	if ( $nep_id_v ) {
		wp_delete_user( $nep_id_v );
	}
}
$nep_comprova( 0 === (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $wpdb->usermeta WHERE user_id IN (%d,%d,%d)", $nep_ids_v ) ), 'verificació: esborrar el compte no deixa metes' ); // phpcs:ignore WordPress.DB
delete_transient( nep_clau_limit( 'registre-global' ) );
wp_set_current_user( 0 );
$_COOKIE = array();

// DELETE /compte: límit d'intents de contrasenya i 415 sense JSON.
$nep_nova_ip();
$_COOKIE = array();
$nep_json( 'POST', '/noempesquen/v1/compte/entra', array( 'email' => $nep_email1, 'contrasenya' => $nep_pass ) );
$nep_form = new WP_REST_Request( 'DELETE', '/noempesquen/v1/compte' );
$nep_form->set_query_params( array( 'contrasenya' => $nep_pass ) );
$r = rest_do_request( $nep_form );
$nep_comprova( 415 === $r->get_status() && false !== get_userdata( $nep_jug1->ID ), 'esborra: sense JSON (contrasenya a la query) → 415' );
$nep_codis = array();
for ( $i = 1; $i <= 9; $i++ ) {
	$nep_codis[] = $nep_json( 'DELETE', '/noempesquen/v1/compte', array( 'contrasenya' => 'incorrecta-' . $i ) )->get_status();
}
$r = $nep_json( 'DELETE', '/noempesquen/v1/compte', array( 'contrasenya' => $nep_pass ) );
$nep_comprova( array_fill( 0, 8, 403 ) === array_slice( $nep_codis, 0, 8 ) && 429 === $nep_codis[8] && 429 === $r->get_status() && false !== get_userdata( $nep_jug1->ID ), 'esborra: el novè intent fallit → 429 (també amb la correcta)' );
delete_transient( nep_clau_limit( 'esborra|' . $nep_jug1->ID ) );

// 6. Esborrat.
$nep_nova_ip();
$_COOKIE = array();
$nep_json( 'POST', '/noempesquen/v1/compte/entra', array( 'email' => $nep_email1, 'contrasenya' => $nep_pass ) );
$nep_files = (int) $wpdb->get_var( 'SELECT COUNT(*) FROM ' . nep_taula_resultats() ); // phpcs:ignore WordPress.DB
$r1        = $nep_json( 'DELETE', '/noempesquen/v1/compte' );
$r2        = $nep_json( 'DELETE', '/noempesquen/v1/compte', array( 'contrasenya' => 'incorrecta-123' ) );
$nep_comprova( 403 === $r1->get_status() && 403 === $r2->get_status() && false !== get_userdata( $nep_jug1->ID ), 'esborra: sense contrasenya o incorrecta → 403' );
$r = $nep_json( 'DELETE', '/noempesquen/v1/compte', array( 'contrasenya' => $nep_pass ) );
$nep_metes = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $wpdb->usermeta WHERE user_id = %d", $nep_jug1->ID ) ); // phpcs:ignore WordPress.DB
clean_user_cache( $nep_jug1->ID );
$nep_comprova( 200 === $r->get_status() && true === $r->get_data()['esborrat'] && false === get_userdata( $nep_jug1->ID ) && 0 === $nep_metes && 0 === get_current_user_id(), 'esborra: usuari, metes i sessions eliminats' );
$nep_comprova( $nep_files === (int) $wpdb->get_var( 'SELECT COUNT(*) FROM ' . nep_taula_resultats() ), 'esborra: nep_resultats no canvia' ); // phpcs:ignore WordPress.DB

remove_filter( 'nep_ip_client', $nep_filtre_ip );
remove_filter( 'send_auth_cookies', '__return_false' );
remove_action( 'set_logged_in_cookie', $nep_captura );
remove_filter( 'pre_wp_mail', $nep_captura_correu, 10 );
$_COOKIE = array();
wp_set_current_user( 1 );

// Neteja: rol i metes desapareixen, l'usuari es conserva.
update_user_meta( $nep_jug_id, 'nep_progres', 'x' );
update_user_meta( $nep_jug_id, 'nep_consentiment', '1' );
if ( ! function_exists( 'nep_neteja_jugadors' ) ) {
	defined( 'WP_UNINSTALL_PLUGIN' ) || define( 'WP_UNINSTALL_PLUGIN', 'noempesquen-core/noempesquen-core.php' );
	define( 'NEP_PROVA_NETEJA', true );
	require_once dirname( __DIR__, 2 ) . '/uninstall.php';
}
nep_neteja_jugadors();
$nep_comprova( null === get_role( 'nep_jugador' ), 'neteja: rol eliminat' );
$nep_comprova( '' === get_user_meta( $nep_jug_id, 'nep_progres', true ) && '' === get_user_meta( $nep_jug_id, 'nep_consentiment', true ), 'neteja: metes eliminades' );
$nep_comprova( false !== get_userdata( $nep_jug_id ), 'neteja: l\'usuari es conserva' );

wp_delete_user( $nep_jug_id );
nep_actualitza();

// Privacitat: exportador i esborrador nadius.
$nep_pv_mail = 'nep_pv_' . wp_rand( 10000, 99999 ) . '@example.test';
$nep_pv_id   = (int) wp_insert_user(
	array(
		'user_login' => 'nep_pv_' . wp_rand( 10000, 99999 ),
		'user_pass'  => wp_generate_password(),
		'user_email' => $nep_pv_mail,
		'role'       => 'nep_jugador',
	)
);
$nep_pv_ids  = nep_compte_ids_missions();
update_user_meta( $nep_pv_id, 'nep_progres', $nep_pv_ids ? array( $nep_pv_ids[0] => 2 ) : array() );
update_user_meta(
	$nep_pv_id,
	'nep_consentiment',
	array(
		'versio' => '7',
		'data'   => '2026-10-31T10:00:00+00:00',
	)
);
$nep_pv_exp = nep_exporta_dades_personals( $nep_pv_mail );
$nep_pv_txt = wp_json_encode( $nep_pv_exp );
$nep_comprova( true === $nep_pv_exp['done'] && 1 === count( $nep_pv_exp['data'] ) && 'nep-compte-' . $nep_pv_id === $nep_pv_exp['data'][0]['item_id'], 'privacitat: exportador retorna el compte' );
$nep_comprova( false !== strpos( $nep_pv_txt, 'example.test' ) && false !== strpos( $nep_pv_txt, '2026-10-31T10:00:00' ) && ( ! $nep_pv_ids || false !== strpos( $nep_pv_txt, $nep_pv_ids[0] . ': 2' ) ), 'privacitat: exportador inclou email, consentiment i progrés' );
$nep_pv_buit = nep_exporta_dades_personals( 'no-existeix@example.test' );
$nep_comprova( array() === $nep_pv_buit['data'] && true === $nep_pv_buit['done'], 'privacitat: email inexistent → buit' );
$nep_pv_esb = nep_esborra_dades_personals( 'no-existeix@example.test' );
$nep_comprova( false === $nep_pv_esb['items_removed'] && true === $nep_pv_esb['done'], 'privacitat: esborrador amb email inexistent sense errors' );
WP_Session_Tokens::get_instance( $nep_pv_id )->create( time() + HOUR_IN_SECONDS );
$nep_pv_ses = count( WP_Session_Tokens::get_instance( $nep_pv_id )->get_all() );
$nep_pv_esb = nep_esborra_dades_personals( $nep_pv_mail );
$nep_comprova( 1 === $nep_pv_ses && array() === WP_Session_Tokens::get_instance( $nep_pv_id )->get_all(), 'privacitat: l\'esborrador destrueix les sessions' );
$nep_comprova( true === $nep_pv_esb['items_removed'] && ! metadata_exists( 'user', $nep_pv_id, 'nep_progres' ) && ! metadata_exists( 'user', $nep_pv_id, 'nep_consentiment' ) && false !== get_userdata( $nep_pv_id ), 'privacitat: esborrador deixa l\'usuari sense metes nep_*' );
// El ganxo delete_user esborra les metes sense passar per l'esborrador.
update_user_meta( $nep_pv_id, 'nep_progres', array( 'x' => 1 ) );
update_user_meta( $nep_pv_id, 'nep_consentiment', array( 'versio' => '7' ) );
do_action( 'delete_user', $nep_pv_id, null, get_userdata( $nep_pv_id ) );
$nep_comprova( false !== has_action( 'delete_user', 'nep_esborra_metes_compte' ) && ! metadata_exists( 'user', $nep_pv_id, 'nep_progres' ) && ! metadata_exists( 'user', $nep_pv_id, 'nep_consentiment' ), 'privacitat: el ganxo delete_user esborra les metes' );
update_user_meta( $nep_pv_id, 'nep_progres', array() );
wp_delete_user( $nep_pv_id );
$nep_comprova( ! metadata_exists( 'user', $nep_pv_id, 'nep_progres' ), 'privacitat: wp_delete_user deixa sense metes' );

if ( $nep_autonom ) {
	if ( $nep_fallades > 0 ) {
		WP_CLI::error( "$nep_fallades comprovacions fallades." );
	}
	WP_CLI::success( 'Comptes correctes.' );
}
