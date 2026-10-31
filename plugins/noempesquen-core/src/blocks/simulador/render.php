<?php
/**
 * Contenidor del simulador. view.js hi munta l'aplicació.
 *
 * @var array $attributes
 */

defined( 'ABSPATH' ) || exit;

$config = array(
	'dispositiu' => $attributes['dispositiu'] ?? 'auto',
	'api'        => esc_url_raw( rest_url( 'noempesquen/v1/' ) ),
);

// Previsualització d'una missió (també esborrany) des del panell: mai per a anònims.
// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Només llegeix un id; la ruta REST torna a comprovar els permisos amb el nonce.
$nep_previsualitza = isset( $_GET['previsualitza'] ) ? absint( wp_unslash( $_GET['previsualitza'] ) ) : 0;
if ( $nep_previsualitza && current_user_can( 'nep_gestiona_missions' ) && current_user_can( 'edit_post', $nep_previsualitza ) ) {
	$config['previsualitza'] = $nep_previsualitza;
	$config['nonce']         = wp_create_nonce( 'wp_rest' );
}
?>
<div <?php echo get_block_wrapper_attributes( array( 'class' => 'nep-sim' ) ); ?>
	data-config="<?php echo esc_attr( wp_json_encode( $config ) ); ?>">
	<noscript><?php esc_html_e( 'Cal JavaScript per fer servir el simulador.', 'noempesquen' ); ?></noscript>
</div>
