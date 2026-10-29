/**
 * Pila d'apps del mòbil (reductor pur, sense JSX).
 *
 * La darrera entrada és l'app en primer pla, tret que `inici` sigui cert:
 * llavors es veu la pantalla d'inici i les apps continuen a la pila (en
 * segon pla, amb el seu estat). Cada entrada té una `clau` estable perquè
 * l'app conservi el seu estat mentre és a la pila.
 *
 * Accions:
 * - { tipus: 'OBRE', app, dades }: obre l'app; si ja hi és, la porta a
 *   dalt sense duplicar-la (i actualitza les dades si se n'hi passen).
 *   Surt de la pantalla d'inici.
 * - { tipus: 'ENRERE' }: treu l'app de dalt (a l'inici o amb la pila
 *   buida, res).
 * - { tipus: 'INICI' }: mostra la pantalla d'inici sense tancar apps.
 * - { tipus: 'REINICIA' }: estat inicial (en tornar al bloqueig).
 */

export const ESTAT_PILA = { apps: [], seq: 0, inici: false };

/**
 * @param {{apps: Object[], seq: number, inici: boolean}} estat Pila actual.
 * @return {?Object} Entrada en primer pla, o null a l'inici.
 */
export function appActiva( estat ) {
	if ( estat.inici ) {
		return null;
	}
	return estat.apps[ estat.apps.length - 1 ] ?? null;
}

/**
 * @param {{apps: Object[], seq: number, inici: boolean}} estat Pila actual.
 * @param {Object}                                        accio Acció.
 * @return {{apps: Object[], seq: number, inici: boolean}} Nova pila.
 */
export function pilaReductor( estat, accio ) {
	switch ( accio.tipus ) {
		case 'OBRE': {
			if ( ! accio.app ) {
				return estat;
			}
			const actual = estat.apps.find( ( a ) => a.app === accio.app );
			if ( actual ) {
				const entrada =
					accio.dades === undefined
						? actual
						: { ...actual, dades: accio.dades };
				return {
					...estat,
					inici: false,
					apps: [
						...estat.apps.filter( ( a ) => a !== actual ),
						entrada,
					],
				};
			}
			return {
				inici: false,
				apps: [
					...estat.apps,
					{
						clau: `a${ estat.seq }`,
						app: accio.app,
						dades: accio.dades,
					},
				],
				seq: estat.seq + 1,
			};
		}
		case 'ENRERE':
			if ( estat.inici || ! estat.apps.length ) {
				return estat;
			}
			return { ...estat, apps: estat.apps.slice( 0, -1 ) };
		case 'INICI':
			if ( estat.inici || ! estat.apps.length ) {
				return estat;
			}
			return { ...estat, inici: true };
		case 'REINICIA':
			return ESTAT_PILA;
		default:
			return estat;
	}
}
