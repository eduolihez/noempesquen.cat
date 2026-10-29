/**
 * Marca d'Envia't: una caixa amb una fletxa d'enviament (SVG propi).
 *
 * @param {Object} props
 * @param {number} props.mida Costat en píxels.
 */
export function IconaCaixa( { mida = 32 } ) {
	return (
		<svg
			viewBox="0 0 32 32"
			width={ mida }
			height={ mida }
			aria-hidden="true"
			focusable="false"
		>
			<path d="M16 3 4 9v14l12 6 12-6V9z" fill="#c2410c" />
			<path
				d="M4 9l12 6 12-6M16 15v14"
				fill="none"
				stroke="#fff"
				strokeWidth="2"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

/**
 * Logotip d'Envia't.
 */
export function MarcaEnviat() {
	return (
		<span className="nep-ev-marca">
			<IconaCaixa />
			<span className="nep-ev-marca__nom">Envia&apos;t</span>
		</span>
	);
}
