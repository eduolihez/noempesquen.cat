/**
 * Marca d'indici de sessió a `localStorage` (`nep-compte-sessio` = `'1'`).
 * No porta cap dada personal: només evita que el simulador demani el nonce
 * a `admin-ajax.php` quan mai s'ha entrat al compte en aquest navegador.
 * Mòdul pur (sense JSX); qualsevol error de `localStorage` s'ignora.
 */
export const CLAU_SESSIO = 'nep-compte-sessio';

const magatzemPerDefecte = () => {
	try {
		return typeof window !== 'undefined' ? window.localStorage : null;
	} catch {
		return null;
	}
};

/**
 * @param {Storage=} magatzem Magatzem (per defecte, `window.localStorage`).
 * @return {boolean} Si hi ha la marca.
 */
export function hiHaMarcaSessio( magatzem = magatzemPerDefecte() ) {
	try {
		return magatzem?.getItem( CLAU_SESSIO ) === '1';
	} catch {
		return false;
	}
}

/**
 * Posa la marca (després d'entrar o registrar-se).
 *
 * @param {Storage=} magatzem Magatzem.
 */
export function posaMarcaSessio( magatzem = magatzemPerDefecte() ) {
	try {
		magatzem?.setItem( CLAU_SESSIO, '1' );
	} catch {}
}

/**
 * Treu la marca (sortir, esborrar el compte o sessió caducada).
 *
 * @param {Storage=} magatzem Magatzem.
 */
export function treuMarcaSessio( magatzem = magatzemPerDefecte() ) {
	try {
		magatzem?.removeItem( CLAU_SESSIO );
	} catch {}
}
