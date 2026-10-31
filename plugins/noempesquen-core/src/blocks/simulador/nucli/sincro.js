/**
 * Fusió de progrés local i del servidor (màxim d'estrelles per missió).
 * Mòdul pur: sense DOM ni JSX.
 */

const esObjecte = ( x ) =>
	x !== null && typeof x === 'object' && ! Array.isArray( x );

const netejat = ( x ) => {
	const sortida = {};
	if ( ! esObjecte( x ) ) {
		return sortida;
	}
	for ( const [ id, v ] of Object.entries( x ) ) {
		if ( typeof v === 'number' && Number.isFinite( v ) ) {
			sortida[ id ] = v;
		}
	}
	return sortida;
};

export const fusionaProgres = ( local, servidor ) => {
	const sortida = netejat( servidor );
	for ( const [ id, v ] of Object.entries( netejat( local ) ) ) {
		if ( ! ( id in sortida ) || v > sortida[ id ] ) {
			sortida[ id ] = v;
		}
	}
	return sortida;
};

export const diferencia = ( fusionat, servidor ) => {
	const s = netejat( servidor );
	return Object.entries( netejat( fusionat ) ).some(
		( [ id, v ] ) => ! ( id in s ) || v > s[ id ]
	);
};
