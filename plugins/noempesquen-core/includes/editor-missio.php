<?php
/**
 * Editor del guió d'una missió al panell: caixa amb el dispositiu, el
 * personatge i el guió JSON (wp.codeEditor), diagnòstic en viu i enllaç per
 * provar-la al simulador. Només per a qui té `nep_gestiona_missions`.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Registra la caixa «Guió de la missió».
 */
function nep_afegeix_caixa_guio(): void {
	if ( ! current_user_can( 'nep_gestiona_missions' ) ) {
		return;
	}
	add_meta_box(
		'nep-guio-missio',
		__( 'Guió de la missió', 'noempesquen' ),
		'nep_pinta_caixa_guio',
		'nep_missio',
		'normal',
		'high'
	);
}
add_action( 'add_meta_boxes_nep_missio', 'nep_afegeix_caixa_guio' );

/**
 * URL de la pàgina que conté el bloc del simulador (o /simulador/ si no se'n troba cap).
 *
 * Amb idioma, afegeix `lang` a l'URL només com a pista: les pàgines `/ca/…`
 * encara no existeixen (T09c), així que la ruta no canvia. La previsualització
 * carrega el guió per id, sigui quin sigui l'idioma.
 *
 * @param string|null $idioma `es`|`ca` de la missió (opcional).
 * @return string
 */
function nep_url_simulador( ?string $idioma = null ): string {
	$url = nep_url_simulador_base();
	return null === $idioma ? $url : add_query_arg( 'lang', nep_idioma_missio( $idioma ), $url );
}

/**
 * URL de la pàgina del simulador sense idioma.
 *
 * @return string
 */
function nep_url_simulador_base(): string {
	$pagines = get_posts(
		array(
			'post_type'      => 'page',
			'post_status'    => 'publish',
			's'              => 'wp:noempesquen/simulador',
			'posts_per_page' => 5,
			'no_found_rows'  => true,
		)
	);
	foreach ( $pagines as $pagina ) {
		if ( has_block( 'noempesquen/simulador', $pagina ) ) {
			return (string) get_permalink( $pagina );
		}
	}
	return home_url( '/simulador/' );
}

/**
 * La pàgina del simulador amb `?previsualitza` per a un gestor porta un nonce
 * i un guió no publicat: que no la desi cap memòria cau.
 */
function nep_no_cache_previsualitzacio(): void {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Només comprova si hi ha el paràmetre.
	if ( ! isset( $_GET['previsualitza'] ) || ! current_user_can( 'nep_gestiona_missions' ) ) {
		return;
	}
	nocache_headers();
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', true );
	}
}
add_action( 'template_redirect', 'nep_no_cache_previsualitzacio' );

/**
 * Pinta la caixa del guió.
 *
 * @param WP_Post $post Missió.
 */
function nep_pinta_caixa_guio( WP_Post $post ): void {
	$dispositiu = (string) get_post_meta( $post->ID, 'nep_dispositiu', true );
	$personatge = (string) get_post_meta( $post->ID, 'nep_personatge', true );
	$guio       = (string) get_post_meta( $post->ID, 'nep_guio', true );
	if ( '{}' !== $guio && '' !== $guio ) {
		$descodificat = json_decode( $guio );
		if ( null !== $descodificat ) {
			$guio = (string) wp_json_encode( $descodificat, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
		}
	}
	$dispositius = array(
		'pc'    => __( 'Ordinador (pc)', 'noempesquen' ),
		'mobil' => __( 'Mòbil (mobil)', 'noempesquen' ),
	);
	$personatges = array(
		'llissa' => __( 'Llissa', 'noempesquen' ),
		'remei'  => __( 'Remei', 'noempesquen' ),
	);
	$idiomes     = array(
		'es' => __( 'Castellà (es)', 'noempesquen' ),
		'ca' => __( 'Català (ca)', 'noempesquen' ),
	);
	// Les noves, en castellà (l'idioma principal); les anteriors sense meta, en català.
	$idioma  = 'auto-draft' === $post->post_status ? 'es' : nep_idioma_de_missio( $post->ID );
	$parella = 'auto-draft' === $post->post_status ? null : nep_missio_te_parella( $post->ID );
	wp_nonce_field( 'nep_desa_guio', 'nep_guio_nonce' );
	?>
	<div class="nep-guio-camps">
		<p>
			<label for="nep-dispositiu"><?php esc_html_e( 'Dispositiu', 'noempesquen' ); ?></label>
			<select id="nep-dispositiu" name="nep_dispositiu">
				<?php foreach ( $dispositius as $valor => $text ) : ?>
					<option value="<?php echo esc_attr( $valor ); ?>" <?php selected( $dispositiu ?: 'pc', $valor ); ?>><?php echo esc_html( $text ); ?></option>
				<?php endforeach; ?>
			</select>
		</p>
		<p>
			<label for="nep-personatge"><?php esc_html_e( 'Personatge', 'noempesquen' ); ?></label>
			<select id="nep-personatge" name="nep_personatge">
				<?php foreach ( $personatges as $valor => $text ) : ?>
					<option value="<?php echo esc_attr( $valor ); ?>" <?php selected( $personatge ?: 'llissa', $valor ); ?>><?php echo esc_html( $text ); ?></option>
				<?php endforeach; ?>
			</select>
		</p>
		<p>
			<label for="nep-idioma"><?php esc_html_e( 'Idioma', 'noempesquen' ); ?></label>
			<select id="nep-idioma" name="nep_idioma">
				<?php foreach ( $idiomes as $valor => $text ) : ?>
					<option value="<?php echo esc_attr( $valor ); ?>" <?php selected( $idioma, $valor ); ?>><?php echo esc_html( $text ); ?></option>
				<?php endforeach; ?>
			</select>
		</p>
	</div>
	<?php if ( false === $parella ) : ?>
		<p class="nep-guio-parella notice notice-warning inline">
			<?php
			echo esc_html(
				sprintf(
					/* translators: %s: codi de l'altre idioma (es o ca) */
					__( 'Aquesta missió encara no té parella en l\'altre idioma (%s) amb el mateix id. Es pot publicar igualment.', 'noempesquen' ),
					nep_idioma_altre( $idioma )
				)
			);
			?>
		</p>
	<?php endif; ?>
	<label id="nep-guio-etiqueta" class="nep-guio-etiqueta" for="nep-guio"><?php esc_html_e( 'Guió (JSON, format v2)', 'noempesquen' ); ?></label>
	<textarea id="nep-guio" name="nep_guio" rows="20" spellcheck="false" aria-describedby="nep-guio-diagnostic"><?php echo esc_textarea( $guio ); ?></textarea>
	<div id="nep-guio-diagnostic" class="nep-guio-diagnostic" role="status" aria-live="polite"></div>
	<p class="nep-guio-io">
		<button type="button" class="button" id="nep-guio-exporta"><?php esc_html_e( 'Exporta', 'noempesquen' ); ?></button>
		<button type="button" class="button" id="nep-guio-importa"><?php esc_html_e( 'Importa', 'noempesquen' ); ?></button>
		<input type="file" id="nep-guio-fitxer" accept="application/json,.json" hidden tabindex="-1" aria-hidden="true">
		<span class="description"><?php esc_html_e( 'Exporta descarrega el guió de l\'editor com a fitxer JSON. Importa el posa a l\'editor sense desar-lo.', 'noempesquen' ); ?></span>
	</p>
	<p id="nep-guio-io-avis" class="nep-guio-io-avis" role="status" aria-live="polite"></p>
	<?php if ( '' === trim( $guio ) || '{}' === trim( $guio ) ) : ?>
		<p class="nep-guio-plantilla">
			<button type="button" class="button" id="nep-guio-plantilla"><?php esc_html_e( 'Nova missió des de plantilla', 'noempesquen' ); ?></button>
			<span class="description"><?php esc_html_e( 'Omple el guió amb una missió d\'exemple i un id nou a partir del títol. No desa res.', 'noempesquen' ); ?></span>
		</p>
		<p id="nep-guio-plantilla-avis" class="nep-guio-plantilla-avis" role="status" aria-live="polite"></p>
	<?php endif; ?>
	<p class="nep-guio-prova">
		<?php if ( 'auto-draft' === $post->post_status ) : ?>
			<?php esc_html_e( 'Desa l\'esborrany per poder provar la missió al simulador.', 'noempesquen' ); ?>
		<?php else : ?>
			<a class="button" href="<?php echo esc_url( add_query_arg( 'previsualitza', $post->ID, nep_url_simulador( $idioma ) ) ); ?>"><?php esc_html_e( 'Prova-la al simulador', 'noempesquen' ); ?></a>
			<span class="description"><?php esc_html_e( 'Prova el guió desat (també si és un esborrany). Desa abans els canvis.', 'noempesquen' ); ?></span>
		<?php endif; ?>
	</p>
	<?php if ( 'auto-draft' !== $post->post_status && current_user_can( 'edit_post', $post->ID ) ) : ?>
		<p class="nep-guio-duplica">
			<a class="button" href="<?php echo esc_url( nep_url_duplica_missio( $post->ID ) ); ?>"><?php esc_html_e( 'Duplica la missió', 'noempesquen' ); ?></a>
			<span class="description"><?php esc_html_e( 'Crea un esborrany amb el guió desat i un id nou.', 'noempesquen' ); ?></span>
		</p>
	<?php endif; ?>
	<?php
}

/**
 * Desa el dispositiu, el personatge i el guió de la caixa.
 *
 * Dispositiu i personatge primer: `nep_protegeix_guio_publicat` valida el guió
 * amb els desats. La publicació d'un guió invàlid ja l'atura
 * `nep_valida_missio_classica` (llegeix els mateixos camps del formulari).
 *
 * @param int $post_id Id de l'entrada.
 */
function nep_desa_caixa_guio( int $post_id ): void {
	if ( ! isset( $_POST['nep_guio_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nep_guio_nonce'] ) ), 'nep_desa_guio' ) ) {
		return;
	}
	if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) || ! current_user_can( 'nep_gestiona_missions' ) ) {
		return;
	}

	$valors = array(
		'nep_dispositiu' => array( 'pc', 'mobil' ),
		'nep_personatge' => array( 'llissa', 'remei' ),
		'nep_idioma'     => nep_idiomes_missio(),
	);
	foreach ( $valors as $clau => $permesos ) {
		$valor = isset( $_POST[ $clau ] ) ? sanitize_key( wp_unslash( $_POST[ $clau ] ) ) : '';
		if ( in_array( $valor, $permesos, true ) ) {
			update_post_meta( $post_id, $clau, $valor );
		}
	}

	if ( ! isset( $_POST['nep_guio'] ) || ! is_string( $_POST['nep_guio'] ) ) {
		return;
	}
	// El sanejament (JSON normalitzat) el fa el sanitize_callback de la meta.
	$json = wp_unslash( $_POST['nep_guio'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	// Un JSON que no es pot llegir es convertiria en '{}': es conserva el guió anterior.
	if ( null === nep_descodifica_guio( $json, $error ) ) {
		nep_desa_avis( 'guio-conservat', array( $error ) );
		return;
	}
	update_post_meta( $post_id, 'nep_guio', wp_slash( $json ) );
}
add_action( 'save_post_nep_missio', 'nep_desa_caixa_guio' );

/**
 * Encua l'editor de codi i el diagnòstic només a la pantalla d'edició de `nep_missio`.
 *
 * @param string $hook Pantalla actual.
 */
function nep_encua_editor_missio( string $hook ): void {
	if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) || ! current_user_can( 'nep_gestiona_missions' ) ) {
		return;
	}
	$pantalla = get_current_screen();
	if ( ! $pantalla || 'nep_missio' !== $pantalla->post_type ) {
		return;
	}
	$asset_file = NEP_PATH . 'build/editor-missio/index.asset.php';
	if ( ! file_exists( $asset_file ) ) {
		return;
	}
	$asset = require $asset_file;

	$code_editor = wp_enqueue_code_editor( array( 'type' => 'application/json' ) );
	$deps        = $asset['dependencies'];
	if ( false !== $code_editor ) {
		$deps[] = 'code-editor';
	}

	wp_enqueue_script( 'nep-editor-missio', NEP_URL . 'build/editor-missio/index.js', $deps, $asset['version'], true );
	wp_set_script_translations( 'nep-editor-missio', 'noempesquen' );
	wp_enqueue_style( 'nep-editor-missio', NEP_URL . 'build/editor-missio/style-index.css', array(), $asset['version'] );

	$post_id = isset( $_GET['post'] ) ? absint( wp_unslash( $_GET['post'] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Només llegeix l'id de la pantalla.
	wp_add_inline_script(
		'nep-editor-missio',
		'window.nepEditorMissio = ' . wp_json_encode(
			array(
				'codeEditor'   => $code_editor,
				// Unicitat per `(id, idioma)`: la parella de l'altre idioma no és un duplicat.
				'idsExistents' => nep_ids_missions_existents( $post_id, $post_id ? nep_idioma_de_missio( $post_id ) : 'es' ),
				'idsInclosos'  => nep_ids_missions_incloses(),
			)
		) . ';',
		'before'
	);
}
add_action( 'admin_enqueue_scripts', 'nep_encua_editor_missio' );
