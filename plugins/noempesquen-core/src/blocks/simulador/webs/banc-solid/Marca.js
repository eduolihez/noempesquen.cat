/**
 * Marca de Banc Sòlid: tres blocs apilats (uns fonaments) i el nom. La còpia
 * falsa en fa una versió gairebé igual: el bloc de dalt d'un verd més clar,
 * els blocs una mica més junts i el nom amb un altre pes.
 */

import { __ } from '@wordpress/i18n';
import { Glif24 } from '../comu/icones';

function Blocs( { falsa } ) {
	return (
		<svg
			viewBox="0 0 36 36"
			width="36"
			height="36"
			aria-hidden="true"
			focusable="false"
		>
			<rect width="36" height="36" rx="8" fill="#12355b" />
			<rect
				x="9"
				y={ falsa ? 9 : 8 }
				width="18"
				height="5"
				rx="1.5"
				fill={ falsa ? '#3fb07f' : '#2f9e6e' }
			/>
			<rect
				x="7"
				y={ falsa ? 15 : 15.5 }
				width="22"
				height="5"
				rx="1.5"
				fill="#fff"
			/>
			<rect
				x="5"
				y={ falsa ? 21 : 23 }
				width="26"
				height="5"
				rx="1.5"
				fill="#fff"
			/>
		</svg>
	);
}

/**
 * @param {Object}  props
 * @param {boolean} props.falsa Versió de la còpia.
 */
export function MarcaBancSolid( { falsa = false } ) {
	return (
		<span className={ `nep-bs-marca${ falsa ? ' is-falsa' : '' }` }>
			<Blocs falsa={ falsa } />
			<span className="nep-bs-marca__nom">
				{ __( 'Banc Sòlid', 'noempesquen' ) }
			</span>
		</span>
	);
}

export const IconaAvis = ( p ) => (
	<Glif24 { ...p }>
		<path d="M12 3.6 2.8 19.4h18.4z" />
		<path d="M12 9.6v4.6" />
		<circle cx="12" cy="16.9" r="0.5" fill="currentColor" />
	</Glif24>
);

export const IconaCorrecte = ( p ) => (
	<Glif24 { ...p }>
		<circle cx="12" cy="12" r="9" />
		<path d="m7.8 12.3 2.8 2.8 5.6-5.8" />
	</Glif24>
);

export const IconaEscut = ( p ) => (
	<Glif24 { ...p }>
		<path d="M12 3 5 6v5.5c0 4.2 2.9 7.8 7 9.5 4.1-1.7 7-5.3 7-9.5V6z" />
		<path d="m9 12 2.2 2.2L15.5 10" />
	</Glif24>
);

export const IconaMobil = ( p ) => (
	<Glif24 { ...p }>
		<rect x="7" y="2.8" width="10" height="18.4" rx="2" />
		<path d="M10.8 17.6h2.4" />
	</Glif24>
);

export const IconaTargeta = ( p ) => (
	<Glif24 { ...p }>
		<rect x="3" y="5.5" width="18" height="13" rx="2" />
		<path d="M3 10h18M7 14.6h4" />
	</Glif24>
);
