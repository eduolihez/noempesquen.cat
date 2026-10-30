/**
 * Il·lustracions SVG generades per codi (gradients + formes simples).
 * Decoratives: qui les fa servir posa l'alt al seu contenidor.
 */
import { useIdSvg } from './icones.js';

/* [cel dalt, cel baix, element principal, element secundari] */
const PALETES = {
	platja: [ '#8fd0f0', '#f6e3b0', '#e8c97a', '#3a8fc0' ],
	muntanya: [ '#9cc4e8', '#dfeaf5', '#6b7f95', '#f4f7fa' ],
	mercat: [ '#fbe3b5', '#f3b562', '#c8503c', '#4f8a4b' ],
	gat: [ '#f4e1cf', '#e7c9a9', '#7a5a45', '#f0a84a' ],
	gos: [ '#cfe6c8', '#a8d09d', '#9a6a3c', '#4a3322' ],
	carrer: [ '#c3d5e8', '#e9e3d6', '#b5694a', '#5b6f84' ],
	plat: [ '#f1ece4', '#e2d8c8', '#d98a3f', '#6a9a4f' ],
	'cel-vespre': [ '#3b3f8f', '#f09a6b', '#ffd98a', '#26254f' ],
	parc: [ '#bfe3f2', '#d7efc4', '#4f9a4f', '#8a5a3a' ],
	bicicleta: [ '#d6e8f2', '#eef0e6', '#2f6f8f', '#3a3a3a' ],
	flors: [ '#f6dfe8', '#cfe8c0', '#d9487a', '#f3c93a' ],
	biblioteca: [ '#e9dcc6', '#cdb48c', '#8a4b36', '#2f5d7a' ],
	font: [ '#cbe4f0', '#e4e2d4', '#7c8a94', '#4aa3d0' ],
	pa: [ '#f6e7cf', '#ebd2a8', '#c98a3c', '#8a5a26' ],
	bosc: [ '#b9d9a8', '#7fb36b', '#2f6a3a', '#6b4a2e' ],
	'mar-matinal': [ '#f7c9a0', '#bfe0ee', '#3d86b3', '#fff1c9' ],
};

const GRIS = [ '#d5d8dc', '#aeb3b9', '#8d939a', '#c2c6cb' ];

function Formes( { id, c } ) {
	const a = c[ 2 ];
	const b = c[ 3 ];
	switch ( id ) {
		case 'platja':
		case 'mar-matinal':
			return (
				<>
					<circle cx="130" cy="34" r="14" fill={ b } opacity="0.9" />
					<rect y="62" width="200" height="38" fill={ b } />
					<path
						d="M0 82q25-8 50 0t50 0 50 0 50 0v18H0z"
						fill={ a }
						opacity="0.85"
					/>
				</>
			);
		case 'muntanya':
		case 'bosc':
			return (
				<>
					<path d="M0 100 55 30l35 45 30-30 80 55z" fill={ a } />
					<path d="M55 30l14 18-14-5-14 5z" fill={ b } />
					<path
						d="M0 100V84q50-10 100 0t100-4v20z"
						fill={ b }
						opacity="0.35"
					/>
				</>
			);
		case 'cel-vespre':
			return (
				<>
					<circle cx="100" cy="68" r="22" fill={ a } />
					<path d="M0 78h200v22H0z" fill={ b } />
					<circle cx="40" cy="20" r="1.8" fill="#fff" />
					<circle cx="150" cy="14" r="1.8" fill="#fff" />
				</>
			);
		case 'gat':
		case 'gos':
			return (
				<>
					<ellipse cx="100" cy="76" rx="38" ry="22" fill={ a } />
					<circle cx="100" cy="46" r="22" fill={ a } />
					<path
						d="M82 32 78 14 94 26zM118 32l4-18-16 12z"
						fill={ a }
					/>
					<circle cx="92" cy="45" r="3" fill={ b } />
					<circle cx="108" cy="45" r="3" fill={ b } />
				</>
			);
		case 'flors':
		case 'parc':
			return (
				<>
					<rect
						y="70"
						width="200"
						height="30"
						fill={ a }
						opacity="0.6"
					/>
					<rect x="60" y="50" width="4" height="30" fill={ a } />
					<circle cx="62" cy="46" r="10" fill={ a } />
					<circle cx="62" cy="46" r="4" fill={ b } />
					<rect x="130" y="40" width="6" height="40" fill={ b } />
					<circle cx="133" cy="34" r="18" fill={ a } />
				</>
			);
		case 'plat':
		case 'pa':
			return (
				<>
					<ellipse
						cx="100"
						cy="60"
						rx="64"
						ry="34"
						fill="#fff"
						opacity="0.8"
					/>
					<ellipse cx="100" cy="58" rx="40" ry="20" fill={ a } />
					<circle cx="88" cy="54" r="6" fill={ b } />
					<circle cx="112" cy="62" r="5" fill={ b } />
				</>
			);
		case 'bicicleta':
			return (
				<>
					<circle
						cx="66"
						cy="68"
						r="20"
						fill="none"
						stroke={ b }
						strokeWidth="4"
					/>
					<circle
						cx="136"
						cy="68"
						r="20"
						fill="none"
						stroke={ b }
						strokeWidth="4"
					/>
					<path
						d="M66 68 90 40h30l16 28M90 40l16 28H66"
						fill="none"
						stroke={ a }
						strokeWidth="4"
					/>
				</>
			);
		case 'mercat':
		case 'carrer':
		case 'biblioteca':
			return (
				<>
					<rect x="20" y="40" width="60" height="60" fill={ a } />
					<rect x="90" y="28" width="50" height="72" fill={ b } />
					<rect
						x="150"
						y="48"
						width="40"
						height="52"
						fill={ a }
						opacity="0.8"
					/>
					<rect
						x="30"
						y="52"
						width="14"
						height="14"
						fill="#fff"
						opacity="0.7"
					/>
					<rect
						x="100"
						y="40"
						width="12"
						height="12"
						fill="#fff"
						opacity="0.7"
					/>
					<rect
						x="118"
						y="40"
						width="12"
						height="12"
						fill="#fff"
						opacity="0.7"
					/>
				</>
			);
		case 'font':
			return (
				<>
					<rect
						x="70"
						y="70"
						width="60"
						height="14"
						rx="4"
						fill={ a }
					/>
					<rect x="96" y="40" width="8" height="32" fill={ a } />
					<path
						d="M100 38q-24 4-30 30M100 38q24 4 30 30"
						fill="none"
						stroke={ b }
						strokeWidth="3"
					/>
				</>
			);
		default:
			return null;
	}
}

export function Ilustracio( { id, className } ) {
	const gid = useIdSvg( 'il' );
	const conegut = Object.prototype.hasOwnProperty.call( PALETES, id );
	const c = conegut ? PALETES[ id ] : GRIS;
	return (
		<svg
			viewBox="0 0 200 100"
			preserveAspectRatio="xMidYMid slice"
			className={ className }
			aria-hidden="true"
			focusable="false"
		>
			<defs>
				<linearGradient id={ gid } x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor={ c[ 0 ] } />
					<stop offset="1" stopColor={ c[ 1 ] } />
				</linearGradient>
			</defs>
			<rect width="200" height="100" fill={ `url(#${ gid })` } />
			{ conegut && <Formes id={ id } c={ c } /> }
		</svg>
	);
}
