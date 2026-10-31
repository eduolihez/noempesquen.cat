<?php
/**
 * Prova d'integració de les capacitats del tipus `nep_missio` (s'inclou des
 * d'integracio.php): un editor no pot crear, editar, publicar ni esborrar
 * missions; l'administrador i un usuari amb només `nep_gestiona_missions`, sí.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

require_once ABSPATH . 'wp-admin/includes/user.php';

$nep_usuari_prova = static fn( string $rol ) => (int) wp_insert_user(
	array(
		'user_login' => 'nep_' . $rol . '_' . wp_rand( 10000, 99999 ),
		'user_pass'  => wp_generate_password(),
		'role'       => $rol,
	)
);

$nep_editor_id = $nep_usuari_prova( 'editor' );
$nep_gestor_id = $nep_usuari_prova( 'subscriber' );
( new WP_User( $nep_gestor_id ) )->add_cap( 'nep_gestiona_missions' );

$nep_tipus = get_post_type_object( 'nep_missio' );

// Petició REST com a l'usuari actual.
$nep_rest = static function ( string $metode, string $ruta, array $params = array() ): WP_REST_Response {
	$peticio = new WP_REST_Request( $metode, $ruta );
	$peticio->set_body_params( $params );
	return rest_do_request( $peticio );
};

// Recorre crear (esborrany) → editar títol → publicar → paperera → esborrar del tot.
$nep_cicle = static function ( string $qui, int $id_aliena, bool $pot ) use ( $nep_comprova, $nep_publica, $nep_rest, $nep_valida, $nep_tipus ): void {
	$esperat = static fn( int $ok ) => $pot ? $ok : 403;

	$nep_comprova( $pot === current_user_can( $nep_tipus->cap->edit_posts ), "$qui: menú Missions " . ( $pot ? 'visible' : 'amagat' ) . ' (edit_posts del tipus)' );

	$guio       = $nep_valida;
	$guio['id'] = $nep_valida['id'] . '-cap-' . str_replace( '_', '-', sanitize_title( $qui ) );
	$r          = $nep_publica( $guio, 'draft' );
	$nep_comprova( $esperat( 201 ) === $r->get_status(), "$qui: REST crear → " . $esperat( 201 ) . ' (rebut ' . $r->get_status() . ')' );

	// Sobre una missió pròpia si l'ha pogut crear; si no, sobre una de l'administrador.
	$id = $pot ? (int) ( $r->get_data()['id'] ?? 0 ) : $id_aliena;

	$r = $nep_rest( 'POST', "/wp/v2/nep_missio/$id", array( 'title' => 'Títol canviat', 'menu_order' => 7 ) );
	$nep_comprova( $esperat( 200 ) === $r->get_status(), "$qui: REST editar títol i ordre → " . $esperat( 200 ) . ' (rebut ' . $r->get_status() . ')' );

	$r = $nep_rest( 'POST', "/wp/v2/nep_missio/$id", array( 'status' => 'publish' ) );
	$nep_comprova( $esperat( 200 ) === $r->get_status(), "$qui: REST publicar → " . $esperat( 200 ) . ' (rebut ' . $r->get_status() . ' ' . ( $r->get_data()['message'] ?? '' ) . ')' );

	$nep_comprova( $pot === nep_pot_duplicar_missio( $id ), "$qui: duplicar " . ( $pot ? 'permès' : 'denegat' ) );

	$r = $nep_rest( 'DELETE', "/wp/v2/nep_missio/$id" );
	$nep_comprova( $esperat( 200 ) === $r->get_status(), "$qui: REST paperera → " . $esperat( 200 ) . ' (rebut ' . $r->get_status() . ')' );

	$r = $nep_rest( 'DELETE', "/wp/v2/nep_missio/$id", array( 'force' => true ) );
	$nep_comprova( $esperat( 200 ) === $r->get_status(), "$qui: REST esborrar del tot → " . $esperat( 200 ) . ' (rebut ' . $r->get_status() . ')' );

	if ( ! $pot ) {
		$nep_comprova( 'draft' === get_post_status( $id ) && 'Missió aliena' === get_the_title( $id ), "$qui: la missió aliena queda intacta" );
	}
};

// Missió de l'administrador sobre la qual prova l'editor.
wp_set_current_user( 1 );
$nep_aliena = wp_insert_post(
	array(
		'post_type'   => 'nep_missio',
		'post_status' => 'draft',
		'post_title'  => 'Missió aliena',
	)
);
$nep_creades[] = (int) $nep_aliena;

wp_set_current_user( $nep_editor_id );
$nep_cicle( 'editor', (int) $nep_aliena, false );

wp_set_current_user( 1 );
$nep_cicle( 'administrador', (int) $nep_aliena, true );

wp_set_current_user( $nep_gestor_id );
$nep_cicle( 'nomes nep_gestiona_missions', (int) $nep_aliena, true );

wp_set_current_user( 1 );
wp_delete_user( $nep_editor_id );
wp_delete_user( $nep_gestor_id );
