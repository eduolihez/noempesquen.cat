/**
 * Lògica pura del retard (`retard_ms`) de l'avís de la plantilla `article`: sense JSX ni
 * DOM. El temps és el del joc (`estat.temps`, en segons), que no avança amb
 * la partida en pausa.
 */

/**
 * Segons de joc que cal esperar per a un retard en mil·lisegons.
 *
 * @param {*} retard Retard en ms (no vàlid o negatiu compta com a 0).
 * @return {number} Segons sencers (arrodonits amunt).
 */
export function segonsRetard( retard ) {
	const ms = Number( retard );
	if ( ! Number.isFinite( ms ) || ms <= 0 ) {
		return 0;
	}
	return Math.ceil( ms / 1000 );
}

/**
 * Avança el comptador de temps visible: només suma els segons de joc que han
 * passat mentre la pestanya era l'activa.
 *
 * @param {{ultim:number, visible:number}} comptador Estat anterior.
 * @param {number}                         ara       Segons de joc actuals.
 * @param {boolean}                        activa    Si la pestanya és visible.
 * @return {{ultim:number, visible:number}} Estat nou.
 */
export function avancaVisible( comptador, ara, activa ) {
	const t = Number( ara ) || 0;
	const delta = Math.max( 0, t - ( Number( comptador?.ultim ) || 0 ) );
	return {
		ultim: t,
		visible: ( Number( comptador?.visible ) || 0 ) + ( activa ? delta : 0 ),
	};
}

/**
 * Si ja toca mostrar l'avís.
 *
 * @param {*}      retard Retard en ms de joc.
 * @param {number} inici  Segons de joc en carregar la pàgina.
 * @param {number} ara    Segons de joc actuals.
 * @return {boolean} Si l'avís ha de ser visible.
 */
export function avisToca( retard, inici, ara ) {
	return (
		( Number( ara ) || 0 ) - ( Number( inici ) || 0 ) >=
		segonsRetard( retard )
	);
}
