/**
 * El Pirata: balandra de fusta amb veles apedaçades, bandera amb una espina
 * de peix i canons de joguina. La Pirata Remei és al pont, al costat del
 * timó. Presentacional i decoratiu (aria-hidden).
 *
 * viewBox 520×520; línia de flotació a y = 400.
 */
import { Remei } from '../avatars';
import { useIdSvg } from '../icones';
import { GavinaPosada } from './Gavina';
import { Onada } from './Onada';
import { trac } from './comu';

const T = trac( 5 );
const T3 = trac( 3 );
const FUSTA = '#8a5a3b';
const FUSTA_FOSCA = '#6e4630';
const LONA = '#f4ead0';

const BUC =
	'M40 250H180V286H440Q480 282 506 252Q496 340 450 404H96Q56 330 40 250Z';

function Cano( { x } ) {
	return (
		<g transform={ `translate(${ x } 324)` }>
			<circle r="13" fill="#14213d" { ...T3 } />
			<rect
				x="-4"
				y="-7"
				width="30"
				height="14"
				rx="7"
				fill="#5b6b7f"
				{ ...T3 }
			/>
			<circle cx="28" cy="0" r="6" fill="#d9392b" { ...T3 } />
		</g>
	);
}

export function Pirata( {
	activa = false,
	seleccionada = false,
	classe = '',
} ) {
	const buc = useIdSvg( 'nep-bucp-' );
	const estat = [
		'nep-port__barca',
		'nep-port__barca--pirata',
		activa && 'is-activa',
		seleccionada && 'is-seleccionada',
		classe,
	]
		.filter( Boolean )
		.join( ' ' );
	return (
		<svg
			className={ estat }
			viewBox="0 0 520 520"
			aria-hidden="true"
			focusable="false"
		>
			<defs>
				<clipPath id={ buc }>
					<path d={ BUC } />
				</clipPath>
			</defs>
			<g className="nep-port__balanc">
				<path d="M299 34L60 250M299 34L512 252" fill="none" { ...T3 } />
				{ /* Bandera */ }
				<g transform="translate(305 8)">
					<g className="nep-port__bandera">
						<path
							d="M0 0Q22-6 42 2T84 2V44Q62 52 42 44T0 44Z"
							fill="#14213d"
							{ ...T3 }
						/>
						<g
							fill="none"
							stroke="#fff"
							strokeWidth="3.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<circle cx="18" cy="23" r="7" />
							<path d="M25 23H62M34 14v18M44 12v22M54 14v18M62 23l12-9v18Z" />
						</g>
						<circle cx="16" cy="21" r="2" fill="#fff" />
					</g>
				</g>
				<rect
					x="292"
					y="4"
					width="14"
					height="290"
					rx="5"
					fill={ FUSTA }
					{ ...T }
				/>
				{ /* Floc */ }
				<g className="nep-port__vela nep-port__vela--floc">
					<path d="M312 70L500 254H316Z" fill={ LONA } { ...T } />
					<path
						d="M400 172l18 18-18 6Z"
						fill="#9fc6d8"
						{ ...T3 }
						strokeDasharray="5 5"
					/>
				</g>
				{ /* Vela major */ }
				<path d="M176 78H420" fill="none" { ...T } strokeWidth="9" />
				<g className="nep-port__vela">
					<path
						d="M186 84H410Q436 170 404 262H196Q164 170 186 84Z"
						fill={ LONA }
						{ ...T }
					/>
					<path
						d="M244 86Q234 170 246 260M356 86Q368 170 354 260"
						fill="none"
						stroke="#d9c9a0"
						strokeWidth="3"
					/>
					<rect
						x="214"
						y="118"
						width="48"
						height="40"
						rx="4"
						fill="#e7c87a"
						{ ...T3 }
						strokeDasharray="6 5"
					/>
					<path
						d="M340 196h44v34h-44Z"
						fill="#c9d8c2"
						{ ...T3 }
						strokeDasharray="6 5"
					/>
					<g
						fill="none"
						stroke="#b98a5a"
						strokeWidth="5"
						strokeLinecap="round"
					>
						<circle cx="282" cy="178" r="11" />
						<path d="M293 178H340M304 166v24M316 164v28M328 166v24M340 178l14-11v22Z" />
					</g>
				</g>
				<path d="M188 262H414" fill="none" { ...T } strokeWidth="8" />
				{ /* Fanal de popa */ }
				<path d="M48 250L40 188" fill="none" { ...T } />
				<circle
					className="nep-port__llum"
					cx="38"
					cy="200"
					r="28"
					fill="#ffd54a"
				/>
				<rect
					className="nep-port__fanal"
					x="28"
					y="186"
					width="20"
					height="26"
					rx="5"
					{ ...T3 }
				/>
				{ /* La Remei i el timó */ }
				<g transform="translate(58 134)">
					<Remei
						estat={ activa ? 'contenta' : 'normal' }
						mida={ 98 }
					/>
				</g>
				<g { ...T3 } fill="none">
					<circle cx="172" cy="214" r="20" fill="#c98a4b" />
					<circle cx="172" cy="214" r="6" fill={ FUSTA_FOSCA } />
					<path d="M172 186v56M144 214h56M152 194l40 40M192 194l-40 40" />
				</g>
				<rect
					x="40"
					y="228"
					width="142"
					height="24"
					rx="4"
					fill={ FUSTA_FOSCA }
					{ ...T }
				/>
				<path
					d="M64 234v12M88 234v12M112 234v12M136 234v12M160 234v12"
					stroke="#c98a4b"
					strokeWidth="4"
					strokeLinecap="round"
				/>
				{ /* Buc */ }
				<path d="M180 270H470" fill="none" { ...T3 } />
				<path
					d="M210 270v16M250 270v16M290 270v16M330 270v16M370 270v16M410 270v16M450 270v16"
					fill="none"
					{ ...T3 }
				/>
				<path d={ BUC } fill={ FUSTA } />
				<g clipPath={ `url(#${ buc })` }>
					<path
						d="M0 350H520M0 378H520M0 304H180"
						stroke={ FUSTA_FOSCA }
						strokeWidth="3"
					/>
					<rect
						x="0"
						y="286"
						width="520"
						height="12"
						fill="#f2b705"
					/>
					<rect
						x="0"
						y="250"
						width="180"
						height="10"
						fill="#f2b705"
					/>
				</g>
				<path d={ BUC } fill="none" { ...T } />
				<path
					d="M470 290L516 246"
					fill="none"
					{ ...T }
					strokeWidth="7"
				/>
				<g fill="#ffe7a8" { ...T3 }>
					<circle cx="78" cy="276" r="7" />
					<circle cx="114" cy="276" r="7" />
					<circle cx="150" cy="276" r="7" />
				</g>
				<Cano x={ 236 } />
				<Cano x={ 312 } />
				<Cano x={ 388 } />
				{ activa && <GavinaPosada x={ 214 } y={ 72 } escala={ 0.9 } /> }
			</g>
			<Onada
				classe="nep-port__aigua"
				x0={ 0 }
				x1={ 520 }
				y={ 400 }
				amp={ 7 }
				periode={ 80 }
				fons={ 440 }
			/>
			<ellipse
				cx="270"
				cy="412"
				rx="210"
				ry="6"
				fill="#0b1e3f"
				opacity=".14"
			/>
		</svg>
	);
}
