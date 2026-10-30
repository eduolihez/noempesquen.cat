/**
 * Icones pròpies d'Ajustos: icona d'app (graella de 48) i glifs (graella
 * de 20, color actual). Totes decoratives.
 */
import { Glif, useIdSvg } from '../../ui/icones';

/* Ajustos: rodeta dentada gris amb un cercle central. */
export function IconaAjustos( { mida = 24 } ) {
	const g = useIdSvg( 'ajt' );
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
					<stop offset="0" stopColor="#8a929e" />
					<stop offset="1" stopColor="#4a515c" />
				</linearGradient>
			</defs>
			<rect width="48" height="48" rx="11" fill={ `url(#${ g })` } />
			<g fill="#fff">
				<circle cx="24" cy="24" r="12" />
				<rect x="21" y="6" width="6" height="8" rx="2" />
				<rect x="21" y="34" width="6" height="8" rx="2" />
				<rect x="6" y="21" width="8" height="6" rx="2" />
				<rect x="34" y="21" width="8" height="6" rx="2" />
			</g>
			<circle cx="24" cy="24" r="5" fill="#5a616c" />
		</svg>
	);
}

export const IconaWifi = ( p ) => (
	<Glif { ...p }>
		<path d="M2.5 8a10.5 10.5 0 0 1 15 0" />
		<path d="M5 11a7 7 0 0 1 10 0" />
		<path d="M7.6 14a3.4 3.4 0 0 1 4.8 0" />
		<circle cx="10" cy="16.5" r=".6" />
	</Glif>
);

export const IconaPantalla = ( p ) => (
	<Glif { ...p }>
		<circle cx="10" cy="10" r="3.2" />
		<path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" />
	</Glif>
);

export const IconaSo = ( p ) => (
	<Glif { ...p }>
		<path d="M3.5 8h3l4-3.5v11L6.5 12h-3z" />
		<path d="M13.5 7.5a3.5 3.5 0 0 1 0 5" />
		<path d="M15.5 5.5a6.5 6.5 0 0 1 0 9" />
	</Glif>
);

export const IconaAplicacions = ( p ) => (
	<Glif { ...p }>
		<rect x="3.5" y="3.5" width="5.5" height="5.5" rx="1.2" />
		<rect x="11" y="3.5" width="5.5" height="5.5" rx="1.2" />
		<rect x="3.5" y="11" width="5.5" height="5.5" rx="1.2" />
		<rect x="11" y="11" width="5.5" height="5.5" rx="1.2" />
	</Glif>
);

export const IconaTelefon = ( p ) => (
	<Glif { ...p }>
		<rect x="5.5" y="2.5" width="9" height="15" rx="2" />
		<path d="M9 15h2" />
	</Glif>
);

export const IconaApagar = ( p ) => (
	<Glif { ...p }>
		<path d="M10 3v7" />
		<path d="M5.6 5.8a6 6 0 1 0 8.8 0" />
	</Glif>
);

export const IconaEnrere = ( p ) => (
	<Glif { ...p }>
		<path d="M16 10H4.5" />
		<path d="M9.5 5 4.5 10l5 5" />
	</Glif>
);

export const IconaSegueix = ( p ) => (
	<Glif { ...p }>
		<path d="M7.5 4.5 13 10l-5.5 5.5" />
	</Glif>
);
