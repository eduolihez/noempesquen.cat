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
					'auth_callback'     => static fn() => current_user_can( 'edit_posts' ),
				)
			);
		}
	}
);

/**
 * Només accepta JSON vàlid al guió.
 *
 * @param mixed $value Valor rebut.
 * @return string JSON normalitzat o '{}' si no és vàlid.
 */
function nep_sanitize_guio( $value ): string {
	$decoded = json_decode( (string) $value, true );
	return is_array( $decoded ) ? wp_json_encode( $decoded ) : '{}';
}
