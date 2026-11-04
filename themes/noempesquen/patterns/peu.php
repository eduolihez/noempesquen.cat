<?php
/**
 * Title: Peu
 * Slug: noempesquen/peu
 * Inserter: no
 *
 * @package noempesquen
 */

defined( 'ABSPATH' ) || exit;

$nep_enllacos = array(
	array( nep_tema_url( 'simulador' ), _x( 'Simulador', 'tema', 'noempesquen' ) ),
	array( nep_tema_url( 'com-funciona' ), _x( 'Com funciona', 'tema', 'noempesquen' ) ),
	array( nep_tema_url( 'missions' ), _x( 'Missions', 'tema', 'noempesquen' ) ),
	array( nep_tema_url( 'videos' ), _x( 'Vídeos', 'tema', 'noempesquen' ) ),
	array( nep_tema_url( 'projecte' ), _x( 'Sobre el projecte', 'tema', 'noempesquen' ) ),
	array( nep_tema_url( 'projecte', null, 'privacitat' ), _x( 'Privacitat', 'tema', 'noempesquen' ) ),
	array( nep_tema_url( 'contacte' ), _x( 'Contacte', 'tema', 'noempesquen' ) ),
	array( nep_tema_url( 'compte' ), _x( 'El meu compte', 'tema', 'noempesquen' ) ),
);
?>
<!-- wp:html -->
<div class="nep-corda" aria-hidden="true"></div>
<footer class="nep-peu">
<div class="nep-dins nep-peu__dins">
<div>
<p class="nep-peu__marca">No em pesquen</p>
<p class="nep-peu__text"><?php echo esc_html_x( 'Tot el que veus al simulador és inventat: les marques, els personatges i les pàgines. Cap és real.', 'tema', 'noempesquen' ); ?></p>
</div>
<ul class="nep-peu__enllacos">
<?php foreach ( $nep_enllacos as $nep_enllac ) : ?>
<li><a href="<?php echo esc_url( $nep_enllac[0] ); ?>"><?php echo esc_html( $nep_enllac[1] ); ?></a></li>
<?php endforeach; ?>
</ul>
<p class="nep-peu__petit"><?php echo esc_html_x( 'Projecte per als Premis Wapps .cat 2026/27', 'tema', 'noempesquen' ); ?></p>
</div>
</footer>
<!-- /wp:html -->
