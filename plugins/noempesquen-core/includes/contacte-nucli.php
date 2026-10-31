<?php
/**
 * Funcions pures del formulari de contacte: saneig i validació.
 *
 * Sense WordPress ni base de dades; es proven amb PHPUnit.
 *
 * @package noempesquen-core
 */

defined( 'ABSPATH' ) || exit;

const NEP_CONTACTE_NOM_MAX      = 80;
const NEP_CONTACTE_EMAIL_MAX    = 100;
const NEP_CONTACTE_MISSATGE_MIN = 10;
const NEP_CONTACTE_MISSATGE_MAX = 2000;

/**
 * Assumptes permesos (llista blanca).
 *
 * @return string[]
 */
function nep_contacte_assumptes(): array {
	return array( 'Dubte', 'Suggeriment', 'He trobat un error', 'Altres' );
}

/**
 * Neteja un text d'una sola línia: sense etiquetes, controls ni salts.
 *
 * @param mixed $valor Valor brut.
 * @return string
 */
function nep_contacte_neteja_linia( $valor ): string {
	if ( ! is_string( $valor ) ) {
		return '';
	}
	$text = strip_tags( $valor );
	$text = preg_replace( '/[\x00-\x1F\x7F]+/u', ' ', $text ) ?? '';
	$text = preg_replace( '/\s+/u', ' ', $text ) ?? '';
	return trim( $text );
}

/**
 * Neteja un text de diverses línies: sense etiquetes ni controls (salvo salts).
 *
 * @param mixed $valor Valor brut.
 * @return string
 */
function nep_contacte_neteja_text( $valor ): string {
	if ( ! is_string( $valor ) ) {
		return '';
	}
	$text = strip_tags( str_replace( "\r\n", "\n", $valor ) );
	$text = str_replace( "\r", "\n", $text );
	$text = preg_replace( '/[\x00-\x09\x0B-\x1F\x7F]+/u', '', $text ) ?? '';
	$text = preg_replace( "/\n{3,}/", "\n\n", $text ) ?? '';
	return trim( $text );
}

/**
 * Valida el format d'un correu.
 *
 * @param mixed $email Correu.
 * @return bool
 */
function nep_contacte_email_valid( $email ): bool {
	if ( ! is_string( $email ) || '' === $email || strlen( $email ) > NEP_CONTACTE_EMAIL_MAX || preg_match( '/\s/', $email ) ) {
		return false;
	}
	return false !== filter_var( $email, FILTER_VALIDATE_EMAIL );
}

/**
 * Cert si el camp trampa (`web`) té contingut: és un robot.
 *
 * @param mixed $dades Cos de la petició.
 * @return bool
 */
function nep_contacte_es_robot( $dades ): bool {
	if ( ! is_array( $dades ) || ! isset( $dades['web'] ) ) {
		return false;
	}
	// Qualsevol valor que no sigui un text buit (també arrays o números) compta com a ple.
	return ! is_string( $dades['web'] ) || '' !== trim( $dades['web'] );
}

/**
 * Sanea i valida les dades del formulari.
 *
 * @param mixed $dades Cos de la petició.
 * @return array{valid:bool,errors:array<string,string>,dades:array<string,string>}
 */
function nep_contacte_valida( $dades ): array {
	$dades  = is_array( $dades ) ? $dades : array();
	$net    = array(
		'nom'      => nep_contacte_neteja_linia( $dades['nom'] ?? '' ),
		'correu'   => nep_contacte_neteja_linia( $dades['correu'] ?? '' ),
		'assumpte' => nep_contacte_neteja_linia( $dades['assumpte'] ?? '' ),
		'missatge' => nep_contacte_neteja_text( $dades['missatge'] ?? '' ),
	);
	$errors = array();

	if ( '' === $net['nom'] ) {
		$errors['nom'] = 'Escriu el teu nom.';
	} elseif ( mb_strlen( $net['nom'] ) > NEP_CONTACTE_NOM_MAX ) {
		$errors['nom'] = 'El nom no pot passar de 80 caràcters.';
	}

	if ( '' === $net['correu'] ) {
		$errors['correu'] = 'Escriu el teu correu electrònic.';
	} elseif ( ! nep_contacte_email_valid( $net['correu'] ) ) {
		$errors['correu'] = 'Escriu un correu vàlid, per exemple nom@exemple.cat.';
	}

	if ( ! in_array( $net['assumpte'], nep_contacte_assumptes(), true ) ) {
		$errors['assumpte'] = 'Tria un assumpte de la llista.';
	}

	$llarg = mb_strlen( $net['missatge'] );
	if ( 0 === $llarg ) {
		$errors['missatge'] = 'Escriu el teu missatge.';
	} elseif ( $llarg < NEP_CONTACTE_MISSATGE_MIN ) {
		$errors['missatge'] = 'El missatge ha de tenir almenys 10 caràcters.';
	} elseif ( $llarg > NEP_CONTACTE_MISSATGE_MAX ) {
		$errors['missatge'] = 'El missatge no pot passar de 2000 caràcters.';
	}

	if ( ! isset( $dades['privacitat'] ) || true !== $dades['privacitat'] ) {
		$errors['privacitat'] = "Cal que acceptis l'avís de privacitat per poder enviar el missatge.";
	}

	return array(
		'valid'  => array() === $errors,
		'errors' => $errors,
		'dades'  => $net,
	);
}

/**
 * Assumpte del correu. Les dades ja són netes (sense salts de línia).
 *
 * @param array<string,string> $dades Dades validades.
 * @return string
 */
function nep_contacte_assumpte_correu( array $dades ): string {
	return '[No em pesquen] ' . $dades['assumpte'] . ': ' . $dades['nom'];
}

/**
 * Cos del correu en text pla.
 *
 * @param array<string,string> $dades Dades validades.
 * @return string
 */
function nep_contacte_cos_correu( array $dades ): string {
	return "Nom: {$dades['nom']}\nCorreu: {$dades['correu']}\nAssumpte: {$dades['assumpte']}\n\n{$dades['missatge']}\n";
}

/**
 * Capçaleres del correu: només un Reply-To validat, sense salts de línia.
 *
 * @param string $correu Correu ja validat.
 * @return string[] Buit si el correu no és vàlid.
 */
function nep_contacte_capcaleres( string $correu ): array {
	if ( ! nep_contacte_email_valid( $correu ) || preg_match( '/[\r\n]/', $correu ) ) {
		return array();
	}
	return array( 'Reply-To: ' . $correu );
}
