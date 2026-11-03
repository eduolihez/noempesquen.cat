/**
 * Dibuix d'un node del mapa segons el tema i l'estat. Decoratiu: el nom,
 * el número i l'estat els porta el botó (Mapa.js).
 *
 * - carta (el Pesquer): boia de senyalització. Feta: boia blanca amb franja
 *   verda i una estrella al cim; disponible: boia groga; bloquejada: grisa.
 * - tresor (el Pirata): illa. Feta: illa amb bandera; disponible: illa amb
 *   la X vermella; bloquejada: illa grisa sota la boira.
 *
 * Colors i animacions, a estils/_mapa.scss (classes nep-mapa__art-*).
 */

const ESTRELLA =
	'M32 1.5 34.4 6.4 39.8 7.2 35.9 11 36.8 16.4 32 13.9 27.2 16.4 28.1 11 24.2 7.2 29.6 6.4Z';

function Boia( { estat } ) {
	return (
		<>
			<path
				className="nep-mapa__art-onada"
				d="M5 57q6.75-4 13.5 0t13.5 0 13.5 0 13.5 0"
			/>
			<path className="nep-mapa__art-pal" d="M32 9v9" />
			{ estat === 'feta' ? (
				<path className="nep-mapa__art-estrella" d={ ESTRELLA } />
			) : (
				<circle className="nep-mapa__art-llum" cx="32" cy="8" r="4.5" />
			) }
			<circle className="nep-mapa__art-cos" cx="32" cy="36" r="19" />
			<path
				className="nep-mapa__art-banda"
				d="M15.4 45.5a19 19 0 0 0 33.2 0Z"
			/>
		</>
	);
}

function Illa( { estat } ) {
	return (
		<>
			<ellipse
				className="nep-mapa__art-onada"
				cx="32"
				cy="47"
				rx="29"
				ry="11"
			/>
			<path
				className="nep-mapa__art-illa"
				d="M7 45c0-6.5 6.5-11 15-11.5 4-5 13-6.5 20-3 8 .5 15 5 15 11.5 0 5.5-5 8-13 8H17c-6.5 0-10-2-10-5z"
			/>
			<path
				className="nep-mapa__art-tronc"
				d="M18 36c0-6 1.5-11 4.5-15"
			/>
			<path
				className="nep-mapa__art-palmera"
				d="M22.5 21c-4-3-9-2.5-12 .5 4-.5 7.5 0 12-.5Zm0 0c1.5-4.5 6-6.5 11-5-4 1-7.5 2.5-11 5Zm0 0c4 .5 7 3.5 7.5 8-2.5-3-5-5.5-7.5-8Zm0 0c-3 1.5-5 5-4.5 9 1-3.5 2.5-6.5 4.5-9Z"
			/>
			{ estat === 'feta' && (
				<>
					<path className="nep-mapa__art-pal" d="M42 39V17" />
					<path
						className="nep-mapa__art-bandera"
						d="M42 17.5h13l-3.5 4.5 3.5 4.5H42Z"
					/>
				</>
			) }
			{ estat === 'disponible' && (
				<path className="nep-mapa__art-x" d="M33 34l11 9M44 34l-11 9" />
			) }
			{ estat === 'bloquejada' && (
				<g className="nep-mapa__art-boira">
					<ellipse cx="24" cy="37" rx="19" ry="6" />
					<ellipse cx="42" cy="44" rx="18" ry="5.5" />
				</g>
			) }
		</>
	);
}

export function ArtNode( { tema, estat } ) {
	return (
		<svg
			className="nep-mapa__art"
			viewBox="0 0 64 64"
			aria-hidden="true"
			focusable="false"
		>
			{ tema === 'tresor' ? (
				<Illa estat={ estat } />
			) : (
				<Boia estat={ estat } />
			) }
		</svg>
	);
}
