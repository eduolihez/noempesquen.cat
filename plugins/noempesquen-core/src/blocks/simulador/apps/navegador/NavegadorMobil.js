import { useEffect, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useMobil } from '../../sistemes/mobil/context';
import { useNavegador } from './useNavegador';
import { BarraAdreces } from './BarraAdreces';
import { BotoEina } from './BotoEina';
import { Panells } from './Panells';
import { SelectorPestanyes } from './SelectorPestanyes';
import { IconaEndavant, IconaEnrere, IconaRecarrega } from './icones';

const APP = 'navegador';

/**
 * Navegador del mòbil: una sola barra a dalt (enrere, endavant, adreça amb
 * candau, recarrega i pestanyes) i selector de pestanyes a pantalla
 * completa. «Enrere» del sistema tanca el selector o torna enrere a
 * l'historial de la pestanya.
 *
 * @param {Object}  props
 * @param {?Object} props.dades Dades d'obertura ({ url }) que envia el sistema.
 */
export default function NavegadorMobil( { dades } ) {
	const { registraEnrere, appActiva } = useMobil();
	const nav = useNavegador( dades );
	const { estat, url, infos, info, potEnrere, enrere } = nav;
	const [ hover, setHover ] = useState( null );
	const [ selector, setSelector ] = useState( false );
	const panells = useRef( {} );
	const refAdreca = useRef( null );
	const refPestanyes = useRef( null );
	const enfocaAdreca = useRef( false );
	const tornaFocus = useRef( false );

	useEffect( () => setHover( null ), [ estat.activa, estat.carregues ] );

	// Pestanya nova des del selector: el focus va a la barra d'adreces.
	useEffect( () => {
		if ( enfocaAdreca.current ) {
			enfocaAdreca.current = false;
			refAdreca.current?.focus();
		}
	}, [ estat.activa, selector ] );

	// En tancar el selector, el focus torna al botó de pestanyes.
	useEffect( () => {
		if ( ! selector && tornaFocus.current ) {
			tornaFocus.current = false;
			refPestanyes.current?.focus();
		}
	}, [ selector ] );

	// Si l'app passa a segon pla, el selector es tanca (Esc a l'inici ha
	// d'obrir la pausa, no tancar un selector invisible).
	useEffect( () => {
		if ( appActiva !== APP ) {
			setSelector( false );
		}
	}, [ appActiva ] );

	useEffect(
		() =>
			registraEnrere( () => {
				if ( selector ) {
					tornaFocus.current = true;
					setSelector( false );
					return true;
				}
				if ( potEnrere ) {
					enrere();
					return true;
				}
				return false;
			} ),
		[ selector, potEnrere, enrere, registraEnrere ]
	);

	const tancaSelector = () => {
		tornaFocus.current = true;
		setSelector( false );
	};

	const n = estat.pestanyes.length;

	return (
		<div className="nep-nav nep-nav--mobil">
			<div className="nep-nav__marc" inert={ selector ? '' : undefined }>
				<div className="nep-nav-eines">
					<BotoEina
						etiqueta={ __( 'Enrere', 'noempesquen' ) }
						Icona={ IconaEnrere }
						mida={ 20 }
						disabled={ ! potEnrere }
						onClick={ enrere }
					/>
					<BotoEina
						etiqueta={ __( 'Endavant', 'noempesquen' ) }
						Icona={ IconaEndavant }
						mida={ 20 }
						disabled={ ! nav.potEndavant }
						onClick={ nav.endavant }
					/>
					<BarraAdreces
						refInput={ refAdreca }
						url={ url }
						info={ info }
						onNavega={ ( desti ) => {
							nav.navega( desti );
							panells.current[ estat.activa ]?.focus();
						} }
					/>
					<BotoEina
						etiqueta={ __( 'Torna a carregar', 'noempesquen' ) }
						Icona={ IconaRecarrega }
						mida={ 20 }
						onClick={ nav.recarrega }
					/>
					<button
						ref={ refPestanyes }
						type="button"
						className="nep-nav-eines__boto nep-nav-eines__pestanyes"
						aria-haspopup="dialog"
						aria-expanded={ selector }
						aria-label={ sprintf(
							/* translators: %d: nombre de pestanyes obertes */
							_n(
								'Pestanyes: %d oberta',
								'Pestanyes: %d obertes',
								n,
								'noempesquen'
							),
							n
						) }
						title={ __( 'Pestanyes', 'noempesquen' ) }
						onClick={ () => setSelector( true ) }
					>
						<span
							className="nep-nav-eines__comptador"
							aria-hidden="true"
						>
							{ n }
						</span>
					</button>
				</div>
				<div className="nep-nav__contingut">
					<Panells
						pestanyes={ estat.pestanyes }
						activa={ estat.activa }
						infos={ infos }
						refs={ panells }
						atributs={ ( p ) => ( {
							'aria-label': infos[ p.id ].titol,
						} ) }
						navega={ nav.navega }
						obrePestanya={ nav.obrePestanya }
						onHoverUrl={ setHover }
						onRecarrega={ nav.recarrega }
					/>
					{ hover && (
						<div className="nep-nav__estat" aria-hidden="true">
							{ hover }
						</div>
					) }
				</div>
			</div>
			{ selector && (
				<SelectorPestanyes
					pestanyes={ estat.pestanyes }
					activa={ estat.activa }
					infos={ infos }
					onTria={ ( id ) => {
						nav.activaPestanya( id );
						tancaSelector();
					} }
					onTanca={ nav.tancaPestanya }
					onNova={ () => {
						enfocaAdreca.current = true;
						nav.novaPestanya();
						setSelector( false );
					} }
					onSurt={ tancaSelector }
				/>
			) }
		</div>
	);
}
