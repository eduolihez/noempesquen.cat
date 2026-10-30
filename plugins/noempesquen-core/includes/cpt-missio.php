<?php
/**
 * Tipus de contingut "Missió": cada missió del simulador és un registre editable
 * des del panell, amb el guió en JSON a la meta `nep_guio`.
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'init',
	static function () {
		register_post_type(
			'nep_missio',
			array(
				'labels'       => array(
					'name'          => __( 'Missions', 'noempesquen' ),
					'singular_name' => __( 'Missió', 'noempesquen' ),
					'add_new_item'  => __( 'Afegeix una missió', 'noempesquen' ),
					'edit_item'     => __( 'Edita la missió', 'noempesquen' ),
				),
				'public'       => false,
				'show_ui'      => true,
				'show_in_rest' => true,
				'menu_icon'    => 'dashicons-shield',
				'supports'     => array( 'title', 'excerpt', 'custom-fields', 'page-attributes' ),
			)
		);

		$meta = array(
			'nep_dispositiu' => array( 'type' => 'string', 'default' => 'pc' ),     // pc | mobil.
			'nep_personatge' => array( 'type' => 'string', 'default' => 'llissa' ), // llissa | remei.
			'nep_guio'       => array( 'type' => 'string', 'default' => '{}' ),     // Guió JSON.
		);

		foreach ( $meta as $key => $args ) {
			register_post_meta(
				'nep_missio',
				$key,
				array(
					'type'              => $args['type'],
					'default'           => $args['default'],
					'single'            => true,
					'show_in_rest'      => true,
					'sanitize_callback' => 'nep_guio' === $key ? 'nep_sanitize_guio' : 'sanitize_key',
					// Decisió: capacitats per defecte del tipus post; la capacitat pròpia només protegeix l'escriptura de la meta.
					'auth_callback'     => static fn( $allowed, $meta_key, $post_id ) => current_user_can( 'edit_post', $post_id ) && current_user_can( 'nep_gestiona_missions' ),
				)
			);
		}
	}
);

/**
 * Només accepta JSON vàlid al guió.
 *
 * Contracte sense canvis: si el JSON no és vàlid torna '{}'. Com que el callback
 * no rep l'id de l'entrada, la protecció de les missions publicades és a
 * `nep_valida_rest_missio`, `nep_valida_missio_classica` (validen el valor brut
 * abans d'arribar aquí) i `nep_protegeix_guio_publicat` (escriptures directes).
 *
 * @param mixed $value Valor rebut.
 * @return string JSON normalitzat o '{}' si no és vàlid.
 */
function nep_sanitize_guio( $value ): string {
	$decoded = json_decode( (string) $value, true );
	return is_array( $decoded ) ? wp_json_encode( $decoded ) : '{}';
}

/**
 * Estats que publiquen (o publicaran) una missió.
 *
 * @param string $estat Estat de l'entrada.
 * @return bool
 */
function nep_estat_publica( string $estat ): bool {
	return in_array( $estat, array( 'publish', 'future' ), true );
}

/**
 * Ids de guió de les altres entrades `nep_missio` (qualsevol estat excepte paperera).
 *
 * @param int $exclou Id de l'entrada que s'està desant.
 * @return string[]
 */
function nep_ids_missions_existents( int $exclou ): array {
	$posts = get_posts(
		array(
			'post_type'      => 'nep_missio',
			'post_status'    => 'any',
			'posts_per_page' => -1,
			'fields'         => 'ids',
			'exclude'        => $exclou ? array( $exclou ) : array(),
		)
	);
	$ids   = array();
	foreach ( $posts as $post_id ) {
		$guio = nep_descodifica_guio( (string) get_post_meta( (int) $post_id, 'nep_guio', true ) );
		if ( $guio && isset( $guio['id'] ) && is_string( $guio['id'] ) ) {
			$ids[] = $guio['id'];
		}
	}
	return $ids;
}

/**
 * Errors del guió candidat d'una missió.
 *
 * @param int         $post_id    Id de l'entrada (0 si és nova).
 * @param string|null $json       Guió candidat (null = el desat).
 * @param string|null $dispositiu Dispositiu candidat (null = el desat).
 * @param string|null $personatge Personatge candidat (null = el desat).
 * @return string[]
 */
function nep_errors_missio( int $post_id, ?string $json, ?string $dispositiu, ?string $personatge ): array {
	$desat = static function ( string $clau, string $defecte ) use ( $post_id ): string {
		$valor = $post_id ? get_post_meta( $post_id, $clau, true ) : '';
		return is_string( $valor ) && '' !== $valor ? $valor : $defecte;
	};

	$json       = $json ?? $desat( 'nep_guio', '{}' );
	$dispositiu = sanitize_key( $dispositiu ?? $desat( 'nep_dispositiu', 'pc' ) );
	$personatge = sanitize_key( $personatge ?? $desat( 'nep_personatge', 'llissa' ) );

	$guio = nep_descodifica_guio( $json );
	if ( null === $guio ) {
		return array( 'El guió no és un JSON vàlid.' );
	}
	return nep_valida_guio( $guio, $dispositiu, $personatge, nep_ids_missions_existents( $post_id ) );
}

/**
 * Valor de text d'una llista si hi és, o null.
 *
 * @param mixed  $llista Llista (array) o qualsevol altre valor.
 * @param string $clau   Clau.
 * @return string|null
 */
function nep_valor_text( $llista, string $clau ): ?string {
	return is_array( $llista ) && isset( $llista[ $clau ] ) && is_scalar( $llista[ $clau ] ) ? (string) $llista[ $clau ] : null;
}

/**
 * REST (editor de blocs): rebutja publicar una missió invàlida. Els esborranys es desen sempre.
 *
 * @param stdClass|WP_Error $prepared_post Entrada preparada.
 * @param WP_REST_Request   $request       Petició.
 * @return stdClass|WP_Error
 */
function nep_valida_rest_missio( $prepared_post, $request ) {
	if ( is_wp_error( $prepared_post ) ) {
		return $prepared_post;
	}
	$post_id = isset( $prepared_post->ID ) ? (int) $prepared_post->ID : 0;
	$estat   = $prepared_post->post_status ?? ( $post_id ? (string) get_post_status( $post_id ) : 'draft' );
	if ( ! nep_estat_publica( (string) $estat ) ) {
		return $prepared_post;
	}

	$meta   = $request['meta'] ?? null;
	$errors = nep_errors_missio(
		$post_id,
		nep_valor_text( $meta, 'nep_guio' ),
		nep_valor_text( $meta, 'nep_dispositiu' ),
		nep_valor_text( $meta, 'nep_personatge' )
	);
	if ( ! $errors ) {
		return $prepared_post;
	}
	return new WP_Error(
		'nep_missio_invalida',
		__( 'No es pot publicar la missió:', 'noempesquen' ) . ' ' . implode( ' ', $errors ),
		array(
			'status' => 400,
			'errors' => $errors,
		)
	);
}
add_filter( 'rest_pre_insert_nep_missio', 'nep_valida_rest_missio', 10, 2 );

/**
 * Desament clàssic: si es vol publicar una missió invàlida, la deixa en esborrany i desa un avís.
 *
 * No actua en REST (ja ho fa `nep_valida_rest_missio`) ni a WP-CLI: `wp noempesquen
 * importa-missions` crea l'entrada abans d'escriure'n la meta i importa fitxers del plugin.
 *
 * @param array $data    Dades de l'entrada (amb barres).
 * @param array $postarr Dades rebudes (amb barres).
 * @return array
 */
function nep_valida_missio_classica( $data, $postarr ) {
	if ( 'nep_missio' !== ( $data['post_type'] ?? '' ) || ! nep_estat_publica( (string) ( $data['post_status'] ?? '' ) ) ) {
		return $data;
	}
	if ( wp_is_serving_rest_request() || ( defined( 'WP_CLI' ) && WP_CLI && ! apply_filters( 'nep_valida_missio_cli', false ) ) ) {
		return $data;
	}

	$postarr = wp_unslash( (array) $postarr );
	$errors  = nep_errors_missio(
		(int) ( $postarr['ID'] ?? 0 ),
		nep_valor_text( $postarr, 'nep_guio' ),
		nep_valor_text( $postarr, 'nep_dispositiu' ),
		nep_valor_text( $postarr, 'nep_personatge' )
	);
	if ( $errors ) {
		$data['post_status'] = 'draft';
		nep_desa_avis( 'esborrany', $errors );
	}
	return $data;
}
add_filter( 'wp_insert_post_data', 'nep_valida_missio_classica', 10, 2 );

/**
 * Desa l'avís per a l'usuari actual (transient de 60 s).
 *
 * @param string   $motiu  'esborrany' (publicació aturada) o 'guio-conservat' (guió no desat).
 * @param string[] $errors Errors en català.
 */
function nep_desa_avis( string $motiu, array $errors ): void {
	set_transient(
		'nep_avis_' . get_current_user_id(),
		array(
			'motiu'  => $motiu,
			'errors' => $errors,
		),
		60
	);
}

/**
 * Mostra (i esborra) l'avís de missió no publicada o de guió no desat.
 */
function nep_mostra_avis_missio(): void {
	$clau = 'nep_avis_' . get_current_user_id();
	$avis = get_transient( $clau );
	if ( ! is_array( $avis ) || empty( $avis['errors'] ) || ! is_array( $avis['errors'] ) ) {
		return;
	}
	delete_transient( $clau );
	$titol = 'guio-conservat' === ( $avis['motiu'] ?? '' )
		? __( 'No s\'ha desat el guió nou i es conserva l\'anterior:', 'noempesquen' )
		: __( 'La missió s\'ha desat com a esborrany perquè el guió no és vàlid:', 'noempesquen' );
	echo '<div class="notice notice-error is-dismissible"><p><strong>' . esc_html( $titol ) . '</strong></p><ul>';
	foreach ( $avis['errors'] as $error ) {
		echo '<li>' . esc_html( (string) $error ) . '</li>';
	}
	echo '</ul></div>';
}
add_action( 'admin_notices', 'nep_mostra_avis_missio' );

/**
 * Impedeix escriure un guió invàlid (p. ex. el '{}' de `nep_sanitize_guio`) a una missió publicada.
 *
 * @param null|bool $check      Valor de curtcircuit.
 * @param int       $object_id  Id de l'entrada.
 * @param string    $meta_key   Clau.
 * @param mixed     $meta_value Valor ja sanejat.
 * @return null|bool
 */
function nep_protegeix_guio_publicat( $check, $object_id, $meta_key, $meta_value ) {
	if ( 'nep_guio' !== $meta_key || 'nep_missio' !== get_post_type( (int) $object_id ) ) {
		return $check;
	}
	if ( ! nep_estat_publica( (string) get_post_status( (int) $object_id ) ) ) {
		return $check;
	}
	return null === nep_descodifica_guio( (string) $meta_value ) || '{}' === $meta_value ? false : $check;
}
add_filter( 'update_post_metadata', 'nep_protegeix_guio_publicat', 10, 4 );

/**
 * El mateix per a la caixa «Camps personalitzats» (actualitza per meta_id i no
 * passa per `update_post_metadata`). Aquí el valor encara no està sanejat.
 *
 * @param null|bool    $check      Valor de curtcircuit.
 * @param int          $meta_id    Id de la meta.
 * @param mixed        $meta_value Valor sense barres ni sanejar.
 * @param string|false $meta_key   Clau nova, o false.
 * @return null|bool
 */
function nep_protegeix_guio_publicat_per_mid( $check, $meta_id, $meta_value, $meta_key ) {
	$meta = get_metadata_by_mid( 'post', (int) $meta_id );
	if ( ! $meta || ( 'nep_guio' !== $meta->meta_key && 'nep_guio' !== $meta_key ) ) {
		return $check;
	}
	$post_id = (int) $meta->post_id;
	if ( 'nep_missio' !== get_post_type( $post_id ) || ! nep_estat_publica( (string) get_post_status( $post_id ) ) ) {
		return $check;
	}
	if ( null !== nep_descodifica_guio( (string) $meta_value ) ) {
		return $check;
	}
	nep_desa_avis( 'guio-conservat', array( 'El guió no és un JSON vàlid.' ) );
	return false;
}
add_filter( 'update_post_metadata_by_mid', 'nep_protegeix_guio_publicat_per_mid', 10, 4 );
