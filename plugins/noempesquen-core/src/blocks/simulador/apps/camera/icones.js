/**
 * Icones pròpies de Càmera: l'icona d'app (graella de 48) i glifs
 * (graella de 20, color actual). Totes decoratives.
 */
import { Glif, useIdSvg } from '../../ui/icones';

/* Càmera: cos de càmera gris amb objectiu i punt de llum. */
export function IconaCamera( { mida = 24 } ) {
	const g = useIdSvg( 'camera' );
	return (
		<svg
			viewBox="0 0 48 48"
			width={ mida }
			height={ mida }
			aria-hidden="true"
			focusable="false"
		>
			<defs>
				<linearGradient id={ g } x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#6f747c" />
					<stop offset="1" stopColor="#2b2e33" />
				</linearGradient>
			</defs>
			<path
				d="M6 15.5c0-2.2 1.8-4 4-4h5.2l2.4-3.8c.4-.6 1-.9 1.7-.9h7.4c.7 0 1.3.3 1.7.9l2.4 3.8H38c2.2 0 4 1.8 4 4v17c0 2.2-1.8 4-4 4H10c-2.2 0-4-1.8-4-4z"
				fill={ `url(#${ g })` }
			/>
			<circle cx="24" cy="25" r="8.5" fill="#15171a" />
			<circle cx="24" cy="25" r="5.5" fill="#3a3f47" />
			<circle cx="22.2" cy="23.2" r="1.6" fill="#fff" fillOpacity=".7" />
		</svg>
	);
}

/* Obturador: cercle exterior i disc central. */
export const IconaObturador = ( p ) => (
	<Glif { ...p }>
		<circle cx="10" cy="10" r="7.25" />
		<circle cx="10" cy="10" r="3.6" fill="currentColor" />
	</Glif>
);

/* Canvi de càmera: dues fletxes circulars. */
export const IconaCanviaCamera = ( p ) => (
	<Glif { ...p }>
		<path d="M4.2 8.2A6 6 0 0 1 14.6 5.6" />
		<path d="M14.6 2.6v3h-3" />
		<path d="M15.8 11.8A6 6 0 0 1 5.4 14.4" />
		<path d="M5.4 17.4v-3h3" />
	</Glif>
);
