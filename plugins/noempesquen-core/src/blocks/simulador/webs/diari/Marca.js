import { __ } from '@wordpress/i18n';

/**
 * Logotip d'El Diari del Barri: un full de diari plegat (SVG propi) i el nom.
 */
export function MarcaDiari() {
	return (
		<span className="nep-dv-marca">
			<svg
				viewBox="0 0 32 32"
				width="32"
				height="32"
				aria-hidden="true"
				focusable="false"
			>
				<rect
					x="3"
					y="5"
					width="26"
					height="22"
					rx="3"
					fill="#9f1239"
				/>
				<rect x="7" y="9" width="10" height="6" fill="#fff" />
				<path
					d="M20 10h5M20 14h5M7 19h18M7 23h18"
					stroke="#fff"
					strokeWidth="2"
					strokeLinecap="round"
				/>
			</svg>
			<span className="nep-dv-marca__nom">
				{ __( 'El Diari del Barri', 'noempesquen' ) }
			</span>
		</span>
	);
}
