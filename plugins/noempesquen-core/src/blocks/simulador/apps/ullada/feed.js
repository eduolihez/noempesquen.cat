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

/**
 * Primer mot d'un nom; tolera valors que no siguin text.
 *
 * @param {*} nom Nom complet.
 * @return {string} Primer mot, o buit.
 */
export function primerNom( nom ) {
	return typeof nom === 'string' ? nom.trim().split( /\s+/ )[ 0 ] : '';
}

/**
 * Usuari d'Ullada del jugador a partir del nom («Àlex Puig» → «alex.puig»).
 *
 * @param {string} nom Nom complet.
 * @return {string} Usuari sense @.
 */
export function usuariDe( nom ) {
	return String( nom ?? '' )
		.normalize( 'NFD' )
		.replace( /[̀-ͯ]/g, '' )
		.toLowerCase()
		.trim()
		.split( /\s+/ )
		.filter( Boolean )
		.join( '.' );
}
