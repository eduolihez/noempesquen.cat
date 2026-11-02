/**
 * Detalls compartits pels dos vaixells del port: bótes, lluentor del buc i
 * reflex a l'aigua. Grups SVG: s'han de fer servir dins d'un <svg>.
 */
import { trac } from './comu';

/*
 * Bóta de fusta dreta, amb base a (x, y).
 */
export function Bota( { x, y } ) {
	return (
		<g transform={ `translate(${ x } ${ y })` }>
			<path
				d="M-13 0Q-17-15-13-30H13Q17-15 13 0Z"
				fill="#b07a48"
				{ ...trac( 3 ) }
			/>
			<path
				d="M-15-8H15M-15-22H15M-4-28Q-6-15-4-2"
				fill="none"
				stroke="#6e4630"
				strokeWidth="2.5"
			/>
			<path
				d="M7-27Q10-15 7-3"
				stroke="#e2b47e"
				strokeWidth="3"
				strokeLinecap="round"
			/>
		</g>
	);
}

/*
 * Reflex del buc a l'aigua: el buc capgirat sobre la línia de flotació,
 * esvaït cap avall i ratllat (la màscara hi deixa franges buides).
 */
export function Reflex( { flota, mascara, children } ) {
	return (
		<g className="nep-port__reflex" mask={ `url(#${ mascara })` }>
			<g transform={ `translate(0 ${ flota * 2 }) scale(1 -1)` }>
				{ children }
			</g>
		</g>
	);
}

/*
 * Màscara del reflex: comença a la flotació i s'esvaeix en `alt`.
 */
export function MascaraReflex( { id, flota, alt = 90 } ) {
	return (
		<mask id={ id } maskUnits="userSpaceOnUse">
			<linearGradient
				id={ `${ id }g` }
				gradientUnits="userSpaceOnUse"
				x1="0"
				y1={ flota + 4 }
				x2="0"
				y2={ flota + alt }
			>
				<stop offset="0" stopColor="#fff" stopOpacity=".42" />
				<stop offset="1" stopColor="#fff" stopOpacity="0" />
			</linearGradient>
			<rect
				y={ flota + 4 }
				width="520"
				height={ alt }
				fill={ `url(#${ id }g)` }
			/>
			<path
				d={ `M0 ${ flota + 16 }H520M0 ${ flota + 34 }H520M0 ${
					flota + 56
				}H520` }
				stroke="#000"
				strokeWidth="5"
			/>
		</mask>
	);
}

/*
 * Lluentor vertical del buc: llum a dalt, ombra a sota.
 */
export function GradientBuc( { id } ) {
	return (
		<linearGradient id={ id } x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stopColor="#fff" stopOpacity=".55" />
			<stop offset=".3" stopColor="#fff" stopOpacity="0" />
			<stop offset=".62" stopColor="#0b1e3f" stopOpacity="0" />
			<stop offset="1" stopColor="#0b1e3f" stopOpacity=".32" />
		</linearGradient>
	);
}
