import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { FASE } from '../nucli/motor';
import { useJoc } from './context';
import {
	VORA,
	forat,
	haCanviat,
	panells,
	posicioTargeta,
	relatiu,
	triaAncora,
} from './guia-tutorial-geometria';

const AMPLADA_TARGETA = 360;
const AMPLADA_ESTRETA = 480;
const FOCALITZABLES = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled]):not([type="hidden"])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]',
	'[contenteditable="true"]',
].join( ',' );

const esVisible = ( el ) => {
	const r = el.getBoundingClientRect();
	return (
		r.width > 0 &&
		r.height > 0 &&
		el.ownerDocument.defaultView.getComputedStyle( el ).visibility !==
			'hidden'
	);
};

/**
 * Element que fa d'àncora d'una clau `data-tut` (vegeu `triaAncora`).
 *
 * @param {HTMLElement} arrel Arrel `.nep-so`.
 * @param {string}      clau  Clau d'àncora.
 * @return {?HTMLElement} Element o null.
 */
function resolAncora( arrel, clau ) {
	const els = [ ...arrel.querySelectorAll( '[data-tut]' ) ].filter(
		( el ) => el.dataset.tut === clau
	);
	const i = triaAncora(
		els.map( ( el ) => ( {
			visible: esVisible( el ),
			foc: !! el.closest( '[data-tut-foc]' ),
		} ) ),
		clau
	);
	return i >= 0 ? els[ i ] : null;
}

/**
 * Elements on es pot arribar amb Tab dins d'un contenidor (ell inclòs).
 *
 * @param {?HTMLElement} cont Contenidor.
 * @return {HTMLElement[]} Tabulables visibles, en ordre del DOM.
 */
function tabulables( cont ) {
	if ( ! cont ) {
		return [];
	}
	const tots = [ ...cont.querySelectorAll( FOCALITZABLES ) ];
	if ( cont.matches( FOCALITZABLES ) ) {
		tots.unshift( cont );
	}
	return tots.filter(
		( el ) =>
			el.tabIndex >= 0 && ! el.closest( '[inert]' ) && esVisible( el )
	);
}

const estil = ( r ) => ( {
	left: `${ r.x }px`,
	top: `${ r.y }px`,
	width: `${ r.amplada }px`,
	height: `${ r.alcada }px`,
} );

// Clic al vel: no fa res i no mou el focus (sense això aniria a `.nep-so`).
const atura = ( e ) => e.preventDefault();

const BUIT = {
	cont: { x: 0, y: 0, amplada: 0, alcada: 0 },
	forat: null,
	mida: { x: 0, y: 0, amplada: 0, alcada: 0 },
};

/**
 * Overlay d'un pas del tutorial: vel de quatre panells al voltant del forat
 * de l'àncora i targeta amb el text.
 *
 * Aïllament: en els passos d'explicació (`continua: "boto"`) el sistema és
 * `inert` (ho fa `Simulador`) i una tapa transparent cobreix el forat; només
 * funciona la targeta. En els passos d'acció el sistema queda operable: els
 * panells aturen el clic fora del forat i Tab només dona la volta entre els
 * elements de l'àncora i els de la targeta. Esc no es captura: obre la pausa.
 *
 * @param {Object}   props
 * @param {Object}   props.pas      Pas actual.
 * @param {number}   props.index    Índex del pas.
 * @param {number}   props.total    Nombre de passos.
 * @param {boolean}  props.actiu    Cert si es mostra (fals en pausa).
 * @param {Function} props.dispatch Dispatch del motor.
 */
function Guia( { pas, index, total, actiu, dispatch } ) {
	const capa = useRef( null );
	const targeta = useRef( null );
	const boto = useRef( null );
	const ancora = useRef( null );
	const anterior = useRef( null );
	const observador = useRef( null );
	const [ geo, setGeo ] = useState( BUIT );
	const explicacio = pas.continua === 'boto';

	const mesura = useCallback( () => {
		const arrel = capa.current?.parentElement;
		if ( ! arrel ) {
			return;
		}
		const rc = arrel.getBoundingClientRect();
		const origen = {
			left: rc.left + arrel.clientLeft,
			top: rc.top + arrel.clientTop,
		};
		const cont = {
			x: 0,
			y: 0,
			amplada: arrel.clientWidth,
			alcada: arrel.clientHeight,
		};
		const el = pas.ancora ? resolAncora( arrel, pas.ancora ) : null;
		if ( el !== ancora.current ) {
			if ( ancora.current ) {
				observador.current?.unobserve( ancora.current );
			}
			if ( el ) {
				observador.current?.observe( el );
			}
			ancora.current = el;
		}
		const f = el
			? forat( relatiu( el.getBoundingClientRect(), origen ), cont )
			: null;
		const t = targeta.current;
		const mida = {
			x: 0,
			y: 0,
			amplada: t?.offsetWidth ?? 0,
			alcada: t?.offsetHeight ?? 0,
		};
		setGeo( ( g ) =>
			haCanviat( g.cont, cont ) ||
			haCanviat( g.forat, f ) ||
			haCanviat( g.mida, mida )
				? { cont, forat: f, mida }
				: g
		);
	}, [ pas.ancora ] );

	// Reposicionat: mides (arrel, àncora, targeta), canvis del sistema
	// (finestres que es mouen, toasts), finestra, scroll i un bucle rAF.
	useLayoutEffect( () => {
		if ( ! actiu ) {
			return undefined;
		}
		const arrel = capa.current.parentElement;
		const vista = arrel.ownerDocument.defaultView;
		const ro = new vista.ResizeObserver( () => mesura() );
		observador.current = ro;
		ancora.current = null;
		ro.observe( arrel );
		if ( targeta.current ) {
			ro.observe( targeta.current );
		}
		const sistema = arrel.querySelector( '.nep-so__sistema' );
		const mo = new vista.MutationObserver( () => mesura() );
		if ( sistema ) {
			mo.observe( sistema, {
				subtree: true,
				childList: true,
				attributes: true,
				attributeFilter: [ 'style', 'class', 'data-tut', 'hidden' ],
			} );
		}
		let bucle = 0;
		const tick = () => {
			mesura();
			bucle = vista.requestAnimationFrame( tick );
		};
		tick();
		vista.addEventListener( 'resize', mesura );
		vista.addEventListener( 'orientationchange', mesura );
		arrel.ownerDocument.addEventListener( 'scroll', mesura, true );
		return () => {
			vista.cancelAnimationFrame( bucle );
			ro.disconnect();
			mo.disconnect();
			observador.current = null;
			ancora.current = null;
			vista.removeEventListener( 'resize', mesura );
			vista.removeEventListener( 'orientationchange', mesura );
			arrel.ownerDocument.removeEventListener( 'scroll', mesura, true );
		};
	}, [ actiu, mesura ] );

	// Passos d'explicació: el focus va a «Entès» (guardem on era per tornar-l'hi).
	useEffect( () => {
		if ( ! actiu || ! explicacio || ! boto.current ) {
			return;
		}
		const actual = boto.current.ownerDocument.activeElement;
		if ( actual && ! capa.current?.contains( actual ) ) {
			anterior.current = actual;
		}
		boto.current.focus( { preventScroll: true } );
	}, [ actiu, explicacio, index ] );

	// En acabar o saltar el tutorial: si el focus s'ha perdut amb la targeta,
	// torna on era abans.
	useEffect(
		() => () => {
			const el = anterior.current;
			const doc = el?.ownerDocument;
			if (
				el?.isConnected &&
				( ! doc.activeElement || doc.activeElement === doc.body ) &&
				! el.closest( '[inert]' )
			) {
				el.focus( { preventScroll: true } );
			}
		},
		[]
	);

	// Passos d'acció: Tab no surt del forat (àncora) i la targeta.
	useEffect( () => {
		if ( ! actiu || explicacio ) {
			return undefined;
		}
		const doc = capa.current.ownerDocument;
		const onKeyDown = ( e ) => {
			if ( e.key !== 'Tab' || e.altKey || e.ctrlKey || e.metaKey ) {
				return;
			}
			const llista = [
				...tabulables( ancora.current ),
				...tabulables( targeta.current ),
			];
			if ( ! llista.length ) {
				return;
			}
			const i = llista.indexOf( doc.activeElement );
			const darrer = llista.length - 1;
			let seguent;
			if ( e.shiftKey ) {
				seguent = i <= 0 ? darrer : i - 1;
			} else {
				seguent = i < 0 || i === darrer ? 0 : i + 1;
			}
			e.preventDefault();
			llista[ seguent ].focus();
		};
		doc.addEventListener( 'keydown', onKeyDown, true );
		return () => doc.removeEventListener( 'keydown', onKeyDown, true );
	}, [ actiu, explicacio ] );

	if ( ! actiu ) {
		return <div ref={ capa } hidden />;
	}

	const f = geo.forat;
	const lloc = posicioTargeta( f, geo.cont, geo.mida );
	// Pantalla estreta (mòbil): tota l'amplada menys els marges.
	const disponible = geo.cont.amplada - 2 * VORA;
	const amplada = Math.max(
		0,
		geo.cont.amplada < AMPLADA_ESTRETA
			? disponible
			: Math.min( AMPLADA_TARGETA, disponible )
	);

	return (
		<div ref={ capa } className="nep-guia">
			{ panells( f, geo.cont ).map( ( p, i ) => (
				<div
					key={ i }
					className="nep-guia__vel"
					aria-hidden="true"
					style={ estil( p ) }
					onMouseDown={ atura }
				/>
			) ) }
			{ f && explicacio && (
				<div
					className="nep-guia__tapa"
					aria-hidden="true"
					style={ estil( f ) }
					onMouseDown={ atura }
				/>
			) }
			{ f && (
				<div
					className="nep-guia__forat"
					aria-hidden="true"
					style={ estil( f ) }
				/>
			) }
			<div
				ref={ targeta }
				className={ `nep-guia__targeta is-${ lloc.costat }` }
				role="region"
				aria-label={ __( 'Guia del tutorial', 'noempesquen' ) }
				style={ {
					left: `${ lloc.x }px`,
					top: `${ lloc.y }px`,
					width: amplada ? `${ amplada }px` : undefined,
				} }
			>
				<div aria-live="polite" aria-atomic="true">
					<p className="nep-guia__comptador">
						{ sprintf(
							/* translators: 1: pas actual, 2: nombre de passos */
							__( 'Pas %1$d de %2$d', 'noempesquen' ),
							index + 1,
							total
						) }
					</p>
					<h2 className="nep-guia__titol">{ pas.titol }</h2>
					<p className="nep-guia__text">{ pas.text }</p>
				</div>
				<div className="nep-guia__botons">
					{ explicacio && (
						<button
							ref={ boto }
							type="button"
							className="nep-boto nep-boto--principal"
							onClick={ () =>
								dispatch( { tipus: 'PAS_SEGUENT' } )
							}
						>
							{ __( 'Entès', 'noempesquen' ) }
						</button>
					) }
					<button
						type="button"
						className="nep-boto nep-boto--link nep-guia__salta"
						onClick={ () => dispatch( { tipus: 'PAS_SALTA' } ) }
					>
						{ __( 'Salta el tutorial', 'noempesquen' ) }
					</button>
				</div>
			</div>
		</div>
	);
}

/**
 * Overlay del tutorial (germà de `.nep-so__sistema` dins de `.nep-so`).
 * Només amb `passos`, durant el joc i mentre queden passos. En pausa (o amb
 * la petició de girar) queda muntat però amagat.
 */
export function GuiaTutorial() {
	const { missio, estat, dispatch } = useJoc();
	const passos = Array.isArray( missio.passos ) ? missio.passos : [];
	const pas = passos[ estat.pas ];
	if ( estat.fase !== FASE.JOC || ! pas ) {
		return null;
	}
	return (
		<Guia
			pas={ pas }
			index={ estat.pas }
			total={ passos.length }
			actiu={ ! estat.pausa }
			dispatch={ dispatch }
		/>
	);
}
