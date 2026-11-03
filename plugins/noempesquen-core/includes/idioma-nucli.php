<?php
/**
 * Funcions pures de l'idioma per petició (sense WordPress).
 *
 * L'idioma només surt de l'URL: `/` → castellà (`es`), `/ca/…` → català (`ca`).
 * Fora de les pàgines (REST, admin-ajax), de `?lang=` o de la capçalera `X-Nep-Lang`.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Idiomes del lloc; el primer és el de l'arrel.
 *
 * @return string[]
 */
function nep_idiomes(): array {
	return array( 'es', 'ca' );
}

/**
 * Valida un idioma contra la llista blanca.
 *
 * @param mixed $valor Valor rebut (paràmetre, capçalera...).
 * @return string|null Idioma vàlid o null.
 */
function nep_idioma_valid( $valor ): ?string {
	if ( ! is_string( $valor ) ) {
		return null;
	}
	$valor = strtolower( trim( $valor ) );
	return in_array( $valor, nep_idiomes(), true ) ? $valor : null;
}

/**
 * Ruta de la petició relativa a la base del lloc (sempre comença per `/`).
 *
 * @param string $uri  REQUEST_URI.
 * @param string $base Ruta de home_url() (p. ex. `/` o `/wp`).
 * @return string
 */
function nep_ruta_relativa( string $uri, string $base = '/' ): string {
	$ruta = parse_url( $uri, PHP_URL_PATH ); // phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url -- Funció pura, sense WordPress.
	$ruta = is_string( $ruta ) && '' !== $ruta ? $ruta : '/';
	$base = rtrim( $base, '/' );
	if ( '' !== $base && ( $ruta === $base || str_starts_with( $ruta, $base . '/' ) ) ) {
		$ruta = substr( $ruta, strlen( $base ) );
	}
	return '' === $ruta ? '/' : $ruta;
}

/**
 * Idioma segons la ruta: `ca` si comença pel segment `/ca`, si no `es`.
 *
 * A propòsit, la comparació és literal: `/CA/…` i rutes amb %-encoding
 * (`/%63a/…`) donen `es` (les URLs canòniques catalanes són sempre `/ca/`).
 *
 * @param string $uri  REQUEST_URI.
 * @param string $base Ruta de home_url().
 * @return string `es`|`ca`.
 */
function nep_idioma_de_ruta( string $uri, string $base = '/' ): string {
	$ruta = nep_ruta_relativa( $uri, $base );
	return ( '/ca' === $ruta || str_starts_with( $ruta, '/ca/' ) ) ? 'ca' : 'es';
}

/**
 * Indica si la URI és de l'API REST (`/wp-json/…` o `?rest_route=`).
 *
 * @param string $uri         REQUEST_URI.
 * @param string $base        Ruta de home_url().
 * @param string $prefix_rest Prefix de rest_get_url_prefix().
 * @return bool
 */
function nep_es_ruta_rest( string $uri, string $base = '/', string $prefix_rest = 'wp-json' ): bool {
	$ruta   = nep_ruta_relativa( $uri, $base );
	$prefix = '/' . trim( $prefix_rest, '/' );
	if ( $ruta === $prefix || str_starts_with( $ruta, $prefix . '/' ) ) {
		return true;
	}
	$consulta = parse_url( $uri, PHP_URL_QUERY ); // phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url -- Funció pura, sense WordPress.
	if ( ! is_string( $consulta ) ) {
		return false;
	}
	parse_str( $consulta, $params );
	return isset( $params['rest_route'] );
}

/**
 * Idioma d'una petició.
 *
 * A les pàgines mana la ruta; a REST i admin-ajax, `?lang=` i després `X-Nep-Lang`
 * (llista blanca), i si no n'hi ha, `es`.
 *
 * @param string      $uri       REQUEST_URI.
 * @param string      $base      Ruta de home_url().
 * @param bool        $es_api    Petició REST o admin-ajax.
 * @param mixed       $param     Valor de `?lang=`.
 * @param string|null $capcalera Valor de la capçalera `X-Nep-Lang`.
 * @return string `es`|`ca`.
 */
function nep_idioma_de_peticio( string $uri, string $base, bool $es_api, $param = null, ?string $capcalera = null ): string {
	if ( ! $es_api ) {
		return nep_idioma_de_ruta( $uri, $base );
	}
	return nep_idioma_valid( $param ) ?? nep_idioma_valid( $capcalera ) ?? 'es';
}

/**
 * Locale de WordPress per a un idioma.
 *
 * @param string $idioma `es`|`ca`.
 * @return string
 */
function nep_locale_idioma( string $idioma ): string {
	return 'ca' === $idioma ? 'ca' : 'es_ES';
}

/**
 * Ruta amb el prefix de l'idioma: `es` → `/ruta/`, `ca` → `/ca/ruta/`.
 *
 * @param string $ruta   Ruta del lloc (amb o sense `/` inicial).
 * @param string $idioma `es`|`ca`.
 * @return string
 */
function nep_ruta_idioma( string $ruta, string $idioma ): string {
	$ruta = '/' . ltrim( $ruta, '/' );
	return 'ca' === $idioma ? '/ca' . $ruta : $ruta;
}

/**
 * Indica si cal respectar el locale de l'usuari: `?_locale=user` (editor de
 * blocs) sense `?lang=` ni `X-Nep-Lang`.
 *
 * @param mixed       $locale_param Valor de `?_locale=`.
 * @param mixed       $lang         Valor de `?lang=`.
 * @param string|null $capcalera    Valor de la capçalera `X-Nep-Lang`.
 * @return bool
 */
function nep_respecta_locale_usuari( $locale_param, $lang = null, ?string $capcalera = null ): bool {
	return 'user' === $locale_param && null === $lang && null === $capcalera;
}

/**
 * Valor de `<html lang>` per a un locale de WordPress (`es_ES` → `es-ES`).
 *
 * @param string $locale Locale.
 * @return string
 */
function nep_lang_html( string $locale ): string {
	return str_replace( '_', '-', $locale );
}

/**
 * Ruta (sense prefix d'idioma) d'una pàgina del lloc segons l'idioma.
 *
 * Claus: `compte`, `contacte`, `projecte`, `simulador`. Una clau desconeguda
 * dóna el simulador.
 *
 * @param string $clau   Clau de la pàgina.
 * @param string $idioma `es`|`ca`.
 * @return string Ruta amb barres inicial i final.
 */
function nep_ruta_pagina( string $clau, string $idioma ): string {
	$rutes = array(
		'es' => array(
			'compte'    => '/cuenta/',
			'contacte'  => '/contacto/',
			'projecte'  => '/sobre-el-proyecto/',
			'simulador' => '/simulador/',
		),
		'ca' => array(
			'compte'    => '/compte/',
			'contacte'  => '/contacte/',
			'projecte'  => '/sobre-el-projecte/',
			'simulador' => '/simulador/',
		),
	);
	$taula = $rutes['ca' === $idioma ? 'ca' : 'es'];
	return $taula[ $clau ] ?? $taula['simulador'];
}

/**
 * Idioma d'un compte a partir de la seva meta `nep_idioma`: sense meta o amb un
 * valor no vàlid, `ca` (els comptes anteriors al canvi d'idiomes eren catalans).
 *
 * @param mixed $meta Valor de la meta.
 * @return string `es`|`ca`.
 */
function nep_idioma_de_meta_usuari( $meta ): string {
	return nep_idioma_valid( $meta ) ?? 'ca';
}
