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

		// Guió d'una missió (també esborrany) per provar-la: només qui la pot gestionar.
		register_rest_route(
			'noempesquen/v1',
			'/previsualitza/(?P<id>\d+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => static fn( WP_REST_Request $request ) => current_user_can( 'edit_post', (int) $request['id'] ) && current_user_can( 'nep_gestiona_missions' ),
				'callback'            => 'nep_rest_previsualitza',
				'args'                => array(
					'id' => array(
						'type'     => 'integer',
						'required' => true,
					),
				),
			)
		);
	}
);

/**
 * Retorna el guió desat d'una missió, sigui quin sigui l'estat.
 *
 * @param WP_REST_Request $request Petició.
 * @return WP_REST_Response|WP_Error
 */
function nep_rest_previsualitza( WP_REST_Request $request ) {
	$id = (int) $request['id'];
	if ( 'nep_missio' !== get_post_type( $id ) ) {
		return new WP_Error( 'nep_no_trobada', __( 'No s\'ha trobat la missió.', 'noempesquen' ), array( 'status' => 404 ) );
	}
	$guio = nep_descodifica_guio( (string) get_post_meta( $id, 'nep_guio', true ) );
	return new WP_REST_Response(
		array(
			'id'    => $id,
			'estat' => get_post_status( $id ),
			'guio'  => $guio ?? new stdClass(),
		),
		200
	);
}

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
