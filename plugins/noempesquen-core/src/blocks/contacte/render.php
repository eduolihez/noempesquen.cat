<?php
/**
 * Contenidor del formulari de contacte. view.js hi munta l'aplicació.
 *
 * No s'hi incrusta cap nonce: el client el demana a admin-ajax (rest-nonce),
 * així l'HTML es pot desar en memòria cau.
 *
 * @var array $attributes
 */

defined( 'ABSPATH' ) || exit;

$nep_config = array(
	'api'            => esc_url_raw( rest_url( 'noempesquen/v1/' ) ),
	'ajaxUrl'        => esc_url_raw( admin_url( 'admin-ajax.php' ) ),
	'urlPrivacitat'  => esc_url_raw( home_url( '/sobre-el-projecte/#privacitat' ) ),
);
?>
<div <?php echo get_block_wrapper_attributes( array( 'class' => 'nep-contacte' ) ); ?>
	data-config="<?php echo esc_attr( wp_json_encode( $nep_config ) ); ?>">
	<noscript><p><?php esc_html_e( 'Cal JavaScript per enviar el formulari de contacte.', 'noempesquen' ); ?></p></noscript>
</div>
