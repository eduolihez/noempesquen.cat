/**
 * Fons del port: cel, sol, núvols, costa amb poble, far, mar en quatre capes,
 * boies, moll de fusta i gavines. Dues composicions (ampla 1600×900 i alta
 * 900×1200) amb les mateixes peces; els vaixells van a part (Escena.js).
 */
import { useIdSvg } from '../icones';
import { Gavina } from './Gavina';
import { Onada } from './Onada';
import { MAR, punts, trac } from './comu';

const T = trac( 4 );
const T3 = trac( 3 );

export const DISPOSICIONS = {
	ampla: {
		w: 1600,
		h: 900,
		horitzo: 470,
		capes: [ 470, 556, 668, 800 ],
		sol: [ 800, 200, 62 ],
		nuvols: [
			[ 230, 120, 1 ],
			[ 1060, 90, 0.8 ],
			[ 1420, 170, 0.7 ],
		],
		lluny: 'M-60 470V424Q180 380 470 404T1010 392Q1290 360 1660 414V470Z',
		turons: [
			'M380 470Q620 360 880 400T1300 470Z',
			'M-60 470V384Q120 330 260 350T560 420Q640 450 700 470Z',
		],
		cases: [ 70, 130, 186, 250, 316, 390, 452 ],
		campanar: [ 210, 330 ],
		far: [ 1500, 470 ],
		brillants: [
			[ 760, 500 ],
			[ 820, 518 ],
			[ 780, 538 ],
			[ 852, 494 ],
			[ 740, 572 ],
			[ 870, 600 ],
			[ 800, 640 ],
		],
		boies: [
			[ 300, 590 ],
			[ 960, 724 ],
			[ 1520, 700 ],
		],
		moll: { x0: -20, x1: 450, y: 664, peus: [ 30, 140, 250, 340, 410 ] },
		amarra: 'M414 642Q450 704 492 668',
		gavines: [
			[ 520, 170, 1.6, 'nep-port__gavina--creua' ],
			[ 1010, 250, 1.2, '' ],
			[ 380, 240, 1, 'nep-port__gavina--lenta' ],
		],
		peix: [ 1200, 690 ],
	},
	alta: {
		w: 900,
		h: 1200,
		horitzo: 430,
		capes: [ 430, 540, 720, 960 ],
		sol: [ 190, 180, 56 ],
		nuvols: [
			[ 110, 80, 0.8 ],
			[ 520, 60, 0.7 ],
			[ 760, 200, 0.6 ],
		],
		lluny: 'M-60 430V384Q150 346 390 368T960 350V430Z',
		turons: [
			'M260 430Q480 330 680 360T960 430Z',
			'M-60 430V344Q100 300 220 320T480 400Q520 420 560 430Z',
		],
		cases: [ 40, 96, 150, 206, 268, 330 ],
		campanar: [ 176, 300 ],
		far: [ 830, 430 ],
		brillants: [
			[ 160, 460 ],
			[ 216, 478 ],
			[ 180, 500 ],
			[ 230, 566 ],
			[ 150, 600 ],
		],
		boies: [
			[ 120, 640 ],
			[ 160, 880 ],
		],
		moll: {
			x0: -20,
			x1: 310,
			y: 984,
			peus: [ 30, 130, 230, 280 ],
			caixes: 150,
			corda: null,
		},
		amarra: 'M274 962Q310 1024 346 990',
		gavines: [
			[ 420, 140, 1.4, 'nep-port__gavina--creua' ],
			[ 600, 300, 1.1, '' ],
			[ 330, 250, 0.9, 'nep-port__gavina--lenta' ],
		],
		peix: [ 180, 760 ],
	},
};

function Nuvol( { x, y, escala, i } ) {
	return (
		<g transform={ `translate(${ x } ${ y }) scale(${ escala })` }>
			<g className={ `nep-port__nuvol nep-port__nuvol--${ i }` }>
				<path
					d="M-90 30Q-110 0-74-6Q-70-40-30-36Q-10-64 26-46Q60-60 72-24Q110-22 98 12Q104 32 80 30Z"
					fill="#fffaf0"
					{ ...T }
				/>
				<path
					d="M-60 14Q-40 22-20 14"
					fill="none"
					stroke="#f2d9c0"
					strokeWidth="5"
					strokeLinecap="round"
				/>
			</g>
		</g>
	);
}

function Sol( { cx, cy, r } ) {
	return (
		<g transform={ `translate(${ cx } ${ cy })` }>
			<g className="nep-port__raigs">
				{ [ 0, 45, 90, 135, 180, 225, 270, 315 ].map( ( a ) => (
					<path
						key={ a }
						d={ `M0 ${ -r - 14 }v-22` }
						transform={ `rotate(${ a })` }
						stroke="#f2b705"
						strokeWidth="9"
						strokeLinecap="round"
					/>
				) ) }
			</g>
			<circle r={ r } fill="#ffd54a" { ...T } />
			<path
				d={ `M${ -r * 0.45 } -4q10-10 20 0M${ r * 0.13 } -4q10-10 20 0` }
				fill="none"
				{ ...T }
			/>
			<path d="M-14 16q14 12 28 0" fill="none" { ...T } />
			<ellipse cx={ -r * 0.55 } cy="12" rx="9" ry="6" fill="#f19b86" />
			<ellipse cx={ r * 0.55 } cy="12" rx="9" ry="6" fill="#f19b86" />
		</g>
	);
}

function Casa( { x, y, i } ) {
	const alt = 34 + ( ( i * 7 ) % 18 );
	const colors = [ '#f7efe0', '#f6d9a8', '#e9f1f2', '#f3c9b4' ];
	return (
		<g transform={ `translate(${ x } ${ y - alt })` }>
			<rect
				width="44"
				height={ alt + 20 }
				fill={ colors[ i % colors.length ] }
				{ ...T3 }
			/>
			<rect
				x="1.5"
				y="2"
				width="11"
				height={ alt + 16.5 }
				fill="#0b1e3f"
				opacity=".1"
			/>
			<path d="M-4 2L22-16 48 2Z" fill="#d9774b" { ...T3 } />
			<path
				d="M24-12L42 0"
				stroke="#ffd9a8"
				strokeWidth="3"
				strokeLinecap="round"
			/>
			<rect x="10" y="12" width="9" height="11" rx="2" fill="#14213d" />
			<rect x="26" y="12" width="9" height="11" rx="2" fill="#14213d" />
			<path
				d="M8 25h13M24 25h13"
				stroke="#fff6e0"
				strokeWidth="3"
				strokeLinecap="round"
			/>
		</g>
	);
}

function Poble( { cases, campanar, horitzo } ) {
	const [ cx, cy ] = campanar;
	return (
		<g>
			<g transform={ `translate(${ cx } ${ cy })` }>
				<rect
					x="-16"
					y="0"
					width="32"
					height="80"
					fill="#f6d9a8"
					{ ...T3 }
				/>
				<path d="M-20 2L0-34 20 2Z" fill="#d9774b" { ...T3 } />
				<circle cx="0" cy="22" r="8" fill="#fff" { ...T3 } />
			</g>
			{ cases.map( ( x, i ) => (
				<Casa
					key={ x }
					x={ x }
					y={ horitzo - 30 + ( ( i * 13 ) % 22 ) }
					i={ i }
				/>
			) ) }
		</g>
	);
}

function Far( { x, y } ) {
	return (
		<g transform={ `translate(${ x } ${ y })` }>
			<path
				className="nep-port__feix"
				d="M0-226L-330-286V-170Z"
				fill="#fff6c9"
			/>
			<path
				d="M-140 6Q-120-46-60-50Q-20-80 40-60Q110-50 140 6Z"
				fill="#7d8a96"
				{ ...T }
			/>
			<path
				d="M-80-30q20-10 40 0M30-40q20-6 40 6"
				fill="none"
				stroke="#a8b4bf"
				strokeWidth="5"
				strokeLinecap="round"
			/>
			<path d="M-30-60L-20-200H20L30-60Z" fill="#fff" { ...T } />
			<path
				d="M-27-100H27L25-130H-25ZM-22-160H22L21-186H-21Z"
				fill="#d9392b"
			/>
			<path d="M6-60L4-200H20L30-60Z" fill="#0b1e3f" opacity=".14" />
			<path
				d="M-14-190L-22-70"
				stroke="#fff"
				strokeWidth="4"
				strokeLinecap="round"
				opacity=".7"
			/>
			<path d="M-30-60L-20-200H20L30-60Z" fill="none" { ...T } />
			<rect
				x="-26"
				y="-212"
				width="52"
				height="14"
				rx="4"
				fill="#14213d"
				{ ...T3 }
			/>
			<rect
				className="nep-port__lluerna"
				x="-18"
				y="-244"
				width="36"
				height="32"
				rx="4"
				fill="#ffd54a"
				{ ...T3 }
			/>
			<path d="M-24-244Q0-276 24-244Z" fill="#d9392b" { ...T3 } />
			<path d="M-6-64v-24h12v24" fill="#14213d" />
		</g>
	);
}

function Boia( { x, y, i } ) {
	return (
		<g transform={ `translate(${ x } ${ y })` }>
			<g className={ `nep-port__boia nep-port__boia--${ i }` }>
				<path d="M0-40v14" fill="none" { ...T3 } />
				<circle cx="0" cy="-44" r="5" fill="#f2b705" { ...T3 } />
				<path
					d="M-16 0Q-18-26 0-28Q18-26 16 0Z"
					fill="#fff"
					{ ...T3 }
				/>
				<path d="M-17-10H17V0H-17Z" fill="#d9392b" />
				<path
					d="M-16 0Q-18-26 0-28Q18-26 16 0Z"
					fill="none"
					{ ...T3 }
				/>
			</g>
		</g>
	);
}

function Moll( { x0, x1, y, peus, caixes = 170, corda = -112 } ) {
	const ample = x1 - x0;
	const taulons = [];
	for ( let x = x0 + 20; x < x1 - 10; x += 46 ) {
		taulons.push( `M${ x } ${ y + 8 }h22M${ x + 14 } ${ y + 15 }h18` );
	}
	const claus = punts(
		peus.flatMap( ( x ) => [
			[ x - 4, y + 30 ],
			[ x + 4, y + 30 ],
		] )
	);
	return (
		<g>
			{ /* Ombra del moll a l'aigua */ }
			<path
				d={ `M${ x0 } ${ y + 38 }H${ x1 + 6 }L${ x1 + 60 } ${ y + 92 }H${ x0 }Z` }
				fill="#0b1e3f"
				opacity=".2"
			/>
			{ peus.map( ( x ) => (
				<rect
					key={ x }
					x={ x - 11 }
					y={ y + 30 }
					width="22"
					height="400"
					rx="6"
					fill="#6e4630"
					{ ...T }
				/>
			) ) }
			<path
				d={ `M${ x0 } ${ y }H${ x1 }L${ x1 + 6 } ${ y + 22 }H${ x0 }Z` }
				fill="#c98a4b"
				{ ...T }
			/>
			<path
				d={ peus
					.slice( 0, -1 )
					.map( ( x ) => `M${ x + 55 } ${ y + 2 }v18` )
					.join( '' ) }
				stroke="#8a5a3b"
				strokeWidth="3"
			/>
			<path
				d={ taulons.join( '' ) }
				stroke="#a86f3c"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path
				d={ `M${ x0 } ${ y + 3 }H${ x1 }` }
				stroke="#f0c48a"
				strokeWidth="3"
			/>
			<rect
				x={ x0 }
				y={ y + 22 }
				width={ ample + 6 }
				height="16"
				fill="#8a5a3b"
				{ ...T }
			/>
			<path
				d={ claus }
				stroke="#3d2618"
				strokeWidth="4"
				strokeLinecap="round"
			/>
			{ /* Xarxa amb suros */ }
			<path
				d={ `M${ x0 + 30 } ${ y + 2 }Q${ x0 + 40 } ${ y - 40 } ${ x0 + 90 } ${
					y - 30
				}Q${ x0 + 130 } ${ y - 20 } ${ x0 + 132 } ${ y + 2 }Z` }
				fill="#e8dcc0"
				{ ...T3 }
			/>
			<path
				d={ `M${ x0 + 50 } ${ y - 20 }l20 18M${ x0 + 74 } ${ y - 28 }l26 26M${
					x0 + 100
				} ${ y - 26 }l24 24M${ x0 + 60 } ${ y - 2 }l30-26M${ x0 + 92 } ${
					y - 2
				}l24-22` }
				stroke="#0b1e3f"
				strokeWidth="2"
				opacity=".45"
			/>
			<path
				d={ punts( [
					[ x0 + 64, y - 14 ],
					[ x0 + 87, y - 15 ],
					[ x0 + 112, y - 14 ],
					[ x0 + 76, y - 2 ],
					[ x0 + 104, y - 2 ],
				] ) }
				stroke="#0b1e3f"
				strokeWidth="5"
				strokeLinecap="round"
				opacity=".55"
			/>
			<circle
				cx={ x0 + 66 }
				cy={ y - 26 }
				r="6"
				fill="#f2b705"
				{ ...T3 }
			/>
			<circle
				cx={ x0 + 112 }
				cy={ y - 20 }
				r="6"
				fill="#d9392b"
				{ ...T3 }
			/>
			{ /* Caixes de peix */ }
			<g transform={ `translate(${ x0 + caixes } ${ y })` }>
				<ellipse
					cx="60"
					cy="1"
					rx="66"
					ry="5"
					fill="#0b1e3f"
					opacity=".25"
				/>
				<path
					d="M6-34l10 8 12-10 10 10 12-8"
					fill="#9fd0e0"
					{ ...T3 }
				/>
				<rect
					x="0"
					y="-28"
					width="58"
					height="28"
					rx="3"
					fill="#c98a4b"
					{ ...T3 }
				/>
				<rect
					x="64"
					y="-24"
					width="50"
					height="24"
					rx="3"
					fill="#d9a066"
					{ ...T3 }
				/>
				<rect
					x="30"
					y="-54"
					width="54"
					height="26"
					rx="3"
					fill="#d9a066"
					{ ...T3 }
				/>
				<path d="M44-58q10-12 22 0" fill="#9fd0e0" { ...T3 } />
			</g>
			{ /* Corda enrotllada (en alt no hi cap) */ }
			{ corda !== null && (
				<g
					transform={ `translate(${ x1 + corda } ${ y - 6 })` }
					fill="none"
					{ ...T3 }
				>
					<ellipse rx="22" ry="8" fill="#e3c27a" />
					<ellipse rx="14" ry="5" />
					<ellipse cy="-6" rx="20" ry="7" />
				</g>
			) }
			{ /* Noray */ }
			<g transform={ `translate(${ x1 - 36 } ${ y })` }>
				<path d="M-10 0V-18H10V0Z" fill="#14213d" { ...T3 } />
				<rect
					x="-16"
					y="-26"
					width="32"
					height="10"
					rx="5"
					fill="#14213d"
					{ ...T3 }
				/>
			</g>
		</g>
	);
}

export function Fons( { disposicio = 'ampla' } ) {
	const d = DISPOSICIONS[ disposicio ];
	const cel = useIdSvg( 'nep-cel-' );
	const { w, h, horitzo } = d;
	const [ sx, sy ] = d.sol;
	const id = ( sufix ) => `${ cel }${ sufix }`;
	const url = ( sufix ) => `url(#${ cel }${ sufix })`;
	return (
		<svg
			className={ `nep-port__fons nep-port__fons--${ disposicio }` }
			viewBox={ `0 0 ${ w } ${ h }` }
			preserveAspectRatio="xMidYMid slice"
			aria-hidden="true"
			focusable="false"
		>
			<defs>
				<linearGradient id={ cel } x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#9fd6e4" />
					<stop offset=".55" stopColor="#d9eef0" />
					<stop offset=".85" stopColor="#ffe2b8" />
					<stop offset="1" stopColor="#ffc98f" />
				</linearGradient>
				{ /* Resplendor del sol i llum càlida al seu costat */ }
				<radialGradient id={ id( 'r' ) }>
					<stop offset="0" stopColor="#fff3c4" stopOpacity=".95" />
					<stop offset=".35" stopColor="#ffe08a" stopOpacity=".4" />
					<stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
				</radialGradient>
				{ /* Ombra al peu dels turons */ }
				<linearGradient id={ id( 'o' ) } x1="0" y1="0" x2="0" y2="1">
					<stop offset=".3" stopColor="#0b3b4a" stopOpacity="0" />
					<stop offset="1" stopColor="#0b3b4a" stopOpacity=".28" />
				</linearGradient>
				{ /* Bruma entre la costa i el mar */ }
				<linearGradient id={ id( 'b' ) } x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#f4f8f2" stopOpacity="0" />
					<stop offset=".75" stopColor="#f4f8f2" stopOpacity=".6" />
					<stop offset="1" stopColor="#f4f8f2" stopOpacity="0" />
				</linearGradient>
				{ /* Càustiques: línies de llum trencades sobre el mar fosc */ }
				<pattern
					id={ id( 'c' ) }
					width="160"
					height="90"
					patternUnits="userSpaceOnUse"
				>
					<path
						d="M8 20q24-14 44 0t40 2M96 62q20-12 40 0t20 0M30 78q14-8 30 0"
						fill="none"
						stroke="#bfeaf2"
						strokeWidth="3"
						strokeLinecap="round"
					/>
				</pattern>
			</defs>
			<rect
				width={ w }
				height={ horitzo + 20 }
				fill={ `url(#${ cel })` }
			/>
			<g className="nep-port__resplendor">
				<circle
					cx={ sx }
					cy={ sy }
					r={ sy * 2.4 }
					fill={ url( 'r' ) }
				/>
			</g>
			<Sol cx={ sx } cy={ sy } r={ d.sol[ 2 ] } />
			{ d.nuvols.map( ( [ x, y, e ], i ) => (
				<Nuvol key={ i } x={ x } y={ y } escala={ e } i={ i } />
			) ) }
			{ /* Tres plans de costa, cada un amb el seu parallax */ }
			<g className="nep-port__capa nep-port__capa--1">
				<path d={ d.lluny } fill="#c3dcd6" />
				<path
					d={ d.lluny }
					fill="none"
					stroke="#e9f4ef"
					strokeWidth="3"
				/>
			</g>
			<g className="nep-port__capa nep-port__capa--2">
				<path d={ d.turons[ 0 ] } fill="#9cc7b5" { ...T } />
				<path d={ d.turons[ 0 ] } fill={ url( 'o' ) } />
			</g>
			<g className="nep-port__capa nep-port__capa--3">
				<path d={ d.turons[ 1 ] } fill="#6fa894" { ...T } />
				<path d={ d.turons[ 1 ] } fill={ url( 'o' ) } />
				<Poble
					cases={ d.cases }
					campanar={ d.campanar }
					horitzo={ horitzo }
				/>
			</g>
			<rect
				x="0"
				y={ horitzo - 70 }
				width={ w }
				height="86"
				fill={ url( 'b' ) }
			/>
			<Far x={ d.far[ 0 ] } y={ d.far[ 1 ] } />
			<circle
				cx={ sx }
				cy={ horitzo }
				r={ horitzo * 0.9 }
				fill={ url( 'r' ) }
				opacity=".4"
			/>
			{ d.capes.map( ( y, i ) => (
				<Onada
					key={ y }
					classe={ `nep-port__onada nep-port__onada--${ i + 1 }` }
					color={ MAR[ i ] }
					x0={ 0 }
					x1={ w }
					y={ y }
					amp={ 5 + i * 3 }
					periode={ 120 + i * 40 }
					fons={ h + 10 }
					escuma={ i === 0 ? '#fff6e0' : '#ddeff2' }
					ondes={ i > 0 }
				/>
			) ) }
			<rect
				className="nep-port__caustica"
				x="-160"
				y={ d.capes[ 2 ] + 30 }
				width={ w + 320 }
				height={ h - d.capes[ 2 ] }
				fill={ url( 'c' ) }
				opacity=".22"
			/>
			{ /* Reflex del sol al mar */ }
			<ellipse
				className="nep-port__reflex-sol"
				cx={ sx }
				cy={ horitzo + 120 }
				rx="150"
				ry="190"
				fill={ url( 'r' ) }
			/>
			{ d.brillants.map( ( [ x, y ], i ) => (
				<path
					key={ i }
					className={ `nep-port__brillant nep-port__brillant--${ i % 3 }` }
					d={ `M${ x - 18 } ${ y }h36` }
					stroke="#fff"
					strokeWidth="5"
					strokeLinecap="round"
				/>
			) ) }
			<g
				className="nep-port__peix"
				transform={ `translate(${ d.peix[ 0 ] } ${ d.peix[ 1 ] })` }
			>
				<g className="nep-port__salt">
					<path
						d="M-18 0Q0-14 18 0Q0 14-18 0ZM-18 0l-12-9v18Z"
						fill="#7ec4dc"
						{ ...T3 }
					/>
					<circle cx="8" cy="-2" r="2.5" fill="#0b1e3f" />
				</g>
			</g>
			{ d.boies.map( ( [ x, y ], i ) => (
				<Boia key={ i } x={ x } y={ y } i={ i } />
			) ) }
			<Moll { ...d.moll } />
			<path
				d={ d.amarra }
				fill="none"
				stroke="#e3c27a"
				strokeWidth="5"
				strokeLinecap="round"
			/>
			{ d.gavines.map( ( [ x, y, e, c ], i ) => (
				<Gavina key={ i } x={ x } y={ y } escala={ e } classe={ c } />
			) ) }
		</svg>
	);
}
