/**
 * Gavines del port: en vol (amb aleteig) i posada (per al vaixell actiu).
 * Grups SVG: s'han de fer servir dins d'un <svg>.
 */
import { trac } from './comu';

const T = trac( 3 );

export function Gavina( { x, y, escala = 1, classe = '' } ) {
	return (
		<g transform={ `translate(${ x } ${ y }) scale(${ escala })` }>
			<g className={ `nep-port__gavina ${ classe }` }>
				<g className="nep-port__ala">
					<path
						d="M-36 0Q-20-20-3-3h6Q20-20 36 0Q20-9 3 3h-6Q-20-9-36 0Z"
						fill="#fff"
						{ ...T }
					/>
					<path
						d="M-36 0l7-3M36 0l-7-3"
						fill="none"
						{ ...T }
						strokeWidth="4"
					/>
				</g>
				<ellipse cx="0" cy="1" rx="9" ry="5.5" fill="#fff" { ...T } />
				<path
					d="M8 0l7 2-7 2Z"
					fill="#f2b705"
					{ ...T }
					strokeWidth="2"
				/>
			</g>
		</g>
	);
}

export function GavinaPosada( { x, y, escala = 1 } ) {
	return (
		<g transform={ `translate(${ x } ${ y }) scale(${ escala })` }>
			<g className="nep-port__posada">
				<path
					d="M-4 0v6M4 0v6"
					fill="none"
					stroke="#f2b705"
					strokeWidth="3"
					strokeLinecap="round"
				/>
				<path d="M-30-14L-14-10-16-4Z" fill="#c9d3dc" { ...T } />
				<ellipse
					cx="-2"
					cy="-10"
					rx="17"
					ry="11"
					fill="#fff"
					{ ...T }
				/>
				<path
					d="M-14-12Q-2-2 12-12"
					fill="#c9d3dc"
					{ ...T }
					strokeWidth="2.5"
				/>
				<g className="nep-port__cap">
					<circle cx="12" cy="-24" r="9" fill="#fff" { ...T } />
					<path
						d="M20-26l11 3-11 3Z"
						fill="#f2b705"
						{ ...T }
						strokeWidth="2.5"
					/>
					<circle cx="14" cy="-26" r="2.2" fill="#0b1e3f" />
				</g>
			</g>
		</g>
	);
}
