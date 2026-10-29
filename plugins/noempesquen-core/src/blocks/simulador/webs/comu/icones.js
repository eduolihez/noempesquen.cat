/* Glifs propis de les webs simulades (graella de 24, traç d'1,8). */
export function Glif24( { children, mida = 20 } ) {
	return (
		<svg
			viewBox="0 0 24 24"
			width={ mida }
			height={ mida }
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			focusable="false"
		>
			{ children }
		</svg>
	);
}

export const IconaCadenat = ( p ) => (
	<Glif24 { ...p }>
		<rect x="5" y="10.5" width="14" height="10" rx="2" />
		<path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7" />
	</Glif24>
);
