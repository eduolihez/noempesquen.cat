<?php
/**
 * Integració de l'endpoint POST /noempesquen/v1/resultat. S'inclou des de
 * `integracio.php` (comparteix `$nep_comprova`, `$nep_publica`, `$nep_valida`
 * i `$nep_creades`). Esborra les files i el límit que crea.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

global $wpdb;
$nep_taula = nep_taula_resultats();
// La mateixa clau que fa servir l'endpoint (WP-CLI pot definir REMOTE_ADDR).
$nep_clau  = nep_clau_limit( nep_ip_client() );
delete_transient( $nep_clau );
delete_transient( NEP_CLAU_LIMIT_GLOBAL );

$nep_envia = static function ( array $cos ): WP_REST_Response {
	$peticio = new WP_REST_Request( 'POST', '/noempesquen/v1/resultat' );
	$peticio->set_header( 'Content-Type', 'application/json' );
	$peticio->set_body( wp_json_encode( $cos ) );
	return rest_ensure_response( rest_do_request( $peticio ) );
};

// Files d'una missió: hash, estrelles, decisió i n.
$nep_files = static fn( string $missio ): array => $wpdb->get_results(
	$wpdb->prepare( "SELECT versio_hash, estrelles, decisio, n FROM {$nep_taula} WHERE missio = %s ORDER BY id", $missio ), // phpcs:ignore WordPress.DB
	ARRAY_A
);

wp_set_current_user( 0 );

// Missió del panell publicada, amb id propi.
$nep_est       = $nep_valida;
$nep_est['id'] = 'prova-estadistiques-' . wp_rand( 1000, 9999 );
wp_set_current_user( 1 );
// Amb NEP_VALIDA_CLI, crear-la publicada validaria el guió abans de desar-lo: primer esborrany.
$nep_r        = $nep_publica( $nep_est, 'draft' );
$nep_est_post = (int) ( $nep_r->get_data()['id'] ?? 0 );
$nep_r        = $nep_publica( $nep_est, 'publish', $nep_est_post );
wp_set_current_user( 0 );
$nep_comprova( $nep_est_post > 0 && 'publish' === get_post_status( $nep_est_post ), 'estadístiques: missió de prova publicada (rebut ' . get_post_status( $nep_est_post ) . ')' );

$nep_comprova( 400 === $nep_envia( array( 'missio' => 'no-existeix-mai', 'estrelles' => 2 ) )->get_status(), 'resultat: missió inexistent → 400' );
$nep_comprova( 400 === $nep_envia( array( 'missio' => $nep_est['id'] . '--prova', 'estrelles' => 2 ) )->get_status(), 'resultat: id de previsualització → 400' );
$nep_comprova( 400 === $nep_envia( array( 'missio' => $nep_est['id'], 'estrelles' => 4 ) )->get_status(), 'resultat: 4 estrelles → 400' );
$nep_comprova( 400 === $nep_envia( array( 'missio' => $nep_est['id'], 'estrelles' => 0 ) )->get_status(), 'resultat: 0 estrelles → 400' );
$nep_comprova( 400 === $nep_envia( array( 'missio' => $nep_est['id'], 'estrelles' => 2, 'decisio' => 'zz' ) )->get_status(), 'resultat: decisió aliena → 400' );
$nep_comprova( array() === $nep_files( $nep_est['id'] ), 'resultat: cap fila amb dades invàlides' );

// Vàlida amb un camp extra: s'ignora.
$nep_r = $nep_envia(
	array(
		'missio'    => $nep_est['id'],
		'estrelles' => 3,
		'decisio'   => 'c',
		'versio_hash' => 'aaaaaaaaaaaa',
		'nom'       => 'Carla',
	)
);
$nep_comprova( 204 === $nep_r->get_status(), 'resultat: vàlida amb camp extra → 204 (rebut ' . $nep_r->get_status() . ')' );
$nep_f = $nep_files( $nep_est['id'] );
$nep_h1 = nep_versio_hash( $nep_est );
$nep_comprova( 1 === count( $nep_f ) && $nep_h1 === $nep_f[0]['versio_hash'] && 'c' === $nep_f[0]['decisio'] && 1 === (int) $nep_f[0]['n'], 'resultat: fila amb hash del servidor, no del client' );
$nep_comprova( ! str_contains( wp_json_encode( $nep_f ), 'Carla' ), 'resultat: el camp extra no es desa' );

// UPSERT: la mateixa combinació incrementa n (també sense decisió).
$nep_envia( array( 'missio' => $nep_est['id'], 'estrelles' => 3, 'decisio' => 'c' ) );
$nep_envia( array( 'missio' => $nep_est['id'], 'estrelles' => 1 ) );
$nep_envia( array( 'missio' => $nep_est['id'], 'estrelles' => 1 ) );
$nep_f = $nep_files( $nep_est['id'] );
$nep_comprova( 2 === count( $nep_f ) && 2 === (int) $nep_f[0]['n'] && '' === $nep_f[1]['decisio'] && 2 === (int) $nep_f[1]['n'], 'resultat: UPSERT incrementa n (amb i sense decisió)' );

// Editar el guió canvia el hash.
$nep_est2          = $nep_est;
$nep_est2['titol'] = $nep_est['titol'] . ' (editada)';
wp_set_current_user( 1 );
$nep_publica( $nep_est2, 'publish', $nep_est_post );
wp_set_current_user( 0 );
$nep_envia( array( 'missio' => $nep_est['id'], 'estrelles' => 2 ) );
$nep_hashes = array_unique( array_column( $nep_files( $nep_est['id'] ), 'versio_hash' ) );
$nep_comprova( 2 === count( $nep_hashes ) && in_array( nep_versio_hash( $nep_est2 ), $nep_hashes, true ), 'resultat: editar el guió canvia el hash' );

// Missió inclosa vàlida → 2xx (i es deixa la fila com estava).
$nep_inclosa = json_decode( (string) file_get_contents( NEP_PATH . 'missions/remei-01-paquet.json' ), true );
$nep_abans   = $nep_files( $nep_inclosa['id'] );
$nep_r       = $nep_envia( array( 'missio' => $nep_inclosa['id'], 'estrelles' => 2 ) );
$nep_comprova( 204 === $nep_r->get_status(), 'resultat: missió inclosa vàlida → 204' );
$nep_wh = array(
	'missio'      => $nep_inclosa['id'],
	'versio_hash' => nep_versio_hash( $nep_inclosa ),
	'dia'         => gmdate( 'Y-m-d' ),
	'estrelles'   => 2,
	'decisio'     => '',
);
$wpdb->query( $wpdb->prepare( "UPDATE {$nep_taula} SET n = n - 1 WHERE missio = %s AND versio_hash = %s AND dia = %s AND estrelles = %d AND decisio = %s", array_values( $nep_wh ) ) ); // phpcs:ignore WordPress.DB
$wpdb->query( "DELETE FROM {$nep_taula} WHERE n = 0" ); // phpcs:ignore WordPress.DB
$nep_comprova( $nep_files( $nep_inclosa['id'] ) == $nep_abans, 'resultat: fila de la inclosa restaurada' ); // phpcs:ignore Universal.Operators.StrictComparisons

// Despublicada → 400.
wp_set_current_user( 1 );
wp_update_post( array( 'ID' => $nep_est_post, 'post_status' => 'draft' ) );
wp_set_current_user( 0 );
$nep_comprova( 400 === $nep_envia( array( 'missio' => $nep_est['id'], 'estrelles' => 2 ) )->get_status(), 'resultat: missió del panell despublicada → 400' );

// Límit: NEP_RESULTATS_LIMIT enviaments per finestra, el següent → 429.
wp_set_current_user( 1 );
wp_update_post( array( 'ID' => $nep_est_post, 'post_status' => 'publish' ) );
wp_set_current_user( 0 );
delete_transient( $nep_clau );
$nep_ok = 0;
for ( $nep_i = 0; $nep_i < NEP_RESULTATS_LIMIT; $nep_i++ ) {
	$nep_ok += 204 === $nep_envia( array( 'missio' => $nep_est['id'], 'estrelles' => 3 ) )->get_status() ? 1 : 0;
}
$nep_r = $nep_envia( array( 'missio' => $nep_est['id'], 'estrelles' => 3 ) );
$nep_comprova( NEP_RESULTATS_LIMIT === $nep_ok && 429 === $nep_r->get_status(), "resultat: $nep_ok enviaments acceptats i el següent → 429 (rebut {$nep_r->get_status()})" );
// Límit global: ple → 429 encara que la IP no hagi enviat res.
delete_transient( $nep_clau );
set_transient( NEP_CLAU_LIMIT_GLOBAL, array( 'n' => NEP_RESULTATS_LIMIT_GLOBAL, 'fi' => time() + 600 ), 600 );
$nep_r = $nep_envia( array( 'missio' => $nep_est['id'], 'estrelles' => 3 ) );
$nep_comprova( 429 === $nep_r->get_status() && false === get_transient( $nep_clau ), 'resultat: límit global ple → 429 i no compta a la IP' );
delete_transient( NEP_CLAU_LIMIT_GLOBAL );

// Filtre nep_ip_client: IPv6 per /64; la clau no conté la IP.
$nep_filtre_ip = static fn() => '2001:db8:aa:bb:1:2:3:4';
add_filter( 'nep_ip_client', $nep_filtre_ip );
$nep_comprova( '2001:db8:aa:bb::/64' === nep_ip_client(), 'ip: el filtre nep_ip_client s\'aplica i IPv6 es redueix a /64' );
$nep_comprova( ! str_contains( nep_clau_limit( nep_ip_client() ), '2001' ), 'ip: la clau del límit no conté la IP' );
remove_filter( 'nep_ip_client', $nep_filtre_ip );

// Cau de missions: publicar o despublicar es veu a l'instant; posts_per_page sense tall.
$nep_comprova( isset( nep_missions_jugables()[ $nep_est['id'] ] ) && is_array( get_transient( NEP_CAU_MISSIONS ) ), 'cau: la missió publicada és al cau' );
wp_set_current_user( 1 );
wp_trash_post( $nep_est_post );
$nep_comprova( ! isset( nep_missions_jugables()[ $nep_est['id'] ] ), 'cau: enviar a la paperera la treu' );
wp_untrash_post( $nep_est_post );
wp_update_post( array( 'ID' => $nep_est_post, 'post_status' => 'publish' ) );
wp_set_current_user( 0 );
$nep_comprova( isset( nep_missions_jugables()[ $nep_est['id'] ] ), 'cau: recuperar-la la torna' );

$nep_comprova( ! str_contains( (string) get_option( 'nep_sal_dia' ), '127.0.0.1' ) && str_starts_with( (string) get_option( 'nep_sal_dia' ), gmdate( 'Y-m-d' ) . '|' ), 'resultat: sal del dia amb la data d\'avui' );

// Errors de base de dades (es reescriuen consultes amb el filtre `query`).
$nep_reescriu = static function ( callable $canvi, callable $fes ) use ( $wpdb ) {
	$errors_abans = $wpdb->suppress_errors( true );
	add_filter( 'query', $canvi );
	try {
		return $fes();
	} finally {
		remove_filter( 'query', $canvi );
		$wpdb->suppress_errors( $errors_abans );
		$wpdb->last_error = '';
	}
};

// La taula no es pot crear: no es desa la versió i hi ha avís.
$nep_versio_db = get_option( 'nep_db_version' );
delete_option( 'nep_db_version' );
delete_transient( 'nep_avis_taula' );
$nep_reescriu(
	static fn( $q ) => str_starts_with( ltrim( $q ), 'SHOW TABLES LIKE' ) ? 'SELECT NULL FROM DUAL WHERE 0' : $q,
	static fn() => nep_actualitza()
);
$nep_comprova( false === get_option( 'nep_db_version' ) && get_transient( 'nep_avis_taula' ), 'taula: si no es pot crear, no es desa nep_db_version i hi ha avís' );
wp_set_current_user( 1 );
// Amb pantalla: els altres avisos del nucli la llegeixen.
set_current_screen( 'edit-nep_missio' );
ob_start();
do_action( 'admin_notices' );
$nep_html = (string) ob_get_clean();
wp_set_current_user( 0 );
// esc_html converteix l'apòstrof: es busca un tros sense.
$nep_comprova( str_contains( $nep_html, 'pogut crear la taula' ), 'taula: avís d\'administració' );
nep_actualitza();
$nep_comprova( $nep_versio_db === get_option( 'nep_db_version' ) && false === get_transient( 'nep_avis_taula' ), 'taula: en tornar a provar es desa la versió i s\'esborra l\'avís' );

// L'INSERT falla → 500.
delete_transient( $nep_clau );
$nep_r = $nep_reescriu(
	static fn( $q ) => str_starts_with( ltrim( $q ), "INSERT INTO {$nep_taula} " ) ? str_replace( "INSERT INTO {$nep_taula} ", "INSERT INTO {$nep_taula}_no_existeix ", $q ) : $q,
	static fn() => $nep_envia( array( 'missio' => $nep_est['id'], 'estrelles' => 3 ) )
);
$nep_comprova( 500 === $nep_r->get_status(), 'resultat: error de BD → 500 (rebut ' . $nep_r->get_status() . ')' );

// La lectura del panell falla → avís d'error, no «Dades insuficients».
wp_set_current_user( 1 );
$nep_html = $nep_reescriu(
	static fn( $q ) => str_contains( $q, "FROM {$nep_taula} WHERE dia" ) ? str_replace( "FROM {$nep_taula} ", "FROM {$nep_taula}_no_existeix ", $q ) : $q,
	static function () {
		ob_start();
		nep_pinta_estadistiques();
		return (string) ob_get_clean();
	}
);
$nep_comprova( str_contains( $nep_html, 'notice-error' ) && str_contains( $nep_html, 'pogut llegir la taula' ) && ! str_contains( $nep_html, 'Dades insuficients' ), 'panell: error de lectura → avís, no «Dades insuficients»' );
wp_set_current_user( 0 );

// Neteja.
$wpdb->query( $wpdb->prepare( "DELETE FROM {$nep_taula} WHERE missio = %s", $nep_est['id'] ) ); // phpcs:ignore WordPress.DB
delete_transient( $nep_clau );
delete_transient( NEP_CLAU_LIMIT_GLOBAL );
wp_set_current_user( 1 );
