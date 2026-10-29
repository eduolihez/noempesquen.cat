/**
 * Icones SVG pròpies del sistema simulat.
 *
 * - Glifs del sistema: traç d'1,4 px sobre una graella de 20, color actual.
 * - Controls de finestra: traç d'1 px sobre una graella de 10.
 * - Icones d'app: graella de 48, volum amb degradats suaus.
 *
 * Totes són decoratives (aria-hidden): l'etiqueta la porta el control.
 */
import { useId } from '@wordpress/element';

const decoratiu = { 'aria-hidden': true, focusable: 'false' };

/* Els id de React porten «:», que no van bé dins url(#...). */
export const useIdSvg = ( prefix ) =>
	`${ prefix }${ useId().replace( /:/g, '' ) }`;

export function Glif( { mida = 16, children, ...resta } ) {
	return (
		<svg
			viewBox="0 0 20 20"
			width={ mida }
			height={ mida }
			fill="none"
			stroke="currentColor"
			strokeWidth="1.4"
			strokeLinecap="round"
			strokeLinejoin="round"
			{ ...decoratiu }
			{ ...resta }
		>
			{ children }
		</svg>
	);
}

export const IconaCerca = ( p ) => (
	<Glif { ...p }>
		<circle cx="8.5" cy="8.5" r="5.25" />
		<path d="M12.4 12.4 16.6 16.6" />
	</Glif>
);

export const IconaLupa = ( p ) => (
	<Glif { ...p }>
		<circle cx="8.25" cy="8.25" r="5.5" />
		<path d="M5.4 7.4a3 3 0 0 1 2-2" />
		<path d="M12.3 12.3 17 17" strokeWidth="2.6" />
	</Glif>
);

export const IconaWifi = ( p ) => (
	<Glif { ...p }>
		<path d="M2.4 7.6a10.8 10.8 0 0 1 15.2 0" />
		<path d="M4.9 10.3a7.2 7.2 0 0 1 10.2 0" />
		<path d="M7.5 13a3.5 3.5 0 0 1 5 0" />
		<circle cx="10" cy="15.6" r="0.9" fill="currentColor" stroke="none" />
	</Glif>
);

export const IconaVolum = ( p ) => (
	<Glif { ...p }>
		<path d="M3 7.6h2.8L9.6 4.3v11.4l-3.8-3.3H3z" />
		<path d="M12.6 7.4a3.7 3.7 0 0 1 0 5.2" />
		<path d="M14.8 5.2a6.8 6.8 0 0 1 0 9.6" />
	</Glif>
);

export const IconaBateria = ( p ) => (
	<Glif { ...p }>
		<rect x="2" y="6.2" width="13.6" height="7.6" rx="2" />
		<path d="M17.6 8.6v2.8" strokeWidth="1.8" />
		<rect
			x="3.9"
			y="8.1"
			width="7.6"
			height="3.8"
			rx="0.8"
			fill="currentColor"
			stroke="none"
		/>
	</Glif>
);

export const IconaCampana = ( p ) => (
	<Glif { ...p }>
		<path d="M10 3.2a4.6 4.6 0 0 0-4.6 4.6v2.7L4 13.6h12l-1.4-3.1V7.8A4.6 4.6 0 0 0 10 3.2z" />
		<path d="M8.1 15.9a2 2 0 0 0 3.8 0" />
	</Glif>
);

export const IconaApaga = ( p ) => (
	<Glif { ...p }>
		<path d="M10 2.8v6.6" />
		<path d="M6.1 5.2a6.2 6.2 0 1 0 7.8 0" />
	</Glif>
);

function Control( { children } ) {
	return (
		<svg
			viewBox="0 0 10 10"
			width="10"
			height="10"
			fill="none"
			stroke="currentColor"
			strokeWidth="1"
			{ ...decoratiu }
		>
			{ children }
		</svg>
	);
}

export const IconaMinimitza = () => (
	<Control>
		<path d="M0 5.5h10" />
	</Control>
);

export const IconaMaximitza = () => (
	<Control>
		<rect x="0.5" y="0.5" width="9" height="9" rx="1.5" />
	</Control>
);

export const IconaRestaura = () => (
	<Control>
		<rect x="0.5" y="2.5" width="7" height="7" rx="1.2" />
		<path d="M2.5 2.5V2A1.5 1.5 0 0 1 4 .5h4A1.5 1.5 0 0 1 9.5 2v4A1.5 1.5 0 0 1 8 7.5h-.5" />
	</Control>
);

export const IconaTanca = () => (
	<Control>
		<path d="M.6.6l8.8 8.8M9.4.6.6 9.4" />
	</Control>
);

function App( { mida = 24, children } ) {
	return (
		<svg
			viewBox="0 0 48 48"
			width={ mida }
			height={ mida }
			{ ...decoratiu }
		>
			{ children }
		</svg>
	);
}

/* Navegador: una finestra que dona al mar, amb el sol a l'horitzó. */
export function IconaNavegador( { mida } ) {
	const g = useIdSvg( 'nav' );
	return (
		<App mida={ mida }>
			<defs>
				<linearGradient id={ `${ g }c` } x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#3cc3cf" />
					<stop offset="1" stopColor="#0b5e7a" />
				</linearGradient>
				<clipPath id={ `${ g }r` }>
					<rect x="4" y="5" width="40" height="38" rx="9" />
				</clipPath>
			</defs>
			<g clipPath={ `url(#${ g }r)` }>
				<rect
					x="4"
					y="5"
					width="40"
					height="38"
					fill={ `url(#${ g }c)` }
				/>
				<rect x="4" y="5" width="40" height="10" fill="#08485e" />
				<rect
					x="9"
					y="8.5"
					width="30"
					height="3.5"
					rx="1.75"
					fill="#fff"
					fillOpacity=".55"
				/>
				<circle cx="31" cy="28" r="5" fill="#ffb84d" />
				<path
					d="M4 30c4.6-3.4 9.4-3.4 14 0s9.4 3.4 14 0 8.6-3.4 12-.8V43H4z"
					fill="#0a6f8c"
				/>
				<path
					d="M4 35c4.6-3.4 9.4-3.4 14 0s9.4 3.4 14 0 8.6-3.4 12-.8V43H4z"
					fill="#e9fbfb"
				/>
			</g>
		</App>
	);
}

/* Parla: bafarada verda amb tres punts. */
export function IconaParla( { mida } ) {
	const g = useIdSvg( 'par' );
	return (
		<App mida={ mida }>
			<defs>
				<linearGradient id={ g } x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#45d38a" />
					<stop offset="1" stopColor="#139455" />
				</linearGradient>
			</defs>
			<path
				d="M5 13a8 8 0 0 1 8-8h22a8 8 0 0 1 8 8v13.5a8 8 0 0 1-8 8H21.5L12 42.5v-8.2A8 8 0 0 1 5 26.5z"
				fill={ `url(#${ g })` }
			/>
			<path
				d="M13 6.5h22a6.5 6.5 0 0 1 6.5 6.5"
				fill="none"
				stroke="#fff"
				strokeOpacity=".35"
				strokeWidth="1.2"
				strokeLinecap="round"
			/>
			<g fill="#fff">
				<circle cx="15.5" cy="20" r="2.7" />
				<circle cx="24" cy="20" r="2.7" />
				<circle cx="32.5" cy="20" r="2.7" />
			</g>
		</App>
	);
}

/* Posta: sobre de correu en el seu color d'accent. */
export function IconaPosta( { mida } ) {
	const g = useIdSvg( 'pos' );
	return (
		<App mida={ mida }>
			<defs>
				<linearGradient id={ g } x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#e8694c" />
					<stop offset="1" stopColor="#b5381f" />
				</linearGradient>
			</defs>
			<rect
				x="4"
				y="9"
				width="40"
				height="30"
				rx="5"
				fill={ `url(#${ g })` }
			/>
			<path
				d="M6.5 12.5 24 26l17.5-13.5"
				fill="none"
				stroke="#fff"
				strokeWidth="2.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M6.5 36 18 24.5M41.5 36 30 24.5"
				stroke="#fff"
				strokeOpacity=".35"
				strokeWidth="1.6"
				strokeLinecap="round"
			/>
		</App>
	);
}

/* Paperera: cubell translúcid amb tapa. */
export function IconaPaperera( { mida } ) {
	const g = useIdSvg( 'pap' );
	return (
		<App mida={ mida }>
			<defs>
				<linearGradient id={ g } x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#f4f8fc" />
					<stop offset="1" stopColor="#b3c4d6" />
				</linearGradient>
			</defs>
			<path
				d="M11.5 14h25l-2.3 25.4a3.2 3.2 0 0 1-3.2 2.9H17a3.2 3.2 0 0 1-3.2-2.9z"
				fill={ `url(#${ g })` }
				stroke="#7b91a8"
				strokeWidth="1.2"
			/>
			<path
				d="M19 19.5v17M24 19.5v17M29 19.5v17"
				stroke="#7b91a8"
				strokeOpacity=".7"
				strokeWidth="1.4"
				strokeLinecap="round"
			/>
			<rect
				x="8.5"
				y="8.5"
				width="31"
				height="5.5"
				rx="2.75"
				fill="#dbe5ef"
				stroke="#7b91a8"
				strokeWidth="1.2"
			/>
		</App>
	);
}

/* Marca del botó d'inici: una gota partida per una onada (no és cap logotip real). */
export function MarcaInici( { mida = 22 } ) {
	const g = useIdSvg( 'ini' );
	const onada = 'M2 24c5.5-4.4 11-4.4 16.5 0s11 4.4 16.5 0 9.5-4.4 13-1.6';
	return (
		<App mida={ mida }>
			<defs>
				<linearGradient id={ `${ g }a` } x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#6fe0cf" />
					<stop offset="1" stopColor="#1fa3ad" />
				</linearGradient>
				<linearGradient id={ `${ g }b` } x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#1489a2" />
					<stop offset="1" stopColor="#0b5e7a" />
				</linearGradient>
				<clipPath id={ `${ g }c` }>
					<path d="M24 3c7 8.6 18 16.4 18 26.5a18 18 0 0 1-36 0C6 19.4 17 11.6 24 3z" />
				</clipPath>
				<mask id={ `${ g }m` }>
					<rect width="48" height="48" fill="#fff" />
					<path
						d={ onada }
						fill="none"
						stroke="#000"
						strokeWidth="3.4"
					/>
				</mask>
			</defs>
			<g clipPath={ `url(#${ g }c)` } mask={ `url(#${ g }m)` }>
				<rect width="48" height="48" fill={ `url(#${ g }b)` } />
				<path d={ `${ onada }V0H2z` } fill={ `url(#${ g }a)` } />
			</g>
		</App>
	);
}

/* Informe de la missió: graella de 24, traç gruixut, color actual. */
function Traca( { mida = 20, children } ) {
	return (
		<svg
			viewBox="0 0 24 24"
			width={ mida }
			height={ mida }
			fill="none"
			stroke="currentColor"
			strokeWidth="2.6"
			strokeLinecap="round"
			strokeLinejoin="round"
			{ ...decoratiu }
		>
			{ children }
		</svg>
	);
}

export const IconaFet = ( p ) => (
	<Traca { ...p }>
		<path d="M5 12.5 10 17.5 19 7" />
	</Traca>
);

export const IconaFalla = ( p ) => (
	<Traca { ...p }>
		<path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />
	</Traca>
);

export const IconaSalvavides = ( p ) => (
	<Traca { ...p }>
		<circle cx="12" cy="12" r="9" />
		<circle cx="12" cy="12" r="4" />
		<path d="M5.6 5.6 9.2 9.2M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6" />
	</Traca>
);

/* Estrella de cinc puntes amb les puntes arrodonides. */
export function Estrella( { mida = 56, plena } ) {
	return (
		<svg
			viewBox="0 0 48 48"
			width={ mida }
			height={ mida }
			strokeLinejoin="round"
			strokeWidth="3"
			{ ...decoratiu }
		>
			<path
				d="M24 4.5 29.9 16.6 43.2 18.5 33.6 27.8 35.9 41 24 34.8 12.1 41 14.4 27.8 4.8 18.5 18.1 16.6Z"
				fill={ plena ? 'currentColor' : 'none' }
				stroke="currentColor"
			/>
		</svg>
	);
}
