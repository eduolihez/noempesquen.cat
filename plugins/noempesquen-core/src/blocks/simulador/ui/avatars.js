/**
 * Personatges dibuixats en SVG (disseny propi, estil «Llotja»).
 * Traç únic de 4 unitats en blau mar, color pla i formes simètriques.
 * estat: 'normal' | 'alerta' | 'contenta' | 'trista'
 */
import { __ } from '@wordpress/i18n';
import { useId } from '@wordpress/element';

const TINTA = '#0b1e3f';
const TRAC = {
	stroke: TINTA,
	strokeWidth: 4,
	strokeLinejoin: 'round',
	strokeLinecap: 'round',
};

const COS_LLISSA =
	'M24 74C24 44 52 28 88 28s64 18 64 44-28 42-64 42S24 104 24 74Z';

export function Llissa( { estat = 'normal', mida = 72 } ) {
	const id = useId();
	const alerta = estat === 'alerta';
	const trista = estat === 'trista';
	const contenta = estat === 'contenta';
	return (
		<svg
			viewBox="0 0 200 140"
			width={ mida }
			height={ mida * 0.7 }
			aria-hidden="true"
			focusable="false"
		>
			<path
				d="M146 72L186 40Q196 33 196 46V98Q196 111 186 104Z"
				fill="#3f86a6"
				{ ...TRAC }
			/>
			<path d="M66 32Q84 6 118 34Z" fill="#3f86a6" { ...TRAC } />
			<clipPath id={ id }>
				<path d={ COS_LLISSA } />
			</clipPath>
			<path d={ COS_LLISSA } fill="#7ec4dc" />
			<g clipPath={ `url(#${ id })` }>
				<path d="M10 86Q88 112 170 82V130H10Z" fill="#dff3f8" />
			</g>
			<path d={ COS_LLISSA } fill="none" { ...TRAC } />
			<path
				d="M102 56Q124 50 142 58"
				stroke="#fff"
				strokeWidth="5"
				strokeLinecap="round"
				fill="none"
				opacity=".7"
			/>
			<path d="M72 44Q62 72 72 104" fill="none" { ...TRAC } />
			<path
				d="M100 78Q108 100 128 92Q122 78 100 78Z"
				fill="#3f86a6"
				{ ...TRAC }
			/>
			<circle
				cx="44"
				cy="62"
				r={ alerta ? 16 : 14 }
				fill="#fff"
				{ ...TRAC }
			/>
			<circle
				cx={ alerta ? 46 : 47 }
				cy={ trista ? 65 : 63 }
				r={ alerta ? 4.5 : 7 }
				fill={ TINTA }
			/>
			<circle
				cx={ alerta ? 47.5 : 49.5 }
				cy={ ( alerta ? 61.5 : 60 ) + ( trista ? 3 : 0 ) }
				r="2"
				fill="#fff"
			/>
			{ alerta && <path d="M26 40L60 48" { ...TRAC } /> }
			{ trista && <path d="M28 52L60 44" { ...TRAC } fill="none" /> }
			{ alerta && (
				<ellipse cx="36" cy="90" rx="5" ry="6.5" fill={ TINTA } />
			) }
			{ contenta && (
				<path d="M30 84Q40 98 52 86" fill="none" { ...TRAC } />
			) }
			{ trista && (
				<path d="M32 94Q40 85 50 91" fill="none" { ...TRAC } />
			) }
			{ ! alerta && ! contenta && ! trista && (
				<path d="M32 86Q40 94 50 88" fill="none" { ...TRAC } />
			) }
		</svg>
	);
}

export function Remei( { estat = 'normal', mida = 72 } ) {
	const alerta = estat === 'alerta';
	const trista = estat === 'trista';
	const contenta = estat === 'contenta';
	const radi = alerta ? 13 : 11.5;
	const pupila = alerta ? 3.5 : 5;
	const baixa = trista ? 3 : 0;
	return (
		<svg
			viewBox="0 -4 140 154"
			width={ mida }
			height={ mida * 1.1 }
			aria-hidden="true"
			focusable="false"
		>
			<ellipse
				cx="31"
				cy="56"
				rx="8"
				ry="13"
				fill="#e3e7ec"
				{ ...TRAC }
			/>
			<ellipse
				cx="109"
				cy="56"
				rx="8"
				ry="13"
				fill="#e3e7ec"
				{ ...TRAC }
			/>
			<circle cx="70" cy="14" r="14" fill="#e3e7ec" { ...TRAC } />
			<path
				d="M14 150Q14 112 70 112T126 150Z"
				fill="#8e5aa8"
				{ ...TRAC }
			/>
			<path d="M56 94h28v20Q70 124 56 114Z" fill="#f2c6a0" { ...TRAC } />
			<path d="M54 113L70 134L86 113Z" fill="#fff" { ...TRAC } />
			<circle cx="31" cy="72" r="7" fill="#f7d3b1" { ...TRAC } />
			<circle cx="109" cy="72" r="7" fill="#f7d3b1" { ...TRAC } />
			<ellipse
				cx="70"
				cy="66"
				rx="40"
				ry="42"
				fill="#f7d3b1"
				{ ...TRAC }
			/>
			<ellipse
				cx="108"
				cy="42"
				rx="12"
				ry="6.5"
				transform="rotate(-28 108 42)"
				fill="#d9392b"
				{ ...TRAC }
			/>
			<ellipse
				cx="108"
				cy="56"
				rx="12"
				ry="6.5"
				transform="rotate(28 108 56)"
				fill="#d9392b"
				{ ...TRAC }
			/>
			<path
				d="M30 58Q28 22 70 22T110 58Q70 44 30 58Z"
				fill="#d9392b"
				{ ...TRAC }
			/>
			<g fill="#fff">
				<circle cx="46" cy="38" r="3.2" />
				<circle cx="70" cy="33" r="3.2" />
				<circle cx="94" cy="38" r="3.2" />
			</g>
			<circle cx="107" cy="49" r="6" fill="#b82a1f" { ...TRAC } />
			<path d="M63 68h14" fill="none" { ...TRAC } strokeWidth="3.5" />
			<circle
				cx="52"
				cy="70"
				r={ radi }
				fill="#fff"
				{ ...TRAC }
				strokeWidth="3.5"
			/>
			<circle
				cx="88"
				cy="70"
				r={ radi }
				fill="#fff"
				{ ...TRAC }
				strokeWidth="3.5"
			/>
			<circle cx="52" cy={ 71 + baixa } r={ pupila } fill={ TINTA } />
			<circle cx="88" cy={ 71 + baixa } r={ pupila } fill={ TINTA } />
			<circle cx="53.6" cy={ 69.2 + baixa } r="1.6" fill="#fff" />
			<circle cx="89.6" cy={ 69.2 + baixa } r="1.6" fill="#fff" />
			<path
				d="M68 78Q64 85 71 86"
				fill="none"
				stroke="#d09a74"
				strokeWidth="3.5"
				strokeLinecap="round"
			/>
			<ellipse
				cx="42"
				cy="90"
				rx="7"
				ry="5"
				fill="#f19b86"
				opacity=".55"
			/>
			<ellipse
				cx="98"
				cy="90"
				rx="7"
				ry="5"
				fill="#f19b86"
				opacity=".55"
			/>
			{ alerta && (
				<>
					<ellipse
						cx="70"
						cy="98"
						rx="5.5"
						ry="7"
						fill="#7a2f26"
						{ ...TRAC }
						strokeWidth="3.5"
					/>
					<path
						d="M122 74q-7 9 0 14q7-5 0-14Z"
						fill="#7ec4dc"
						{ ...TRAC }
						strokeWidth="3"
					/>
				</>
			) }
			{ contenta && (
				<path d="M55 92Q70 110 85 92Z" fill="#fff" { ...TRAC } />
			) }
			{ trista && (
				<path d="M58 100Q70 90 82 100" fill="none" { ...TRAC } />
			) }
			{ ! alerta && ! contenta && ! trista && (
				<path d="M57 93Q70 105 83 93" fill="none" { ...TRAC } />
			) }
		</svg>
	);
}

export const PERSONATGES = {
	llissa: { nom: __( 'la Llissa', 'noempesquen' ), Avatar: Llissa },
	remei: { nom: __( 'la Pirata Remei', 'noempesquen' ), Avatar: Remei },
};
