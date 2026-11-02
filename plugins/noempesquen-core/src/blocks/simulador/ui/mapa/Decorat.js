/**
 * Decoració del mapa de ruta per tema. Tot és decoratiu (aria-hidden, sense
 * punter) i va per sota dels nodes. Només CSS anima (estils/_mapa.scss);
 * l'estat base és el final i visible.
 *
 * - carta (el Pesquer): costa d'arena, rosa dels vents i bancs de peixos.
 * - tresor (el Pirata): brúixola, bancs de boira, peix-espina i cel estrellat
 *   (aquest, `Cel`, al marc fix del mar).
 */
import { midaVista } from '../../nucli/mapaGeom';

const MODES = [
	[ 'ample', 'a' ],
	[ 'baix', 'b' ],
	[ 'estret', 'e' ],
];
const pc = ( v ) => `${ Math.round( v * 1000 ) / 10 }%`;

/**
 * Llocs lliures per a la decoració mòbil: entre cada parell de nodes (0-1,
 * 2-3…), per sobre del camí en ample i baix; al costat buit en estret.
 *
 * @param {Object} pos Posicions dels nodes per mode.
 * @return {Array<Object>} Estils amb --xa/--ya, --xb/--yb i --xe/--ye.
 */
function llocs( pos ) {
	const n = pos.ample.length;
	const res = [];
	for ( let i = 0; i + 1 < n; i += 2 ) {
		const estil = { '--k': res.length };
		MODES.forEach( ( [ mode, l ] ) => {
			const { w, h } = midaVista( n, mode );
			const a = pos[ mode ][ i ];
			const b = pos[ mode ][ i + 1 ];
			const estret = mode === 'estret';
			estil[ `--x${ l }` ] = estret ? '78%' : pc( ( a.x + b.x ) / 2 / w );
			estil[ `--y${ l }` ] = estret ? pc( a.y / h ) : '11%';
		} );
		res.push( estil );
	}
	return res;
}

const Svg = ( { className, viewBox, children, ...resta } ) => (
	<svg
		className={ className }
		viewBox={ viewBox }
		aria-hidden="true"
		focusable="false"
		{ ...resta }
	>
		{ children }
	</svg>
);

function Rosa() {
	const punta = ( r, l ) => `M0-${ r } ${ l }-${ l } 0 0Z`;
	return (
		<Svg className="nep-mapa__rosa" viewBox="-50 -50 100 100">
			<circle className="nep-mapa__rosa-anell" r="38" />
			<circle className="nep-mapa__rosa-anell" r="31" />
			{ [ 45, 135, 225, 315 ].map( ( a ) => (
				<g key={ a } transform={ `rotate(${ a })` }>
					<path
						className="nep-mapa__rosa-fosc"
						d={ punta( 27, 5 ) }
					/>
					<path
						className="nep-mapa__rosa-clar"
						d={ punta( 27, 5 ) }
						transform="scale(-1 1)"
					/>
				</g>
			) ) }
			{ [ 0, 90, 180, 270 ].map( ( a ) => (
				<g key={ a } transform={ `rotate(${ a })` }>
					<path
						className="nep-mapa__rosa-fosc"
						d={ punta( 46, 8 ) }
					/>
					<path
						className="nep-mapa__rosa-clar"
						d={ punta( 46, 8 ) }
						transform="scale(-1 1)"
					/>
				</g>
			) ) }
			<circle className="nep-mapa__rosa-centre" r="3.5" />
		</Svg>
	);
}

function Bruixola() {
	return (
		<Svg className="nep-mapa__rosa" viewBox="-50 -50 100 100">
			<circle className="nep-mapa__rosa-anell" r="42" />
			<circle className="nep-mapa__rosa-anell" r="34" />
			<path
				className="nep-mapa__rosa-marques"
				d="M0-42v8M0 42v-8M-42 0h8M42 0h-8M29.7-29.7l-4.2 4.2M-29.7 29.7l4.2-4.2M29.7 29.7l-4.2-4.2M-29.7-29.7l4.2 4.2"
			/>
			<g className="nep-mapa__agulla">
				<path className="nep-mapa__agulla-nord" d="M0-30 7 0H-7Z" />
				<path className="nep-mapa__rosa-clar" d="M0 30 7 0H-7Z" />
				<circle className="nep-mapa__rosa-centre" r="3.5" />
			</g>
		</Svg>
	);
}

/**
 * Peix-espina: l'emblema del Pirata (propi, no és cap calavera).
 *
 * @param {Object} props           Props.
 * @param {string} props.className Classe extra.
 */
export function PeixEspina( { className = '' } ) {
	return (
		<Svg
			className={ `nep-mapa__espina ${ className }` }
			viewBox="0 0 48 24"
		>
			<path
				className="nep-mapa__espina-cap"
				d="M3 12c2.5-5 6.5-7.5 10-7.5v15C9.5 19.5 5.5 17 3 12Z"
			/>
			<circle className="nep-mapa__espina-ull" cx="8" cy="11" r="1.6" />
			<path
				className="nep-mapa__espina-os"
				d="M13 12h27M18 5l3 7-3 7M25 4l3 8-3 8M32 5l3 7-3 7M40 12l6-6v12Z"
			/>
		</Svg>
	);
}

const Banc = () => (
	<Svg className="nep-mapa__banc" viewBox="0 0 64 28">
		{ [
			[ 4, 6 ],
			[ 22, 2 ],
			[ 16, 16 ],
			[ 36, 11 ],
			[ 46, 21 ],
		].map( ( [ x, y ] ) => (
			<path
				key={ `${ x }-${ y }` }
				className="nep-mapa__peix"
				d={ `M${ x } ${ y }c3-3 7.5-3 10.5 0-3 3-7.5 3-10.5 0Zm10.5 0 4-3v6Z` }
			/>
		) ) }
	</Svg>
);

export function Decorat( { tema, pos } ) {
	const tresor = tema === 'tresor';
	return (
		<div className="nep-mapa__decor" aria-hidden="true">
			{ ! tresor && (
				<Svg
					className="nep-mapa__costa"
					viewBox="0 0 400 40"
					preserveAspectRatio="none"
				>
					<path d="M0 0h400v14c-18 10-34-6-56 2s-30 16-52 6-38-12-60-2-32 14-58 4-34-10-58-2-30 12-56 4-40-8-60-2Z" />
				</Svg>
			) }
			{ tresor ? <Bruixola /> : <Rosa /> }
			{ tresor && <PeixEspina className="nep-mapa__espina--segell" /> }
			{ llocs( pos ).map( ( estil, k ) =>
				tresor ? (
					<span
						key={ k }
						className="nep-mapa__boira"
						style={ estil }
					/>
				) : (
					<span
						key={ k }
						className="nep-mapa__lloc-banc"
						style={ estil }
					>
						<Banc />
					</span>
				)
			) }
		</div>
	);
}

/** Estrelles que titil·len al marc fosc del mar (tema tresor). */
export function Cel() {
	const grups = [
		'M12 8h.1M64 18h.1M118 6h.1M170 22h.1M30 90h.1M150 88h.1',
		'M40 30h.1M92 9h.1M140 34h.1M190 10h.1M8 60h.1M96 94h.1',
		'M24 44h.1M78 40h.1M128 16h.1M182 52h.1M60 72h.1M192 80h.1',
	];
	return (
		<Svg
			className="nep-mapa__cel"
			viewBox="0 0 200 100"
			preserveAspectRatio="xMidYMid slice"
		>
			{ grups.map( ( d, i ) => (
				<path
					key={ d }
					className="nep-mapa__estel"
					style={ { '--k': i } }
					d={ d }
				/>
			) ) }
		</Svg>
	);
}
