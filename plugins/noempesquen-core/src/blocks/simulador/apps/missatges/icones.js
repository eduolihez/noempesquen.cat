/**
 * Icones pròpies de Missatges: l'icona d'app (graella de 48) i glifs
 * (graella de 20, color actual). Totes decoratives.
 */
import { Glif, useIdSvg } from '../../ui/icones';

/* Missatges: bafarada blava amb dues ratlles de text. */
export function IconaMissatges( { mida = 24 } ) {
	const g = useIdSvg( 'sms' );
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
					<stop offset="0" stopColor="#5aa9ff" />
					<stop offset="1" stopColor="#1f5fd1" />
				</linearGradient>
			</defs>
			<path
				d="M24 6c10.5 0 19 6.9 19 15.5S34.5 37 24 37c-1.9 0-3.7-.2-5.4-.6L9 41.5l2.4-8.1C7.4 30.6 5 26.3 5 21.5 5 12.9 13.5 6 24 6z"
				fill={ `url(#${ g })` }
			/>
			<path
				d="M14 8.9c3-1.5 6.4-2.4 10-2.4 6 0 11.3 2.3 14.6 5.8"
				fill="none"
				stroke="#fff"
				strokeOpacity=".35"
				strokeWidth="1.2"
				strokeLinecap="round"
			/>
			<g stroke="#fff" strokeWidth="3" strokeLinecap="round">
				<path d="M15 18.5h18" />
				<path d="M15 25h12" />
			</g>
		</svg>
	);
}

export const IconaMes = ( p ) => (
	<Glif { ...p } stroke="none" fill="currentColor">
		<circle cx="10" cy="4.5" r="1.6" />
		<circle cx="10" cy="10" r="1.6" />
		<circle cx="10" cy="15.5" r="1.6" />
	</Glif>
);

export const IconaEnrere = ( p ) => (
	<Glif { ...p }>
		<path d="M16 10H4.5" />
		<path d="M9.5 5 4.5 10l5 5" />
	</Glif>
);

export const IconaEnvia = ( p ) => (
	<Glif { ...p }>
		<path d="M3 10 17 3.5 13 17l-3.2-5.3z" />
		<path d="M9.8 11.7 17 3.5" />
	</Glif>
);

export const IconaContactes = ( p ) => (
	<Glif { ...p }>
		<circle cx="10" cy="7" r="3.2" />
		<path d="M3.8 16.5c.9-3 3.3-4.6 6.2-4.6s5.3 1.6 6.2 4.6" />
	</Glif>
);

export const IconaEsborra = ( p ) => (
	<Glif { ...p }>
		<path d="M4 5.5h12" />
		<path d="M8 5.5V4h4v1.5" />
		<path d="M5.5 5.5l.8 10.5h7.4l.8-10.5" />
	</Glif>
);

export const IconaBloqueja = ( p ) => (
	<Glif { ...p }>
		<circle cx="10" cy="10" r="6.5" />
		<path d="M5.4 14.6 14.6 5.4" />
	</Glif>
);

export const IconaReenvia = ( p ) => (
	<Glif { ...p }>
		<path d="M11.5 4.5 16 9l-4.5 4.5" />
		<path d="M16 9H9a5 5 0 0 0-5 5v1.5" />
	</Glif>
);

export const IconaRespon = ( p ) => (
	<Glif { ...p }>
		<path d="M8.5 4.5 4 9l4.5 4.5" />
		<path d="M4 9h7a5 5 0 0 1 5 5v1.5" />
	</Glif>
);
