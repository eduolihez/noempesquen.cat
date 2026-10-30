/**
 * Icones pròpies d'Ullada: icona d'app (graella de 48), logotip de text i
 * glifs (graella de 20, color actual). Totes decoratives.
 */
import { Glif, useIdSvg } from '../../ui/icones';

/* Ullada: ull estilitzat sobre degradat porpra-taronja. */
export function IconaUllada( { mida = 24 } ) {
	const g = useIdSvg( 'ull' );
	return (
		<svg
			viewBox="0 0 48 48"
			width={ mida }
			height={ mida }
			aria-hidden="true"
			focusable="false"
		>
			<defs>
				<linearGradient id={ g } x1="0" y1="1" x2="1" y2="0">
					<stop offset="0" stopColor="#f58a3c" />
					<stop offset="1" stopColor="#8a3fd1" />
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
				d="M9 24s5.6-9 15-9 15 9 15 9-5.6 9-15 9-15-9-15-9z"
				fill="none"
				stroke="#fff"
				strokeWidth="3"
				strokeLinejoin="round"
			/>
			<circle cx="24" cy="24" r="4.5" fill="#fff" />
		</svg>
	);
}

/* Logotip de text «Ullada», propi. */
export function LogoUllada( { alt = 22 } ) {
	return (
		<svg
			viewBox="0 0 96 28"
			height={ alt }
			width={ ( alt * 96 ) / 28 }
			aria-hidden="true"
			focusable="false"
		>
			<text
				x="0"
				y="22"
				fontFamily="Georgia, 'Times New Roman', serif"
				fontStyle="italic"
				fontWeight="700"
				fontSize="26"
				fill="currentColor"
			>
				Ullada
			</text>
		</svg>
	);
}

export const IconaCor = ( p ) => (
	<Glif { ...p }>
		<path d="M10 16.5S3.5 12.6 3.5 7.8A3.6 3.6 0 0 1 10 5.9a3.6 3.6 0 0 1 6.5 1.9c0 4.8-6.5 8.7-6.5 8.7z" />
	</Glif>
);

export const IconaCasa = ( p ) => (
	<Glif { ...p }>
		<path d="M3.5 9.5 10 4l6.5 5.5" />
		<path d="M5 8.5V16h10V8.5" />
	</Glif>
);

export const IconaCerca = ( p ) => (
	<Glif { ...p }>
		<circle cx="8.5" cy="8.5" r="5.25" />
		<path d="m12.5 12.5 4 4" />
	</Glif>
);

export const IconaPerfil = ( p ) => (
	<Glif { ...p }>
		<circle cx="10" cy="7" r="3.2" />
		<path d="M3.8 16.5c.9-3 3.3-4.6 6.2-4.6s5.3 1.6 6.2 4.6" />
	</Glif>
);

export const IconaAvisos = ( p ) => (
	<Glif { ...p }>
		<path d="M5 14.5V9a5 5 0 0 1 10 0v5.5l1.5 1.5h-13z" />
		<path d="M8.5 17.5h3" />
	</Glif>
);
