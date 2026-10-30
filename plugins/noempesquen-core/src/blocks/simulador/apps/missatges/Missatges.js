import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { useSistema } from '../../sistemes/pc/context';
import { useMobil } from '../../sistemes/mobil/context';
import {
	contactesLocalitzables,
	destinsReenvia,
	filsVisibles,
	senseEsborrats,
} from './fils.js';
import { LlistaFils } from './LlistaFils';
import { Fil } from './Fil';
import { Contactes, Fitxa } from './Contactes';
import { Fulla } from './Fulla';
import {
	IconaAdreca,
	IconaBloqueja,
	IconaEsborra,
	IconaReenvia,
	IconaRespon,
} from './icones';

const APP = 'missatges';

/* Menú d'un missatge: accions segons si és rebut i si el número és bloquejat. */
function MenuMissatge( { missatge, bloquejat, onAccio } ) {
	const rebut = missatge.de !== 'jo';
	const url = ( missatge.cos ?? [] ).flat().find( ( seg ) => seg.enllac )
		?.enllac.url;
	const items = [
		url && {
			id: 'adreca',
			text: __( 'Veure adreça', 'noempesquen' ),
			Icona: IconaAdreca,
		},
		rebut &&
			! bloquejat && {
				id: 'respon',
				text: __( 'Respon', 'noempesquen' ),
				Icona: IconaRespon,
			},
		{
			id: 'reenvia',
			text: __( 'Reenvia', 'noempesquen' ),
			Icona: IconaReenvia,
		},
		rebut &&
			! bloquejat && {
				id: 'bloqueja',
				text: __( 'Bloqueja el número', 'noempesquen' ),
				Icona: IconaBloqueja,
			},
		{
			id: 'esborra',
			text: __( 'Esborra', 'noempesquen' ),
			Icona: IconaEsborra,
		},
	].filter( Boolean );
	return (
		<ul className="nep-missatges-fulla__opcions">
			{ items.map( ( it ) => (
				<li key={ it.id }>
					<button
						type="button"
						className="nep-missatges-fulla__opcio"
						data-accio={ it.id }
						onClick={ () => onAccio( it.id ) }
					>
						<it.Icona mida={ 20 } />
						{ it.text }
					</button>
				</li>
			) ) }
		</ul>
	);
}

function BotoCancella( { onTanca } ) {
	return (
		<button
			type="button"
			className="nep-missatges-accio"
			onClick={ onTanca }
		>
			{ __( 'Cancel·la', 'noempesquen' ) }
		</button>
	);
}

/**
 * Missatges (SMS) del mòbil: llista de converses, conversa, contactes i
 * fitxa, amb fulls per al menú del missatge, l'enllaç, el bloqueig i el
 * reenviament. Els esborrats són estat local i els bloquejats surten del motor; al motor li arriben
 * `missatge.obre`, `missatge.esborra`, `contacte.bloqueja`,
 * `missatge.reenvia`, `missatge.respon`, `enllac.mantingut` i `enllac.obre`.
 */
export default function Missatges() {
	const { missio, mon, estat, emet } = useJoc();
	const { obreApp } = useSistema();
	const { registraEnrere, appActiva } = useMobil();
	const [ vistes, setVistes ] = useState( [ { tipus: 'llista' } ] );
	const [ esborrats, setEsborrats ] = useState( () => new Set() );
	// Bloquejats: només ids, al motor (sobreviuen en tancar l'app).
	const bloquejats = useMemo(
		() => new Set( estat.bloquejats ?? [] ),
		[ estat.bloquejats ]
	);
	const [ full, setFull ] = useState( null );
	const [ avis, setAvis ] = useState( null );
	const arrel = useRef( null );
	const refResposta = useRef( null );
	const respostaA = useRef( null );
	const focusDespres = useRef( null );
	const tornaA = useRef( null );
	const idCasella = useId();
	const fullObert = useRef( false );

	const tots = useMemo(
		() => filsVisibles( estat, mon, missio ),
		[ estat, mon, missio ]
	);
	const fils = useMemo(
		() => senseEsborrats( tots, esborrats ),
		[ tots, esborrats ]
	);
	const contactes = useMemo(
		() => contactesLocalitzables( tots, mon ),
		[ tots, mon ]
	);

	const vista = vistes[ vistes.length - 1 ];
	const filObert =
		vista.tipus === 'fil' ? fils.find( ( f ) => f.id === vista.id ) : null;

	const empeny = ( v ) => {
		setAvis( null );
		setVistes( ( vs ) => [ ...vs, v ] );
	};
	const torna = useCallback( () => {
		setVistes( ( vs ) => {
			const dalt = vs[ vs.length - 1 ];
			if ( dalt.tipus === 'fil' ) {
				tornaA.current = `[data-fil="${ dalt.id }"]`;
			} else if ( dalt.tipus === 'fitxa' ) {
				tornaA.current = `[data-contacte="${ dalt.id }"]`;
			}
			return vs.length > 1 ? vs.slice( 0, -1 ) : vs;
		} );
	}, [] );
	const tancaFull = useCallback( () => setFull( null ), [] );

	// Una conversa que es queda buida (esborrada) es tanca sola.
	useEffect( () => {
		if ( vista.tipus === 'fil' && ! filObert ) {
			setVistes( ( vs ) => vs.slice( 0, -1 ) );
		}
	}, [ vista, filObert ] );

	// En canviar de vista, el focus va a la fila d'on es venia o al títol.
	useEffect( () => {
		const el = arrel.current;
		const selector = tornaA.current;
		tornaA.current = null;
		(
			( selector && el?.querySelector( selector ) ) ??
			el?.querySelector( '.nep-missatges__titol' )
		)?.focus();
	}, [ vistes ] );

	// Després de tancar un full, el focus pot anar a un altre lloc.
	useEffect( () => {
		if ( full ) {
			return;
		}
		if ( focusDespres.current ) {
			focusDespres.current.focus();
			focusDespres.current = null;
			return;
		}
		// L'origen del full ha desaparegut (esborrat, bloquejat): al títol.
		const el = arrel.current;
		const actiu = el?.ownerDocument.activeElement;
		if ( el && ( ! actiu || actiu === el.ownerDocument.body ) ) {
			el.querySelector( '.nep-missatges__titol' )?.focus();
		}
	}, [ full ] );

	// «Enrere» del sistema: primer el full, després la vista.
	const estatEnrere = useRef();
	estatEnrere.current = { full, profunditat: vistes.length };
	useEffect(
		() =>
			registraEnrere( () => {
				const { full: obert, profunditat } = estatEnrere.current;
				if ( obert ) {
					tancaFull();
					return true;
				}
				if ( profunditat > 1 ) {
					torna();
					return true;
				}
				return false;
			} ),
		[ registraEnrere, tancaFull, torna ]
	);

	// Idempotent: la pulsació llarga i el `contextmenu` poden arribar tots dos.
	const obreFull = ( f ) => {
		if ( fullObert.current ) {
			return false;
		}
		fullObert.current = true;
		setFull( f );
		return true;
	};

	useEffect( () => {
		fullObert.current = !! full;
	}, [ full ] );

	// L'app queda muntada i amagada: el full no ha de quedar obert (ni
	// tancar-se amb Esc des d'una altra app).
	useEffect( () => {
		if ( appActiva !== APP ) {
			setFull( null );
		}
	}, [ appActiva ] );

	// Només els SMS de la missió arriben al motor; el farciment no.
	const idsMissio = useMemo(
		() =>
			new Set(
				tots.flatMap( ( f ) =>
					f.missatges.filter( ( m ) => m.missio ).map( ( m ) => m.id )
				)
			),
		[ tots ]
	);

	const obreFil = ( fil ) => {
		empeny( { tipus: 'fil', id: fil.id } );
		fil.missatges
			.filter( ( m ) => m.missio )
			.forEach( ( m ) =>
				emet( 'missatge.obre', { app: APP, id: m.id } )
			);
	};

	const obreEnllac = ( url ) => {
		emet( 'enllac.obre', { url } );
		obreApp( 'navegador', { url } );
	};

	const mantingut = ( url, origen ) => {
		if ( obreFull( { tipus: 'enllac', url, origen } ) ) {
			emet( 'enllac.mantingut', { url } );
		}
	};

	const esborra = ( ids ) => {
		setEsborrats( ( s ) => new Set( [ ...s, ...ids ] ) );
		ids.filter( ( id ) => idsMissio.has( id ) ).forEach( ( id ) =>
			emet( 'missatge.esborra', { app: APP, id } )
		);
	};

	const bloqueja = ( contacte, iEsborra ) => {
		// Primer el bloqueig: és la decisió; l'esborrat ve després.
		emet( 'contacte.bloqueja', { id: contacte.id } );
		if ( iEsborra ) {
			const fil = tots.find( ( f ) => f.contacte === contacte.id );
			esborra(
				( fil?.missatges ?? [] )
					.map( ( m ) => m.id )
					.filter( ( id ) => ! esborrats.has( id ) )
			);
		}
		setAvis(
			sprintf(
				/* translators: %s: nom o número del contacte */
				__( 'Has bloquejat %s.', 'noempesquen' ),
				contacte.nom
			)
		);
	};

	const contacteDelFil = ( fil ) =>
		contactes.find( ( c ) => c.id === fil.contacte ) ?? {
			id: fil.contacte,
			nom: fil.nom,
			senyal: fil.senyal,
		};

	const accioMenu = ( accio ) => {
		const { missatge, fil } = full;
		if ( accio === 'adreca' ) {
			const url = ( missatge.cos ?? [] )
				.flat()
				.find( ( seg ) => seg.enllac )?.enllac.url;
			if ( url ) {
				setFull( { tipus: 'enllac', url, origen: full.origen } );
				emet( 'enllac.mantingut', { url } );
			}
		} else if ( accio === 'respon' ) {
			respostaA.current = missatge.id;
			focusDespres.current = refResposta.current;
			setFull( null );
		} else if ( accio === 'reenvia' ) {
			setFull( { ...full, tipus: 'reenvia' } );
		} else if ( accio === 'bloqueja' ) {
			setFull( {
				tipus: 'bloqueja',
				contacte: contacteDelFil( fil ),
				origen: full.origen,
			} );
		} else if ( accio === 'esborra' ) {
			setFull( null );
			esborra( [ missatge.id ] );
			setAvis( __( "S'ha esborrat el missatge.", 'noempesquen' ) );
		}
	};

	const reenvia = ( desti ) => {
		emet( 'missatge.reenvia', {
			app: APP,
			id: full.missatge.id,
			a: desti.id,
		} );
		setFull( null );
		setAvis(
			sprintf(
				/* translators: %s: nom del xat de destí */
				__( "S'ha reenviat a %s.", 'noempesquen' ),
				desti.nom
			)
		);
	};

	const contingutFull = () => {
		if ( full.tipus === 'menu' ) {
			return (
				<Fulla
					key={ full.tipus }
					titol={ __( 'Opcions del missatge', 'noempesquen' ) }
					onTanca={ tancaFull }
					origen={ full.origen }
				>
					<MenuMissatge
						missatge={ full.missatge }
						bloquejat={ bloquejats.has( full.fil.contacte ) }
						onAccio={ accioMenu }
					/>
					<BotoCancella onTanca={ tancaFull } />
				</Fulla>
			);
		}
		if ( full.tipus === 'reenvia' ) {
			return (
				<Fulla
					key={ full.tipus }
					titol={ __( 'Reenvia a…', 'noempesquen' ) }
					onTanca={ tancaFull }
					origen={ full.origen }
				>
					<ul className="nep-missatges-fulla__opcions">
						{ destinsReenvia( mon ).map( ( d ) => (
							<li key={ d.id }>
								<button
									type="button"
									className="nep-missatges-fulla__opcio"
									data-desti={ d.id }
									onClick={ () => reenvia( d ) }
								>
									<span
										className="nep-missatges__avatar"
										aria-hidden="true"
									>
										{ d.nom.charAt( 0 ) }
									</span>
									{ d.nom }
								</button>
							</li>
						) ) }
					</ul>
					<BotoCancella onTanca={ tancaFull } />
				</Fulla>
			);
		}
		if ( full.tipus === 'bloqueja' ) {
			const { contacte } = full;
			return (
				<Fulla
					key={ full.tipus }
					titol={ sprintf(
						/* translators: %s: nom o número del contacte */
						__( 'Vols bloquejar %s?', 'noempesquen' ),
						contacte.nom
					) }
					onTanca={ tancaFull }
					origen={ full.origen }
				>
					<form
						className="nep-missatges-fulla__form"
						onSubmit={ ( e ) => {
							e.preventDefault();
							const iEsborra =
								e.currentTarget.elements.namedItem(
									'esborra'
								).checked;
							setFull( null );
							bloqueja( contacte, iEsborra );
						} }
					>
						<p className="nep-missatges-fulla__text">
							{ __(
								"No rebràs trucades ni missatges d'aquest número.",
								'noempesquen'
							) }
						</p>
						<label
							className="nep-missatges-fulla__casella"
							htmlFor={ idCasella }
						>
							<input
								id={ idCasella }
								type="checkbox"
								name="esborra"
							/>
							{ __( 'I esborra la conversa', 'noempesquen' ) }
						</label>
						<div className="nep-missatges-fulla__botons">
							<BotoCancella onTanca={ tancaFull } />
							<button
								type="submit"
								className="nep-missatges-accio is-perill"
							>
								{ __( 'Bloqueja', 'noempesquen' ) }
							</button>
						</div>
					</form>
				</Fulla>
			);
		}
		// Full de l'enllaç: l'adreça sencera, sense obrir-la.
		return (
			<Fulla
				key={ full.tipus }
				titol={ __( 'Enllaç', 'noempesquen' ) }
				onTanca={ tancaFull }
				origen={ full.origen }
			>
				<p className="nep-missatges-fulla__url">{ full.url }</p>
				<div className="nep-missatges-fulla__botons">
					<BotoCancella onTanca={ tancaFull } />
					<button
						type="button"
						className="nep-missatges-accio is-principal"
						onClick={ () => {
							const { url } = full;
							setFull( null );
							obreEnllac( url );
						} }
					>
						{ __( 'Obre', 'noempesquen' ) }
					</button>
				</div>
			</Fulla>
		);
	};

	const pantalla = () => {
		if ( filObert ) {
			return (
				<Fil
					key={ filObert.id }
					fil={ filObert }
					bloquejat={ bloquejats.has( filObert.contacte ) }
					refResposta={ refResposta }
					respostaA={ respostaA }
					onTorna={ torna }
					onFitxa={ () =>
						empeny( { tipus: 'fitxa', id: filObert.contacte } )
					}
					onMenu={ ( missatge, origen ) =>
						obreFull( {
							tipus: 'menu',
							missatge,
							fil: filObert,
							origen,
						} )
					}
					onMantingut={ mantingut }
					onObreEnllac={ obreEnllac }
					onRespon={ ( id ) => {
						if ( idsMissio.has( id ) ) {
							emet( 'missatge.respon', { app: APP, id } );
						}
						setAvis( __( 'Missatge enviat.', 'noempesquen' ) );
					} }
				/>
			);
		}
		if ( vista.tipus === 'contactes' ) {
			return (
				<Contactes
					contactes={ contactes }
					bloquejats={ bloquejats }
					onTorna={ torna }
					onFitxa={ ( id ) => empeny( { tipus: 'fitxa', id } ) }
				/>
			);
		}
		const contacte =
			vista.tipus === 'fitxa' &&
			contactes.find( ( c ) => c.id === vista.id );
		if ( contacte ) {
			const fil = fils.find( ( f ) => f.contacte === contacte.id );
			return (
				<Fitxa
					contacte={ contacte }
					bloquejat={ bloquejats.has( contacte.id ) }
					ambFil={ !! fil }
					onTorna={ torna }
					onBloqueja={ ( origen ) =>
						obreFull( { tipus: 'bloqueja', contacte, origen } )
					}
					onConversa={ () => obreFil( fil ) }
				/>
			);
		}
		return (
			<LlistaFils
				fils={ fils }
				bloquejats={ bloquejats }
				onObre={ obreFil }
				onContactes={ () => empeny( { tipus: 'contactes' } ) }
			/>
		);
	};

	return (
		<div className="nep-missatges" ref={ arrel }>
			<div
				className="nep-missatges__vista"
				inert={ full ? '' : undefined }
			>
				{ pantalla() }
			</div>
			<div className="nep-missatges__avis-zona" role="status">
				{ avis && <p className="nep-missatges__avis">{ avis }</p> }
			</div>
			{ full && contingutFull() }
		</div>
	);
}
