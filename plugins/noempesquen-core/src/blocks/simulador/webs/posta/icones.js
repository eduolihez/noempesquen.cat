/**
 * Glifs de Posta (graella de 20, traç d'1,4 px, color actual) i la marca.
 * Decoratius: l'etiqueta la porta el control.
 */
import { Glif } from '../../ui/icones';

export const IconaRedacta = ( p ) => (
	<Glif { ...p }>
		<path d="M12.6 4.2 15.8 7.4 7.4 15.8H4.2v-3.2z" />
		<path d="M10.8 6l3.2 3.2" />
	</Glif>
);

export const IconaEntrada = ( p ) => (
	<Glif { ...p }>
		<path d="M3.5 11.2 5.6 4.6a1.2 1.2 0 0 1 1.1-.8h6.6a1.2 1.2 0 0 1 1.1.8l2.1 6.6v3.8a1.2 1.2 0 0 1-1.2 1.2H4.7a1.2 1.2 0 0 1-1.2-1.2z" />
		<path d="M3.6 11.2h3.6l1 1.9h3.6l1-1.9h3.6" />
	</Glif>
);

export const IconaEstrella = ( { plena, ...p } ) => (
	<Glif { ...p }>
		<path
			d="m10 3.3 2 4.2 4.6.6-3.4 3.2.9 4.6L10 13.7l-4.1 2.2.9-4.6-3.4-3.2 4.6-.6z"
			fill={ plena ? 'currentColor' : 'none' }
		/>
	</Glif>
);

export const IconaEnviats = ( p ) => (
	<Glif { ...p }>
		<path d="M16.6 3.4 3.4 8.6l5.4 2.6 2.6 5.4z" />
		<path d="M16.6 3.4 8.8 11.2" />
	</Glif>
);

export const IconaArxiva = ( p ) => (
	<Glif { ...p }>
		<rect x="3" y="4" width="14" height="3.4" rx="0.8" />
		<path d="M4.4 7.4v7.4a1.2 1.2 0 0 0 1.2 1.2h8.8a1.2 1.2 0 0 0 1.2-1.2V7.4" />
		<path d="M10 9.6v4M8.2 12l1.8 1.8 1.8-1.8" />
	</Glif>
);

export const IconaBrossa = ( p ) => (
	<Glif { ...p }>
		<path d="M7.2 3.2h5.6l4 4v5.6l-4 4H7.2l-4-4V7.2z" />
		<path d="M10 6.6v4.2" />
		<circle cx="10" cy="13.4" r="0.6" fill="currentColor" />
	</Glif>
);

export const IconaPaperera = ( p ) => (
	<Glif { ...p }>
		<path d="M3.8 5.6h12.4M8 5.6V4.2h4v1.4" />
		<path d="M5.2 5.6l.8 10a1.2 1.2 0 0 0 1.2 1.1h5.6a1.2 1.2 0 0 0 1.2-1.1l.8-10" />
		<path d="M8.4 8.6v5M11.6 8.6v5" />
	</Glif>
);

export const IconaEnrere = ( p ) => (
	<Glif { ...p }>
		<path d="M16 10H4.4M9 5.2 4.2 10 9 14.8" />
	</Glif>
);

export const IconaMes = ( p ) => (
	<Glif { ...p }>
		<circle cx="10" cy="4.6" r="1.1" fill="currentColor" stroke="none" />
		<circle cx="10" cy="10" r="1.1" fill="currentColor" stroke="none" />
		<circle cx="10" cy="15.4" r="1.1" fill="currentColor" stroke="none" />
	</Glif>
);

export const IconaNoLlegit = ( p ) => (
	<Glif { ...p }>
		<path d="M11.4 5H4.2A1.2 1.2 0 0 0 3 6.2v8.6A1.2 1.2 0 0 0 4.2 16h11.6a1.2 1.2 0 0 0 1.2-1.2V9.6" />
		<path d="m3.4 6.4 6.6 4.8 3-2.2" />
		<circle cx="15.4" cy="5" r="2.1" fill="currentColor" stroke="none" />
	</Glif>
);

export const IconaLlegit = ( p ) => (
	<Glif { ...p }>
		<path d="M3 8.6 10 3.8l7 4.8v7.2A1.2 1.2 0 0 1 15.8 17H4.2A1.2 1.2 0 0 1 3 15.8z" />
		<path d="m3.4 9 6.6 4.6L16.6 9" />
	</Glif>
);

/* Ham de pescar: «Denuncia pesca». */
export const IconaHam = ( p ) => (
	<Glif { ...p }>
		<circle cx="12" cy="3.6" r="1.4" />
		<path d="M12 5v7.2a3.8 3.8 0 0 1-7.6 0V9.4l2.6 2.2" />
	</Glif>
);

export const IconaTancaX = ( p ) => (
	<Glif { ...p }>
		<path d="M5.4 5.4l9.2 9.2M14.6 5.4l-9.2 9.2" />
	</Glif>
);

/**
 * Marca de Posta: un sobre obert sobre un segell de vores dentades.
 *
 * @param {Object} props
 * @param {number} props.mida Alçada en píxels.
 */
export function MarcaPosta( { mida = 30 } ) {
	return (
		<svg
			viewBox="0 0 32 32"
			width={ mida }
			height={ mida }
			aria-hidden="true"
			focusable="false"
		>
			<path
				d="M5 3h22a2 2 0 0 1 2 2v1.6a1.4 1.4 0 0 0 0 2.8v2.8a1.4 1.4 0 0 0 0 2.8v2.8a1.4 1.4 0 0 0 0 2.8v2.8a1.4 1.4 0 0 0 0 2.8V27a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.6a1.4 1.4 0 0 0 0-2.8v-2.8a1.4 1.4 0 0 0 0-2.8v-2.8a1.4 1.4 0 0 0 0-2.8V9.4a1.4 1.4 0 0 0 0-2.8V5a2 2 0 0 1 2-2z"
				fill="#c8452c"
			/>
			<rect x="7.5" y="10" width="17" height="12" rx="1.6" fill="#fff" />
			<path
				d="m8.4 11 7.6 6 7.6-6"
				fill="none"
				stroke="#c8452c"
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
