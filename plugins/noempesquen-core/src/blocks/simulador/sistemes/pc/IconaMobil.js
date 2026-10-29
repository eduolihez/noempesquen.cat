import { Glif } from '../../ui/icones';

/**
 * Icona SVG pròpia d'un telèfon mòbil (origen de les notificacions
 * del mòbil vinculat).
 *
 * @param {Object} p Propietats de Glif (mida...).
 */
export const IconaMobil = ( p ) => (
	<Glif { ...p }>
		<rect x="5.5" y="2.5" width="9" height="15" rx="2" />
		<path d="M8.6 15h2.8" />
	</Glif>
);
