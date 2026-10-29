/**
 * Marca de Llum Clara: bombeta i logotip. La còpia falsa en fa una versió
 * gairebé igual: groc més pàl·lid, sense el filament, rosca d'una sola
 * peça i el nom amb un altre pes i un blau una mica diferent.
 */

function Bombeta( { falsa } ) {
	if ( falsa ) {
		return (
			<svg
				viewBox="0 0 36 36"
				width="36"
				height="36"
				aria-hidden="true"
				focusable="false"
			>
				<circle cx="18" cy="14.6" r="11" fill="#ffb81c" />
				<rect
					x="12.6"
					y="25"
					width="10.8"
					height="7"
					rx="2"
					fill="#26395f"
				/>
			</svg>
		);
	}
	return (
		<svg
			viewBox="0 0 36 36"
			width="36"
			height="36"
			aria-hidden="true"
			focusable="false"
		>
			<circle cx="18" cy="14" r="11" fill="#f5a300" />
			<path
				d="M14.6 16.2 18 11.4l3.4 4.8"
				fill="none"
				stroke="#fff"
				strokeWidth="2.2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<rect
				x="13.4"
				y="25.6"
				width="9.2"
				height="2.6"
				rx="1.3"
				fill="#1d2a44"
			/>
			<rect
				x="14.6"
				y="29.6"
				width="6.8"
				height="2.6"
				rx="1.3"
				fill="#1d2a44"
			/>
		</svg>
	);
}

/**
 * @param {Object}  props
 * @param {boolean} props.falsa Versió de la còpia.
 */
export function MarcaLlumClara( { falsa = false } ) {
	return (
		<span className={ `nep-lc-marca${ falsa ? ' is-falsa' : '' }` }>
			<Bombeta falsa={ falsa } />
			<span className="nep-lc-marca__nom">Llum Clara</span>
		</span>
	);
}

/* Glifs propis de les webs de Llum Clara (graella de 24, traç d'1,8). */
function Glif24( { children, mida = 20 } ) {
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

export const IconaAvis = ( p ) => (
	<Glif24 { ...p }>
		<path d="M12 3.6 2.8 19.4h18.4z" />
		<path d="M12 9.6v4.6" />
		<circle cx="12" cy="16.9" r="0.5" fill="currentColor" />
	</Glif24>
);

export const IconaCorrecte = ( p ) => (
	<Glif24 { ...p }>
		<circle cx="12" cy="12" r="9" />
		<path d="m7.8 12.3 2.8 2.8 5.6-5.8" />
	</Glif24>
);

export const IconaCadenat = ( p ) => (
	<Glif24 { ...p }>
		<rect x="5" y="10.5" width="14" height="10" rx="2" />
		<path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7" />
	</Glif24>
);

export const IconaFactura = ( p ) => (
	<Glif24 { ...p }>
		<path d="M6 3h9l3 3v15l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2L6 21z" />
		<path d="M9 9h6M9 12.5h6M9 16h3.5" />
	</Glif24>
);

export const IconaEina = ( p ) => (
	<Glif24 { ...p }>
		<path d="M14.6 6.2a4 4 0 0 0 5 5L12 18.8a2.3 2.3 0 0 1-3.3-3.3z" />
		<path d="m4 20 4.2-4.2" />
	</Glif24>
);

export const IconaCanvi = ( p ) => (
	<Glif24 { ...p }>
		<path d="M4 8h13l-3.4-3.4M20 16H7l3.4 3.4" />
	</Glif24>
);
