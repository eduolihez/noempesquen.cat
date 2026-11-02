/**
 * El Pesquer: barca de pesca blava i blanca amb la Llissa a la finestra
 * de la cabina. Presentacional i decoratiu (aria-hidden): el nom accessible
 * el posa el botó que l'embolcalla.
 *
 * viewBox 500×420; línia de flotació a y = 330.
 */
import { Llissa } from '../avatars';
import { useIdSvg } from '../icones';
import { GavinaPosada } from './Gavina';
import { Onada } from './Onada';
import { banderins, onada, punts, trac } from './comu';
import { Bota, GradientBuc, MascaraReflex, Reflex } from './Detalls';

const T = trac( 5 );
const T3 = trac( 3 );
const BLAU = '#1f5fa8';
const VERMELL = '#d9392b';
const FUSTA = '#8a5a3b';
const VIDRE = '#bfe6f0';

const BUC = 'M30 244H452Q486 242 498 206Q492 290 456 344H72Q40 300 30 244Z';
const FINESTRA = 'M256 162h68v56h-68Z';
const BANDERINS = banderins( 151, 46, 36, 240, 7 );
const REMACHES = punts(
	[ 90, 130, 170, 210, 250, 290, 330, 370, 410 ].map( ( x ) => [ x, 296 ] )
);
const ESCUMA = onada( { x0: 96, x1: 440, y: 335, amp: 5, periode: 26 } );

export function Pesquer( {
	activa = false,
	seleccionada = false,
	classe = '',
} ) {
	const xarxa = useIdSvg( 'nep-xarxa-' );
	const buc = useIdSvg( 'nep-buc-' );
	const finestra = useIdSvg( 'nep-fin-' );
	const llum = `${ buc }l`;
	const reflex = `${ buc }r`;
	const estat = [
		'nep-port__barca',
		'nep-port__barca--pesquer',
		activa && 'is-activa',
		seleccionada && 'is-seleccionada',
		classe,
	]
		.filter( Boolean )
		.join( ' ' );
	return (
		<svg
			className={ estat }
			viewBox="0 0 500 420"
			aria-hidden="true"
			focusable="false"
		>
			<defs>
				<pattern
					id={ xarxa }
					width="12"
					height="12"
					patternUnits="userSpaceOnUse"
					patternTransform="rotate(45)"
				>
					<path
						d="M0 0h12M0 0v12"
						stroke="#0b1e3f"
						strokeWidth="2"
						fill="none"
					/>
					<circle r="2.2" fill="#0b1e3f" />
					<circle cx="12" cy="12" r="2.2" fill="#0b1e3f" />
				</pattern>
				<GradientBuc id={ llum } />
				<MascaraReflex id={ reflex } flota={ 330 } />
				<clipPath id={ buc }>
					<path d={ BUC } />
				</clipPath>
				<clipPath id={ finestra }>
					<path d={ FINESTRA } />
				</clipPath>
			</defs>
			<g className="nep-port__balanc">
				{ /* Obencs */ }
				<path d="M151 46L36 240M151 46L470 222" fill="none" { ...T3 } />
				{ /* Banderins de festa al cap de proa */ }
				{ [ VERMELL, '#f2b705', '#2fa36b' ].map( ( c, i ) => (
					<path
						key={ c }
						d={ BANDERINS[ i ] }
						fill={ c }
						stroke="#0b1e3f"
						strokeWidth="2"
						strokeLinejoin="round"
					/>
				) ) }
				{ /* Gallardet */ }
				<g transform="translate(156 40)">
					<path
						className="nep-port__gallardet"
						d="M0 0L42 9 0 18Z"
						fill={ VERMELL }
						{ ...T3 }
					/>
				</g>
				<rect
					x="146"
					y="36"
					width="10"
					height="212"
					rx="4"
					fill={ FUSTA }
					{ ...T }
				/>
				<path
					d="M152 50v190"
					stroke="#b07a48"
					strokeWidth="2.5"
					strokeDasharray="30 12 50 14"
				/>
				<path d="M92 92H214" fill="none" { ...T } />
				{ /* Xarxa penjada de la verga */ }
				<path
					d="M96 94Q66 168 104 246H146V94Z"
					fill="#e8dcc0"
					{ ...T3 }
				/>
				<path
					d="M96 94Q66 168 104 246H146V94Z"
					fill={ `url(#${ xarxa })` }
					opacity=".5"
				/>
				<g fill="#f2b705" { ...T3 }>
					<circle cx="92" cy="128" r="6" />
					<circle cx="84" cy="168" r="6" />
					<circle cx="90" cy="208" r="6" />
				</g>
				{ /* Fanal */ }
				<path d="M208 92v18" fill="none" { ...T3 } />
				<circle
					className="nep-port__llum"
					cx="208"
					cy="124"
					r="30"
					fill="#ffd54a"
				/>
				<rect
					className="nep-port__fanal"
					x="198"
					y="110"
					width="20"
					height="26"
					rx="5"
					{ ...T3 }
				/>
				<path d="M196 110h24" fill="none" { ...T3 } />
				{ /* Fum */ }
				<g transform="translate(368 76)">
					<circle className="nep-port__fum" r="12" />
					<circle className="nep-port__fum" r="12" />
					<circle className="nep-port__fum" r="12" />
				</g>
				<path d="M355 98h24l-2 42h-20Z" fill={ VERMELL } { ...T } />
				<path
					d="M356 112h22"
					fill="none"
					stroke="#fff"
					strokeWidth="6"
				/>
				{ /* Cabina */ }
				<rect
					x="250"
					y="148"
					width="130"
					height="102"
					rx="8"
					fill="#fff"
					{ ...T }
				/>
				<rect
					x="240"
					y="134"
					width="150"
					height="18"
					rx="7"
					fill={ BLAU }
					{ ...T }
				/>
				<path
					d="M248 139H382M256 154v88"
					stroke="#8fc0f0"
					strokeWidth="3.5"
					strokeLinecap="round"
				/>
				<path
					d="M370 156v88"
					stroke="#0b1e3f"
					strokeWidth="8"
					opacity=".1"
				/>
				<path d={ FINESTRA } fill={ VIDRE } />
				<g clipPath={ `url(#${ finestra })` }>
					<g transform="translate(334 165) scale(-1 1)">
						<Llissa
							estat={ activa ? 'contenta' : 'normal' }
							mida={ 84 }
						/>
					</g>
				</g>
				<path d={ FINESTRA } fill="none" { ...T } />
				<rect
					x="334"
					y="166"
					width="32"
					height="34"
					rx="6"
					fill={ VIDRE }
					{ ...T }
				/>
				<path
					d="M342 174l10-6"
					stroke="#fff"
					strokeWidth="4"
					strokeLinecap="round"
				/>
				<circle cx="300" cy="234" r="12" fill="#fff" { ...T } />
				<circle
					cx="300"
					cy="234"
					r="12"
					fill="none"
					stroke={ VERMELL }
					strokeWidth="5"
					strokeDasharray="9.4 9.4"
				/>
				<circle cx="300" cy="234" r="5" fill="#fff" { ...T3 } />
				<Bota x={ 404 } y={ 244 } />
				<Bota x={ 432 } y={ 244 } />
				{ /* Caixa de peix */ }
				<path
					d="M184 214l10 8 12-10 10 10 10-8"
					fill="#9fd0e0"
					{ ...T3 }
				/>
				<rect
					x="180"
					y="220"
					width="54"
					height="26"
					rx="3"
					fill="#c98a4b"
					{ ...T3 }
				/>
				<path
					d="M40 226H240M70 226v20M110 226v20M210 226v20"
					fill="none"
					{ ...T3 }
				/>
				{ /* Buc */ }
				<path d={ BUC } fill="#fff" />
				<g clipPath={ `url(#${ buc })` }>
					<rect x="0" y="282" width="500" height="80" fill={ BLAU } />
					<rect x="0" y="276" width="500" height="7" fill="#f2b705" />
					<rect
						y="244"
						width="500"
						height="100"
						fill={ `url(#${ llum })` }
					/>
					<path
						d={ REMACHES }
						stroke="#9cc4ee"
						strokeWidth="4.5"
						strokeLinecap="round"
					/>
				</g>
				<path d={ BUC } fill="none" { ...T } />
				<path d="M30 244H452" fill="none" { ...T3 } />
				<g fill={ VIDRE } { ...T3 }>
					<circle cx="96" cy="262" r="7" />
					<circle cx="132" cy="262" r="7" />
					<circle cx="404" cy="260" r="7" />
				</g>
				<text
					className="nep-port__nom"
					x="268"
					y="318"
					textAnchor="middle"
					fill="#fff"
				>
					PESQUER
				</text>
				{ activa && <GavinaPosada x={ 296 } y={ 134 } /> }
			</g>
			<Onada
				classe="nep-port__aigua"
				x0={ 0 }
				x1={ 500 }
				y={ 334 }
				amp={ 7 }
				periode={ 80 }
				fons={ 368 }
			/>
			<Reflex flota={ 330 } mascara={ reflex }>
				<path d={ BUC } fill="#fff" />
				<rect
					y="282"
					width="500"
					height="80"
					fill={ BLAU }
					clipPath={ `url(#${ buc })` }
				/>
			</Reflex>
			<path
				className="nep-port__escuma"
				d={ ESCUMA }
				fill="none"
				stroke="#fff"
				strokeWidth="5"
				strokeLinecap="round"
				opacity=".85"
			/>
			<ellipse
				cx="262"
				cy="346"
				rx="200"
				ry="6"
				fill="#0b1e3f"
				opacity=".14"
			/>
		</svg>
	);
}
