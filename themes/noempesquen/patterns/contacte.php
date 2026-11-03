<?php
/**
 * Title: Contacte
 * Slug: noempesquen/contacte
 * Inserter: no
 *
 * @package noempesquen
 */

defined( 'ABSPATH' ) || exit;
?>
<!-- wp:html -->
<section class="nep-rotul" aria-labelledby="nep-titol">
<div class="nep-dins nep-rotul__dins">
<h1 id="nep-titol"><?php echo esc_html_x( 'Contacte', 'tema', 'noempesquen' ); ?></h1>
<p><?php echo esc_html_x( 'Un dubte, un suggeriment o un error que has trobat?', 'tema', 'noempesquen' ); ?> <span style="white-space:nowrap"><?php echo esc_html_x( 'Escriu-nos.', 'tema', 'noempesquen' ); ?></span></p>
</div>
</section>
<div class="nep-corda" aria-hidden="true"></div>
<div class="nep-dins nep-contacte-pagina">
<div class="nep-contacte-pagina__form">
<!-- /wp:html -->
<!-- wp:noempesquen/contacte /-->
<!-- wp:html -->
</div>
<aside>
<h2><?php echo esc_html_x( 'Abans d\'escriure', 'tema', 'noempesquen' ); ?></h2>
<p><?php echo esc_html_x( 'No et demanarem mai contrasenyes, dades bancàries ni codis, ni al joc ni per correu.', 'tema', 'noempesquen' ); ?></p>
<p>
<?php
echo wp_kses_post(
	sprintf(
		/* translators: %s: URL de l'avís de privacitat. */
		_x( 'Més informació a l\'<a href="%s">avís de privacitat</a>.', 'tema', 'noempesquen' ),
		esc_url( nep_tema_url( 'projecte', null, 'privacitat' ) )
	)
);
?>
</p>
</aside>
</div>
<!-- /wp:html -->
