<?php
/**
 * Idioma per petició: locale de WordPress, helpers i enllaços.
 *
 * Com es comprova `ca`: les pàgines `/ca/…` encara no existeixen (T09c); mentrestant
 * ho cobreix IdiomaNucliTest (URIs simulades). Quan existeixin:
 * `curl -s http://localhost:8888/ca/ | grep -o '<html[^>]*lang="[^"]*"'` ha de donar `lang="ca"`.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/idioma-nucli.php';

/**
 * Indica si la petició actual és REST o admin-ajax.
 *
 * Es fa per la URI perquè `pre_determine_locale` pot córrer abans que es defineixi REST_REQUEST.
 *
 * @return bool
 */
function nep_es_peticio_api(): bool {
	if ( wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return true;
	}
	$uri  = isset( $_SERVER['REQUEST_URI'] ) ? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) : '/'; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Només es compara.
	$base = (string) wp_parse_url( home_url(), PHP_URL_PATH );
	return nep_es_ruta_rest( $uri, $base, rest_get_url_prefix() );
}

/**
 * Idioma de la petició actual.
 *
 * @return string `es`|`ca`.
 */
function nep_idioma_actual(): string {
	$uri  = isset( $_SERVER['REQUEST_URI'] ) ? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) : '/'; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Només es compara.
	$base = (string) wp_parse_url( home_url(), PHP_URL_PATH );
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Només tria l'idioma (llista blanca).
	$param     = isset( $_GET['lang'] ) ? wp_unslash( $_GET['lang'] ) : null; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Llista blanca.
	$capcalera = isset( $_SERVER['HTTP_X_NEP_LANG'] ) ? (string) wp_unslash( $_SERVER['HTTP_X_NEP_LANG'] ) : null; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Llista blanca.
	return nep_idioma_de_peticio( $uri, $base, nep_es_peticio_api(), $param, $capcalera );
}

/**
 * URL del lloc en un idioma.
 *
 * @param string      $ruta   Ruta (p. ex. `/simulador/`).
 * @param string|null $idioma `es`|`ca`; per defecte, el de la petició.
 * @return string
 */
function nep_url( string $ruta, ?string $idioma = null ): string {
	$idioma = nep_idioma_valid( $idioma ) ?? nep_idioma_actual();
	return home_url( nep_ruta_idioma( $ruta, $idioma ) );
}

/**
 * `<html lang>` amb el locale complet (`es-ES`, `ca`): el paquet es_ES tradueix
 * `html_lang_attribute` per `es`, i SEO (hreflang) vol `es-ES`.
 */
add_filter(
	'language_attributes',
	static function ( $sortida, $doctype ) {
		if ( 'html' !== $doctype ) {
			return $sortida;
		}
		return (string) preg_replace( '/\blang="[^"]*"/', 'lang="' . esc_attr( nep_lang_html( determine_locale() ) ) . '"', (string) $sortida );
	},
	10,
	2
);

/**
 * Locale per petició. L'administració (fora d'admin-ajax), el login i WP-CLI
 * segueixen el locale de l'usuari o del lloc (`es_ES`). Amb `?_locale=user` (editor
 * de blocs) i sense `lang`/`X-Nep-Lang`, també es respecta el locale de l'usuari.
 */
add_filter(
	'pre_determine_locale',
	static function ( $locale ) {
		if ( ! isset( $_SERVER['REQUEST_URI'] ) || ( defined( 'WP_CLI' ) && WP_CLI ) ) {
			return $locale;
		}
		if ( ( is_admin() && ! wp_doing_ajax() ) || ( isset( $GLOBALS['pagenow'] ) && 'wp-login.php' === $GLOBALS['pagenow'] ) ) {
			return $locale;
		}
		// phpcs:disable WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Només es compara.
		$locale_param = isset( $_GET['_locale'] ) ? wp_unslash( $_GET['_locale'] ) : null;
		$lang         = isset( $_GET['lang'] ) ? wp_unslash( $_GET['lang'] ) : null;
		// phpcs:enable
		$capcalera = isset( $_SERVER['HTTP_X_NEP_LANG'] ) ? (string) wp_unslash( $_SERVER['HTTP_X_NEP_LANG'] ) : null; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Només es compara.
		if ( nep_respecta_locale_usuari( $locale_param, $lang, $capcalera ) ) {
			return $locale;
		}
		return nep_locale_idioma( nep_idioma_actual() );
	}
);

/**
 * Enllaç a una pàgina del lloc (`compte`, `contacte`, `projecte`, `simulador`)
 * en un idioma: `/cuenta/` o `/ca/compte/`.
 *
 * @param string      $clau   Clau de la pàgina.
 * @param string|null $idioma `es`|`ca`; per defecte, el de la petició.
 * @param string      $resta  Cua opcional (consulta o àncora), p. ex. `?verifica=…`.
 * @return string
 */
function nep_url_pagina( string $clau, ?string $idioma = null, string $resta = '' ): string {
	$idioma = nep_idioma_valid( $idioma ) ?? nep_idioma_actual();
	return nep_url( nep_ruta_pagina( $clau, $idioma ), $idioma ) . $resta;
}

/**
 * Executa una funció amb el locale d'un idioma (correus, textos fora de petició)
 * i restaura el locale previ, passi el que passi.
 *
 * @param string   $idioma `es`|`ca`.
 * @param callable $fer    Funció a executar.
 * @return mixed Resultat de la funció.
 */
function nep_amb_idioma( string $idioma, callable $fer ) {
	$canviat = switch_to_locale( nep_locale_idioma( nep_idioma_valid( $idioma ) ?? 'ca' ) );
	try {
		return $fer();
	} finally {
		if ( $canviat ) {
			restore_previous_locale();
		}
	}
}

/**
 * Carrega les traduccions del connector (`languages/noempesquen-<locale>.mo`).
 * Sense WP-CLI ni paquets d'idioma a la producció: el `.mo` viatja al zip. El
 * català és l'msgid i no necessita fitxer.
 */
add_filter(
	'load_textdomain_mofile',
	static function ( $mofile, $domini ) {
		if ( 'noempesquen' !== $domini || file_exists( $mofile ) ) {
			return $mofile;
		}
		return NEP_PATH . 'languages/' . basename( (string) $mofile );
	},
	10,
	2
);
add_action(
	'init',
	static function () {
		load_plugin_textdomain( 'noempesquen', false, dirname( plugin_basename( NEP_PATH . 'noempesquen-core.php' ) ) . '/languages' );
	},
	0
);

/**
 * `Vary: X-Nep-Lang` a les respostes REST del connector: els missatges depenen
 * de la capçalera `X-Nep-Lang` (o de `?lang=`, que ja és a la URL).
 */
add_filter(
	'rest_post_dispatch',
	static function ( $resposta, $servidor, $peticio ) {
		if ( $resposta instanceof WP_HTTP_Response && $peticio instanceof WP_REST_Request && str_starts_with( $peticio->get_route(), '/noempesquen/v1/' ) ) {
			$resposta->header( 'Vary', 'X-Nep-Lang', false );
		}
		return $resposta;
	},
	10,
	3
);
