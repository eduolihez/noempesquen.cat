import { createContext, useContext } from '@wordpress/element';
import { PeticioGirar } from './PeticioGirar';

/* Fitxer amb nom diferent de pantalla.js: Windows no distingeix majúscules. */

const SENSE_ESCALA = { escala: 1 };
const PantallaContext = createContext( SENSE_ESCALA );

/**
 * Escala del sistema simulat (1 si no s'escala). Per convertir els
 * desplaçaments del punter a píxels lògics.
 *
 * @return {number} Escala.
 */
export const useEscala = () => useContext( PantallaContext ).escala;

/**
 * Embolcall del PC: el mostra tal qual (normal), escalat a 1280×720
 * (escalat) o tapat amb la petició de girar (girar). L'arbre és sempre el
 * mateix perquè canviar de mode no desmunti el sistema.
 *
 * @param {Object}   props
 * @param {string}   props.dispositiu 'pc' o 'mobil'.
 * @param {Object}   props.pantalla   Resultat d'usePantalla.
 * @param {Function} props.onSurt     Torna al selector.
 * @param {Object}   props.children   Sistema.
 */
export function Pantalla( { dispositiu, pantalla, onSurt, children } ) {
	if ( dispositiu !== 'pc' ) {
		return children;
	}
	const { mode, escala, ample, alt, desplX, desplY, tactil } = pantalla;
	const escalat = mode === 'escalat';
	const girar = mode === 'girar';
	const classes = [ 'nep-so-pantalla', `is-${ mode }`, tactil && 'is-tactil' ]
		.filter( Boolean )
		.join( ' ' );

	return (
		<div
			className={ classes }
			style={ escalat ? { '--so-escala': escala } : undefined }
		>
			<div
				className="nep-so-pantalla__contingut"
				style={
					escalat
						? {
								width: ample,
								height: alt,
								left: desplX,
								top: desplY,
							}
						: undefined
				}
				inert={ girar ? '' : undefined }
				aria-hidden={ girar ? 'true' : undefined }
			>
				<PantallaContext.Provider
					value={ escalat ? { escala } : SENSE_ESCALA }
				>
					{ children }
				</PantallaContext.Provider>
			</div>
			{ girar && <PeticioGirar tactil={ tactil } onSurt={ onSurt } /> }
		</div>
	);
}
