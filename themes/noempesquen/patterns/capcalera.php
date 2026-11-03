<?php
/**
 * Title: Capçalera
 * Slug: noempesquen/capcalera
 * Inserter: no
 *
 * @package noempesquen
 */

defined( 'ABSPATH' ) || exit;

$nep_altre = 'ca' === nep_tema_idioma() ? 'es' : 'ca';
$nep_menu  = array(
	array( 'com-funciona', _x( 'Com funciona', 'tema', 'noempesquen' ) ),
	array( 'missions', _x( 'Missions', 'tema', 'noempesquen' ) ),
	array( 'projecte', _x( 'Sobre el projecte', 'tema', 'noempesquen' ) ),
	array( 'contacte', _x( 'Contacte', 'tema', 'noempesquen' ) ),
	array( 'compte', _x( 'El meu compte', 'tema', 'noempesquen' ) ),
);
?>
<!-- wp:html -->
<a class="nep-salta" href="#contingut"><?php echo esc_html_x( 'Salta al contingut', 'tema', 'noempesquen' ); ?></a>
<!-- /wp:html -->
<!-- wp:group {"tagName":"header","className":"nep-capcalera","layout":{"type":"default"}} -->
<header class="wp-block-group nep-capcalera">
<!-- wp:group {"className":"nep-dins nep-capcalera__dins","layout":{"type":"flex","justifyContent":"space-between","flexWrap":"wrap"}} -->
<div class="wp-block-group nep-dins nep-capcalera__dins">
<!-- wp:html -->
<a class="nep-marca" href="<?php echo esc_url( nep_tema_url( 'inici' ) ); ?>"><svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle cx="24" cy="24" r="24" fill="#fff"/><path d="M8 25c5-8 13-11 21-7l6-5v8l5 4-5 4v8l-6-5c-8 4-16 1-21-7z" fill="#0D3FA6"/><circle cx="16" cy="22" r="2.4" fill="#fff"/><path d="M38 9c0 4 0 7-2 9" fill="none" stroke="#C8201E" stroke-width="3" stroke-linecap="round"/></svg><span>No em pesquen</span></a>
<!-- /wp:html -->
<!-- wp:navigation {"overlayMenu":"mobile","overlayBackgroundColor":"port","overlayTextColor":"blanc","className":"nep-menu","layout":{"type":"flex","setCascadingProperties":true,"justifyContent":"right"}} -->
<?php foreach ( $nep_menu as $nep_item ) : ?>
<!-- wp:navigation-link <?php echo wp_json_encode( array( 'label' => esc_html( $nep_item[1] ), 'url' => esc_url_raw( nep_tema_url( $nep_item[0] ) ), 'kind' => 'custom' ) ); ?> /-->
<?php endforeach; ?>
<!-- wp:navigation-link <?php echo wp_json_encode( array( 'label' => esc_html_x( 'Entra a jugar', 'tema', 'noempesquen' ), 'url' => esc_url_raw( nep_tema_url( 'simulador' ) ), 'kind' => 'custom', 'className' => 'nep-menu__joc' ) ); ?> /-->
<!-- /wp:navigation -->
<!-- wp:html -->
<a class="nep-btn nep-btn--lot nep-btn--petit nep-capcalera__joc" href="<?php echo esc_url( nep_tema_url( 'simulador' ) ); ?>"><?php echo esc_html_x( 'Entra a jugar', 'tema', 'noempesquen' ); ?></a>
<!-- /wp:html -->
<!-- wp:html -->
<nav class="nep-idioma" aria-label="<?php echo esc_attr_x( 'Idioma', 'tema', 'noempesquen' ); ?>"><a class="nep-idioma__enllac" href="<?php echo esc_url( nep_tema_url( nep_tema_clau_actual(), $nep_altre ) ); ?>" hreflang="<?php echo esc_attr( $nep_altre ); ?>" lang="<?php echo esc_attr( $nep_altre ); ?>"><?php echo 'ca' === $nep_altre ? 'Català' : 'Castellano'; ?></a></nav>
<!-- /wp:html -->
</div>
<!-- /wp:group -->
</header>
<!-- /wp:group -->
<!-- wp:html -->
<div class="nep-corda" aria-hidden="true"></div>
<!-- /wp:html -->
<?php
/*
 * Suggeriment d'idioma (només ES, portada i simulador): ocult fins que el JS veu un
 * navegador en català i que no s'ha tancat abans. En català (lang="ca") perquè és
 * per a qui el parla, com el selector.
 */
if ( 'es' === nep_tema_idioma() && ( is_front_page() || 'simulador' === nep_tema_clau_actual() ) ) :
	?>
<!-- wp:html -->
<aside class="nep-suggeriment" lang="ca" aria-label="Idioma" hidden><div class="nep-dins nep-suggeriment__dins"><p class="nep-suggeriment__text">Aquest web també és en català.</p><a class="nep-suggeriment__enllac" href="<?php echo esc_url( nep_tema_url( nep_tema_clau_actual(), 'ca' ) ); ?>" hreflang="ca">Canvia al català</a><button type="button" class="nep-suggeriment__tanca">Tanca</button></div></aside>
<!-- /wp:html -->
<?php endif; ?>
