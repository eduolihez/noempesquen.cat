<?php
/**
 * Endpoints REST públics del simulador (namespace noempesquen/v1).
 * Res d'aquí guarda dades personals: només agregats anònims.
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'rest_api_init',
	static function () {
		// Llista de missions publicades (lectura pública).
		register_rest_route(
			'noempesquen/v1',
			'/missions',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => 'nep_rest_missions',
			)
		);
	}
);

/**
 * Retorna les missions publicades amb el seu guió.
 *
 * @return WP_REST_Response
 */
function nep_rest_missions(): WP_REST_Response {
	$posts = get_posts(
		array(
			'post_type'      => 'nep_missio',
			'post_status'    => 'publish',
			'posts_per_page' => 50,
			'orderby'        => 'menu_order',
			'order'          => 'ASC',
		)
	);

	$data = array_map(
		static fn( WP_Post $p ) => array(
			'id'          => $p->ID,
			'titol'       => get_the_title( $p ),
			'resum'       => get_the_excerpt( $p ),
			'dispositiu'  => get_post_meta( $p->ID, 'nep_dispositiu', true ),
			'personatge'  => get_post_meta( $p->ID, 'nep_personatge', true ),
			'guio'        => json_decode( get_post_meta( $p->ID, 'nep_guio', true ) ?: '{}', true ),
		),
		$posts
	);

	return new WP_REST_Response( $data, 200 );
}
