<?php
/**
 * Pantalla «Estadístiques» (submenú de Missions): partides, estrelles
 * mitjanes i decisió més triada per missió i període. Només lectura.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

/** Períodes que es poden triar (dies). */
const NEP_PERIODES = array( 7, 30, 90 );

add_action(
	'admin_menu',
	static function () {
		add_submenu_page(
			'edit.php?post_type=nep_missio',
			__( 'Estadístiques', 'noempesquen' ),
			__( 'Estadístiques', 'noempesquen' ),
			'nep_veu_estadistiques',
			'nep-estadistiques',
			'nep_pinta_estadistiques'
		);
	}
);

/**
 * Files agregades del període (missió × estrelles × decisió).
 *
 * @param int $dies Dies del període (inclou avui).
 * @return array[]|null Files, o null si la consulta falla.
 */
function nep_files_periode( int $dies ): ?array {
	global $wpdb;
	$taula  = nep_taula_resultats();
	$wpdb->last_error = '';
	$des_de = gmdate( 'Y-m-d', time() - ( $dies - 1 ) * DAY_IN_SECONDS );
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Lectura agregada de la taula pròpia.
	$files = $wpdb->get_results(
		$wpdb->prepare(
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Nom de taula intern.
			"SELECT missio, estrelles, decisio, SUM(n) AS n FROM {$taula} WHERE dia >= %s GROUP BY missio, estrelles, decisio",
			$des_de
		),
		ARRAY_A
	);
	if ( '' !== $wpdb->last_error || ! is_array( $files ) ) {
		return null;
	}
	return $files;
}

/**
 * Pinta la pantalla d'estadístiques.
 */
function nep_pinta_estadistiques(): void {
	if ( ! current_user_can( 'nep_veu_estadistiques' ) ) {
		wp_die( esc_html__( 'No tens permís per veure aquesta pàgina.', 'noempesquen' ), 403 );
	}

	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Només lectura: el període és un filtre.
	$dies = isset( $_GET['periode'] ) ? absint( wp_unslash( $_GET['periode'] ) ) : 30;
	if ( ! in_array( $dies, NEP_PERIODES, true ) ) {
		$dies = 30;
	}

	$missions = nep_missions_jugables();
	$files    = nep_files_periode( $dies );
	$error_bd = null === $files;
	$agregats = nep_agrega_resultats( $files ?? array(), NEP_RESULTATS_K );
	$ids      = array_unique( array_merge( array_keys( $missions ), array_keys( $agregats ) ) );
	$insuf    = $error_bd
		? __( 'No s\'ha pogut llegir la taula d\'estadístiques', 'noempesquen' )
		: __( 'Dades insuficients (menys de 10 partides)', 'noempesquen' );
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Estadístiques', 'noempesquen' ); ?></h1>
		<?php if ( $error_bd ) : ?>
			<div class="notice notice-error inline"><p><?php esc_html_e( 'No s\'ha pogut llegir la taula d\'estadístiques.', 'noempesquen' ); ?></p></div>
		<?php endif; ?>
		<p><strong><?php esc_html_e( 'Dades indicatives.', 'noempesquen' ); ?></strong>
			<?php esc_html_e( 'Recompte anònim de partides acabades: no es desa cap dada de qui juga. Les missions amb menys de 10 partides en el període no mostren xifres.', 'noempesquen' ); ?></p>

		<form method="get">
			<input type="hidden" name="post_type" value="nep_missio">
			<input type="hidden" name="page" value="nep-estadistiques">
			<label for="nep-periode"><?php esc_html_e( 'Període', 'noempesquen' ); ?></label>
			<select id="nep-periode" name="periode">
				<?php foreach ( NEP_PERIODES as $opcio ) : ?>
					<option value="<?php echo esc_attr( (string) $opcio ); ?>" <?php selected( $dies, $opcio ); ?>>
						<?php
						/* translators: %d: nombre de dies. */
						echo esc_html( sprintf( __( 'Darrers %d dies', 'noempesquen' ), $opcio ) );
						?>
					</option>
				<?php endforeach; ?>
			</select>
			<?php submit_button( __( 'Mostra', 'noempesquen' ), 'secondary', '', false ); ?>
		</form>

		<table class="widefat striped nep-estadistiques">
			<caption>
				<?php
				/* translators: %d: nombre de dies. */
				echo esc_html( sprintf( __( 'Resultats per missió dels darrers %d dies', 'noempesquen' ), $dies ) );
				?>
			</caption>
			<thead>
				<tr>
					<th scope="col"><?php esc_html_e( 'Missió', 'noempesquen' ); ?></th>
					<th scope="col"><?php esc_html_e( 'Partides', 'noempesquen' ); ?></th>
					<th scope="col"><?php esc_html_e( 'Estrelles mitjanes', 'noempesquen' ); ?></th>
					<th scope="col"><?php esc_html_e( 'Decisió més triada', 'noempesquen' ); ?></th>
				</tr>
			</thead>
			<tbody>
				<?php foreach ( $ids as $id ) : ?>
					<?php
					$guio  = $missions[ $id ] ?? null;
					$titol = is_array( $guio ) && isset( $guio['titol'] ) && is_string( $guio['titol'] ) ? $guio['titol'] : $id;
					$a     = $agregats[ $id ] ?? null;
					?>
					<tr>
						<th scope="row">
							<?php echo esc_html( $titol ); ?>
							<br><code><?php echo esc_html( (string) $id ); ?></code>
						</th>
						<?php if ( ! $a || ! $a['suficient'] ) : ?>
							<td colspan="3"><?php echo esc_html( $insuf ); ?></td>
						<?php else : ?>
							<td><?php echo esc_html( number_format_i18n( $a['partides'] ) ); ?></td>
							<td><?php echo esc_html( number_format_i18n( $a['estrelles'], 2 ) ); ?></td>
							<td>
								<?php
								if ( null === $a['decisio'] ) {
									esc_html_e( 'Cap decisió', 'noempesquen' );
								} else {
									$text = '';
									foreach ( (array) ( $guio['decisio']['opcions'] ?? array() ) as $o ) {
										if ( is_array( $o ) && ( $o['id'] ?? null ) === $a['decisio'] && is_string( $o['text'] ?? null ) ) {
											$text = $o['text'];
										}
									}
									echo esc_html( sprintf( '«%s» %s (%d %%)', $a['decisio'], $text, $a['percentatge'] ) );
								}
								?>
							</td>
						<?php endif; ?>
					</tr>
				<?php endforeach; ?>
			</tbody>
		</table>
	</div>
	<?php
}
