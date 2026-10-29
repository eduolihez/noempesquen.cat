/**
 * Glifs propis de Parla (graella de 20, traç d'1,4 px, color actual).
 * Tots decoratius: l'etiqueta la porta el control.
 */
import { Glif } from '../../ui/icones';

export const IconaFixat = ( p ) => (
	<Glif { ...p }>
		<path d="M7.6 2.8h4.8l-.7 4.6 2.8 2.9H5.5l2.8-2.9z" />
		<path d="M10 10.3v6.9" />
	</Glif>
);

export const IconaNouXat = ( p ) => (
	<Glif { ...p }>
		<path d="M9 3.6H5.6a2 2 0 0 0-2 2v8.8a2 2 0 0 0 2 2h8.8a2 2 0 0 0 2-2V11" />
		<path d="M14.6 2.9a1.5 1.5 0 0 1 2.1 2.1l-6.2 6.2-2.8.7.7-2.8z" />
	</Glif>
);

export const IconaMes = ( p ) => (
	<Glif { ...p }>
		<g fill="currentColor" stroke="none">
			<circle cx="10" cy="4.6" r="1.4" />
			<circle cx="10" cy="10" r="1.4" />
			<circle cx="10" cy="15.4" r="1.4" />
		</g>
	</Glif>
);

export const IconaAvall = ( p ) => (
	<Glif { ...p }>
		<path d="M5 7.8l5 5 5-5" />
	</Glif>
);

export const IconaCara = ( p ) => (
	<Glif { ...p }>
		<circle cx="10" cy="10" r="7" />
		<path d="M7 11.8a3.6 3.6 0 0 0 6 0" />
		<g fill="currentColor" stroke="none">
			<circle cx="7.6" cy="8.2" r="0.95" />
			<circle cx="12.4" cy="8.2" r="0.95" />
		</g>
	</Glif>
);

export const IconaClip = ( p ) => (
	<Glif { ...p }>
		<path d="M15.6 9.4l-5.9 5.9a3.6 3.6 0 0 1-5.1-5.1l6.3-6.3a2.4 2.4 0 0 1 3.4 3.4l-6.2 6.2a1.2 1.2 0 0 1-1.7-1.7l5.5-5.5" />
	</Glif>
);

export const IconaMicro = ( p ) => (
	<Glif { ...p }>
		<rect x="7.4" y="2.6" width="5.2" height="9.4" rx="2.6" />
		<path d="M4.6 9.6a5.4 5.4 0 0 0 10.8 0" />
		<path d="M10 15v2.4" />
	</Glif>
);

/* Doble marca de llegit, més ampla que alta com a les apps de missatgeria. */
export function IconaLlegit() {
	return (
		<svg
			viewBox="0 0 18 11"
			width="17"
			height="11"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			focusable="false"
		>
			<path d="M1.2 6.1l3 3L10.6 1.8" />
			<path d="M8.4 8.6l.5.5 6.4-7.3" />
		</svg>
	);
}
