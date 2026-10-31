<?php
/**
 * Contenidor de la pantalla de compte. view.js hi munta l'aplicació.
 *
 * No s'hi incrusta cap nonce: el client el demana a admin-ajax (rest-nonce)
 * amb la galeta de sessió, així l'HTML es pot desar en memòria cau.
 *
 * @var array $attributes
 */

defined( 'ABSPATH' ) || exit;

$nep_config = array(
	'api'                => esc_url_raw( rest_url( 'noempesquen/v1/' ) ),
	'ajaxUrl'            => esc_url_raw( admin_url( 'admin-ajax.php' ) ),
	'urlSimulador'       => esc_url_raw( home_url( '/simulador/' ) ),
	'versioConsentiment' => NEP_VERSIO_CONSENTIMENT,
);
?>
<div <?php echo get_block_wrapper_attributes( array( 'class' => 'nep-compte' ) ); ?>
	data-config="<?php echo esc_attr( wp_json_encode( $nep_config ) ); ?>">
	<noscript><p><?php esc_html_e( 'Cal JavaScript per crear un compte o entrar-hi.', 'noempesquen' ); ?></p></noscript>
</div>
