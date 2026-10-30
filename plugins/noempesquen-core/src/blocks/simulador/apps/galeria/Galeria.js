import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { useMobil } from '../../sistemes/mobil/context';
import { Ilustracio } from '../../ui/ilustracions';
import { agrupaPerData, etiquetaData, vei } from './agrupa.js';
import { Visor } from './Visor';

const APP = 'galeria';

/**
 * Galeria del mòbil: quadrícula de 3 columnes agrupada per dies i visor.
 * És farciment: no emet cap esdeveniment al motor.
 */
export default function Galeria() {
	const { mon } = useJoc();
	const { registraEnrere, appActiva } = useMobil();
	const [ oberta, setOberta ] = useState( null );
	const arrel = useRef( null );
	const origen = useRef( null );
	const idOberta = useRef( null );
	idOberta.current = oberta;
	const estatEnrere = useRef();
	// Moment de muntar l'app: només cal per a «Avui» i «Ahir».
	const [ ara ] = useState( () => new Date() );

	const fotos = useMemo( () => mon.galeria ?? [], [ mon ] );
	const grups = useMemo( () => agrupaPerData( fotos, ara ), [ fotos, ara ] );
	const foto = oberta ? fotos.find( ( f ) => f.id === oberta ) : null;

	const tanca = useCallback( () => {
		const id = idOberta.current;
		if ( id ) {
			origen.current =
				arrel.current?.querySelector( `[data-foto="${ id }"]` ) ??
				origen.current;
		}
		setOberta( null );
	}, [] );

	// En tancar el visor, el focus torna al botó de la foto.
	const estavaObert = useRef( false );
	useEffect( () => {
		if ( estavaObert.current && ! oberta && origen.current?.isConnected ) {
			origen.current.focus();
		}
		estavaObert.current = !! oberta;
	}, [ oberta ] );

	estatEnrere.current = !! oberta;
	useEffect(
		() =>
			registraEnrere( () => {
				if ( estatEnrere.current ) {
					tanca();
					return true;
				}
				return false;
			} ),
		[ registraEnrere, tanca ]
	);

	// L'app queda muntada i amagada: el visor no es queda obert.
	useEffect( () => {
		if ( appActiva !== APP ) {
			setOberta( null );
		}
	}, [ appActiva ] );

	const canvia = ( delta ) => {
		const v = vei( fotos, oberta, delta );
		if ( v ) {
			setOberta( v.id );
		}
	};

	return (
		<div
			className="nep-galeria"
			role="region"
			aria-label={ __( 'Galeria', 'noempesquen' ) }
			ref={ arrel }
		>
			<div className="nep-galeria__vista" inert={ foto ? '' : undefined }>
				<header className="nep-galeria__cap">
					<h2 className="nep-galeria__titol">
						{ __( 'Galeria', 'noempesquen' ) }
					</h2>
				</header>
				<div className="nep-galeria__cos">
					{ grups.map( ( g ) => (
						<section
							key={ g.data }
							className="nep-galeria__grup"
							aria-label={ g.etiqueta }
						>
							<h3 className="nep-galeria__data">
								{ g.etiqueta }
							</h3>
							<ul className="nep-galeria__graella">
								{ g.fotos.map( ( f ) => (
									<li key={ f.id }>
										<button
											type="button"
											className="nep-galeria__foto"
											data-foto={ f.id }
											aria-label={ f.titol }
											onClick={ ( e ) => {
												origen.current =
													e.currentTarget;
												setOberta( f.id );
											} }
										>
											<Ilustracio
												id={ f.il }
												className="nep-galeria__il"
											/>
										</button>
									</li>
								) ) }
							</ul>
						</section>
					) ) }
				</div>
			</div>
			{ foto && (
				<Visor
					foto={ foto }
					etiqueta={ etiquetaData( foto.data, ara ) }
					hiHaAnt={ !! vei( fotos, foto.id, -1 ) }
					hiHaSeg={ !! vei( fotos, foto.id, 1 ) }
					onCanvia={ canvia }
					onTanca={ tanca }
				/>
			) }
		</div>
	);
}
