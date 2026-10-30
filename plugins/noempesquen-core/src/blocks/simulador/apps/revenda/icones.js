/**
 * Icones pròpies de Revenda: icona d'app (graella de 48) i glifs de les
 * pestanyes (graella de 20, color actual). Totes decoratives.
 */
import { Glif, useIdSvg } from '../../ui/icones';

/* Revenda: etiqueta de preu amb fletxes de canvi sobre degradat verd-blau. */
export function IconaRevenda( { mida = 24 } ) {
	const g = useIdSvg( 'revenda' );
	return (
		<svg
			viewBox="0 0 48 48"
			width={ mida }
			height={ mida }
			aria-hidden="true"
			focusable="false"
		>
			<defs>
				<linearGradient id={ g } x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#1f9d8a" />
					<stop offset="1" stopColor="#13577a" />
				</linearGradient>
			</defs>
			<rect
				x="4"
				y="4"
				width="40"
				height="40"
				rx="11"
				fill={ `url(#${ g })` }
			/>
			<path
				d="M24 11h11a2 2 0 0 1 2 2v11L24.5 36.5a2 2 0 0 1-2.8 0l-10.2-10.2a2 2 0 0 1 0-2.8z"
				fill="#fff"
			/>
			<circle cx="31" cy="17" r="2.6" fill="#13577a" />
			<path
				d="M19 24.5h8m-2.6-2.6 2.6 2.6-2.6 2.6"
				fill="none"
				stroke="#13577a"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

/* Pestanya «Anuncis»: etiqueta. */
export const IconaEtiqueta = ( p ) => (
	<Glif { ...p }>
		<path d="M10.5 3.5H16a.5.5 0 0 1 .5.5v5.5l-7 7-6-6z" />
		<circle cx="13" cy="7" r="1.2" />
	</Glif>
);

/* Pestanya «Xats»: dues bafarades. */
export const IconaXats = ( p ) => (
	<Glif { ...p }>
		<path d="M3.5 4.5h9v6h-5l-3 2.5V10.5h-1z" />
		<path d="M14.5 7.5h2v6h-1V16l-3-2.5h-4.5v-1" />
	</Glif>
);
