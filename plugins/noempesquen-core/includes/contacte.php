<?php
/**
 * Formulari de contacte: ruta REST POST noempesquen/v1/contacte.
 *
 * - No es desa res a la base de dades: el missatge només surt per correu.
 * - Límit per IP (hash HMAC, mai en clar): 3 enviaments per hora i 10 per dia.
 * - Camp trampa `web`: si ve ple es respon 200 sense enviar res.
 * - El nonce (wp_rest) el demana el client a admin-ajax (rest-nonce), com al
 *   compte; no s'incrusta a l'HTML per no trencar la memòria cau.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/contacte-nucli.php';

const NEP_CONTACTE_LIMIT_HORA = 3;
const NEP_CONTACTE_LIMIT_DIA  = 10;

add_action(
	'rest_api_init',
	static function () {
		register_rest_route(
			'noempesquen/v1',
			'/contacte',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				// Formulari públic: el protegeixen validació, límit per IP i camp trampa.
				'permission_callback' => '__return_true',
				'callback'            => 'nep_rest_contacte',
			)
		);
	}
);

// Sense cau en cap resposta de la ruta.
add_filter(
	'rest_post_dispatch',
	static function ( $resposta, $server, $request ) {
		if ( $resposta instanceof WP_HTTP_Response && $request instanceof WP_REST_Request && '/noempesquen/v1/contacte' === $request->get_route() ) {
			$resposta->header( 'Cache-Control', 'no-store' );
		}
		return $resposta;
	},
	10,
	3
);

/**
 * Clau de transient d'una finestra de límit per a la IP actual (hash, no IP).
 *
 * @param string $finestra 'h' (hora) o 'd' (dia).
 * @return string
 */
function nep_contacte_clau_limit( string $finestra ): string {
	$hash = hash_hmac( 'sha256', 'contacte|' . nep_ip_client(), wp_salt( 'auth' ) );
	return 'nep_ct_' . $finestra . '_' . substr( $hash, 0, 32 );
}

/**
 * Cert si la finestra ja ha arribat al màxim.
 *
 * @param string $clau Transient.
 * @param int    $max  Màxim d'enviaments.
 * @return bool
 */
function nep_contacte_limit_ple( string $clau, int $max ): bool {
	$estat = get_transient( $clau );
	return is_array( $estat ) && (int) $estat['n'] >= $max;
}

/**
 * Suma un enviament a la finestra (la caducitat no s'allarga).
 *
 * @param string $clau   Transient.
 * @param int    $durada Segons de la finestra.
 */
function nep_contacte_suma( string $clau, int $durada ): void {
	$ara   = time();
	$estat = get_transient( $clau );
	if ( ! is_array( $estat ) || (int) $estat['fi'] <= $ara ) {
		$estat = array(
			'n'  => 0,
			'fi' => $ara + $durada,
		);
	}
	++$estat['n'];
	set_transient( $clau, $estat, max( 1, (int) $estat['fi'] - $ara ) );
}

/**
 * Gestiona l'enviament del formulari.
 *
 * @param WP_REST_Request $request Petició.
 * @return WP_REST_Response
 */
function nep_rest_contacte( WP_REST_Request $request ) {
	$cos = $request->get_json_params();
	$cos = is_array( $cos ) ? $cos : array();

	// Robot: es respon com a un enviament correcte i no s'envia res.
	if ( nep_contacte_es_robot( $cos ) ) {
		return new WP_REST_Response( array( 'ok' => true ), 200 );
	}

	$text = static function ( string $camp ) use ( $cos ): string {
		return isset( $cos[ $camp ] ) && is_string( $cos[ $camp ] ) ? $cos[ $camp ] : '';
	};
	$brut = array(
		'nom'        => sanitize_text_field( $text( 'nom' ) ),
		'correu'     => sanitize_text_field( $text( 'correu' ) ),
		'assumpte'   => sanitize_text_field( $text( 'assumpte' ) ),
		'missatge'   => sanitize_textarea_field( $text( 'missatge' ) ),
		'privacitat' => $cos['privacitat'] ?? false,
	);

	$resultat = nep_contacte_valida( $brut );
	if ( $resultat['valid'] ) {
		$correu = sanitize_email( $resultat['dades']['correu'] );
		if ( $correu !== $resultat['dades']['correu'] || ! is_email( $correu ) ) {
			$resultat['valid']            = false;
			$resultat['errors']['correu'] = 'Escriu un correu vàlid, per exemple nom@exemple.cat.';
		}
	}
	if ( ! $resultat['valid'] ) {
		return new WP_REST_Response(
			array(
				'ok'     => false,
				'errors' => $resultat['errors'],
			),
			422
		);
	}

	$clau_h = nep_contacte_clau_limit( 'h' );
	$clau_d = nep_contacte_clau_limit( 'd' );
	if ( nep_contacte_limit_ple( $clau_h, NEP_CONTACTE_LIMIT_HORA ) || nep_contacte_limit_ple( $clau_d, NEP_CONTACTE_LIMIT_DIA ) ) {
		return new WP_REST_Response(
			array(
				'ok'      => false,
				'message' => 'Has enviat massa missatges. Torna-ho a provar una mica més tard.',
			),
			429
		);
	}
	nep_contacte_suma( $clau_h, HOUR_IN_SECONDS );
	nep_contacte_suma( $clau_d, DAY_IN_SECONDS );

	$dades = $resultat['dades'];
	/**
	 * Destinatari del formulari de contacte.
	 *
	 * @param string $destinatari Per defecte, el correu de l'administrador.
	 */
	$destinatari = (string) apply_filters( 'nep_contacte_destinatari', get_option( 'admin_email' ) );

	$enviat = wp_mail(
		$destinatari,
		nep_contacte_assumpte_correu( $dades ),
		nep_contacte_cos_correu( $dades ),
		nep_contacte_capcaleres( $dades['correu'] )
	);
	if ( ! $enviat ) {
		return new WP_REST_Response(
			array(
				'ok'      => false,
				'message' => "No s'ha pogut enviar el missatge. Torna-ho a provar d'aquí una estona.",
			),
			500
		);
	}
	return new WP_REST_Response( array( 'ok' => true ), 200 );
}
