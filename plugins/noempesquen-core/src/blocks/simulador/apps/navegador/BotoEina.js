/**
 * Botó d'icona de la barra d'eines (enrere, endavant, recarrega...).
 *
 * @param {Object}   props
 * @param {string}   props.etiqueta Nom accessible i títol.
 * @param {Function} props.Icona    Component d'icona.
 * @param {number}   [props.mida]   Mida de la icona.
 */
export function BotoEina( { etiqueta, Icona, mida = 18, ...resta } ) {
	return (
		<button
			type="button"
			className="nep-nav-eines__boto"
			aria-label={ etiqueta }
			title={ etiqueta }
			{ ...resta }
		>
			<Icona mida={ mida } />
		</button>
	);
}
