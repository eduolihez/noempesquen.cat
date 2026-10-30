/**
 * Icones pròpies de Galeria: l'icona d'app (graella de 48) i glifs
 * (graella de 20, color actual). Totes decoratives.
 */
import { Glif, useIdSvg } from '../../ui/icones';

/* Galeria: targeta clara amb un sol i una muntanya sobre fons càlid. */
export function IconaGaleria( { mida = 24 } ) {
	const g = useIdSvg( 'galeria' );
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
					<stop offset="0" stopColor="#ffb347" />
					<stop offset="1" stopColor="#e0457b" />
				</linearGradient>
			</defs>
			<rect
				x="5"
				y="9"
				width="38"
				height="30"
				rx="6"
				fill={ `url(#${ g })` }
			/>
			<circle cx="32" cy="19" r="4" fill="#fff" fillOpacity=".95" />
			<path
				d="M5 34l11-12 9 9 6-6 12 12v2a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"
				fill="#fff"
				fillOpacity=".85"
			/>
		</svg>
	);
}

export const IconaTanca = ( p ) => (
	<Glif { ...p }>
		<path d="M5 5l10 10" />
		<path d="M15 5 5 15" />
	</Glif>
);

export const IconaAnterior = ( p ) => (
	<Glif { ...p }>
		<path d="M12.5 4.5 7 10l5.5 5.5" />
	</Glif>
);

export const IconaSeguent = ( p ) => (
	<Glif { ...p }>
		<path d="M7.5 4.5 13 10l-5.5 5.5" />
	</Glif>
);
