/**
 * Glifs i favicons propis del navegador. Glifs: graella de 20, traç d'1,4 px,
 * color actual. Favicons: graella de 16, a color. Tots decoratius.
 */
import { Glif } from '../../ui/icones';

const decoratiu = { 'aria-hidden': true, focusable: 'false' };

export const IconaEnrere = ( p ) => (
	<Glif { ...p }>
		<path d="M16 10H4.4M9.2 5 4.2 10l5 5" />
	</Glif>
);

export const IconaEndavant = ( p ) => (
	<Glif { ...p }>
		<path d="M4 10h11.6M10.8 5l5 5-5 5" />
	</Glif>
);

export const IconaRecarrega = ( p ) => (
	<Glif { ...p }>
		<path d="M15.6 10a5.6 5.6 0 1 1-1.7-4" />
		<path d="M14.4 2.8v3.6h-3.6" />
	</Glif>
);

export const IconaCadenat = ( p ) => (
	<Glif { ...p }>
		<rect x="4.6" y="8.6" width="10.8" height="8" rx="1.6" />
		<path d="M7.2 8.6V6.4a2.8 2.8 0 0 1 5.6 0v2.2" />
	</Glif>
);

export const IconaAvis = ( p ) => (
	<Glif { ...p }>
		<path d="M10 3.2 17.4 16H2.6z" />
		<path d="M10 8.2v3.6" />
		<circle cx="10" cy="13.9" r="0.5" fill="currentColor" />
	</Glif>
);

export const IconaInfo = ( p ) => (
	<Glif { ...p }>
		<circle cx="10" cy="10" r="7" />
		<path d="M10 9v4.6" />
		<circle cx="10" cy="6.4" r="0.5" fill="currentColor" />
	</Glif>
);

export const IconaMes = ( p ) => (
	<Glif { ...p }>
		<path d="M10 4.4v11.2M4.4 10h11.2" />
	</Glif>
);

export const IconaTancaPetita = ( p ) => (
	<Glif { ...p }>
		<path d="M5.6 5.6l8.8 8.8M14.4 5.6l-8.8 8.8" />
	</Glif>
);

export const IconaCercaNav = ( p ) => (
	<Glif { ...p }>
		<circle cx="8.6" cy="8.6" r="5" />
		<path d="M12.4 12.4 16.4 16.4" />
	</Glif>
);

/* Full trencat: la web no respon. */
export const IconaSenseConnexio = ( { mida = 72 } ) => (
	<svg
		viewBox="0 0 72 72"
		width={ mida }
		height={ mida }
		fill="none"
		stroke="currentColor"
		strokeWidth="3"
		strokeLinejoin="round"
		strokeLinecap="round"
		{ ...decoratiu }
	>
		<path d="M18 8h26l12 12v44H18z" />
		<path d="M44 8v12h12" />
		<path d="M28 38l4 4M32 38l-4 4M42 38l4 4M46 38l-4 4" />
		<path d="M29 54q8-5 16 0" />
	</svg>
);

function Favicon( { mida = 16, children } ) {
	return (
		<svg
			viewBox="0 0 16 16"
			width={ mida }
			height={ mida }
			{ ...decoratiu }
		>
			{ children }
		</svg>
	);
}

/* Món genèric: webs sense favicon propi o que no carreguen. */
export const FaviconMon = ( { mida } ) => (
	<Favicon mida={ mida }>
		<g fill="none" stroke="#5f6368" strokeWidth="1.2">
			<circle cx="8" cy="8" r="6.2" />
			<ellipse cx="8" cy="8" rx="2.7" ry="6.2" />
			<path d="M2 8h12M3 4.8h10M3 11.2h10" strokeWidth="0.9" />
		</g>
	</Favicon>
);

export const FaviconPosta = ( { mida } ) => (
	<Favicon mida={ mida }>
		<rect x="1" y="3" width="14" height="10" rx="2" fill="#c8452c" />
		<path
			d="M2.4 4.6 8 9l5.6-4.4"
			fill="none"
			stroke="#fff"
			strokeWidth="1.4"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</Favicon>
);

/* Llum Clara: bombeta groga. Les còpies falses també el copien. */
export const FaviconLlumClara = ( { mida } ) => (
	<Favicon mida={ mida }>
		<circle cx="8" cy="6.4" r="4.9" fill="#f5a300" />
		<rect x="5.8" y="11.2" width="4.4" height="3.6" rx="1" fill="#1d2a44" />
		<path
			d="M6.6 7.4 8 5.4l1.4 2"
			fill="none"
			stroke="#fff"
			strokeWidth="1.2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</Favicon>
);

export const FaviconDiari = ( { mida } ) => (
	<Favicon mida={ mida }>
		<rect x="1.5" y="2" width="13" height="12" rx="1.5" fill="#2d3a4a" />
		<path
			d="M4 5h8M4 8h3.6M4 11h3.6M9.2 8H12v3H9.2z"
			stroke="#fff"
			strokeWidth="1.2"
			fill="none"
		/>
	</Favicon>
);
