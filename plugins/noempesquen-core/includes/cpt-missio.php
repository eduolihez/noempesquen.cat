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
					// Totes les capacitats primitives del tipus (menú, llista, editors, REST,
					// paperera, duplicar) es redueixen a `nep_gestiona_missions`; map_meta_cap
					// tradueix edit_post, delete_post i read_post a aquestes.
					'map_meta_cap' => true,
					'capabilities' => nep_capacitats_missio(),
			)
		);

		$meta = array(
			'nep_dispositiu' => array( 'type' => 'string', 'default' => 'pc' ),     // pc | mobil.
			'nep_personatge' => array( 'type' => 'string', 'default' => 'llissa' ), // llissa | remei.
			'nep_guio'       => array( 'type' => 'string', 'default' => '{}' ),     // Guió JSON.
			'nep_idioma'     => array( 'type' => 'string', 'default' => NEP_IDIOMA_MISSIO_PER_DEFECTE ), // es | ca (sense meta: ca).
		);
		$sanejadors = array(
			'nep_guio'   => 'nep_sanitize_guio',
			'nep_idioma' => 'nep_idioma_missio',
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
					'sanitize_callback' => $sanejadors[ $key ] ?? 'sanitize_key',
					// El tipus ja exigeix `nep_gestiona_missions` (vegeu `nep_capacitats_missio`); aquí es repeteix com a defensa.
					'auth_callback'     => static fn( $allowed, $meta_key, $post_id ) => current_user_can( 'edit_post', $post_id ) && current_user_can( 'nep_gestiona_missions' ),
				)
			);
		}
	}
);

/**
 * Capacitats primitives del tipus `nep_missio`: totes són `nep_gestiona_missions`.
 * `read` es manté (llegir el lloc), la resta no s'hereta de les de `post`.
 *
 * @return array<string,string>
 */
function nep_capacitats_missio(): array {
	$caps = array( 'edit_posts', 'edit_others_posts', 'edit_private_posts', 'edit_published_posts', 'publish_posts', 'read_private_posts', 'delete_posts', 'delete_private_posts', 'delete_published_posts', 'delete_others_posts', 'create_posts' );
	return array_fill_keys( $caps, 'nep_gestiona_missions' );
}

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
 * L'id és únic per `(id, idioma)`: amb `$idioma` només compten les entrades
 * d'aquest idioma (sense meta `nep_idioma`, `ca`).
 *
 * @param int         $exclou Id de l'entrada que s'està desant.
 * @param string|null $idioma `es`|`ca`, o null per a tots els idiomes.
 * @return string[]
 */
function nep_ids_missions_existents( int $exclou, ?string $idioma = null ): array {
	$ids = array();
	foreach ( nep_idiomes_ids_missions( $exclou ) as $id => $idiomes ) {
		if ( null === $idioma || in_array( nep_idioma_missio( $idioma ), $idiomes, true ) ) {
			$ids[] = (string) $id;
		}
	}
	return $ids;
}

/**
 * Idiomes en què existeix cada id de guió (altres entrades, qualsevol estat excepte paperera).
 *
 * Una sola consulta; els guions massa grans o mal formats s'ignoren.
 *
 * @param int $exclou Id de l'entrada que s'exclou.
 * @return array<string, string[]> Idiomes per id.
 */
function nep_idiomes_ids_missions( int $exclou ): array {
	global $wpdb;
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Una sola consulta en lloc d'una per entrada; no es pot fer cau (ha de ser al dia en desar).
	$files = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT pm.meta_value AS guio, pi.meta_value AS idioma FROM {$wpdb->postmeta} pm
			INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
			LEFT JOIN {$wpdb->postmeta} pi ON pi.post_id = p.ID AND pi.meta_key = 'nep_idioma'
			WHERE p.post_type = 'nep_missio'
			AND p.post_status IN ( 'publish', 'future', 'draft', 'pending', 'private' )
			AND pm.meta_key = 'nep_guio'
			AND p.ID <> %d",
			$exclou
		)
	);
	$ids = array();
	foreach ( (array) $files as $fila ) {
		$guio = nep_descodifica_guio( (string) $fila->guio );
		if ( $guio && isset( $guio['id'] ) && is_string( $guio['id'] ) ) {
			$ids[ $guio['id'] ][] = nep_idioma_missio( $fila->idioma );
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
 * @param string|null $idioma     Idioma candidat (null = el desat; sense meta, `ca`).
 * @return string[]
 */
function nep_errors_missio( int $post_id, ?string $json, ?string $dispositiu, ?string $personatge, ?string $idioma = null ): array {
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
	$idioma     = nep_idioma_missio( $idioma ?? $desat( 'nep_idioma' ) );

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
			nep_ids_missions_existents( $post_id, $idioma )
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
		nep_valor_text( $meta, 'nep_personatge' ),
		nep_valor_text( $meta, 'nep_idioma' )
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
		nep_valor_text( $postarr, 'nep_personatge' ),
		nep_valor_text( $postarr, 'nep_idioma' )
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

/**
 * Ids de les missions incloses al plugin (`missions/ca/*.json`, sense el món; els ids són els mateixos a `es/`).
 *
 * @param string $idioma `es`|`ca` (els ids són els mateixos als dos).
 * @return string[]
 */
function nep_ids_missions_incloses( string $idioma = NEP_IDIOMA_MISSIO_PER_DEFECTE ): array {
	$ids = array();
	foreach ( nep_fitxers_missions_incloses( nep_carpeta_missions( NEP_PATH . 'missions/', $idioma ) ) as $fitxer ) {
		$guio = nep_descodifica_guio( (string) file_get_contents( $fitxer ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Fitxer local del plugin.
		if ( $guio && isset( $guio['id'] ) && is_string( $guio['id'] ) ) {
			$ids[] = $guio['id'];
		}
	}
	return $ids;
}

/**
 * URL (amb nonce) que duplica una missió com a esborrany.
 *
 * @param int $post_id Missió original.
 * @return string
 */
function nep_url_duplica_missio( int $post_id ): string {
	return wp_nonce_url(
		add_query_arg(
			array(
				'action' => 'nep_duplica_missio',
				'post'   => $post_id,
			),
			admin_url( 'admin-post.php' )
		),
		'nep_duplica_missio_' . $post_id
	);
}

/**
 * Si l'usuari actual pot duplicar la missió.
 *
 * @param int $post_id Missió original.
 * @return bool
 */
function nep_pot_duplicar_missio( int $post_id ): bool {
	$tipus = get_post_type_object( 'nep_missio' );
	return 'nep_missio' === get_post_type( $post_id )
		&& $tipus
		&& current_user_can( 'nep_gestiona_missions' )
		&& current_user_can( 'edit_post', $post_id )
		&& current_user_can( $tipus->cap->create_posts );
}

/**
 * Acció de fila «Duplica» a la llista de missions.
 *
 * @param array   $accions Accions de la fila.
 * @param WP_Post $post    Entrada.
 * @return array
 */
function nep_accio_fila_duplica( $accions, $post ) {
	if ( ! $post instanceof WP_Post || 'trash' === $post->post_status || ! nep_pot_duplicar_missio( $post->ID ) ) {
		return $accions;
	}
	$accions['nep_duplica'] = sprintf(
		'<a href="%s" aria-label="%s">%s</a>',
		esc_url( nep_url_duplica_missio( $post->ID ) ),
		/* translators: %s: títol de la missió */
		esc_attr( sprintf( __( 'Duplica «%s»', 'noempesquen' ), $post->post_title ) ),
		esc_html__( 'Duplica', 'noempesquen' )
	);
	return $accions;
}
add_filter( 'post_row_actions', 'nep_accio_fila_duplica', 10, 2 );

/**
 * Duplica una missió: esborrany amb «(còpia)» al títol, les mateixes metas i un
 * id de guió nou que no és de cap missió inclosa ni del panell (si no, el
 * duplicat substituiria l'original a `combinaMissions`). No publica mai.
 */
function nep_duplica_missio(): void {
	$original = isset( $_GET['post'] ) ? absint( wp_unslash( $_GET['post'] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- El nonce es comprova just a continuació.
	check_admin_referer( 'nep_duplica_missio_' . $original );
	if ( ! $original || ! nep_pot_duplicar_missio( $original ) ) {
		wp_die( esc_html__( 'No pots duplicar aquesta missió.', 'noempesquen' ), '', array( 'response' => 403 ) );
	}
	$post = get_post( $original );

	$guio = nep_descodifica_guio( (string) get_post_meta( $original, 'nep_guio', true ) );
	if ( $guio ) {
		$base       = isset( $guio['id'] ) && is_string( $guio['id'] ) && '' !== $guio['id'] ? $guio['id'] : $post->post_title;
		$guio['id'] = nep_proposa_id_missio(
			$base . '-copia',
			array_merge( nep_ids_missions_incloses(), nep_ids_missions_existents( 0 ) )
		);
	}

	$nou = wp_insert_post(
		wp_slash(
			array(
				'post_type'    => 'nep_missio',
				'post_status'  => 'draft',
				/* translators: %s: títol de la missió original */
				'post_title'   => sprintf( __( '%s (còpia)', 'noempesquen' ), $post->post_title ),
				'post_excerpt' => $post->post_excerpt,
				'menu_order'   => $post->menu_order,
			)
		),
		true
	);
	if ( is_wp_error( $nou ) ) {
		wp_die( esc_html( $nou->get_error_message() ) );
	}

	// Dispositiu, personatge i idioma abans del guió (les proteccions validen el guió amb els desats).
	foreach ( array( 'nep_dispositiu', 'nep_personatge', 'nep_idioma' ) as $clau ) {
		if ( metadata_exists( 'post', $original, $clau ) ) {
			update_post_meta( $nou, $clau, wp_slash( (string) get_post_meta( $original, $clau, true ) ) );
		}
	}
	if ( $guio ) {
		update_post_meta( $nou, 'nep_guio', wp_slash( (string) wp_json_encode( $guio, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) ) );
	}

	wp_safe_redirect(
		add_query_arg(
			array(
				'post'          => $nou,
				'action'        => 'edit',
				'nep_duplicada' => $original,
			),
			admin_url( 'post.php' )
		)
	);
	exit;
}
add_action( 'admin_post_nep_duplica_missio', 'nep_duplica_missio' );

/**
 * Avís a l'editor del duplicat acabat de crear.
 */
function nep_avis_missio_duplicada(): void {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Només decideix si es mostra l'avís.
	$original = isset( $_GET['nep_duplicada'] ) ? absint( wp_unslash( $_GET['nep_duplicada'] ) ) : 0;
	$pantalla = get_current_screen();
	if ( ! $original || ! $pantalla || 'nep_missio' !== $pantalla->post_type || 'post' !== $pantalla->base ) {
		return;
	}
	printf(
		'<div class="notice notice-success is-dismissible" role="status"><p>%s</p></div>',
		esc_html(
			sprintf(
				/* translators: %s: títol de la missió original */
				__( 'S\'ha creat un esborrany a partir de «%s» amb un id de guió nou. Revisa\'l abans de publicar-lo.', 'noempesquen' ),
				get_post_field( 'post_title', $original )
			)
		)
	);
}
add_action( 'admin_notices', 'nep_avis_missio_duplicada' );

/**
 * Idioma desat d'una missió (sense meta, `ca`).
 *
 * @param int $post_id Id de l'entrada.
 * @return string `es`|`ca`.
 */
function nep_idioma_de_missio( int $post_id ): string {
	return nep_idioma_missio( metadata_exists( 'post', $post_id, 'nep_idioma' ) ? get_post_meta( $post_id, 'nep_idioma', true ) : '' );
}

/**
 * Si la missió té parella en l'altre idioma (mateix id de guió): una altra
 * entrada del panell o una missió inclosa (`missions/<idioma>/`). Només avisa.
 *
 * @param int $post_id Id de l'entrada.
 * @return bool|null Null si el guió encara no té id.
 */
function nep_missio_te_parella( int $post_id ): ?bool {
	$guio = nep_descodifica_guio( (string) get_post_meta( $post_id, 'nep_guio', true ) );
	if ( ! $guio || ! isset( $guio['id'] ) || ! is_string( $guio['id'] ) || '' === $guio['id'] ) {
		return null;
	}
	$altre = nep_idioma_altre( nep_idioma_de_missio( $post_id ) );
	return in_array( $guio['id'], nep_ids_missions_incloses( $altre ), true )
		|| in_array( $guio['id'], nep_ids_missions_existents( $post_id, $altre ), true );
}

/** Versió de les dades de les missions (migracions de `nep_migra_missions`, a part de `nep_actualitza`, que és a capacitats.php). */
const NEP_VERSIO_MISSIONS = 1;

/**
 * Migracions idempotents i versionades de les dades (opció `nep_versio_missions`).
 *
 * 1: les missions del panell sense `nep_idioma` passen a `ca` (abans només n'hi havia en català).
 */
function nep_migra_missions(): void {
	$versio = (int) get_option( 'nep_versio_missions', 0 );
	if ( $versio >= NEP_VERSIO_MISSIONS ) {
		return;
	}
	if ( $versio < 1 ) {
		$sense = get_posts(
			array(
				'post_type'      => 'nep_missio',
				'post_status'    => 'any',
				'posts_per_page' => -1,
				'fields'         => 'ids',
				'no_found_rows'  => true,
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- Migració d'una sola vegada.
				'meta_query'     => array(
					array(
						'key'     => 'nep_idioma',
						'compare' => 'NOT EXISTS',
					),
				),
			)
		);
		foreach ( $sense as $post_id ) {
			// Únic: si una altra petició ja l'ha afegit, no es duplica.
			add_post_meta( (int) $post_id, 'nep_idioma', NEP_IDIOMA_MISSIO_PER_DEFECTE, true );
		}
	}
	update_option( 'nep_versio_missions', NEP_VERSIO_MISSIONS );
}
add_action( 'init', 'nep_migra_missions', 20 );
