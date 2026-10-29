/**
 * Separa els blancs dels extrems d'un text perquè quedin fora d'un botó
 * (un <button> en línia es menja els espais que porta a dins).
 *
 * @param {string} text Text original.
 * @return {{abans: string, nucli: string, despres: string}} Parts.
 */
export function separaEspais( text = '' ) {
	const [ , abans, nucli, despres ] = /^(\s*)([\s\S]*?)(\s*)$/.exec(
		text ?? ''
	);
	return { abans, nucli, despres };
}
