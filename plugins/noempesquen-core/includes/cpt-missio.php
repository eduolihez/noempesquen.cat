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
 * Una sola consulta; els guions massa grans o mal formats s'ignoren.
 *
 * @param int $exclou Id de l'entrada que s'està desant.
 * @return string[]
 */
function nep_ids_missions_existents( int $exclou ): array {
	global $wpdb;
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Una sola consulta en lloc d'una per entrada; no es pot fer cau (ha de ser al dia en desar).
	$guions = $wpdb->get_col(
		$wpdb->prepare(
			"SELECT pm.meta_value FROM {$wpdb->postmeta} pm
			INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
			WHERE p.post_type = 'nep_missio'
			AND p.post_status IN ( 'publish', 'future', 'draft', 'pending', 'private' )
			AND pm.meta_key = 'nep_guio'
			AND p.ID <> %d",
			$exclou
		)
	);
	$ids    = array();
	foreach ( $guions as $json ) {
		$guio = nep_descodifica_guio( (string) $json );
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
	// `get_post_meta` torna el valor per defecte registrat encara que la meta no existeixi: cal `metadata_exists`.
	$desat = static function ( string $clau ) use ( $post_id ): string {
		if ( ! $post_id || ! metadata_exists( 'post', $post_id, $clau ) ) {
			return '';
		}
		$valor = get_post_meta( $post_id, $clau, true );
		return is_string( $valor ) ? $valor : '';
	};

	$json       = $json ?? $desat( 'nep_guio' );
	$dispositiu = sanitize_key( $dispositiu ?? $desat( 'nep_dispositiu' ) );
	$personatge = sanitize_key( $personatge ?? $desat( 'nep_personatge' ) );

	$errors = array();
	if ( '' === $dispositiu ) {
		$errors[] = 'Falta el dispositiu de la missió (nep_dispositiu).';
	}
	if ( '' === $personatge ) {
		$errors[] = 'Falta el personatge de la missió (nep_personatge).';
	}
	$guio = nep_descodifica_guio( '' === $json ? '{}' : $json, $error );
	if ( null === $guio ) {
		$errors[] = $error;
		return $errors;
	}
	// Sense meta, es compara amb el valor del guió per no repetir l'error com a «no coincideix».
	return array_merge(
		$errors,
		nep_valida_guio(
			$guio,
			'' === $dispositiu ? (string) ( $guio['dispositiu'] ?? '' ) : $dispositiu,
			'' === $personatge ? (string) ( $guio['personatge'] ?? '' ) : $personatge,
			nep_ids_missions_existents( $post_id )
		)
	);
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
	$meta = $request['meta'] ?? null;
	// Un null esborraria la meta: el guió només es pot substituir per un text (en qualsevol estat).
	if ( is_array( $meta ) && array_key_exists( 'nep_guio', $meta ) && ! is_string( $meta['nep_guio'] ) ) {
		return new WP_Error( 'nep_guio_invalid', __( 'El guió ha de ser un text JSON.', 'noempesquen' ), array( 'status' => 400 ) );
	}
	// Un JSON il·legible es convertiria en '{}' i esborraria el guió: 400 també en esborrany
	// (els esborranys poden tenir errors de regles, però no un JSON que no es pot llegir).
	if ( is_array( $meta ) && isset( $meta['nep_guio'] ) && null === nep_descodifica_guio( $meta['nep_guio'], $error ) ) {
		return new WP_Error( 'nep_guio_invalid', __( 'No es pot desar la missió:', 'noempesquen' ) . ' ' . $error, array( 'status' => 400 ) );
	}
	$post_id = isset( $prepared_post->ID ) ? (int) $prepared_post->ID : 0;
	$estat   = $prepared_post->post_status ?? ( $post_id ? (string) get_post_status( $post_id ) : 'draft' );
	if ( ! nep_estat_publica( (string) $estat ) ) {
		return $prepared_post;
	}

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
 * La constant `NEP_VALIDA_CLI` (només per a proves) l'activa a WP-CLI.
 *
 * @param array $data    Dades de l'entrada (amb barres).
 * @param array $postarr Dades rebudes (amb barres).
 * @return array
 */
function nep_valida_missio_classica( $data, $postarr ) {
	if ( 'nep_missio' !== ( $data['post_type'] ?? '' ) || ! nep_estat_publica( (string) ( $data['post_status'] ?? '' ) ) ) {
		return $data;
	}
	if ( wp_is_serving_rest_request() || ( defined( 'WP_CLI' ) && WP_CLI && ! ( defined( 'NEP_VALIDA_CLI' ) && NEP_VALIDA_CLI ) ) ) {
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
 * @return bool Cert si l'avís ha quedat desat.
 */
function nep_desa_avis( string $motiu, array $errors ): bool {
	$usuari = get_current_user_id();
	if ( $usuari <= 0 ) {
		return false;
	}
	$clau = 'nep_avis_' . $usuari;
	$avis = array(
		'motiu'  => $motiu,
		'errors' => $errors,
	);
	// set_transient també torna fals si el valor no ha canviat: es comprova llegint-lo.
	if ( ! set_transient( $clau, $avis, 60 ) && get_transient( $clau ) !== $avis ) {
		error_log( 'noempesquen: no s\'ha pogut desar l\'avís de la missió.' ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Sense l'avís, l'usuari no sabria per què no s'ha publicat.
		return false;
	}
	return true;
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
 * WP no ha de dir «publicada» (message=6) si la missió no s'ha publicat o el
 * guió no s'ha desat:
 * - en esborrany, si es va demanar publicar o l'avís és de publicació aturada
 *   («esborrany»), diu «esborrany actualitzat» (10), encara que el transient
 *   no s'hagi pogut desar;
 * - amb qualsevol altre avís pendent (p. ex. «guio-conservat»), no diu res.
 * El transient no s'esborra aquí: el mostra `nep_mostra_avis_missio`.
 *
 * @param string $location URL de redirecció.
 * @param int    $post_id  Id de l'entrada.
 * @return string
 */
function nep_redireccio_avis_missio( $location, $post_id ) {
	if ( 'nep_missio' !== get_post_type( (int) $post_id ) ) {
		return $location;
	}
	$avis             = get_transient( 'nep_avis_' . get_current_user_id() );
	$motiu            = is_array( $avis ) ? (string) ( $avis['motiu'] ?? '' ) : '';
	$demanat_publicar = isset( $_POST['publish'] ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Només es mira quin botó s'ha premut; el nonce el comprova edit_post.
	if ( 'draft' === get_post_status( (int) $post_id ) && ( $demanat_publicar || 'esborrany' === $motiu ) ) {
		return add_query_arg( 'message', 10, $location );
	}
	return is_array( $avis ) ? remove_query_arg( 'message', $location ) : $location;
}
add_filter( 'redirect_post_location', 'nep_redireccio_avis_missio', 10, 2 );

/**
 * Entrades que `wp_delete_post` està esborrant: n'esborra la meta per meta_id
 * amb l'entrada encara publicada, i això no s'ha d'impedir.
 *
 * @param int         $post_id Id de l'entrada.
 * @param string|null $accio   'afegeix', 'treu' o null (només consulta).
 * @return bool Si l'entrada s'està esborrant.
 */
function nep_missio_esborrant( int $post_id, ?string $accio = null ): bool {
	static $ids = array();
	if ( 'afegeix' === $accio ) {
		$ids[ $post_id ] = true;
	} elseif ( 'treu' === $accio ) {
		unset( $ids[ $post_id ] );
	}
	return isset( $ids[ $post_id ] );
}
add_action( 'before_delete_post', static fn( $post_id ) => nep_missio_esborrant( (int) $post_id, 'afegeix' ) );
add_action( 'deleted_post', static fn( $post_id ) => nep_missio_esborrant( (int) $post_id, 'treu' ) );

/**
 * Si l'entrada és una missió publicada (o programada) que no s'està esborrant.
 *
 * @param int $post_id Id de l'entrada.
 * @return bool
 */
function nep_es_missio_publicada( int $post_id ): bool {
	return $post_id > 0
		&& 'nep_missio' === get_post_type( $post_id )
		&& nep_estat_publica( (string) get_post_status( $post_id ) )
		&& ! nep_missio_esborrant( $post_id );
}

/**
 * Errors d'un guió candidat per a una missió publicada, amb la resta de metas desades.
 *
 * @param int   $post_id Id de l'entrada.
 * @param mixed $valor   Guió candidat.
 * @return string[] Errors (buit = vàlid).
 */
function nep_errors_guio_publicat( int $post_id, $valor ): array {
	if ( ! is_string( $valor ) ) {
		return array( 'El guió no és un JSON vàlid.' );
	}
	return nep_errors_missio( $post_id, $valor, null, null );
}

/**
 * Impedeix escriure o afegir un guió invàlid (p. ex. el '{}' de `nep_sanitize_guio`)
 * a una missió publicada.
 *
 * Valida el guió sencer amb el dispositiu i el personatge desats (REST i
 * l'importador els escriuen abans que el guió).
 *
 * @param null|bool $check      Valor de curtcircuit.
 * @param int       $object_id  Id de l'entrada.
 * @param string    $meta_key   Clau.
 * @param mixed     $meta_value Valor ja sanejat.
 * @return null|bool
 */
function nep_protegeix_guio_publicat( $check, $object_id, $meta_key, $meta_value ) {
	if ( 'nep_guio' !== $meta_key || ! nep_es_missio_publicada( (int) $object_id ) ) {
		return $check;
	}
	return nep_errors_guio_publicat( (int) $object_id, $meta_value ) ? false : $check;
}
add_filter( 'update_post_metadata', 'nep_protegeix_guio_publicat', 10, 4 );
add_filter( 'add_post_metadata', 'nep_protegeix_guio_publicat', 10, 4 );

/**
 * No deixa esborrar el guió d'una missió publicada.
 *
 * @param null|bool $check      Valor de curtcircuit.
 * @param int       $object_id  Id de l'entrada.
 * @param string    $meta_key   Clau.
 * @param mixed     $meta_value Valor.
 * @param bool      $delete_all Si esborra la clau de totes les entrades.
 * @return null|bool
 */
function nep_protegeix_esborrat_guio( $check, $object_id, $meta_key, $meta_value, $delete_all ) {
	if ( 'nep_guio' !== $meta_key || $delete_all || ! nep_es_missio_publicada( (int) $object_id ) ) {
		return $check;
	}
	return false;
}
add_filter( 'delete_post_metadata', 'nep_protegeix_esborrat_guio', 10, 5 );

/**
 * El mateix per a la caixa «Camps personalitzats» (actualitza per meta_id i no
 * passa per `update_post_metadata`). Aquí el valor encara no està sanejat.
 * Canviar la clau del guió d'una missió publicada equival a esborrar-lo.
 *
 * @param null|bool    $check      Valor de curtcircuit.
 * @param int          $meta_id    Id de la meta.
 * @param mixed        $meta_value Valor sense barres ni sanejar.
 * @param string|false $meta_key   Clau nova, o false.
 * @return null|bool
 */
function nep_protegeix_guio_publicat_per_mid( $check, $meta_id, $meta_value, $meta_key ) {
	$meta = get_metadata_by_mid( 'post', (int) $meta_id );
	if ( ! $meta ) {
		return $check;
	}
	$clau_nova = $meta_key ? (string) $meta_key : $meta->meta_key;
	if ( 'nep_guio' !== $meta->meta_key && 'nep_guio' !== $clau_nova ) {
		return $check;
	}
	// En qualsevol estat: un JSON il·legible es desaria com a '{}' i es perdria el guió anterior.
	if ( 'nep_guio' === $clau_nova && 'nep_missio' === get_post_type( (int) $meta->post_id ) && ( ! is_string( $meta_value ) || null === nep_descodifica_guio( $meta_value, $error ) ) ) {
		nep_desa_avis( 'guio-conservat', array( $error ?? 'El guió no és un JSON vàlid.' ) );
		return false;
	}
	if ( ! nep_es_missio_publicada( (int) $meta->post_id ) ) {
		return $check;
	}
	$errors = 'nep_guio' === $clau_nova
		? nep_errors_guio_publicat( (int) $meta->post_id, $meta_value )
		: array( 'No es pot canviar la clau del guió d\'una missió publicada.' );
	if ( ! $errors ) {
		return $check;
	}
	nep_desa_avis( 'guio-conservat', $errors );
	return false;
}
add_filter( 'update_post_metadata_by_mid', 'nep_protegeix_guio_publicat_per_mid', 10, 4 );

/**
 * No deixa esborrar el guió d'una missió publicada des de la caixa «Camps personalitzats».
 *
 * @param null|bool $check   Valor de curtcircuit.
 * @param int       $meta_id Id de la meta.
 * @return null|bool
 */
function nep_protegeix_esborrat_guio_per_mid( $check, $meta_id ) {
	$meta = get_metadata_by_mid( 'post', (int) $meta_id );
	if ( ! $meta || 'nep_guio' !== $meta->meta_key || ! nep_es_missio_publicada( (int) $meta->post_id ) ) {
		return $check;
	}
	nep_desa_avis( 'guio-conservat', array( 'No es pot esborrar el guió d\'una missió publicada.' ) );
	return false;
}
add_filter( 'delete_post_metadata_by_mid', 'nep_protegeix_esborrat_guio_per_mid', 10, 2 );
