import { __ } from '@wordpress/i18n';
import { Inspeccionable } from '../../ui/Inspeccionable';
import { Glif24 } from './icones';

const IconaInfo = ( p ) => (
	<Glif24 { ...p }>
		<circle cx="12" cy="12" r="8.5" />
		<path d="M12 11v5.5" />
		<path d="M12 7.8h.01" />
	</Glif24>
);

const IconaCreu = ( p ) => (
	<Glif24 { ...p }>
		<path d="M6.5 6.5 17.5 17.5" />
		<path d="M17.5 6.5 6.5 17.5" />
	</Glif24>
);

/**
 * Barra superior falsa «El teu navegador està desactualitzat…» d'una web
 * simulada. El text admet segments amb senyal (`Inspeccionable`).
 *
 * @param {Object}   props
 * @param {Array}    props.text         Segments `{ t, senyal? }`.
 * @param {string}   props.boto         Text del botó d'acció.
 * @param {Function} props.onDescarrega Clic al botó d'acció.
 * @param {Function} props.onTanca      Clic a «Tanca la barra».
 */
export function BarraActualitzacio( { text, boto, onDescarrega, onTanca } ) {
	const segments = Array.isArray( text ) ? text : [];
	return (
		<div
			className="nep-barra-act"
			role="region"
			aria-label={ __( 'Avís del navegador', 'noempesquen' ) }
		>
			<IconaInfo mida={ 22 } />
			<p className="nep-barra-act__text">
				{ segments.map( ( seg, i ) => (
					<Inspeccionable
						key={ i }
						text={ seg.t }
						senyal={ seg.senyal }
					/>
				) ) }
			</p>
			<button
				type="button"
				className="nep-barra-act__boto"
				onClick={ () => onDescarrega?.() }
			>
				{ boto }
			</button>
			<button
				type="button"
				className="nep-barra-act__tanca"
				aria-label={ __( 'Tanca la barra', 'noempesquen' ) }
				onClick={ () => onTanca?.() }
			>
				<IconaCreu mida={ 20 } />
			</button>
		</div>
	);
}
