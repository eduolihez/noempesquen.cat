<?php
/**
 * Title: Com funciona
 * Slug: noempesquen/com-funciona
 * Inserter: no
 *
 * @package noempesquen
 */

defined( 'ABSPATH' ) || exit;

$nep_pistes = array(
	array( _x( 'Pressa', 'tema', 'noempesquen' ), _x( 'Et diuen que ho has de fer ara, avui o en 24 hores.', 'tema', 'noempesquen' ) ),
	array( _x( 'Remitent estrany', 'tema', 'noempesquen' ), _x( 'Un número o una adreça que no coneixes, o que s\'assembla a una de coneguda.', 'tema', 'noempesquen' ) ),
	array( _x( 'Enllaç sospitós', 'tema', 'noempesquen' ), _x( 'Una adreça que no és la de l\'empresa de debò.', 'tema', 'noempesquen' ) ),
	array( _x( 'Demanen diners o codis', 'tema', 'noempesquen' ), _x( 'Un pagament petit, una despesa d\'enviament o el codi que t\'ha arribat per SMS.', 'tema', 'noempesquen' ) ),
	array( _x( 'Massa bo per ser veritat', 'tema', 'noempesquen' ), _x( 'Premis, inversions que multipliquen els diners, ofertes impossibles.', 'tema', 'noempesquen' ) ),
	array( _x( 'Por', 'tema', 'noempesquen' ), _x( 'Et diuen que tens un virus, que et tallaran un servei o que t\'han bloquejat el compte.', 'tema', 'noempesquen' ) ),
);
?>
<!-- wp:html -->
<section class="nep-rotul" aria-labelledby="nep-titol">
<div class="nep-dins nep-rotul__dins">
<h1 id="nep-titol"><?php echo esc_html_x( 'Com funciona', 'tema', 'noempesquen' ); ?></h1>
<p><?php echo esc_html_x( 'Un simulador per practicar abans que ho necessitis de veritat.', 'tema', 'noempesquen' ); ?></p>
</div>
</section>
<div class="nep-corda" aria-hidden="true"></div>
<div class="nep-dins nep-prosa">
<h2><?php echo esc_html_x( 'Què hi trobaràs', 'tema', 'noempesquen' ); ?></h2>
<p><?php echo esc_html_x( 'Un ordinador i un mòbil de mentida que s\'obren a pantalla completa. Hi arriben correus, SMS, missatges i anuncis que semblen reals. Tu pots obrir-los, respondre, esborrar, bloquejar o denunciar. Cada decisió té una conseqüència, i al final el joc t\'explica què havies de mirar.', 'tema', 'noempesquen' ); ?></p>
<h2><?php echo esc_html_x( 'Com es juga', 'tema', 'noempesquen' ); ?></h2>
<ol>
<li><?php echo esc_html_x( 'Tria una missió. N\'hi ha deu, repartides en tres nivells.', 'tema', 'noempesquen' ); ?></li>
<li><?php echo esc_html_x( 'Llegeix el missatge amb calma. No hi ha cronòmetre.', 'tema', 'noempesquen' ); ?></li>
<li><?php echo esc_html_x( 'Mira els detalls: l\'adreça de qui t\'escriu, l\'enllaç, el to. Ho pots inspeccionar tot.', 'tema', 'noempesquen' ); ?></li>
<li><?php echo esc_html_x( 'Decideix què fas. El joc et mostra què hauria passat de veritat.', 'tema', 'noempesquen' ); ?></li>
</ol>
<h2><?php echo esc_html_x( 'Les pistes que cal aprendre', 'tema', 'noempesquen' ); ?></h2>
<p><?php echo esc_html_x( 'Les estafes canvien de cara, però quasi sempre deixen les mateixes empremtes.', 'tema', 'noempesquen' ); ?></p>
<ol class="nep-pistes-lista">
<?php foreach ( $nep_pistes as $nep_pista ) : ?>
<li><div><strong><?php echo esc_html( $nep_pista[0] ); ?></strong><?php echo esc_html( $nep_pista[1] ); ?></div></li>
<?php endforeach; ?>
</ol>
<h2><?php echo esc_html_x( 'Ordinador i mòbil', 'tema', 'noempesquen' ); ?></h2>
<p><?php echo esc_html_x( 'Algunes missions passen a l\'ordinador i d\'altres al mòbil. Pots jugar des del telèfon o des d\'un ordinador.', 'tema', 'noempesquen' ); ?></p>
<div class="nep-nota"><p><?php echo wp_kses_post( _x( '<strong>Tot és de mentida.</strong> Les marques, els personatges i les pàgines del joc són inventats. Res del que escrius als formularis falsos es guarda ni s\'envia.', 'tema', 'noempesquen' ) ); ?></p></div>
<h2><?php echo esc_html_x( 'El teu progrés', 'tema', 'noempesquen' ); ?></h2>
<p><?php echo esc_html_x( 'No cal registrar-se per jugar. Si vols recordar fins on has arribat, pots crear un compte amb el correu. Pots descarregar les dades o esborrar-ho tot quan vulguis.', 'tema', 'noempesquen' ); ?></p>
<p class="nep-cta-fi"><a class="nep-btn nep-btn--mar nep-btn--gran" href="<?php echo esc_url( nep_tema_url( 'simulador' ) ); ?>"><?php echo esc_html_x( 'Entra a jugar', 'tema', 'noempesquen' ); ?></a></p>
</div>
<!-- /wp:html -->
