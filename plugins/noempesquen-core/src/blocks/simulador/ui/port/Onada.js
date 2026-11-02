/**
 * Franja de mar amb cresta d'escuma. El grup exterior col·loca; l'interior
 * (`classe`) és el que l'animació desplaça exactament un període.
 */
import { onada } from './comu';

export function Onada( { classe, color, escuma = '#ddeff2', ...forma } ) {
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
		</g>
	);
}
