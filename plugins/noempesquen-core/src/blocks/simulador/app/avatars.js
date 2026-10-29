/**
 * Personatges dibuixats en SVG (disseny propi).
 * estat: 'normal' | 'alerta' | 'contenta' | 'trista'
 */

function Boca( { estat, x, y, ample = 14 } ) {
	if ( estat === 'contenta' ) {
		return (
			<path
				d={ `M${ x - ample / 2 } ${ y } q${ ample / 2 } ${ ample / 2 } ${ ample } 0` }
				fill="none"
				stroke="#1b2a3a"
				strokeWidth="3"
				strokeLinecap="round"
			/>
		);
	}
	if ( estat === 'trista' ) {
		return (
			<path
				d={ `M${ x - ample / 2 } ${ y + 4 } q${ ample / 2 } -${ ample / 2 } ${ ample } 0` }
				fill="none"
				stroke="#1b2a3a"
				strokeWidth="3"
				strokeLinecap="round"
			/>
		);
	}
	if ( estat === 'alerta' ) {
		return <ellipse cx={ x } cy={ y + 1 } rx="4" ry="5" fill="#1b2a3a" />;
	}
	return (
		<path
			d={ `M${ x - ample / 2 } ${ y } h${ ample }` }
			stroke="#1b2a3a"
			strokeWidth="3"
			strokeLinecap="round"
		/>
	);
}

export function Llissa( { estat = 'normal', mida = 72 } ) {
	return (
		<svg
			viewBox="0 0 120 100"
			width={ mida }
			height={ mida * 0.83 }
			aria-hidden="true"
			focusable="false"
		>
			{ /* cua */ }
			<path d="M95 50 L118 30 L112 50 L118 70 Z" fill="#5b8fa3" />
			{ /* cos */ }
			<ellipse cx="58" cy="50" rx="44" ry="32" fill="#7fb3c4" />
			<ellipse cx="54" cy="60" rx="32" ry="16" fill="#cfe6ec" />
			{ /* aleta */ }
			<path d="M50 20 q15 -14 30 2 z" fill="#5b8fa3" />
			<path d="M60 58 q10 10 22 4 q-10 -2 -14 -12 z" fill="#5b8fa3" />
			{ /* ull */ }
			<circle cx="34" cy="40" r="9" fill="#fff" />
			<circle
				cx={ estat === 'alerta' ? 36 : 34 }
				cy="40"
				r="4.5"
				fill="#1b2a3a"
			/>
			{ estat === 'alerta' && (
				<path
					d="M24 28 l18 4"
					stroke="#1b2a3a"
					strokeWidth="3"
					strokeLinecap="round"
				/>
			) }
			{ /* boca i cicatriu de l'ham */ }
			<Boca estat={ estat } x={ 22 } y={ 58 } ample={ 12 } />
			<path
				d="M14 52 l6 4 M16 50 l4 7"
				stroke="#d9667a"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}

export function Remei( { estat = 'normal', mida = 72 } ) {
	return (
		<svg
			viewBox="0 0 100 100"
			width={ mida }
			height={ mida }
			aria-hidden="true"
			focusable="false"
		>
			{ /* monyo */ }
			<circle cx="50" cy="16" r="12" fill="#d7d7d7" />
			{ /* cara */ }
			<circle cx="50" cy="54" r="34" fill="#f2c9a5" />
			{ /* mocador pirata */ }
			<path d="M16 46 q34 -34 68 0 q-34 -10 -68 0 z" fill="#b42318" />
			<circle cx="34" cy="36" r="2.2" fill="#fff" />
			<circle cx="50" cy="31" r="2.2" fill="#fff" />
			<circle cx="66" cy="36" r="2.2" fill="#fff" />
			<path d="M82 44 l12 6 l-10 4 z" fill="#b42318" />
			{ /* pegat a l'ull */ }
			<path d="M22 44 L78 62" stroke="#1b2a3a" strokeWidth="2" />
			<ellipse cx="38" cy="54" rx="9" ry="7" fill="#1b2a3a" />
			{ /* ulleres i ull */ }
			<circle
				cx="63"
				cy="54"
				r="9"
				fill="#fff"
				stroke="#6b4f2a"
				strokeWidth="2.5"
			/>
			<circle
				cx={ estat === 'alerta' ? 65 : 63 }
				cy="54"
				r="3.5"
				fill="#1b2a3a"
			/>
			{ estat === 'alerta' && (
				<path
					d="M54 42 l16 -2"
					stroke="#8a8a8a"
					strokeWidth="3"
					strokeLinecap="round"
				/>
			) }
			{ /* arracada */ }
			<circle
				cx="18"
				cy="64"
				r="4"
				fill="none"
				stroke="#d4a017"
				strokeWidth="2.5"
			/>
			{ /* galtes i boca */ }
			<circle cx="40" cy="70" r="5" fill="#eaa38a" opacity="0.6" />
			<circle cx="70" cy="70" r="5" fill="#eaa38a" opacity="0.6" />
			<Boca estat={ estat } x={ 55 } y={ 74 } ample={ 16 } />
		</svg>
	);
}

export const PERSONATGES = {
	llissa: { nom: 'la Llissa', Avatar: Llissa },
	remei: { nom: 'la Pirata Remei', Avatar: Remei },
};
