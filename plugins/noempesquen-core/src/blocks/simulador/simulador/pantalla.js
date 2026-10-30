/**
 * Mode de pantalla del PC simulat segons la mida de la finestra.
 * Mòdul pur: sense DOM.
 */
export const MINIM = { w: 1280, h: 720 };

const NORMAL = {
	mode: 'normal',
	escala: 1,
	ample: MINIM.w,
	alt: MINIM.h,
	desplX: 0,
	desplY: 0,
};

const valid = ( n ) => Number.isFinite( n ) && n > 0;

/**
 * @param {Object} p
 * @param {number} p.w          Ample de la finestra.
 * @param {number} p.h          Alt de la finestra.
 * @param {boolean} [p.tactil] Reservat: encara no influeix en el resultat.
 * @param {string} p.dispositiu 'pc' o 'mobil'.
 * @return {{mode:string,escala:number,ample:number,alt:number,desplX:number,desplY:number}} Mode i geometria.
 */
export function calculaPantalla( { w, h, dispositiu } = {} ) {
	if ( dispositiu !== 'pc' || ! valid( w ) || ! valid( h ) ) {
		return { ...NORMAL };
	}
	if ( w >= MINIM.w && h >= MINIM.h ) {
		return { ...NORMAL };
	}
	if ( h > w && w < 768 ) {
		return { ...NORMAL, mode: 'girar' };
	}
	const escala =
		Math.round( Math.min( w / MINIM.w, h / MINIM.h ) * 1000 ) / 1000;
	return {
		mode: 'escalat',
		escala,
		ample: MINIM.w,
		alt: MINIM.h,
		desplX: Math.round( ( w - MINIM.w * escala ) / 2 ),
		desplY: Math.round( ( h - MINIM.h * escala ) / 2 ),
	};
}
