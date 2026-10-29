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
?>
<div <?php echo get_block_wrapper_attributes( array( 'class' => 'nep-sim' ) ); ?>
	data-config="<?php echo esc_attr( wp_json_encode( $config ) ); ?>">
	<noscript><?php esc_html_e( 'Cal JavaScript per fer servir el simulador.', 'noempesquen' ); ?></noscript>
</div>
