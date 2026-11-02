/**
 * Geometria de l'overlay del tutorial (mòdul pur, sense DOM ni JSX).
 *
 * Tots els rectangles són `{ x, y, amplada, alcada }` en píxels relatius a la
 * caixa interior de `.nep-so`; els del DOM (`getBoundingClientRect()`) es
 * passen abans per `relatiu()`.
 */

/** Marge entre l'element i la vora del forat. */
export const MARGE_FORAT = 8;
/** Separació entre el forat i la targeta. */
export const SEPARACIO = 12;
/** Distància mínima de la targeta a les vores del contenidor. */
export const VORA = 8;

/**
 * Rectangle d'un element relatiu al contenidor.
 *
 * @param {{left:number, top:number, width:number, height:number}} el   Rect de l'element.
 * @param {{left:number, top:number}}                              cont Origen del contenidor (ja amb `clientLeft/Top`).
 * @return {{x:number, y:number, amplada:number, alcada:number}} Rect relatiu.
 */
export function relatiu( el, cont ) {
	return {
		x: el.left - cont.left,
		y: el.top - cont.top,
		amplada: el.width,
		alcada: el.height,
	};
}

/**
 * Forat: l'àncora amb marge, retallada al contenidor.
 *
 * @param {?Object} ancora Rect relatiu de l'àncora (o null).
 * @param {Object}  cont   `{ amplada, alcada }` del contenidor.
 * @param {number}  marge  Marge al voltant.
 * @return {?Object} Rect del forat, o null si no n'hi ha (o queda buit).
 */
export function forat( ancora, cont, marge = MARGE_FORAT ) {
	if ( ! ancora || ancora.amplada <= 0 || ancora.alcada <= 0 ) {
		return null;
	}
	const x1 = Math.max( 0, ancora.x - marge );
	const y1 = Math.max( 0, ancora.y - marge );
	const x2 = Math.min( cont.amplada, ancora.x + ancora.amplada + marge );
	const y2 = Math.min( cont.alcada, ancora.y + ancora.alcada + marge );
	if ( x2 - x1 <= 0 || y2 - y1 <= 0 ) {
		return null;
	}
	return { x: x1, y: y1, amplada: x2 - x1, alcada: y2 - y1 };
}

/**
 * Panells del vel: quatre al voltant del forat (dalt, baix, esquerra, dreta)
 * sense solapar-se, o un de sol que ho cobreix tot si no hi ha forat.
 *
 * @param {?Object} f    Forat.
 * @param {Object}  cont `{ amplada, alcada }`.
 * @return {Array<Object>} Rectangles (amplada i alçada ≥ 0).
 */
export function panells( f, cont ) {
	const { amplada: W, alcada: H } = cont;
	if ( ! f ) {
		return [ { x: 0, y: 0, amplada: W, alcada: H } ];
	}
	const baix = f.y + f.alcada;
	const dreta = f.x + f.amplada;
	return [
		{ x: 0, y: 0, amplada: W, alcada: f.y },
		{ x: 0, y: baix, amplada: W, alcada: Math.max( 0, H - baix ) },
		{ x: 0, y: f.y, amplada: f.x, alcada: f.alcada },
		{
			x: dreta,
			y: f.y,
			amplada: Math.max( 0, W - dreta ),
			alcada: f.alcada,
		},
	];
}

const limita = ( v, min, max ) => Math.max( min, Math.min( v, max ) );

/**
 * Posició de la targeta: sota el forat si hi cap, si no a sobre, si no al
 * costat (dreta o esquerra) i, si no, centrada. Sempre dins del contenidor.
 *
 * @param {?Object} f               Forat.
 * @param {Object}  cont            `{ amplada, alcada }`.
 * @param {Object}  targeta         `{ amplada, alcada }` de la targeta.
 * @param {Object}  [opc]
 * @param {number}  [opc.separacio] Separació amb el forat.
 * @param {number}  [opc.vora]      Marge amb les vores.
 * @return {{costat:string, x:number, y:number}} Costat i cantonada superior esquerra.
 */
export function posicioTargeta(
	f,
	cont,
	targeta,
	{ separacio = SEPARACIO, vora = VORA } = {}
) {
	const { amplada: W, alcada: H } = cont;
	const { amplada: tw, alcada: th } = targeta;
	const maxX = Math.max( vora, W - tw - vora );
	const maxY = Math.max( vora, H - th - vora );
	const centrada = {
		costat: 'centre',
		x: limita( ( W - tw ) / 2, vora, maxX ),
		y: limita( ( H - th ) / 2, vora, maxY ),
	};
	if ( ! f ) {
		return centrada;
	}
	const xCentrat = () => limita( f.x + ( f.amplada - tw ) / 2, vora, maxX );
	const yCentrat = () => limita( f.y + ( f.alcada - th ) / 2, vora, maxY );
	const sota = f.y + f.alcada + separacio;
	if ( sota + th + vora <= H ) {
		return { costat: 'sota', x: xCentrat(), y: sota };
	}
	const sobre = f.y - separacio - th;
	if ( sobre >= vora ) {
		return { costat: 'sobre', x: xCentrat(), y: sobre };
	}
	const dreta = f.x + f.amplada + separacio;
	if ( dreta + tw + vora <= W ) {
		return { costat: 'dreta', x: dreta, y: yCentrat() };
	}
	const esquerra = f.x - separacio - tw;
	if ( esquerra >= vora ) {
		return { costat: 'esquerra', x: esquerra, y: yCentrat() };
	}
	return centrada;
}

/**
 * Tria quin dels elements amb la mateixa clau fa d'àncora.
 * Regla: el primer visible; per a `botons-finestra`, el de dins de la
 * finestra amb focus (`data-tut-foc`) i, si cap no en té, l'últim visible.
 *
 * @param {Array<{visible:boolean, foc:boolean}>} candidats En ordre del DOM.
 * @param {string}                                clau      Clau `data-tut`.
 * @return {number} Índex triat o -1.
 */
export function triaAncora( candidats, clau ) {
	const visibles = candidats
		.map( ( c, i ) => ( { ...c, i } ) )
		.filter( ( c ) => c.visible );
	if ( ! visibles.length ) {
		return -1;
	}
	if ( clau === 'botons-finestra' ) {
		const ambFoc = visibles.find( ( c ) => c.foc );
		return ( ambFoc ?? visibles.at( -1 ) ).i;
	}
	return visibles[ 0 ].i;
}

/**
 * Cert si dos rectangles (o null) difereixen més del llindar.
 *
 * @param {?Object} a       Rect anterior.
 * @param {?Object} b       Rect nou.
 * @param {number}  llindar Píxels.
 * @return {boolean} Cert si ha canviat.
 */
export function haCanviat( a, b, llindar = 0.5 ) {
	if ( ! a || ! b ) {
		return a !== b;
	}
	return [ 'x', 'y', 'amplada', 'alcada' ].some(
		( k ) => Math.abs( ( a[ k ] ?? 0 ) - ( b[ k ] ?? 0 ) ) > llindar
	);
}
