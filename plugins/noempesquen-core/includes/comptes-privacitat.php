<?php
/**
 * Integració dels comptes de jugador amb les eines de privacitat de WordPress
 * (Eines > Exporta / Esborra dades personals).
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Registra l'exportador de dades personals.
 *
 * @param array $exportadors Exportadors registrats.
 * @return array
 */
function nep_registra_exportador( $exportadors ) {
	$exportadors['noempesquen'] = array(
		'exporter_friendly_name' => __( 'Compte del simulador', 'noempesquen' ),
		'callback'               => 'nep_exporta_dades_personals',
	);
	return $exportadors;
}
add_filter( 'wp_privacy_personal_data_exporters', 'nep_registra_exportador' );

/**
 * Registra l'esborrador de dades personals.
 *
 * @param array $esborradors Esborradors registrats.
 * @return array
 */
function nep_registra_esborrador( $esborradors ) {
	$esborradors['noempesquen'] = array(
		'eraser_friendly_name' => __( 'Compte del simulador', 'noempesquen' ),
		'callback'             => 'nep_esborra_dades_personals',
	);
	return $esborradors;
}
add_filter( 'wp_privacy_personal_data_erasers', 'nep_registra_esborrador' );

/**
 * Usuari jugador a partir d'un email, o null.
 *
 * @param string $email Email.
 * @return WP_User|null
 */
function nep_privacitat_jugador( $email ): ?WP_User {
	$usuari = is_string( $email ) ? get_user_by( 'email', $email ) : false;
	return ( $usuari && in_array( 'nep_jugador', (array) $usuari->roles, true ) ) ? $usuari : null;
}

/**
 * Exporta les dades del compte de jugador.
 *
 * @param string $email  Email de la persona.
 * @param int    $pagina Pàgina (no s'usa).
 * @return array
 */
function nep_exporta_dades_personals( $email, $pagina = 1 ) {
	$usuari = nep_privacitat_jugador( $email );
	if ( ! $usuari ) {
		return array(
			'data' => array(),
			'done' => true,
		);
	}
	$cons    = get_user_meta( $usuari->ID, 'nep_consentiment', true );
	$progres = array();
	foreach ( nep_compte_progres_desat( (int) $usuari->ID ) as $id => $estrelles ) {
		$progres[] = $id . ': ' . $estrelles;
	}
	$dades = array(
		array(
			'name'  => __( 'Correu electrònic', 'noempesquen' ),
			'value' => $usuari->user_email,
		),
		array(
			'name'  => __( 'Data de creació', 'noempesquen' ),
			'value' => gmdate( 'c', (int) strtotime( $usuari->user_registered . ' UTC' ) ),
		),
		array(
			'name'  => __( 'Versió del consentiment', 'noempesquen' ),
			'value' => is_array( $cons ) ? (string) ( $cons['versio'] ?? '' ) : '',
		),
		array(
			'name'  => __( 'Data del consentiment', 'noempesquen' ),
			'value' => is_array( $cons ) ? (string) ( $cons['data'] ?? '' ) : '',
		),
		array(
			'name'  => __( 'Progrés (missió: estrelles)', 'noempesquen' ),
			'value' => implode( ', ', $progres ),
		),
	);
	return array(
		'data' => array(
			array(
				'group_id'    => 'nep-compte',
				'group_label' => __( 'Compte del simulador', 'noempesquen' ),
				'item_id'     => 'nep-compte-' . $usuari->ID,
				'data'        => $dades,
			),
		),
		'done' => true,
	);
}

/**
 * Esborra les metes del compte i tanca les sessions. No esborra l'usuari: la fila
 * ja la gestiona l'esborrador d'usuaris del nucli de WordPress.
 *
 * @param string $email  Email de la persona.
 * @param int    $pagina Pàgina (no s'usa).
 * @return array
 */
function nep_esborra_dades_personals( $email, $pagina = 1 ) {
	$usuari   = nep_privacitat_jugador( $email );
	$esborrat = false;
	if ( $usuari ) {
		$esborrat = nep_esborra_metes_compte( (int) $usuari->ID );
		WP_Session_Tokens::get_instance( (int) $usuari->ID )->destroy_all();
	}
	return array(
		'items_removed'  => $esborrat,
		'items_retained' => false,
		'messages'       => array(),
		'done'           => true,
	);
}

/**
 * Elimina les metes nep_* d'un usuari (idempotent). També s'executa a delete_user.
 *
 * @param int $id Usuari.
 * @return bool Si n'hi havia alguna.
 */
function nep_esborra_metes_compte( $id ): bool {
	$id = (int) $id;
	$n  = false;
	foreach ( array( 'nep_progres', 'nep_consentiment' ) as $clau ) {
		if ( metadata_exists( 'user', $id, $clau ) ) {
			delete_user_meta( $id, $clau );
			$n = true;
		}
	}
	return $n;
}
add_action( 'delete_user', 'nep_esborra_metes_compte' );
