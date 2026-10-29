import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useReducer,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { useFinestra } from '../../sistemes/pc/context';
import {
	ajustaEsquema,
	estatInicial,
	hostname,
	navegadorReductor,
	pestanyaActiva,
	urlActual,
} from './historial';
import { infoPagina } from './infoPagina';
import { Pestanyes } from './Pestanyes';
import { BarraAdreces } from './BarraAdreces';
import { Pagina } from './Pagina';
import { IconaEndavant, IconaEnrere, IconaRecarrega } from './icones';

function BotoEina( { etiqueta, Icona, ...resta } ) {
	return (
		<button
			type="button"
			className="nep-nav-eines__boto"
			aria-label={ etiqueta }
			title={ etiqueta }
			{ ...resta }
		>
			<Icona mida={ 18 } />
		</button>
	);
}

/**
 * Navegador: pestanyes, barra d'adreces amb historial, webs de la missió i
 * barra d'estat amb la URL de l'enllaç sota el punter.
 *
 * @param {Object}  props
 * @param {?Object} props.dades Dades d'obertura ({ url }) que envia el sistema.
 */
export default function Navegador( { dades } ) {
	const { missio, emet } = useJoc();
	const { posaTitol } = useFinestra();
	const [ estat, dispatch ] = useReducer(
		navegadorReductor,
		dades?.url ? ajustaEsquema( dades.url, missio ) : null,
		estatInicial
	);
	const [ hover, setHover ] = useState( null );
	const dadesAnteriors = useRef( dades );
	const panells = useRef( {} );
	const refAdreca = useRef( null );
	const enfocaAdreca = useRef( false );
	const prefix = useId();

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
	// notificació de Posta): s'activa la pestanya que ja la mostra o se
	// n'obre una de nova. Es compara per URL, mai no es duplica.
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

	useEffect( () => setHover( null ), [ estat.activa, estat.carregues ] );

	// Pestanya nova amb el botó «+»: el focus va a la barra d'adreces.
	useEffect( () => {
		if ( enfocaAdreca.current ) {
			enfocaAdreca.current = false;
			refAdreca.current?.focus();
		}
	}, [ estat.activa ] );

	useEffect( () => {
		posaTitol(
			sprintf(
				/* translators: %s: títol de la pàgina */
				__( '%s — Navegador', 'noempesquen' ),
				info.titol
			)
		);
	}, [ info.titol, posaTitol ] );

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

	const idPestanya = ( id ) => `${ prefix }-pestanya-${ id }`;
	const idPanell = ( id ) => `${ prefix }-panell-${ id }`;

	return (
		<div className="nep-nav">
			<Pestanyes
				pestanyes={ estat.pestanyes }
				activa={ estat.activa }
				infos={ infos }
				idPestanya={ idPestanya }
				idPanell={ idPanell }
				onActiva={ ( id ) => dispatch( { tipus: 'ACTIVA', id } ) }
				onTanca={ ( id ) =>
					dispatch( { tipus: 'TANCA_PESTANYA', id } )
				}
				onNova={ () => {
					enfocaAdreca.current = true;
					dispatch( { tipus: 'OBRE_PESTANYA' } );
				} }
			/>
			<div className="nep-nav-eines">
				<BotoEina
					etiqueta={ __( 'Enrere', 'noempesquen' ) }
					Icona={ IconaEnrere }
					disabled={ activa.index === 0 }
					onClick={ () => dispatch( { tipus: 'ENRERE' } ) }
				/>
				<BotoEina
					etiqueta={ __( 'Endavant', 'noempesquen' ) }
					Icona={ IconaEndavant }
					disabled={ activa.index >= activa.historial.length - 1 }
					onClick={ () => dispatch( { tipus: 'ENDAVANT' } ) }
				/>
				<BotoEina
					etiqueta={ __( 'Torna a carregar', 'noempesquen' ) }
					Icona={ IconaRecarrega }
					onClick={ recarrega }
				/>
				<BarraAdreces
					refInput={ refAdreca }
					url={ url }
					info={ info }
					onNavega={ ( desti ) => {
						navega( desti );
						panells.current[ estat.activa ]?.focus();
					} }
				/>
			</div>
			<div className="nep-nav__contingut">
				{ estat.pestanyes.map( ( p ) => (
					<div
						key={ p.id }
						ref={ ( el ) => {
							panells.current[ p.id ] = el;
						} }
						id={ idPanell( p.id ) }
						className="nep-nav__pagina"
						role="tabpanel"
						aria-labelledby={ idPestanya( p.id ) }
						tabIndex={ 0 }
						hidden={ p.id !== estat.activa }
					>
						<Pagina
							key={ p.carrega }
							url={ urlActual( p ) }
							info={ infos[ p.id ] }
							navega={ navega }
							obrePestanya={ obrePestanya }
							onHoverUrl={ setHover }
							onRecarrega={ recarrega }
						/>
					</div>
				) ) }
				{ hover && (
					<div className="nep-nav__estat" aria-hidden="true">
						{ hover }
					</div>
				) }
			</div>
		</div>
	);
}
