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

require_once ABSPATH . 'wp-admin/includes/admin.php';

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

$nep_publica = static function ( array $guio, string $estat, int $id = 0, array $extra = array() ) use ( &$nep_creades ): WP_REST_Response {
	$peticio = new WP_REST_Request( 'POST', '/wp/v2/nep_missio' . ( $id ? "/$id" : '' ) );
	$peticio->set_body_params(
		array_merge(
			array(
				'title'  => 'Prova validació',
				'status' => $estat,
				'meta'   => array(
					'nep_dispositiu' => $guio['dispositiu'] ?? 'pc',
					'nep_personatge' => $guio['personatge'] ?? 'llissa',
					'nep_guio'       => wp_json_encode( $guio, JSON_UNESCAPED_UNICODE ),
				),
			),
			$extra
		)
	);
	$resposta = rest_do_request( $peticio );
	$dades    = $resposta->get_data();
	if ( isset( $dades['id'] ) ) {
		$nep_creades[] = (int) $dades['id'];
	}
	return $resposta;
};

// Guió desat d'una entrada, descodificat.
$nep_guio_desat = static fn( int $id ) => json_decode( (string) get_post_meta( $id, 'nep_guio', true ), true );

// Meta_id del guió d'una entrada (0 si no en té).
$nep_mid_guio = static function ( int $id ): int {
	foreach ( has_meta( $id ) as $fila ) {
		if ( 'nep_guio' === $fila['meta_key'] ) {
			return (int) $fila['meta_id'];
		}
	}
	return 0;
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
$nep_futur          = gmdate( 'Y-m-d\TH:i:s', time() + 30 * DAY_IN_SECONDS );

// REST: publicar una invàlida → 400 amb el missatge.
$nep_r = $nep_publica( $nep_invalida, 'publish' );
$nep_comprova( 400 === $nep_r->get_status(), 'REST publicar versio 1 → 400 (rebut ' . $nep_r->get_status() . ')' );
$nep_comprova( 'nep_missio_invalida' === ( $nep_r->get_data()['code'] ?? '' ), 'REST codi nep_missio_invalida' );
$nep_comprova( str_contains( (string) ( $nep_r->get_data()['message'] ?? '' ), 'La versió del guió ha de ser 2.' ), 'REST missatge amb l\'error' );

// REST: programar (future) una invàlida → 400.
$nep_r = $nep_publica( $nep_invalida, 'future', 0, array( 'date_gmt' => $nep_futur ) );
$nep_comprova( 400 === $nep_r->get_status(), 'REST programar invàlida → 400 (rebut ' . $nep_r->get_status() . ')' );

// REST: com a esborrany es desa.
$nep_r = $nep_publica( $nep_invalida, 'draft' );
$nep_comprova( 201 === $nep_r->get_status(), 'REST esborrany invàlid → 201 (rebut ' . $nep_r->get_status() . ')' );
$nep_esborrany = (int) ( $nep_r->get_data()['id'] ?? 0 );

// REST: un JSON il·legible → 400 també en esborrany, i el guió desat es conserva.
$nep_peticio = new WP_REST_Request( 'POST', "/wp/v2/nep_missio/$nep_esborrany" );
$nep_peticio->set_body_params( array( 'meta' => array( 'nep_guio' => '{trencat' ) ) );
$nep_r = rest_do_request( $nep_peticio );
$nep_comprova( 400 === $nep_r->get_status() && str_contains( (string) ( $nep_r->get_data()['message'] ?? '' ), 'El guió no és un JSON vàlid' ) && $nep_guio_desat( $nep_esborrany ) === $nep_invalida, 'REST esborrany amb JSON il·legible → 400 i guió conservat' );

// REST: publicar sense dispositiu ni personatge → error explícit.
$nep_sense            = $nep_valida;
$nep_sense['id']      = $nep_valida['id'] . '-sense';
$nep_peticio          = new WP_REST_Request( 'POST', '/wp/v2/nep_missio' );
$nep_peticio->set_body_params(
	array(
		'title'  => 'Prova sense metas',
		'status' => 'publish',
		'meta'   => array( 'nep_guio' => wp_json_encode( $nep_sense ) ),
	)
);
$nep_r = rest_do_request( $nep_peticio );
$nep_comprova( 400 === $nep_r->get_status() && str_contains( (string) ( $nep_r->get_data()['message'] ?? '' ), 'Falta el dispositiu' ), 'REST publicar sense nep_dispositiu → 400 explícit (rebut ' . $nep_r->get_status() . ')' );

// Caixa «Camps personalitzats» en un esborrany: un JSON il·legible no esborra el guió i avisa.
delete_transient( 'nep_avis_1' );
update_meta( $nep_mid_guio( $nep_esborrany ), 'nep_guio', '{trencat' );
$nep_avis = get_transient( 'nep_avis_1' );
$nep_comprova( $nep_guio_desat( $nep_esborrany ) === $nep_invalida && is_array( $nep_avis ) && 'guio-conservat' === $nep_avis['motiu'], 'camps personalitzats en esborrany: JSON il·legible → guió conservat i avís' );
delete_transient( 'nep_avis_1' );

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
$nep_comprova( $nep_guio_desat( $nep_publicada ) === $nep_valida, 'REST guió amb \\" i \\ intacte després de desar' );

// REST: un guió que no és text (null l'esborraria) → 400, també en esborrany.
foreach ( array( null, 5 ) as $nep_valor ) {
	foreach ( array( $nep_publicada, $nep_esborrany ) as $nep_id ) {
		$nep_peticio = new WP_REST_Request( 'POST', "/wp/v2/nep_missio/$nep_id" );
		$nep_peticio->set_body_params( array( 'meta' => array( 'nep_guio' => $nep_valor ) ) );
		$nep_r = rest_do_request( $nep_peticio );
		$nep_codi = (string) ( $nep_r->get_data()['code'] ?? '' );
		$nep_comprova( 400 === $nep_r->get_status() && ( null !== $nep_valor || 'nep_guio_invalid' === $nep_codi ), 'REST nep_guio ' . var_export( $nep_valor, true ) . " a $nep_id → 400 (rebut " . $nep_r->get_status() . " $nep_codi)" );
	}
}
$nep_comprova( $nep_guio_desat( $nep_publicada ) === $nep_valida, 'REST guió publicat intacte després del null' );

// REST: una altra missió amb el mateix id no es pot publicar.
$nep_r = $nep_publica( $nep_valida, 'publish' );
$nep_comprova( 400 === $nep_r->get_status() && str_contains( (string) $nep_r->get_data()['message'], 'Ja hi ha una altra missió' ), 'REST id duplicat → 400' );

// REST: actualitzar la publicada sense canviar res → 200 (no és duplicat d'ella mateixa).
$nep_comprova( 200 === $nep_publica( $nep_valida, 'publish', $nep_publicada )->get_status(), 'REST actualitzar publicada vàlida → 200' );

// Escriptures directes a una publicada: JSON trencat, JSON vàlid però guió invàlid, afegir duplicat, esborrar.
update_post_meta( $nep_publicada, 'nep_guio', '{trencat' );
$nep_comprova( $nep_guio_desat( $nep_publicada ) === $nep_valida, 'update_post_meta JSON trencat: es conserva' );
$nep_altre_dispositiu               = $nep_valida;
$nep_altre_dispositiu['dispositiu'] = 'mobil';
update_post_meta( $nep_publicada, 'nep_guio', wp_slash( wp_json_encode( $nep_altre_dispositiu ) ) );
$nep_comprova( $nep_guio_desat( $nep_publicada ) === $nep_valida, 'update_post_meta guió amb un altre dispositiu: es conserva (validació completa)' );
$nep_comprova( false === add_post_meta( $nep_publicada, 'nep_guio', '{}' ), 'add_post_meta duplicat invàlid: rebutjat' );
$nep_comprova( 1 === count( get_post_meta( $nep_publicada, 'nep_guio' ) ), 'add_post_meta: només hi ha un guió' );
$nep_comprova( false === delete_post_meta( $nep_publicada, 'nep_guio' ) && $nep_guio_desat( $nep_publicada ) === $nep_valida, 'delete_post_meta a una publicada: rebutjat' );

// Caixa «Camps personalitzats» a una publicada: editar amb JSON invàlid, canviar la clau o esborrar es rebutja i avisa.
$nep_mid = $nep_mid_guio( $nep_publicada );
delete_transient( 'nep_avis_1' );
update_meta( $nep_mid, 'nep_guio', '{trencat' );
$nep_comprova( $nep_mid && $nep_guio_desat( $nep_publicada ) === $nep_valida, 'camps personalitzats: guió publicat intacte' );
$nep_avis = get_transient( 'nep_avis_1' );
$nep_comprova( is_array( $nep_avis ) && 'guio-conservat' === $nep_avis['motiu'], 'camps personalitzats: avís de guió no desat' );
update_meta( $nep_mid, 'nep_guio_vell', wp_slash( wp_json_encode( $nep_valida ) ) );
$nep_comprova( $nep_guio_desat( $nep_publicada ) === $nep_valida, 'camps personalitzats: canviar la clau del guió es rebutja' );
$nep_comprova( false === delete_meta( $nep_mid ) && $nep_guio_desat( $nep_publicada ) === $nep_valida, 'camps personalitzats: esborrar el guió es rebutja' );
delete_transient( 'nep_avis_1' );

// A partir d'aquí, el desament clàssic també es valida a WP-CLI.
define( 'NEP_VALIDA_CLI', true );

// Desament clàssic: publicar una invàlida la deixa en esborrany i desa l'avís.
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

// Desament clàssic: programar (future) una invàlida la deixa en esborrany.
$nep_classica = wp_insert_post(
	wp_slash(
		array(
			'post_type'     => 'nep_missio',
			'post_status'   => 'future',
			'post_date_gmt' => str_replace( 'T', ' ', $nep_futur ),
			'post_title'    => 'Prova clàssica programada',
			'nep_guio'      => wp_json_encode( $nep_invalida ),
		)
	)
);
$nep_creades[] = (int) $nep_classica;
$nep_comprova( 'draft' === get_post_status( $nep_classica ), 'clàssic programar invàlida → esborrany (rebut ' . get_post_status( $nep_classica ) . ')' );

// Desament clàssic: una vàlida es publica (el guió, el dispositiu i el personatge vénen de $postarr, com al formulari).
$nep_valida2       = $nep_valida;
$nep_valida2['id'] = $nep_valida['id'] . '-b';
$nep_classica      = wp_insert_post(
	wp_slash(
		array(
			'post_type'      => 'nep_missio',
			'post_status'    => 'publish',
			'post_title'     => 'Prova clàssica vàlida',
			'nep_dispositiu' => $nep_valida2['dispositiu'],
			'nep_personatge' => $nep_valida2['personatge'],
			'nep_guio'       => wp_json_encode( $nep_valida2 ),
		)
	)
);
$nep_creades[] = (int) $nep_classica;
$nep_comprova( 'publish' === get_post_status( $nep_classica ), 'clàssic publicar vàlida → publicada' );
$nep_classica_valida = (int) $nep_classica;

// Desament clàssic sense dispositiu ni personatge: error explícit, no valor per defecte.
$nep_valida4       = $nep_valida;
$nep_valida4['id'] = $nep_valida['id'] . '-d';
delete_transient( 'nep_avis_1' );
$nep_classica = wp_insert_post(
	wp_slash(
		array(
			'post_type'   => 'nep_missio',
			'post_status' => 'publish',
			'post_title'  => 'Prova clàssica sense metas',
			'nep_guio'    => wp_json_encode( $nep_valida4 ),
		)
	)
);
$nep_creades[] = (int) $nep_classica;
$nep_avis      = get_transient( 'nep_avis_1' );
$nep_comprova( 'draft' === get_post_status( $nep_classica ) && is_array( $nep_avis ) && in_array( 'Falta el dispositiu de la missió (nep_dispositiu).', $nep_avis['errors'], true ) && in_array( 'Falta el personatge de la missió (nep_personatge).', $nep_avis['errors'], true ), 'clàssic sense dispositiu/personatge → esborrany amb error explícit' );

// Redirecció: esborrany i s'havia demanat publicar → «esborrany actualitzat» encara que no hi hagi avís.
delete_transient( 'nep_avis_1' );
$_POST['publish'] = 'Publica';
$nep_url          = nep_redireccio_avis_missio( 'https://exemple.test/wp-admin/post.php?post=1&message=6', $nep_classica );
unset( $_POST['publish'] );
$nep_comprova( str_contains( $nep_url, 'message=10' ) && ! str_contains( $nep_url, 'message=6' ), 'redirecció: esborrany + publicar sense transient → message=10' );
// Publicada amb avís «guio-conservat» → sense missatge de WP.
nep_desa_avis( 'guio-conservat', array( 'x' ) );
$nep_url = nep_redireccio_avis_missio( 'https://exemple.test/wp-admin/post.php?post=1&message=1', $nep_classica_valida );
$nep_comprova( ! str_contains( $nep_url, 'message=' ), 'redirecció: publicada amb guió conservat → sense «actualitzada»' );
$nep_comprova( true === nep_desa_avis( 'guio-conservat', array( 'x' ) ), 'nep_desa_avis: desar el mateix avís dues vegades no és un error' );
delete_transient( 'nep_avis_1' );

// Pantalla d'edició clàssica (`edit_post`, dades amb barres com $_POST): publicar
// des de la caixa «Camps personalitzats» amb un guió invàlid la deixa en esborrany.
// La caixa escriu la meta abans de canviar l'estat, amb l'entrada encara en esborrany.
$nep_valida3       = $nep_valida;
$nep_valida3['id'] = $nep_valida['id'] . '-c';
$nep_r             = $nep_publica( $nep_valida3, 'draft' );
$nep_caixa         = (int) ( $nep_r->get_data()['id'] ?? 0 );
$nep_edita         = static function ( string $json ) use ( $nep_caixa, $nep_mid_guio ): void {
	edit_post(
		wp_slash(
			array(
				'post_ID'     => $nep_caixa,
				'post_type'   => 'nep_missio',
				'post_title'  => 'Prova caixa',
				'post_status' => 'publish',
				'publish'     => 'Publica',
				'meta'        => array(
					$nep_mid_guio( $nep_caixa ) => array(
						'key'   => 'nep_guio',
						'value' => $json,
					),
				),
			)
		)
	);
};
$nep_edita( wp_json_encode( $nep_invalida ) );
$nep_comprova( 'draft' === get_post_status( $nep_caixa ), 'caixa camps personalitzats: publicar invàlida → esborrany (rebut ' . get_post_status( $nep_caixa ) . ')' );
// El mateix camí amb un guió vàlid amb \" i \: es publica i el guió sobreviu intacte.
$nep_edita( wp_json_encode( $nep_valida3, JSON_UNESCAPED_UNICODE ) );
$nep_comprova( 'publish' === get_post_status( $nep_caixa ), 'caixa camps personalitzats: publicar vàlida → publicada' );
$nep_comprova( $nep_guio_desat( $nep_caixa ) === $nep_valida3, 'caixa camps personalitzats: guió amb \\" i \\ intacte' );

// Esborrar del tot una publicada no deixa meta òrfena.
$nep_mid = $nep_mid_guio( $nep_publicada );
wp_delete_post( $nep_publicada, true );
$nep_comprova( $nep_mid && false === get_metadata_by_mid( 'post', $nep_mid ), 'wp_delete_post esborra el guió d\'una publicada' );

// Estadístiques: endpoint /resultat (fa servir les mateixes ajudes).
require __DIR__ . '/integracio-estadistiques.php';

// Capacitats del tipus nep_missio: editor 403, administrador i gestor OK.
require __DIR__ . '/integracio-capacitats.php';
wp_set_current_user( 1 );

foreach ( array_unique( $nep_creades ) as $nep_id ) {
	wp_delete_post( $nep_id, true );
}

// user_has_cap: rol administrador sense les capacitats i sense nep_db_version → l'administrador les té igualment; un editor no.
$nep_admin_rol = get_role( 'administrator' );
foreach ( nep_capacitats() as $nep_cap ) {
	$nep_admin_rol->remove_cap( $nep_cap );
}
delete_option( 'nep_db_version' );
$nep_admin  = new WP_User( 1 );
$nep_editor = new WP_User( (int) wp_insert_user( array( 'user_login' => 'nep_editor_' . wp_rand( 1000, 9999 ), 'user_pass' => wp_generate_password(), 'role' => 'editor' ) ) );
$nep_comprova( ! $nep_admin_rol->has_cap( 'nep_veu_estadistiques' ) && $nep_admin->has_cap( 'nep_veu_estadistiques' ) && $nep_admin->has_cap( 'nep_gestiona_missions' ), 'user_has_cap: administrador sense caps al rol ni nep_db_version → les té' );
$nep_comprova( $nep_editor->exists() && ! $nep_editor->has_cap( 'nep_veu_estadistiques' ) && ! $nep_editor->has_cap( 'nep_gestiona_missions' ), 'user_has_cap: un editor no les té' );
require_once ABSPATH . 'wp-admin/includes/user.php';
wp_delete_user( $nep_editor->ID );
nep_actualitza();

// Desinstal·lació (a l'entorn de proves): esborra transients propis, opcions i taula; després es restaura.
set_transient( 'nep_rl_prova', array( 'n' => 1 ), 60 );
set_transient( 'nep_avis_99999', array( 'errors' => array( 'x' ) ), 60 );
set_transient( 'nepaltre_prova', 1, 60 );
define( 'WP_UNINSTALL_PLUGIN', 'noempesquen-core/noempesquen-core.php' );
require NEP_PATH . 'uninstall.php';
wp_cache_flush();
$nep_comprova(
	false === get_transient( 'nep_rl_prova' ) && false === get_transient( 'nep_avis_99999' ) && 1 === (int) get_transient( 'nepaltre_prova' ),
	'uninstall: esborra els transients nep_rl_* i nep_avis_* (i cap altre)'
);
$nep_comprova( false === get_option( 'nep_db_version' ) && null === $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $wpdb->esc_like( nep_taula_resultats() ) ) ), 'uninstall: esborra la versió i la taula' ); // phpcs:ignore WordPress.DB
delete_transient( 'nepaltre_prova' );
nep_actualitza();
$nep_comprova( NEP_DB_VERSION === get_option( 'nep_db_version' ), 'uninstall: restaurat amb nep_actualitza()' );

if ( $nep_fallades ) {
	WP_CLI::error( "$nep_fallades comprovacions fallades." );
}
WP_CLI::success( 'Integració correcta.' );
