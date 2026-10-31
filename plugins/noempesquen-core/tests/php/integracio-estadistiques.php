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
$nep_r = $nep_envia( array( 'missio' => $nep_est['id'] . "\n", 'estrelles' => 2 ) );
$nep_comprova( 400 === $nep_r->get_status() && 'rest_invalid_param' === ( $nep_r->get_data()['code'] ?? '' ), 'resultat: id amb salt de línia final → 400 del patró' );
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

// Panell: només la versió actual, en franges, i les decisions sense text no surten.
$wpdb->query( $wpdb->prepare( "DELETE FROM {$nep_taula} WHERE missio = %s", $nep_est['id'] ) ); // phpcs:ignore WordPress.DB
$nep_actual = nep_versio_hash( nep_missions_jugables()[ $nep_est['id'] ] );
$nep_insereix = static fn( string $hash, int $estrelles, string $decisio, int $n ) => $wpdb->insert(
	$nep_taula,
	array(
		'missio'      => $nep_est['id'],
		'versio_hash' => $hash,
		'dia'         => gmdate( 'Y-m-d' ),
		'estrelles'   => $estrelles,
		'decisio'     => $decisio,
		'n'           => $n,
	)
);
$nep_insereix( $nep_actual, 3, 'c', 7 );
$nep_insereix( $nep_actual, 2, 'esborrada', 5 );
$nep_insereix( 'aaaaaaaaaaaa', 1, 'a', 40 );
wp_set_current_user( 1 );
ob_start();
nep_pinta_estadistiques();
$nep_html = (string) ob_get_clean();
wp_set_current_user( 0 );
$nep_c    = array_values( array_filter( $nep_est['decisio']['opcions'], static fn( $o ) => 'c' === $o['id'] ) )[0];
$nep_fila = (string) strstr( (string) strstr( $nep_html, $nep_est['id'] ), '</tr>', true );
$nep_comprova( str_contains( $nep_fila, '<td>10-19</td>' ) && str_contains( $nep_fila, '<td>' . number_format_i18n( 2.6, 1 ) . '</td>' ), 'panell: 12 partides actuals en franja «10-19» i mitjana amb un decimal' );
$nep_comprova( str_contains( $nep_fila, '«c»' ) && str_contains( $nep_fila, esc_html( $nep_c['text'] ) ) && str_contains( $nep_fila, '50-59 %' ) && ! str_contains( $nep_fila, 'esborrada' ), 'panell: decisió amb text i percentatge en franja (la decisió esborrada no surt)' );
$nep_comprova( str_contains( $nep_html, 'partides de versions anteriors del guió no es compten' ), 'panell: nota de partides de versions anteriors' );

// phpcs:disable WordPress.DB
// Migració v2 → v3: la taula torna a la forma v2 (clau única sense `demo`) amb una fila; nep_actualitza() afegeix la columna i canvia la clau.
$wpdb->query( $wpdb->prepare( "DELETE FROM {$nep_taula} WHERE missio = %s", $nep_est['id'] ) );
$wpdb->query( "ALTER TABLE {$nep_taula} DROP INDEX resultat_demo, DROP COLUMN demo, ADD UNIQUE KEY resultat (missio,versio_hash,dia,estrelles,decisio)" );
$nep_insereix( $nep_actual, 2, 'a', 3 );
delete_option( 'nep_db_version' );
nep_actualitza();
$nep_index = static fn( string $nom ) => (bool) $wpdb->get_var( $wpdb->prepare( "SHOW INDEX FROM {$nep_taula} WHERE Key_name = %s", $nom ) );
$nep_comprova( NEP_DB_VERSION === get_option( 'nep_db_version' ) && $nep_index( 'resultat_demo' ) && ! $nep_index( 'resultat' ), 'migració: versió actual amb la clau resultat_demo i sense la clau antiga' );
$nep_comprova( '0' === (string) $wpdb->get_var( $wpdb->prepare( "SELECT demo FROM {$nep_taula} WHERE missio = %s", $nep_est['id'] ) ), 'migració: les files existents queden amb demo = 0' );

// Demo: sembra, aïllament de l'endpoint real i esborra.
$nep_reals  = static fn() => (int) $wpdb->get_var( "SELECT COALESCE(SUM(n), 0) FROM {$nep_taula} WHERE demo = 0" );
$nep_demo_n = static fn( string $missio ) => (int) $wpdb->get_var( $wpdb->prepare( "SELECT COALESCE(SUM(n), 0) FROM {$nep_taula} WHERE demo = 1 AND missio = %s", $missio ) );
$nep_abans  = $nep_reals();
$nep_comprova( 25 * count( nep_info_missions_jugables() ) === nep_sembra_demo( 25, 3 ), 'demo: sembra 25 partides per missió jugable' );
$nep_comprova( 25 === $nep_demo_n( $nep_est['id'] ) && 25 === $nep_demo_n( $nep_inclosa['id'] ) && nep_hi_ha_demo(), 'demo: inclou les missions del panell i les incloses' );
$nep_comprova( $nep_abans === $nep_reals(), 'demo: sembrar no toca les files reals' );
$nep_comprova( 0 === (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$nep_taula} WHERE demo = 1 AND versio_hash <> %s AND missio = %s", $nep_actual, $nep_est['id'] ) ), 'demo: amb el hash actual del guió' );
nep_sembra_demo( 25, 3 );
$nep_comprova( 25 === $nep_demo_n( $nep_est['id'] ), 'demo: tornar a sembrar substitueix (no duplica)' );
// Un enviament real amb la mateixa clau que una fila demo d'avui: fila real a part.
$nep_d = $wpdb->get_row( $wpdb->prepare( "SELECT estrelles, decisio, n FROM {$nep_taula} WHERE demo = 1 AND missio = %s AND dia = %s LIMIT 1", $nep_est['id'], gmdate( 'Y-m-d' ) ), ARRAY_A );
if ( ! $nep_d ) {
	$wpdb->insert( $nep_taula, array( 'missio' => $nep_est['id'], 'versio_hash' => $nep_actual, 'dia' => gmdate( 'Y-m-d' ), 'estrelles' => 3, 'decisio' => 'c', 'demo' => 1, 'n' => 1 ) );
	$nep_d = array( 'estrelles' => 3, 'decisio' => 'c', 'n' => 1 );
}
delete_transient( $nep_clau );
$nep_cos = array( 'missio' => $nep_est['id'], 'estrelles' => (int) $nep_d['estrelles'] );
if ( '' !== $nep_d['decisio'] ) {
	$nep_cos['decisio'] = $nep_d['decisio'];
}
$nep_demo_abans = $nep_demo_n( $nep_est['id'] );
$nep_r          = $nep_envia( $nep_cos );
$nep_comprova( 204 === $nep_r->get_status() && $nep_demo_abans === $nep_demo_n( $nep_est['id'] ) && $nep_abans + 1 === $nep_reals(), 'demo: l\'endpoint real escriu demo = 0 i no suma a la fila demo' );
// Panell: amb demo, avís role="status" i xifres.
wp_set_current_user( 1 );
ob_start();
nep_pinta_estadistiques();
$nep_html = (string) ob_get_clean();
wp_set_current_user( 0 );
$nep_comprova( str_contains( $nep_html, 'role="status"' ) && str_contains( $nep_html, 'Dades de demostració incloses' ) && str_contains( $nep_html, '<code>wp nep demo-estadistiques esborra</code>' ), 'demo: el panell avisa de les dades de demostració' );
$nep_comprova( str_contains( $nep_html, 'class="nep-distribucions"' ) && str_contains( $nep_html, 'Decisions: ' . esc_html( $nep_est['titol'] ) ) && str_contains( $nep_html, 'aria-hidden="true"' ), 'barres: repartiment de les estrelles i les decisions amb demo' );
$nep_comprova( 1 !== preg_match( '/style="width: (?!(5|15|25|35|45|55|65|75|85|95)%)/', $nep_html ), 'barres: amplada que surt de la franja (no del percentatge exacte)' );
$nep_comprova( false !== nep_esborra_demo() && ! nep_hi_ha_demo() && $nep_abans + 1 === $nep_reals(), 'demo: esborra només les files demo' );
wp_set_current_user( 1 );
ob_start();
nep_pinta_estadistiques();
$nep_html = (string) ob_get_clean();
wp_set_current_user( 0 );
$nep_comprova( ! str_contains( $nep_html, 'Dades de demostració incloses' ) && ! str_contains( $nep_html, 'Decisions: ' . esc_html( $nep_est['titol'] ) ), 'demo: sense files demo no hi ha avís ni barres de la missió' );

// Resum públic GET /resultat/resum: anònim, franges, n>=10 reals de la versió actual, en cau.
$wpdb->query( $wpdb->prepare( "DELETE FROM {$nep_taula} WHERE missio = %s", $nep_est['id'] ) );
$nep_hash_resum = nep_info_missions_jugables()[ $nep_est['id'] ]['hash'];
$nep_resum      = static function ( string $missio ) use ( $nep_hash_resum ): WP_REST_Response {
	delete_transient( nep_clau_resum( $missio, $nep_hash_resum ) );
	$peticio = new WP_REST_Request( 'GET', '/noempesquen/v1/resultat/resum' );
	$peticio->set_query_params( array( 'missio' => $missio ) );
	return rest_ensure_response( rest_do_request( $peticio ) );
};
$nep_fila_resum = static fn( string $decisio, int $n, int $demo = 0, ?string $hash = null ) => $wpdb->insert(
	$nep_taula,
	array(
		'missio'      => $nep_est['id'],
		'versio_hash' => $hash ?? $nep_hash_resum,
		'dia'         => gmdate( 'Y-m-d' ),
		'estrelles'   => 2,
		'decisio'     => $decisio,
		'demo'        => $demo,
		'n'           => $n,
	)
);
$nep_comprova( 404 === $nep_resum( 'no-existeix-mai' )->get_status(), 'resum: missió desconeguda → 404' );
$nep_comprova( 400 === $nep_resum( $nep_est['id'] . '--prova' )->get_status(), 'resum: id de previsualització → 400' );
$nep_fila_resum( 'a', 9 );
$nep_fila_resum( 'a', 50, 1 );
$nep_fila_resum( 'b', 50, 0, 'aaaaaaaaaaaa' );
$nep_r = $nep_resum( $nep_est['id'] );
$nep_comprova( 200 === $nep_r->get_status() && array( 'prou' => false ) === $nep_r->get_data(), 'resum: 9 reals (+ demo + versió antiga) → prou:false sense xifres' );
$nep_comprova( 'public, max-age=3600' === ( $nep_r->get_headers()['Cache-Control'] ?? '' ), 'resum: Cache-Control public, max-age=3600' );
$nep_fila_resum( 'c', 11 );
$nep_r = $nep_resum( $nep_est['id'] );
$nep_comprova(
	array(
		'n_banda'   => '20-49',
		'decisions' => array(
			array(
				'id'    => 'c',
				'banda' => '50-59 %',
			),
		),
	) === $nep_r->get_data(),
	'resum: 20 reals → franges; «a» (9 < k) no surt (rebut ' . wp_json_encode( $nep_r->get_data() ) . ')'
);
// En cau: una fila nova no canvia la resposta fins que caduca.
$nep_fila_resum( 'a', 30 );
$nep_p = new WP_REST_Request( 'GET', '/noempesquen/v1/resultat/resum' );
$nep_p->set_query_params( array( 'missio' => $nep_est['id'] ) );
$nep_comprova( '20-49' === ( rest_do_request( $nep_p )->get_data()['n_banda'] ?? '' ), 'resum: la resposta surt del transient' );
delete_transient( nep_clau_resum( $nep_est['id'], $nep_hash_resum ) );
// phpcs:enable

// Neteja.
$wpdb->query( $wpdb->prepare( "DELETE FROM {$nep_taula} WHERE missio = %s", $nep_est['id'] ) ); // phpcs:ignore WordPress.DB
delete_transient( $nep_clau );
delete_transient( NEP_CLAU_LIMIT_GLOBAL );
wp_set_current_user( 1 );
