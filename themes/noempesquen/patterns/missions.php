<?php
/**
 * Title: Missions
 * Slug: noempesquen/missions
 * Inserter: no
 *
 * @package noempesquen
 */

defined( 'ABSPATH' ) || exit;

$nep_pc     = _x( 'Ordinador', 'tema', 'noempesquen' );
$nep_mobil  = _x( 'Mòbil', 'tema', 'noempesquen' );
$nep_nivell = array(
	array(
		_x( 'Nivell 1', 'tema', 'noempesquen' ),
		_x( 'Per començar', 'tema', 'noempesquen' ),
		array(
			array( _x( 'La factura de la llum', 'tema', 'noempesquen' ), _x( 'Un correu diu que et tallaran la llum avui si no pagues. És de veritat?', 'tema', 'noempesquen' ), $nep_pc ),
			array( _x( 'El paquet retingut', 'tema', 'noempesquen' ), _x( 'Un SMS diu que tens un paquet retingut i que cal pagar 1,99 €. Ho pagaries?', 'tema', 'noempesquen' ), $nep_mobil ),
			array( _x( 'Has guanyat un sorteig!', 'tema', 'noempesquen' ), _x( 'Una publicació d\'Ullada diu que has guanyat un premi enorme, però cal pagar unes despeses d\'enviament. Ho faries?', 'tema', 'noempesquen' ), $nep_mobil ),
		),
	),
	array(
		_x( 'Nivell 2', 'tema', 'noempesquen' ),
		_x( 'Per agafar el truc', 'tema', 'noempesquen' ),
		array(
			array( _x( 'El banc et bloqueja el compte', 'tema', 'noempesquen' ), _x( 'Un correu del banc diu que t\'han bloquejat el compte i que tens 24 hores per verificar-lo. Cal fer-ne cas?', 'tema', 'noempesquen' ), $nep_pc ),
			array( _x( 'Hola, he canviat de mòbil', 'tema', 'noempesquen' ), _x( 'Un número desconegut diu que és el Pau, que ha canviat de mòbil i que necessita 380 € ara mateix. Els hi enviaries?', 'tema', 'noempesquen' ), $nep_mobil ),
			array( _x( 'Em passes el codi?', 'tema', 'noempesquen' ), _x( 'La Marta et demana per Parla el codi que t\'acaba d\'arribar per SMS. Li\'l passaries?', 'tema', 'noempesquen' ), $nep_mobil ),
			array( _x( 'Compro la teva bici', 'tema', 'noempesquen' ), _x( 'Vens una bici per Revenda i un comprador te la vol pagar ara mateix amb un enllaç. Hi entraries per cobrar?', 'tema', 'noempesquen' ), $nep_mobil ),
		),
	),
	array(
		_x( 'Nivell 3', 'tema', 'noempesquen' ),
		_x( 'Per posar-te a prova', 'tema', 'noempesquen' ),
		array(
			array( _x( 'El truc d\'inversió', 'tema', 'noempesquen' ), _x( 'Un anunci al diari diu que una presentadora famosa ha multiplicat els seus diners amb un truc. N\'hi posaries 250 €?', 'tema', 'noempesquen' ), $nep_pc ),
			array( _x( 'Virus detectat!', 'tema', 'noempesquen' ), _x( 'Estàs mirant una recepta i de cop la pantalla s\'omple d\'alarmes: diu que tens virus i que truquis ara mateix. Què fas?', 'tema', 'noempesquen' ), $nep_pc ),
			array( _x( 'Actualitza el navegador', 'tema', 'noempesquen' ), _x( 'Vols mirar quin temps farà i una barra et diu que el navegador està desactualitzat. T\'hi descarregaries l\'actualització?', 'tema', 'noempesquen' ), $nep_pc ),
		),
	),
);
$nep_num    = 0;
?>
<!-- wp:html -->
<section class="nep-rotul" aria-labelledby="nep-titol">
<div class="nep-dins nep-rotul__dins">
<h1 id="nep-titol"><?php echo esc_html_x( 'Missions', 'tema', 'noempesquen' ); ?></h1>
<p><?php echo esc_html_x( 'Deu situacions, tres nivells. Cada una dura entre 4 i 6 minuts.', 'tema', 'noempesquen' ); ?></p>
</div>
</section>
<div class="nep-corda" aria-hidden="true"></div>
<section class="nep-seccio nep-tauler">
<div class="nep-dins">
<?php foreach ( $nep_nivell as $nep_n ) : ?>
<div class="nep-nivell">
<h2 class="nep-nivell__titol"><?php echo esc_html( $nep_n[0] ); ?><span><?php echo esc_html( $nep_n[1] ); ?></span></h2>
<ol class="nep-lots">
	<?php
	foreach ( $nep_n[2] as $nep_lot ) :
		++$nep_num;
		?>
<li><span class="nep-lots__num" aria-hidden="true"><?php echo esc_html( sprintf( '%02d', $nep_num ) ); ?></span><span><span class="nep-lots__titol"><?php echo esc_html( $nep_lot[0] ); ?></span><span class="nep-lots__resum"><?php echo esc_html( $nep_lot[1] ); ?></span></span><span class="nep-etiqueta"><?php echo esc_html( $nep_lot[2] ); ?></span></li>
	<?php endforeach; ?>
</ol>
</div>
<?php endforeach; ?>
<p class="nep-cta-fi"><a class="nep-btn nep-btn--mar nep-btn--gran" href="<?php echo esc_url( nep_tema_url( 'simulador' ) ); ?>"><?php echo esc_html_x( 'Entra a jugar', 'tema', 'noempesquen' ); ?></a></p>
</div>
</section>
<!-- /wp:html -->
