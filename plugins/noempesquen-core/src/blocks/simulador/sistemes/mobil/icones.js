/**
 * Glifs propis del sistema mòbil (graella de 20, color actual, decoratius).
 */
import { Glif } from '../../ui/icones';

export const IconaCobertura = ( p ) => (
	<Glif { ...p } stroke="none" fill="currentColor">
		<rect x="2.5" y="12.5" width="2.6" height="4.5" rx="0.8" />
		<rect x="6.6" y="9.5" width="2.6" height="7.5" rx="0.8" />
		<rect x="10.7" y="6.5" width="2.6" height="10.5" rx="0.8" />
		<rect x="14.8" y="3.5" width="2.6" height="13.5" rx="0.8" />
	</Glif>
);

export const IconaEnrere = ( p ) => (
	<Glif { ...p }>
		<path d="M12.5 4.5 7 10l5.5 5.5" />
	</Glif>
);

export const IconaInici = ( p ) => (
	<Glif { ...p }>
		<circle cx="10" cy="10" r="5.6" />
	</Glif>
);
