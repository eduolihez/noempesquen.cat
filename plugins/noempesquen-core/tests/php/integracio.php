<?php
/**
 * Prova d'integració amb WordPress (wp-env, entorn de proves):
 *   wp eval-file wp-content/plugins/noempesquen-core/tests/php/integracio.php
 *
 * Crea entrades `nep_missio` temporals i les esborra en acabar.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

$nep_creades = array();
$nep_fallades = 0;

$nep_comprova = static function ( bool $ok, string $nom ) use ( &$nep_fallades ): void {
	if ( $ok ) {
		WP_CLI::log( "ok  - $nom" );
	} else {
		++$nep_fallades;
		WP_CLI::log( "ERR - $nom" );
	}
};

$nep_publica = static function ( array $guio, string $estat, int $id = 0 ) use ( &$nep_creades ): WP_REST_Response {
	$peticio = new WP_REST_Request( 'POST', '/wp/v2/nep_missio' . ( $id ? "/$id" : '' ) );
	$peticio->set_body_params(
		array(
			'title'  => 'Prova validació',
			'status' => $estat,
			'meta'   => array(
				'nep_dispositiu' => $guio['dispositiu'] ?? 'pc',
				'nep_personatge' => $guio['personatge'] ?? 'llissa',
				'nep_guio'       => wp_json_encode( $guio, JSON_UNESCAPED_UNICODE ),
			),
		)
	);
	$resposta = rest_do_request( $peticio );
	$dades    = $resposta->get_data();
	if ( isset( $dades['id'] ) ) {
		$nep_creades[] = (int) $dades['id'];
	}
	return $resposta;
};

wp_set_current_user( 1 );

$nep_valida = json_decode( (string) file_get_contents( NEP_PATH . 'missions/llissa-01-factura.json' ), true );
// Un id que no existeix a la base de dades de proves.
$nep_valida['id']    = 'prova-integracio-' . wp_rand( 1000, 9999 );
$nep_valida['titol'] = 'Diu "hola" amb barra \\ i cometes \\"';
$nep_invalida        = $nep_valida;
$nep_invalida['versio'] = 1;
// Id propi: un esborrany amb el mateix id també compta com a duplicat.
$nep_invalida['id'] = $nep_valida['id'] . '-invalida';

// REST: publicar una invàlida → 400 amb el missatge.
$nep_r = $nep_publica( $nep_invalida, 'publish' );
$nep_comprova( 400 === $nep_r->get_status(), 'REST publicar versio 1 → 400 (rebut ' . $nep_r->get_status() . ')' );
$nep_comprova( 'nep_missio_invalida' === ( $nep_r->get_data()['code'] ?? '' ), 'REST codi nep_missio_invalida' );
$nep_comprova( str_contains( (string) ( $nep_r->get_data()['message'] ?? '' ), 'La versió del guió ha de ser 2.' ), 'REST missatge amb l\'error' );

// REST: com a esborrany es desa.
$nep_r = $nep_publica( $nep_invalida, 'draft' );
$nep_comprova( 201 === $nep_r->get_status(), 'REST esborrany invàlid → 201 (rebut ' . $nep_r->get_status() . ')' );
$nep_esborrany = (int) ( $nep_r->get_data()['id'] ?? 0 );

// REST: publicar l'esborrany sense tocar res més continua fallant.
$nep_peticio = new WP_REST_Request( 'POST', "/wp/v2/nep_missio/$nep_esborrany" );
$nep_peticio->set_body_params( array( 'status' => 'publish' ) );
$nep_comprova( 400 === rest_do_request( $nep_peticio )->get_status(), 'REST publicar esborrany invàlid sense meta → 400' );

// REST: JSON invàlid.
$nep_peticio = new WP_REST_Request( 'POST', "/wp/v2/nep_missio/$nep_esborrany" );
$nep_peticio->set_body_params(
	array(
		'status' => 'publish',
		'meta'   => array( 'nep_guio' => '{trencat' ),
	)
);
$nep_r = rest_do_request( $nep_peticio );
$nep_comprova( 400 === $nep_r->get_status() && str_contains( (string) $nep_r->get_data()['message'], 'El guió no és un JSON vàlid' ), 'REST JSON invàlid → 400' );

// REST: publicar una vàlida → 201, i el guió amb \" i \ sobreviu intacte.
$nep_r = $nep_publica( $nep_valida, 'publish' );
$nep_comprova( 201 === $nep_r->get_status(), 'REST publicar vàlida → 201 (rebut ' . $nep_r->get_status() . ' ' . ( $nep_r->get_data()['message'] ?? '' ) . ')' );
$nep_publicada = (int) ( $nep_r->get_data()['id'] ?? 0 );
$nep_desat     = json_decode( (string) get_post_meta( $nep_publicada, 'nep_guio', true ), true );
$nep_comprova( $nep_desat === $nep_valida, 'guió amb \\" i \\ intacte després de desar' );

// REST: una altra missió amb el mateix id no es pot publicar.
$nep_r = $nep_publica( $nep_valida, 'publish' );
$nep_comprova( 400 === $nep_r->get_status() && str_contains( (string) $nep_r->get_data()['message'], 'Ja hi ha una altra missió' ), 'REST id duplicat → 400' );

// REST: actualitzar la publicada sense canviar res → 200 (no és duplicat d'ella mateixa).
$nep_comprova( 200 === $nep_publica( $nep_valida, 'publish', $nep_publicada )->get_status(), 'REST actualitzar publicada vàlida → 200' );

// Escriptura directa d'un guió invàlid a una publicada: es rebutja.
update_post_meta( $nep_publicada, 'nep_guio', '{trencat' );
$nep_comprova( json_decode( (string) get_post_meta( $nep_publicada, 'nep_guio', true ), true ) === $nep_valida, 'guió publicat no es sobreescriu amb \'{}\'' );

// Caixa «Camps personalitzats» (update_meta per meta_id) amb JSON invàlid a una publicada: es rebutja i avisa.
require_once ABSPATH . 'wp-admin/includes/post.php';
delete_transient( 'nep_avis_1' );
$nep_mid = 0;
foreach ( has_meta( $nep_publicada ) as $nep_fila ) {
	if ( 'nep_guio' === $nep_fila['meta_key'] ) {
		$nep_mid = (int) $nep_fila['meta_id'];
	}
}
update_meta( $nep_mid, 'nep_guio', '{trencat' );
$nep_comprova( $nep_mid && json_decode( (string) get_post_meta( $nep_publicada, 'nep_guio', true ), true ) === $nep_valida, 'camps personalitzats: guió publicat intacte' );
$nep_avis = get_transient( 'nep_avis_1' );
$nep_comprova( is_array( $nep_avis ) && 'guio-conservat' === $nep_avis['motiu'], 'camps personalitzats: avís de guió no desat' );
delete_transient( 'nep_avis_1' );

// Desament clàssic: publicar una invàlida la deixa en esborrany i desa l'avís.
add_filter( 'nep_valida_missio_cli', '__return_true' );
delete_transient( 'nep_avis_1' );
$nep_classica = wp_insert_post(
	wp_slash(
		array(
			'post_type'   => 'nep_missio',
			'post_status' => 'publish',
			'post_title'  => 'Prova clàssica',
			'nep_guio'    => wp_json_encode( $nep_invalida ),
		)
	)
);
$nep_creades[] = (int) $nep_classica;
$nep_comprova( 'draft' === get_post_status( $nep_classica ), 'clàssic publicar invàlida → esborrany' );
$nep_avis = get_transient( 'nep_avis_1' );
$nep_comprova( is_array( $nep_avis ) && 'esborrany' === $nep_avis['motiu'] && in_array( 'La versió del guió ha de ser 2.', $nep_avis['errors'], true ), 'clàssic avís al transient' );
ob_start();
nep_mostra_avis_missio();
$nep_html = (string) ob_get_clean();
$nep_comprova( str_contains( $nep_html, 'notice-error' ) && str_contains( $nep_html, 'La versió del guió ha de ser 2.' ), 'admin_notices mostra l\'avís' );
$nep_comprova( false === get_transient( 'nep_avis_1' ), 'l\'avís s\'esborra un cop mostrat' );

// Desament clàssic: una vàlida es publica (el guió ve de $postarr, amb barres).
$nep_valida2       = $nep_valida;
$nep_valida2['id'] = $nep_valida['id'] . '-b';
$nep_classica      = wp_insert_post(
	wp_slash(
		array(
			'post_type'   => 'nep_missio',
			'post_status' => 'publish',
			'post_title'  => 'Prova clàssica vàlida',
			'nep_guio'    => wp_json_encode( $nep_valida2 ),
		)
	)
);
$nep_creades[] = (int) $nep_classica;
$nep_comprova( 'publish' === get_post_status( $nep_classica ), 'clàssic publicar vàlida → publicada' );
remove_filter( 'nep_valida_missio_cli', '__return_true' );

foreach ( array_unique( $nep_creades ) as $nep_id ) {
	wp_delete_post( $nep_id, true );
}

if ( $nep_fallades ) {
	WP_CLI::error( "$nep_fallades comprovacions fallades." );
}
WP_CLI::success( 'Integració correcta.' );
