/**
 * Marca de Sorteig del Barri: una estrella dins d'un cercle (SVG propi).
 *
 * @param {Object} props
 * @param {number} props.mida Costat en píxels.
 */
export function IconaEstrella( { mida = 32 } ) {
	return (
		<svg
			viewBox="0 0 32 32"
			width={ mida }
			height={ mida }
			aria-hidden="true"
			focusable="false"
		>
			<circle cx="16" cy="16" r="15" fill="#6d28d9" />
			<path
				d="m16 6 3 6.3 6.9.9-5 4.8 1.3 6.8L16 21.4 9.8 24.8l1.3-6.8-5-4.8 6.9-.9z"
				fill="#fde047"
			/>
		</svg>
	);
}

/**
 * Logotip de Sorteig del Barri.
 */
export function MarcaSorteig() {
	return (
		<span className="nep-sb-marca">
			<IconaEstrella />
			<span className="nep-sb-marca__nom">Sorteig del Barri</span>
		</span>
	);
}
