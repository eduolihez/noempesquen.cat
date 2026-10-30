/**
 * Icones pròpies de l'app Banc Sòlid: icona d'app (graella de 48) i glifs
 * (graella de 20, color actual). Totes decoratives.
 */
import { Glif } from '../../ui/icones';

/* Banc Sòlid: tres blocs apilats sobre fons blau, com la marca de la web. */
export function IconaBancSolid( { mida = 24 } ) {
	return (
		<svg
			viewBox="0 0 48 48"
			width={ mida }
			height={ mida }
			aria-hidden="true"
			focusable="false"
		>
			<rect width="48" height="48" rx="11" fill="#12355b" />
			<rect x="12" y="11" width="24" height="7" rx="2" fill="#2f9e6e" />
			<rect x="9" y="20.5" width="30" height="7" rx="2" fill="#fff" />
			<rect x="6" y="30" width="36" height="7" rx="2" fill="#fff" />
		</svg>
	);
}

export const IconaEnrere = ( p ) => (
	<Glif { ...p }>
		<path d="m12 4-6 6 6 6M6 10h11" />
	</Glif>
);

export const IconaMoviments = ( p ) => (
	<Glif { ...p }>
		<path d="M4 6h12M4 10h12M4 14h8" />
	</Glif>
);

export const IconaTransferir = ( p ) => (
	<Glif { ...p }>
		<path d="M4 7h12l-3-3M16 13H4l3 3" />
	</Glif>
);

export const IconaCorrecteApp = ( p ) => (
	<Glif { ...p }>
		<circle cx="10" cy="10" r="7" />
		<path d="m6.8 10.2 2.2 2.2 4.2-4.4" />
	</Glif>
);
