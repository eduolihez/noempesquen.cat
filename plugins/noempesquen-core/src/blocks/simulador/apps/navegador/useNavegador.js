import {
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
} from '@wordpress/element';
import { useJoc } from '../../simulador/context';
import {
	ajustaEsquema,
	estatInicial,
	hostname,
	navegadorReductor,
	pestanyaActiva,
	urlActual,
} from './historial';
import { infoPagina } from './infoPagina';

/**
 * Lògica comuna del Navegador (PC i mòbil): pestanyes amb historial,
 * obertura amb `dades.url`, esdeveniments al motor i accions.
 *
 * @param {?Object} dades Dades d'obertura ({ url }) que envia el sistema.
 * @return {Object} Estat, pestanya activa, infos de pàgina i accions.
 */
export function useNavegador( dades ) {
	const { missio, emet } = useJoc();
	const [ estat, dispatch ] = useReducer(
		navegadorReductor,
		dades?.url ? ajustaEsquema( dades.url, missio ) : null,
		estatInicial
	);
	const dadesAnteriors = useRef( dades );

	const activa = pestanyaActiva( estat );
	const url = urlActual( activa );
	const infos = useMemo(
		() =>
			Object.fromEntries(
				estat.pestanyes.map( ( p ) => [
					p.id,
					infoPagina( urlActual( p ), missio ),
				] )
			),
		[ estat.pestanyes, missio ]
	);
	const info = infos[ estat.activa ];

	// El sistema torna a obrir el navegador amb una URL (p. ex. la
	// notificació de Posta o un enllaç de Missatges): s'activa la pestanya
	// que ja la mostra o se n'obre una de nova. Es compara per URL, mai no
	// es duplica. No s'emet `enllac.obre`: ja l'emet qui obre l'enllaç.
	useEffect( () => {
		if ( dades === dadesAnteriors.current || ! dades?.url ) {
			return;
		}
		dadesAnteriors.current = dades;
		const desti = ajustaEsquema( dades.url, missio );
		const existent = estat.pestanyes.find(
			( p ) => urlActual( p ) === desti
		);
		dispatch(
			existent
				? { tipus: 'ACTIVA', id: existent.id }
				: { tipus: 'OBRE_PESTANYA', url: desti }
		);
	}, [ dades ] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Cada càrrega de la pestanya activa (no un simple canvi de pestanya).
	useEffect( () => {
		if ( hostname( url ) ) {
			emet( 'web.carrega', { url } );
		}
	}, [ estat.carregues ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const navega = useCallback(
		( desti ) =>
			dispatch( {
				tipus: 'NAVEGA',
				url: ajustaEsquema( desti, missio ),
			} ),
		[ missio ]
	);
	const obrePestanya = useCallback(
		( desti ) => {
			emet( 'enllac.obre', { url: desti } );
			dispatch( {
				tipus: 'OBRE_PESTANYA',
				url: ajustaEsquema( desti, missio ),
			} );
		},
		[ emet, missio ]
	);
	const recarrega = useCallback(
		() => dispatch( { tipus: 'RECARREGA' } ),
		[]
	);
	const enrere = useCallback( () => dispatch( { tipus: 'ENRERE' } ), [] );
	const endavant = useCallback( () => dispatch( { tipus: 'ENDAVANT' } ), [] );
	const activaPestanya = useCallback(
		( id ) => dispatch( { tipus: 'ACTIVA', id } ),
		[]
	);
	const tancaPestanya = useCallback(
		( id ) => dispatch( { tipus: 'TANCA_PESTANYA', id } ),
		[]
	);
	const novaPestanya = useCallback(
		() => dispatch( { tipus: 'OBRE_PESTANYA' } ),
		[]
	);

	return {
		estat,
		activa,
		url,
		infos,
		info,
		potEnrere: activa.index > 0,
		potEndavant: activa.index < activa.historial.length - 1,
		navega,
		obrePestanya,
		recarrega,
		enrere,
		endavant,
		activaPestanya,
		tancaPestanya,
		novaPestanya,
	};
}
