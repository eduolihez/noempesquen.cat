/**
 * Revenda (mòbil): app de compravenda de segona mà. Pestanyes «Anuncis»
 * (els anuncis del jugador) i «Xats» (converses amb compradors).
 *
 * Tot és local: al motor només li arriben `contacte.bloqueja`,
 * `missatge.envia { contacte }` (mai el text) i `enllac.obre`.
 */
import {
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { useSistema } from '../../sistemes/pc/context';
import { useMobil } from '../../sistemes/mobil/context';
import { Cos } from '../../ui/Cos';
import { Ilustracio } from '../../ui/ilustracions';
import { esUrlNavegable } from '../../webs/enllac';
import { AvatarXat } from '../parla/LlistaXats';
import { IconaBloqueja, IconaEnrere } from '../missatges/icones';
import {
	esDesconegut,
	esdevenimentEnvia,
	formataPreu,
	idsVisibles,
	missatgesVisibles,
	textMissatge,
	ultimMissatge,
	xatsVisibles,
} from './anuncis.js';
import { IconaEtiqueta, IconaRevenda, IconaXats } from './icones';

const PESTANYES = [ 'anuncis', 'xats' ];
const ICONES = { anuncis: IconaEtiqueta, xats: IconaXats };
const MS_AVIS = 4000;

/**
 * Pestanya «Anuncis»: targetes amb il·lustració, títol, preu i descripció.
 *
 * @param {Object}   props
 * @param {Object[]} props.anuncis Anuncis de la missió.
 */
function Anuncis( { anuncis } ) {
	if ( ! anuncis.length ) {
		return (
			<p className="nep-revenda__buit">
				{ __( 'Encara no has publicat cap anunci', 'noempesquen' ) }
			</p>
		);
	}
	return (
		<ul className="nep-revenda-anuncis">
			{ anuncis.map( ( a ) => (
				<li key={ a.id }>
					<article className="nep-revenda-anunci">
						<div
							className="nep-revenda-anunci__imatge"
							role="img"
							aria-label={ a.titol }
						>
							<Ilustracio id={ a.il } />
						</div>
						<div className="nep-revenda-anunci__cos">
							<h3 className="nep-revenda-anunci__titol">
								{ a.titol }
							</h3>
							<p className="nep-revenda-anunci__preu">
								{ formataPreu( a.preu ) }
							</p>
							<p className="nep-revenda-anunci__descripcio">
								{ a.descripcio }
							</p>
						</div>
					</article>
				</li>
			) ) }
		</ul>
	);
}

/**
 * Pestanya «Xats»: llista de converses.
 *
 * @param {Object}            props
 * @param {Object[]}          props.elements Xats ja resolts { id, nom, anunci, darrer, hora }.
 * @param {(id:string)=>void} props.onObre   Obre un xat pel seu id.
 */
function LlistaXats( { elements, onObre } ) {
	if ( ! elements.length ) {
		return (
			<p className="nep-revenda__buit">
				{ __( 'Encara no tens cap xat', 'noempesquen' ) }
			</p>
		);
	}
	return (
		<ul className="nep-revenda-xats">
			{ elements.map( ( x ) => (
				<li key={ x.id }>
					<button
						type="button"
						className="nep-revenda-xat"
						data-xat={ x.id }
						onClick={ () => onObre( x.id ) }
					>
						<AvatarXat nom={ x.nom } mida={ 44 } />
						<span className="nep-revenda-xat__text">
							<span className="nep-revenda-xat__fila">
								<strong className="nep-revenda-xat__nom">
									{ x.nom }
								</strong>
								<span className="nep-revenda-xat__hora">
									{ x.hora }
								</span>
							</span>
							<span className="nep-revenda-xat__anunci">
								{ x.anunci }
							</span>
							<span className="nep-revenda-xat__darrer">
								{ x.darrer }
							</span>
						</span>
					</button>
				</li>
			) ) }
		</ul>
	);
}

/**
 * Conversa oberta amb un comprador. El camp de text no és controlat: el
 * text no surt mai del camp (només s'avisa el motor que s'ha enviat).
 *
 * @param {Object}             props
 * @param {string}             props.nom        Nom del contacte.
 * @param {string}             props.anunci     Títol de l'anunci del xat.
 * @param {Object[]}           props.missatges  Missatges visibles.
 * @param {boolean}            props.desconegut El contacte no és a l'agenda.
 * @param {boolean}            props.bloquejat  El contacte ja és bloquejat.
 * @param {()=>void}           props.onBloqueja Bloqueja el contacte.
 * @param {()=>void}           props.onEnvia    S'ha enviat un missatge (sense text).
 * @param {(url:string)=>void} props.onEnllac   Obre un enllaç simulat.
 * @param {()=>void}           props.onEnrere   Torna a la llista.
 */
function Conversa( {
	nom,
	anunci,
	missatges,
	desconegut,
	bloquejat,
	onBloqueja,
	onEnvia,
	onEnllac,
	onEnrere,
} ) {
	const registre = useRef( null );
	const camp = useRef( null );
	const nota = useRef( null );
	const total = missatges.length;

	useLayoutEffect( () => {
		const el = registre.current;
		if ( el ) {
			el.scrollTop = el.scrollHeight;
		}
	}, [ total ] );

	useLayoutEffect( () => {
		if ( bloquejat ) {
			nota.current?.focus();
		}
	}, [ bloquejat ] );

	const envia = ( e ) => {
		e.preventDefault();
		const el = camp.current;
		if ( el && el.value.trim() ) {
			el.value = '';
			onEnvia();
		}
	};

	return (
		<div className="nep-parla-conversa nep-revenda-conversa">
			<div className="nep-parla-conversa__cap">
				<button
					type="button"
					className="nep-parla-conversa__enrere"
					aria-label={ __( 'Torna als xats', 'noempesquen' ) }
					onClick={ onEnrere }
				>
					<IconaEnrere mida={ 22 } />
				</button>
				<AvatarXat nom={ nom } mida={ 40 } />
				<div className="nep-parla-conversa__qui">
					<h2 className="nep-parla-conversa__nom">{ nom }</h2>
					{ anunci && (
						<p className="nep-parla-conversa__estat">{ anunci }</p>
					) }
				</div>
				{ desconegut && ! bloquejat && (
					<button
						type="button"
						className="nep-revenda__bloqueja"
						onClick={ onBloqueja }
					>
						<IconaBloqueja mida={ 18 } />
						{ __( 'Bloqueja', 'noempesquen' ) }
					</button>
				) }
			</div>
			{ desconegut && ! bloquejat && (
				<p className="nep-revenda-avis">
					{ __(
						'Aquest usuari no és als teus contactes de Revenda. Vigila amb les dades que comparteixes.',
						'noempesquen'
					) }
				</p>
			) }
			<div className="nep-parla-conversa__fil">
				{ /* Focusable per poder-lo desplaçar amb el teclat. */ }
				<div
					ref={ registre }
					className="nep-parla-missatges"
					role="log"
					aria-live="off"
					aria-label={ sprintf(
						/* translators: %s: nom del contacte */
						__( 'Missatges amb %s', 'noempesquen' ),
						nom
					) }
					tabIndex={ 0 }
				>
					<ol className="nep-parla-missatges__llista">
						{ missatges.map( ( m, j ) => {
							const propi = m.de === 'jo';
							const cua =
								j === 0 ||
								( missatges[ j - 1 ].de === 'jo' ) !== propi;
							return (
								<li
									key={ m.id }
									className={ `nep-parla-msg ${
										propi ? 'is-propi' : 'is-rebut'
									}${ cua ? ' amb-cua' : '' }` }
								>
									<div className="nep-parla-msg__bombolla">
										<span className="nep-so-sr">
											{ propi
												? __( 'Tu:', 'noempesquen' )
												: sprintf(
														/* translators: %s: nom del contacte */
														__(
															'%s:',
															'noempesquen'
														),
														nom
													) }
										</span>
										<div className="nep-parla-msg__text nep-revenda-msg__text">
											<Cos
												paragrafs={ [ m.cos ] }
												onEnllac={ onEnllac }
											/>
										</div>
										{ m.hora && (
											<span className="nep-revenda-msg__hora">
												{ m.hora }
											</span>
										) }
									</div>
								</li>
							);
						} ) }
					</ol>
				</div>
			</div>
			{ bloquejat ? (
				<p
					ref={ nota }
					className="nep-parla-bloquejat nep-revenda-bloquejat"
					tabIndex={ -1 }
				>
					{ __(
						'Has bloquejat aquest usuari. Ja no et pot escriure.',
						'noempesquen'
					) }
				</p>
			) : (
				<form
					className="nep-parla-compon"
					onSubmit={ envia }
					autoComplete="off"
				>
					<input
						ref={ camp }
						type="text"
						className="nep-parla-compon__camp"
						placeholder={ __(
							'Escriu un missatge',
							'noempesquen'
						) }
						aria-label={ __( 'Missatge', 'noempesquen' ) }
						autoComplete="off"
						defaultValue=""
					/>
					<button type="submit" className="nep-parla-compon__envia">
						{ __( 'Envia', 'noempesquen' ) }
					</button>
				</form>
			) }
		</div>
	);
}

/**
 * App Revenda.
 *
 * @param {Object}  props
 * @param {?Object} props.dades Dades d'obertura (`{ pestanya, xat }` des d'una notificació).
 */
export default function Revenda( { dades } ) {
	const { mon, missio, estat, emet } = useJoc();
	const { obreApp } = useSistema();
	const { registraEnrere, appActiva } = useMobil();
	const [ pestanya, setPestanya ] = useState( 'anuncis' );
	const [ actiu, setActiu ] = useState( null );
	// Contactes bloquejats: només ids, al motor (sobreviuen en tancar l'app).
	const bloquejats = useMemo(
		() => new Set( estat.bloquejats ?? [] ),
		[ estat.bloquejats ]
	);
	const [ avis, setAvis ] = useState( '' );
	const refsPestanya = useRef( {} );
	const arrel = useRef( null );
	const ultim = useRef( null );
	const enPrimer = appActiva === 'revenda';

	const revenda = missio?.apps?.revenda;
	const anuncis = Array.isArray( revenda?.anuncis ) ? revenda.anuncis : [];
	const visibles = idsVisibles( estat );
	const xats = xatsVisibles( revenda?.xats, visibles );
	const nomDe = ( id ) =>
		mon?.contactes?.find( ( c ) => c.id === id )?.nom ?? id;
	const contacteDe = ( id ) =>
		mon?.contactes?.find( ( c ) => c.id === id ) ?? null;
	const titolAnunci = ( id ) => anuncis.find( ( a ) => a.id === id )?.titol;

	// Missatges entrants ja vistos (els que hi havia en obrir l'app no s'anuncien).
	const rebuts = xats.flatMap( ( x ) =>
		missatgesVisibles( x, visibles )
			.filter( ( m ) => m.de === 'ells' )
			.map( ( m ) => ( { id: m.id, contacte: x.contacte } ) )
	);
	const vistos = useRef( null );
	if ( vistos.current === null ) {
		vistos.current = new Set( rebuts.map( ( m ) => m.id ) );
	}
	const clauRebuts = rebuts.map( ( m ) => m.id ).join( '|' );
	useEffect( () => {
		const nous = rebuts.filter( ( m ) => ! vistos.current.has( m.id ) );
		nous.forEach( ( m ) => vistos.current.add( m.id ) );
		const darrer = nous[ nous.length - 1 ];
		if ( darrer ) {
			setAvis(
				sprintf(
					/* translators: %s: nom del contacte */
					__( 'Missatge nou de %s a Revenda', 'noempesquen' ),
					nomDe( darrer.contacte )
				)
			);
		}
	}, [ clauRebuts ] ); // eslint-disable-line react-hooks/exhaustive-deps

	// L'avís s'esborra passat un temps, perquè un segon avís es torni a anunciar.
	useEffect( () => {
		if ( ! avis ) {
			return undefined;
		}
		const t = setTimeout( () => setAvis( '' ), MS_AVIS );
		return () => clearTimeout( t );
	}, [ avis ] );

	// Obertura des d'una notificació: pestanya «Xats» i, si cal, el xat.
	useEffect( () => {
		if ( ! dades ) {
			return;
		}
		if ( dades.pestanya === 'xats' || dades.xat ) {
			setPestanya( 'xats' );
		}
		if ( dades.xat && xats.some( ( x ) => x.id === dades.xat ) ) {
			setActiu( dades.xat );
		}
	}, [ dades ] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Enrere (del sistema): de la conversa torna a la llista de xats.
	useEffect(
		() =>
			registraEnrere( () => {
				if ( actiu === null ) {
					return false;
				}
				setActiu( null );
				return true;
			} ),
		[ actiu, registraEnrere ]
	);

	// Focus: en obrir un xat, al nom del contacte; en tornar, al xat de la
	// llista que s'havia obert.
	useEffect( () => {
		if ( ! enPrimer ) {
			return;
		}
		if ( actiu !== null ) {
			const titol = arrel.current?.querySelector(
				'.nep-parla-conversa__nom'
			);
			titol?.setAttribute( 'tabindex', '-1' );
			titol?.focus();
		} else if ( ultim.current !== null ) {
			const boto = [
				...( arrel.current?.querySelectorAll( '.nep-revenda-xat' ) ??
					[] ),
			].find( ( b ) => b.dataset.xat === ultim.current );
			boto?.focus();
		}
		ultim.current = actiu;
	}, [ actiu, enPrimer ] );

	const obreEnllac = ( url ) => {
		if ( ! esUrlNavegable( url ) ) {
			return;
		}
		emet( 'enllac.obre', { url } );
		obreApp( 'navegador', { url } );
	};

	const bloqueja = ( contacte ) => {
		if ( ! contacte ) {
			return;
		}
		emet( 'contacte.bloqueja', { id: contacte.id } );
		setAvis(
			sprintf(
				/* translators: %s: nom del contacte */
				__( 'Has bloquejat %s', 'noempesquen' ),
				contacte.nom
			)
		);
	};

	const envia = ( contacte ) => {
		// Només l'id del contacte: el text no surt del camp.
		emet( ...esdevenimentEnvia( contacte ) );
		setAvis( __( 'Missatge enviat', 'noempesquen' ) );
	};

	const onTecla = ( e ) => {
		const i = PESTANYES.indexOf( pestanya );
		let nou = null;
		if ( e.key === 'ArrowRight' ) {
			nou = PESTANYES[ ( i + 1 ) % PESTANYES.length ];
		} else if ( e.key === 'ArrowLeft' ) {
			nou = PESTANYES[ ( i + PESTANYES.length - 1 ) % PESTANYES.length ];
		} else if ( e.key === 'Home' ) {
			nou = PESTANYES[ 0 ];
		} else if ( e.key === 'End' ) {
			nou = PESTANYES[ PESTANYES.length - 1 ];
		}
		if ( nou ) {
			e.preventDefault();
			setPestanya( nou );
			refsPestanya.current[ nou ]?.focus();
		}
	};

	const etiquetes = {
		anuncis: __( 'Anuncis', 'noempesquen' ),
		xats: __( 'Xats', 'noempesquen' ),
	};
	const textBloquejat = __( 'Has bloquejat aquest usuari', 'noempesquen' );

	const xatObert = actiu !== null && xats.find( ( x ) => x.id === actiu );

	let vista;
	if ( xatObert ) {
		const contacte = contacteDe( xatObert.contacte );
		vista = (
			<Conversa
				key={ xatObert.id }
				nom={ nomDe( xatObert.contacte ) }
				anunci={ titolAnunci( xatObert.anunci ) }
				missatges={ missatgesVisibles( xatObert, visibles ) }
				desconegut={ esDesconegut( contacte ) }
				bloquejat={ bloquejats.has( xatObert.contacte ) }
				onBloqueja={ () => bloqueja( contacte ) }
				onEnvia={ () => envia( xatObert.contacte ) }
				onEnllac={ obreEnllac }
				onEnrere={ () => setActiu( null ) }
			/>
		);
	} else {
		const elements = xats.map( ( x ) => {
			const m = ultimMissatge( x, visibles );
			return {
				id: x.id,
				nom: nomDe( x.contacte ),
				anunci: titolAnunci( x.anunci ),
				hora: m?.hora ?? '',
				darrer: bloquejats.has( x.contacte )
					? textBloquejat
					: textMissatge( m ),
			};
		} );
		vista = (
			<>
				<header className="nep-revenda__cap">
					<h1 className="nep-revenda__titol">
						<IconaRevenda mida={ 28 } />
						{ __( 'Revenda', 'noempesquen' ) }
					</h1>
				</header>
				<div
					className="nep-revenda__pestanyes"
					role="tablist"
					aria-label={ __( 'Seccions de Revenda', 'noempesquen' ) }
				>
					{ PESTANYES.map( ( id ) => {
						const Icona = ICONES[ id ];
						const activa = id === pestanya;
						return (
							<button
								key={ id }
								type="button"
								role="tab"
								id={ `nep-revenda-pestanya-${ id }` }
								ref={ ( el ) => {
									refsPestanya.current[ id ] = el;
								} }
								aria-selected={ activa }
								aria-controls={
									activa
										? `nep-revenda-panell-${ id }`
										: undefined
								}
								tabIndex={ activa ? 0 : -1 }
								className="nep-revenda__pestanya"
								onClick={ () => setPestanya( id ) }
								onKeyDown={ onTecla }
							>
								<Icona mida={ 20 } />
								<span>{ etiquetes[ id ] }</span>
							</button>
						);
					} ) }
				</div>
				<div
					className="nep-revenda__panell"
					role="tabpanel"
					id={ `nep-revenda-panell-${ pestanya }` }
					aria-labelledby={ `nep-revenda-pestanya-${ pestanya }` }
					tabIndex={ 0 }
				>
					{ pestanya === 'anuncis' ? (
						<Anuncis anuncis={ anuncis } />
					) : (
						<LlistaXats elements={ elements } onObre={ setActiu } />
					) }
				</div>
			</>
		);
	}

	return (
		<div className="nep-revenda" ref={ arrel }>
			{ vista }
			<p className="nep-so-sr" role="status">
				{ avis }
			</p>
		</div>
	);
}
