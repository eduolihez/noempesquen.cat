/**
 * Lògica pura del feed d'Ullada (sense JSX).
 */

/**
 * Publicacions amb el perfil resolt; les extres de la missió van al principi.
 * Un autor inexistent no trenca: es crea un perfil buit.
 *
 * @param {Object}   mon    Món compartit (`mon.ullada`).
 * @param {Object[]} extres Publicacions extra de la missió.
 * @return {Object[]} Publicacions amb `perfil`.
 */
export function construeixFeed( mon, extres = [] ) {
	const perfils = Array.isArray( mon?.ullada?.perfils )
		? mon.ullada.perfils
		: [];
	const publicacions = Array.isArray( mon?.ullada?.publicacions )
		? mon.ullada.publicacions
		: [];
	const llista = [
		...( Array.isArray( extres ) ? extres : [] ),
		...publicacions,
	];
	return llista
		.filter( ( p ) => p && typeof p === 'object' )
		.map( ( p ) => ( {
			...p,
			likes: Number.isFinite( p.likes ) ? p.likes : 0,
			perfil: perfils.find( ( pf ) => pf.id === p.autor ) ?? {
				id: p.autor ?? '',
				nom: '',
				usuari: '',
				il: null,
			},
		} ) );
}

/**
 * «1.234 m'agrada», «1 m'agrada», «0 m'agrada» (milers amb punt).
 *
 * @param {number} n Nombre de m'agrada.
 * @return {string} Text.
 */
export function formataLikes( n ) {
	const v = Number.isFinite( n ) ? Math.max( 0, Math.trunc( n ) ) : 0;
	const milers = String( v ).replace( /\B(?=(\d{3})+(?!\d))/g, '.' );
	return `${ milers } m'agrada`;
}
