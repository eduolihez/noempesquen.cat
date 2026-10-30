/**
 * Icones pròpies de Rellotge: icona d'app (graella de 48), decorativa.
 */
import { useIdSvg } from '../../ui/icones';

/* Rellotge: esfera fosca amb agulles i marques. */
export function IconaRellotge( { mida = 24 } ) {
	const g = useIdSvg( 'rlg' );
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
					<stop offset="0" stopColor="#4a4f5a" />
					<stop offset="1" stopColor="#1b1e25" />
				</linearGradient>
			</defs>
			<rect width="48" height="48" rx="11" fill={ `url(#${ g })` } />
			<circle cx="24" cy="24" r="16" fill="#fff" />
			<g stroke="#1b1e25" strokeWidth="2" strokeLinecap="round">
				<path d="M24 11.5v3" />
				<path d="M24 33.5v3" />
				<path d="M11.5 24h3" />
				<path d="M33.5 24h3" />
			</g>
			<path
				d="M24 24V15.5"
				stroke="#1b1e25"
				strokeWidth="2.6"
				strokeLinecap="round"
			/>
			<path
				d="M24 24l6.5 3.8"
				stroke="#e8590c"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<circle cx="24" cy="24" r="1.8" fill="#e8590c" />
		</svg>
	);
}
