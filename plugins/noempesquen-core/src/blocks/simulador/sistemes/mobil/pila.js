/**
 * Pila d'apps del mòbil (reductor pur, sense JSX).
 *
 * La darrera entrada és l'app en primer pla; amb la pila buida es veu
 * la pantalla d'inici. Cada entrada té una `clau` estable perquè l'app
 * conservi el seu estat mentre és a la pila.
 *
 * Accions:
 * - { tipus: 'OBRE', app, dades }: obre l'app; si ja hi és, la porta a
 *   dalt sense duplicar-la (i actualitza les dades si se n'hi passen).
 * - { tipus: 'ENRERE' }: treu l'app de dalt (amb la pila buida, res).
 * - { tipus: 'INICI' }: torna a la pantalla d'inici (buida la pila).
 * - { tipus: 'REINICIA' }: estat inicial (en tornar al bloqueig).
 */

export const ESTAT_PILA = { apps: [], seq: 0 };

/**
 * @param {{apps: Object[], seq: number}} estat Pila actual.
 * @return {?Object} Entrada en primer pla, o null a l'inici.
 */
export function appActiva( estat ) {
	return estat.apps[ estat.apps.length - 1 ] ?? null;
}

/**
 * @param {{apps: Object[], seq: number}} estat Pila actual.
 * @param {Object}                         accio Acció.
 * @return {{apps: Object[], seq: number}} Nova pila.
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
					apps: [
						...estat.apps.filter( ( a ) => a !== actual ),
						entrada,
					],
				};
			}
			return {
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
			if ( ! estat.apps.length ) {
				return estat;
			}
			return { ...estat, apps: estat.apps.slice( 0, -1 ) };
		case 'INICI':
			if ( ! estat.apps.length ) {
				return estat;
			}
			return { ...estat, apps: [] };
		case 'REINICIA':
			return ESTAT_PILA;
		default:
			return estat;
	}
}
