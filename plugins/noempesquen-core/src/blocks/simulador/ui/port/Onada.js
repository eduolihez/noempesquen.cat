/**
 * Franja de mar amb cresta d'escuma. El grup exterior col·loca; l'interior
 * (`classe`) és el que l'animació desplaça exactament un període.
 */
import { onada, ondetes } from './comu';

export function Onada( {
	classe,
	color,
	escuma = '#ddeff2',
	ondes = false,
	...forma
} ) {
	return (
		<g className={ classe }>
			<path d={ onada( forma ) } fill={ color } />
			<path
				d={ onada( { ...forma, fons: undefined } ) }
				fill="none"
				stroke={ escuma }
				strokeWidth="3"
				strokeLinecap="round"
			/>
			{ ondes && (
				<path
					d={ ondetes( {
						...forma,
						y: forma.y + forma.amp * 3 + 8,
					} ) }
					fill="none"
					stroke={ escuma }
					strokeWidth="2.5"
					strokeLinecap="round"
					opacity=".4"
				/>
			) }
		</g>
	);
}
