/**
 * Fons de pantalla propi: corrents d'aigua abstractes, sense imatges.
 * Es comparteix entre el bloqueig (desenfocat) i l'escriptori.
 */
import { useIdSvg } from '../../ui/icones';

export function Fons() {
	const g = useIdSvg( 'fons' );
	return (
		<svg
			className="nep-so-fons"
			viewBox="0 0 1600 1000"
			preserveAspectRatio="xMidYMid slice"
			aria-hidden="true"
			focusable="false"
		>
			<defs>
				<linearGradient id={ `${ g }cel` } x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#0a2346" />
					<stop offset="0.5" stopColor="#0f4a76" />
					<stop offset="1" stopColor="#1d7e99" />
				</linearGradient>
				<radialGradient
					id={ `${ g }llum` }
					cx="0.68"
					cy="0.38"
					r="0.55"
				>
					<stop offset="0" stopColor="#bdf1f4" stopOpacity="0.85" />
					<stop
						offset="0.45"
						stopColor="#5cc3d6"
						stopOpacity="0.35"
					/>
					<stop offset="1" stopColor="#5cc3d6" stopOpacity="0" />
				</radialGradient>
				<linearGradient id={ `${ g }c1` } x1="0" y1="1" x2="1" y2="0">
					<stop offset="0" stopColor="#0d5d86" />
					<stop offset="0.55" stopColor="#38a9c6" />
					<stop offset="1" stopColor="#d4f6f3" />
				</linearGradient>
				<linearGradient id={ `${ g }c2` } x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stopColor="#5fd0d9" stopOpacity="0" />
					<stop offset="0.5" stopColor="#8fe3e4" stopOpacity="0.75" />
					<stop offset="1" stopColor="#ffffff" stopOpacity="0.9" />
				</linearGradient>
				<linearGradient id={ `${ g }c3` } x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#0a2a52" />
					<stop offset="1" stopColor="#0c3f69" />
				</linearGradient>
				<filter
					id={ `${ g }suau` }
					x="-10%"
					y="-10%"
					width="120%"
					height="120%"
				>
					<feGaussianBlur stdDeviation="10" />
				</filter>
				<filter
					id={ `${ g }fi` }
					x="-10%"
					y="-10%"
					width="120%"
					height="120%"
				>
					<feGaussianBlur stdDeviation="2.5" />
				</filter>
			</defs>
			<rect width="1600" height="1000" fill={ `url(#${ g }cel)` } />
			<rect width="1600" height="1000" fill={ `url(#${ g }llum)` } />
			{ /* corrent principal */ }
			<path
				d="M-100 900C200 760 420 520 760 520s620 120 940-260v-400h-60C1380 120 1100 300 820 330S300 420-100 720z"
				fill={ `url(#${ g }c1)` }
				opacity="0.9"
				filter={ `url(#${ g }fi)` }
			/>
			{ /* vel clar */ }
			<path
				d="M-100 820C260 660 520 600 820 600s560-120 880-420v60C1400 520 1140 660 840 668S280 760-100 920z"
				fill={ `url(#${ g }c2)` }
				opacity="0.85"
				filter={ `url(#${ g }suau)` }
			/>
			{ /* fil de llum */ }
			<path
				d="M-60 870C300 700 540 640 830 636s560-150 840-430"
				fill="none"
				stroke="#ffffff"
				strokeOpacity="0.5"
				strokeWidth="3"
				filter={ `url(#${ g }fi)` }
			/>
			{ /* fons marí */ }
			<path
				d="M-100 1100V940C220 820 500 760 860 760s560-60 840-240v580z"
				fill={ `url(#${ g }c3)` }
				opacity="0.95"
				filter={ `url(#${ g }suau)` }
			/>
		</svg>
	);
}
