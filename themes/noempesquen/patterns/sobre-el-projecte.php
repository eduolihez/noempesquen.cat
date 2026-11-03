<?php
/**
 * Title: Sobre el projecte
 * Slug: noempesquen/sobre-el-projecte
 * Inserter: no
 *
 * @package noempesquen
 */

defined( 'ABSPATH' ) || exit;
?>
<!-- wp:html -->
<section class="nep-rotul" aria-labelledby="nep-titol">
<div class="nep-dins nep-rotul__dins">
<h1 id="nep-titol"><?php echo esc_html_x( 'Sobre el projecte', 'tema', 'noempesquen' ); ?></h1>
<p><?php echo esc_html_x( 'Un simulador per aprendre a reconèixer estafes sense córrer cap risc.', 'tema', 'noempesquen' ); ?></p>
</div>
</section>
<div class="nep-corda" aria-hidden="true"></div>
<div class="nep-dins nep-prosa">
<h2><?php echo esc_html_x( 'Per què existeix', 'tema', 'noempesquen' ); ?></h2>
<p><?php echo esc_html_x( 'Les estafes digitals fan servir la pressa, la por i la confiança. Llegir-ne una explicació no és el mateix que viure-la. No em pesquen et posa dins de la situació, amb la decisió a les teves mans, i et deixa equivocar-te sense conseqüències reals.', 'tema', 'noempesquen' ); ?></p>
<h2><?php echo esc_html_x( 'Per a qui és', 'tema', 'noempesquen' ); ?></h2>
<p><?php echo esc_html_x( 'Per a tothom, i sobretot per a qui no es mou còmode amb la tecnologia. Els textos són clars, els botons grans i el joc es pot fer amb el teclat.', 'tema', 'noempesquen' ); ?></p>
<h2><?php echo esc_html_x( 'Premis Wapps .cat', 'tema', 'noempesquen' ); ?></h2>
<p><?php echo esc_html_x( 'El projecte es presenta als Premis Wapps .cat 2026/27.', 'tema', 'noempesquen' ); ?></p>
<h2 id="privacitat"><?php echo esc_html_x( 'Privacitat', 'tema', 'noempesquen' ); ?></h2>
<p><?php echo wp_kses_post( _x( '<strong>Si jugues sense compte</strong>, no es guarda cap dada personal. El que escrius als formularis falsos del simulador no es desa ni s\'envia enlloc. Només es comptabilitzen estadístiques anònimes de les partides (quina missió i quin resultat), sense cap dada teva.', 'tema', 'noempesquen' ) ); ?></p>
<p>
<?php
echo wp_kses_post(
	sprintf(
		/* translators: %s: URL de la pàgina «El meu compte». */
		_x( '<strong>Si crees un compte</strong>, es guarda el teu correu electrònic i el teu progrés, perquè el puguis recuperar en un altre dispositiu. Pots descarregar-ho o esborrar-ho tot quan vulguis des d\'<a href="%s">El meu compte</a>.', 'tema', 'noempesquen' ),
		esc_url( nep_tema_url( 'compte' ) )
	)
);
?>
</p>
<p><?php echo wp_kses_post( _x( '<strong>Si ens escrius pel formulari de contacte</strong>, el missatge arriba per correu a qui gestiona el web i només s\'usa per respondre\'t. No es desa al web.', 'tema', 'noempesquen' ) ); ?></p>
<h2><?php echo esc_html_x( 'Contacte', 'tema', 'noempesquen' ); ?></h2>
<p>
<?php
echo wp_kses_post(
	sprintf(
		/* translators: %s: URL de la pàgina de contacte. */
		_x( 'Si tens un dubte, un suggeriment o has trobat un error, escriu-nos des de la pàgina de <a href="%s">Contacte</a>.', 'tema', 'noempesquen' ),
		esc_url( nep_tema_url( 'contacte' ) )
	)
);
?>
</p>
</div>
<!-- /wp:html -->
