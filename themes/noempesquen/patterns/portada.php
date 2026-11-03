<?php
/**
 * Title: Portada
 * Slug: noempesquen/portada
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
			array( _x( 'La factura de la llum', 'tema', 'noempesquen' ), $nep_pc ),
			array( _x( 'El paquet retingut', 'tema', 'noempesquen' ), $nep_mobil ),
			array( _x( 'Has guanyat un sorteig!', 'tema', 'noempesquen' ), $nep_mobil ),
		),
	),
	array(
		_x( 'Nivell 2', 'tema', 'noempesquen' ),
		_x( 'Per agafar el truc', 'tema', 'noempesquen' ),
		array(
			array( _x( 'El banc et bloqueja el compte', 'tema', 'noempesquen' ), $nep_pc ),
			array( _x( 'Hola, he canviat de mòbil', 'tema', 'noempesquen' ), $nep_mobil ),
			array( _x( 'Em passes el codi?', 'tema', 'noempesquen' ), $nep_mobil ),
			array( _x( 'Compro la teva bici', 'tema', 'noempesquen' ), $nep_mobil ),
		),
	),
	array(
		_x( 'Nivell 3', 'tema', 'noempesquen' ),
		_x( 'Per posar-te a prova', 'tema', 'noempesquen' ),
		array(
			array( _x( 'El truc d\'inversió', 'tema', 'noempesquen' ), $nep_pc ),
			array( _x( 'Virus detectat!', 'tema', 'noempesquen' ), $nep_pc ),
			array( _x( 'Actualitza el navegador', 'tema', 'noempesquen' ), $nep_pc ),
		),
	),
);
$nep_num    = 0;
?>
<!-- wp:html -->
<section class="nep-ham" aria-labelledby="nep-titol">
<div class="nep-dins nep-ham__dins">
<div>
<h1 id="nep-titol"><?php echo wp_kses_post( _x( 'No et deixis <em>pescar.</em>', 'tema', 'noempesquen' ) ); ?></h1>
<p class="nep-ham__lead"><?php echo esc_html_x( 'Un ordinador i un mòbil de mentida, amb missatges, correus i pàgines que semblen reals. Tu decides què fas i veus què passa. Sense risc.', 'tema', 'noempesquen' ); ?></p>
<p class="nep-ham__accions">
<a class="nep-btn nep-btn--lot nep-btn--gran" href="<?php echo esc_url( nep_tema_url( 'simulador' ) ); ?>"><?php echo esc_html_x( 'Entra a jugar', 'tema', 'noempesquen' ); ?></a>
<a class="nep-btn nep-btn--contorn" href="<?php echo esc_url( nep_tema_url( 'com-funciona' ) ); ?>"><?php echo esc_html_x( 'Com funciona', 'tema', 'noempesquen' ); ?></a>
</p>
</div>
<figure class="nep-cebo">
<svg class="nep-cebo__fil" viewBox="0 0 80 216" aria-hidden="true" focusable="false"><path d="M44 0V150V174a18 18 0 0 1-36 0V158" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 158l-8-12 16 3z" fill="#fff" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><circle cx="44" cy="150" r="7" fill="#FFD23F" stroke="#fff" stroke-width="4"/></svg>
<div class="nep-cebo__missatge">
<p class="nep-cebo__remitent"><span><?php echo esc_html_x( 'Número desconegut', 'tema', 'noempesquen' ); ?></span><span><?php echo esc_html_x( 'ara', 'tema', 'noempesquen' ); ?></span></p>
<p class="nep-cebo__text"><?php echo esc_html_x( 'Posta: el teu paquet està retingut. Paga 1,99 € avui o es retornarà. Segueix-lo aquí:', 'tema', 'noempesquen' ); ?> <span class="nep-cebo__enllac"><?php echo esc_html_x( 'posta-seguiment.top/3kd', 'tema', 'noempesquen' ); ?></span></p>
<span class="nep-sell nep-sell--1" aria-hidden="true">1</span>
<span class="nep-sell nep-sell--2" aria-hidden="true">2</span>
<span class="nep-sell nep-sell--3" aria-hidden="true">3</span>
</div>
<figcaption>
<ol class="nep-cebo__pistes">
<li><span class="nep-sell" aria-hidden="true">1</span><?php echo esc_html_x( 'Ningú no t\'avisa d\'un paquet així', 'tema', 'noempesquen' ); ?></li>
<li><span class="nep-sell" aria-hidden="true">2</span><?php echo esc_html_x( 'Un enllaç que no és de Posta', 'tema', 'noempesquen' ); ?></li>
<li><span class="nep-sell" aria-hidden="true">3</span><?php echo esc_html_x( 'Pressa: «avui»', 'tema', 'noempesquen' ); ?></li>
</ol>
</figcaption>
<svg viewBox="0 0 200 140" class="nep-cebo__peix" aria-hidden="true" focusable="false"><path d="M146 72L186 40Q196 33 196 46V98Q196 111 186 104Z" fill="#3f86a6" stroke="#0b1e3f" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M66 32Q84 6 118 34Z" fill="#3f86a6" stroke="#0b1e3f" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><clipPath id="nep-peix-cos"><path d="M24 74C24 44 52 28 88 28s64 18 64 44-28 42-64 42S24 104 24 74Z"/></clipPath><path d="M24 74C24 44 52 28 88 28s64 18 64 44-28 42-64 42S24 104 24 74Z" fill="#7ec4dc"/><g clip-path="url(#nep-peix-cos)"><path d="M10 86Q88 112 170 82V130H10Z" fill="#dff3f8"/></g><path d="M24 74C24 44 52 28 88 28s64 18 64 44-28 42-64 42S24 104 24 74Z" fill="none" stroke="#0b1e3f" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M102 56Q124 50 142 58" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".7"/><path d="M72 44Q62 72 72 104" fill="none" stroke="#0b1e3f" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M100 78Q108 100 128 92Q122 78 100 78Z" fill="#3f86a6" stroke="#0b1e3f" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="44" cy="62" r="16" fill="#fff" stroke="#0b1e3f" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="46" cy="63" r="4.5" fill="#0b1e3f"/><circle cx="47.5" cy="61.5" r="2" fill="#fff"/><path d="M26 40L60 48" stroke="#0b1e3f" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><ellipse cx="36" cy="90" rx="5" ry="6.5" fill="#0b1e3f"/></svg>
</figure>
</div>
</section>
<!-- /wp:html -->

<!-- wp:html -->
<div class="nep-corda" aria-hidden="true"></div>
<section class="nep-seccio" aria-labelledby="nep-passos-titol">
<div class="nep-dins">
<h2 id="nep-passos-titol"><?php echo esc_html_x( 'Mira l\'esquer abans de mossegar', 'tema', 'noempesquen' ); ?></h2>
<p class="nep-seccio__intro"><?php echo esc_html_x( 'Cada missió és una situació que et podria passar demà. Ningú no et diu què és veritat: ho has de descobrir tu.', 'tema', 'noempesquen' ); ?></p>
<ol class="nep-passos">
<li><span class="nep-passos__num" aria-hidden="true">1</span><h3><?php echo esc_html_x( 'Reps el missatge', 'tema', 'noempesquen' ); ?></h3><p><?php echo esc_html_x( 'Un correu, un SMS o un avís al teu ordinador o mòbil de mentida.', 'tema', 'noempesquen' ); ?></p></li>
<li><span class="nep-passos__num" aria-hidden="true">2</span><h3><?php echo esc_html_x( 'Decideixes', 'tema', 'noempesquen' ); ?></h3><p><?php echo esc_html_x( 'Obres, esborres, denuncies o bloquejes. També pots mirar cada detall amb lupa.', 'tema', 'noempesquen' ); ?></p></li>
<li><span class="nep-passos__num" aria-hidden="true">3</span><h3><?php echo esc_html_x( 'Veus què passa', 'tema', 'noempesquen' ); ?></h3><p><?php echo esc_html_x( 'El joc t\'ensenya la conseqüència i les pistes que et podien haver avisat.', 'tema', 'noempesquen' ); ?></p></li>
</ol>
</div>
</section>
<!-- /wp:html -->

<!-- wp:html -->
<section class="nep-seccio nep-tauler" aria-labelledby="nep-lots-titol">
<div class="nep-dins">
<h2 id="nep-lots-titol"><?php echo esc_html_x( 'Deu lots, tres nivells', 'tema', 'noempesquen' ); ?></h2>
<p class="nep-seccio__intro"><?php echo esc_html_x( 'Cada nivell puja una mica la dificultat. Cada missió dura entre 4 i 6 minuts.', 'tema', 'noempesquen' ); ?></p>
<div class="nep-nivells">
<?php foreach ( $nep_nivell as $nep_n ) : ?>
<div class="nep-nivell">
<h3><?php echo esc_html( $nep_n[0] ); ?><span><?php echo esc_html( $nep_n[1] ); ?></span></h3>
<ol class="nep-lots"<?php echo $nep_num > 0 ? ' start="' . esc_attr( (string) ( $nep_num + 1 ) ) . '"' : ''; ?>>
	<?php
	foreach ( $nep_n[2] as $nep_lot ) :
		++$nep_num;
		?>
<li><span class="nep-lots__num" aria-hidden="true"><?php echo esc_html( sprintf( '%02d', $nep_num ) ); ?></span><span class="nep-lots__titol"><?php echo esc_html( $nep_lot[0] ); ?></span><span class="nep-etiqueta"><?php echo esc_html( $nep_lot[1] ); ?></span></li>
	<?php endforeach; ?>
</ol>
</div>
<?php endforeach; ?>
</div>
<p class="nep-cta-fi"><a class="nep-btn nep-btn--mar" href="<?php echo esc_url( nep_tema_url( 'missions' ) ); ?>"><?php echo esc_html_x( 'Veure totes les missions', 'tema', 'noempesquen' ); ?></a></p>
</div>
</section>
<!-- /wp:html -->

<!-- wp:html -->
<section class="nep-seccio nep-garanties" aria-labelledby="nep-garanties-titol">
<div class="nep-dins">
<h2 id="nep-garanties-titol"><?php echo esc_html_x( 'Sense risc de veritat', 'tema', 'noempesquen' ); ?></h2>
<dl class="nep-garanties__llista">
<div><dt><?php echo esc_html_x( 'Tot és de mentida', 'tema', 'noempesquen' ); ?></dt><dd><?php echo esc_html_x( 'Els sistemes, les marques i els personatges són inventats. No hi ha res real que puguis perdre.', 'tema', 'noempesquen' ); ?></dd></div>
<div><dt><?php echo esc_html_x( 'El que escrius no es desa', 'tema', 'noempesquen' ); ?></dt><dd><?php echo esc_html_x( 'Als formularis falsos pots posar el que vulguis: no es guarda ni s\'envia enlloc.', 'tema', 'noempesquen' ); ?></dd></div>
<div><dt><?php echo esc_html_x( 'El compte és opcional', 'tema', 'noempesquen' ); ?></dt><dd><?php echo esc_html_x( 'Pots jugar sense registrar-te. El compte només serveix per recordar fins on has arribat.', 'tema', 'noempesquen' ); ?></dd></div>
</dl>
</div>
</section>
<!-- /wp:html -->

<!-- wp:html -->
<section class="nep-seccio nep-final" aria-labelledby="nep-final-titol">
<div class="nep-dins">
<h2 id="nep-final-titol"><?php echo esc_html_x( 'Prova-ho. És de mentida.', 'tema', 'noempesquen' ); ?></h2>
<p><a class="nep-btn nep-btn--lot nep-btn--gran" href="<?php echo esc_url( nep_tema_url( 'simulador' ) ); ?>"><?php echo esc_html_x( 'Entra a jugar', 'tema', 'noempesquen' ); ?></a></p>
</div>
</section>
<!-- /wp:html -->
