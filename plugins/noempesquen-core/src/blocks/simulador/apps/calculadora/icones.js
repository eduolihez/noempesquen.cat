/**
 * Icona pròpia de la Calculadora (graella de 48). Decorativa.
 */
import { useIdSvg } from '../../ui/icones';

/* Calculadora: placa fosca amb pantalla i graella de tecles. */
export function IconaCalculadora( { mida = 24 } ) {
	const g = useIdSvg( 'calc' );
	const tecles = [ 0, 1, 2 ].flatMap( ( f ) =>
		[ 0, 1, 2 ].map( ( c ) => (
			<rect
				key={ `${ f }-${ c }` }
				x={ 11 + c * 9.5 }
				y={ 23 + f * 7.5 }
				width="7"
				height="5"
				rx="1.6"
				fill={ f === 0 && c === 2 ? '#ffb020' : '#fff' }
				fillOpacity={ f === 0 && c === 2 ? 1 : 0.88 }
			/>
		) )
	);
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
					<stop offset="0" stopColor="#555c66" />
					<stop offset="1" stopColor="#20242b" />
				</linearGradient>
			</defs>
			<rect
				x="6"
				y="4"
				width="36"
				height="40"
				rx="8"
				fill={ `url(#${ g })` }
			/>
			<rect x="11" y="9" width="26" height="10" rx="3" fill="#a8e6c3" />
			<path
				d="M30 14h4"
				stroke="#20242b"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			{ tecles }
		</svg>
	);
}
