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
	array( 'videos', _x( 'Vídeos', 'tema', 'noempesquen' ) ),
	array( 'projecte', _x( 'Sobre el projecte', 'tema', 'noempesquen' ) ),
	array( 'contacte', _x( 'Contacte', 'tema', 'noempesquen' ) ),
);
$nep_actual = nep_tema_idioma();
$nep_noms   = array(
	'ca' => array( 'CA', 'Català' ),
	'es' => array( 'ES', 'Castellano' ),
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
<!-- wp:navigation <?php
echo wp_json_encode(
	array(
		'overlayMenu'            => 'mobile',
		'overlayBackgroundColor' => 'port',
		'overlayTextColor'       => 'blanc',
		'className'              => 'nep-menu',
		'ariaLabel'              => _x( 'Navegació principal', 'tema', 'noempesquen' ),
		'layout'                 => array(
			'type'                  => 'flex',
			'setCascadingProperties' => true,
			'justifyContent'        => 'right',
		),
	)
); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON de bloque.
?> -->
<?php foreach ( $nep_menu as $nep_item ) : ?>
<!-- wp:navigation-link <?php echo wp_json_encode( array( 'label' => esc_html( $nep_item[1] ), 'url' => esc_url_raw( nep_tema_url( $nep_item[0] ) ), 'kind' => 'custom' ) ); ?> /-->
<?php endforeach; ?>
<!-- wp:navigation-link <?php echo wp_json_encode( array( 'label' => esc_html_x( 'El meu compte', 'tema', 'noempesquen' ), 'url' => esc_url_raw( nep_tema_url( 'compte' ) ), 'kind' => 'custom', 'className' => 'nep-menu__joc' ) ); ?> /-->
<!-- wp:navigation-link <?php echo wp_json_encode( array( 'label' => esc_html_x( 'Entra a jugar', 'tema', 'noempesquen' ), 'url' => esc_url_raw( nep_tema_url( 'simulador' ) ), 'kind' => 'custom', 'className' => 'nep-menu__joc' ) ); ?> /-->
<!-- /wp:navigation -->
<!-- wp:html -->
<div class="nep-capcalera__dreta">
<a class="nep-capcalera__compte" href="<?php echo esc_url( nep_tema_url( 'compte' ) ); ?>"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span class="nep-capcalera__compte-text"><?php echo esc_html_x( 'El meu compte', 'tema', 'noempesquen' ); ?></span></a>
<nav class="nep-idioma" aria-label="<?php echo esc_attr_x( 'Idioma', 'tema', 'noempesquen' ); ?>">
<details class="nep-idioma__desplegable">
<summary class="nep-idioma__boto"><span class="nep-idioma__curt"><?php echo esc_html( $nep_noms[ $nep_actual ][0] ); ?></span><span class="nep-idioma__llarg"><?php echo esc_html( $nep_noms[ $nep_actual ][1] ); ?></span><svg class="nep-idioma__fletxa" viewBox="0 0 12 8" aria-hidden="true" focusable="false"><path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></summary>
<ul class="nep-idioma__llista">
<?php foreach ( array( 'ca', 'es' ) as $nep_l ) : ?>
<li><a class="nep-idioma__enllac" href="<?php echo esc_url( nep_tema_url_idioma( $nep_l ) ); ?>" hreflang="<?php echo esc_attr( $nep_l ); ?>" lang="<?php echo esc_attr( $nep_l ); ?>"<?php echo $nep_l === $nep_actual ? ' aria-current="true"' : ''; ?>><?php echo esc_html( $nep_noms[ $nep_l ][1] ); ?></a></li>
<?php endforeach; ?>
</ul>
</details>
</nav>
</div>
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
