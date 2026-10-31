import { useEffect, useRef, useState } from '@wordpress/element';
import {
	admetAvisos,
	afegeixAnunci,
	filtraCua,
	podaRestes,
	restaTemps,
} from '../nucli/avisos';
import { MS_ENTRE_AVISOS, MS_SORTIDA } from '../nucli/temps';

/**
 * Esdeveniment (amb bombolla) que emet la llista d'avisos quan un avís entra
 * a la vista. `useSoNotificacions` l'escolta a l'arrel per fer sonar el to.
 */
export const AVIS_ENTRA = 'nep-so-avis-entra';

/* Amb moviment reduït l'avís descartat es desmunta sense animació. */
export const movimentReduit = () =>
	typeof window !== 'undefined' &&
	Boolean(
		window.matchMedia?.( '(prefers-reduced-motion: reduce)' )?.matches
	);

const esFocusTeclat = ( el ) => {
	try {
		return el.matches( ':focus-visible' );
	} catch {
		return true;
	}
};

/**
 * Cua d'avisos compartida pels toasts del PC i els banners del mòbil: admissió
 * escalonada (MS_ENTRE_AVISOS) amb tope de visibles, filtre per app oberta
 * (també del que ja espera), sortida animada (MS_SORTIDA), temps restant per
 * id (sobreviu al desmuntatge quan el centre és obert), anunci aria-live i
 * esdeveniment AVIS_ENTRA quan un avís entra de debò a la vista.
 *
 * @param {Object}   p
 * @param {Array}    p.notificacions Notificacions del motor.
 * @param {boolean}  p.pausa         Joc en pausa (o demanant girar).
 * @param {boolean}  p.amagats       El centre és obert: no se'n mostra cap.
 * @param {boolean}  p.silenci       Encara es veu el bloqueig: no entren a la cua.
 * @param {number}   p.max           Tope de visibles alhora.
 * @param {Function} p.oculta        (n) => cert si no s'ha de mostrar ara.
 * @param {*}        p.clauOculta    Valor primitiu del qual depèn `oculta`.
 * @param {Function} p.textAnunci    (n) => text per a la regió aria-live.
 * @param {Object}   p.llista        Ref de la llista (emet AVIS_ENTRA).
 * @return {{visibles: Array, sortint: Set, treu: Function, restes: Object, anuncis: Array}} Estat de la cua.
 */
export function useCuaAvisos( {
	notificacions,
	pausa,
	amagats,
	silenci,
	max,
	oculta,
	clauOculta,
	textAnunci,
	llista,
} ) {
	const vistes = useRef( null );
	if ( vistes.current === null ) {
		vistes.current = new Set( notificacions.map( ( n ) => n.id ) );
	}
	// `cua`: esperen torn; `ids`: a la vista; `sortint`: animant la sortida.
	const [ cua, setCua ] = useState( [] );
	const [ ids, setIds ] = useState( [] );
	const [ sortint, setSortint ] = useState( () => new Set() );
	const [ rellotge, setRellotge ] = useState( 0 );
	const [ anuncis, setAnuncis ] = useState( [] );
	const ultimaEntrada = useRef( null );
	const tandaOberta = useRef( false );
	const clauAnunci = useRef( 0 );
	const sortides = useRef( new Map() );
	const restes = useRef( new Map() );
	const actual = useRef( {} );
	actual.current = { oculta, textAnunci, silenci };

	useEffect( () => {
		const timers = sortides.current;
		return () => timers.forEach( ( t ) => clearTimeout( t ) );
	}, [] );

	// Només reacciona a l'arribada de notificacions noves; `silenci` i
	// `oculta` es llegeixen tal com són quan arriben.
	useEffect( () => {
		if ( ! notificacions.length ) {
			vistes.current = new Set();
			setCua( [] );
			setIds( [] );
			setSortint( new Set() );
			setAnuncis( [] );
			sortides.current.forEach( ( t ) => clearTimeout( t ) );
			sortides.current.clear();
			restes.current = new Map();
			ultimaEntrada.current = null;
			tandaOberta.current = false;
			return;
		}
		const noves = notificacions.filter(
			( n ) => ! vistes.current.has( n.id )
		);
		if ( ! noves.length ) {
			return;
		}
		noves.forEach( ( n ) => vistes.current.add( n.id ) );
		if ( actual.current.silenci ) {
			return;
		}
		const mostra = filtraCua(
			noves.map( ( n ) => n.id ),
			notificacions,
			actual.current.oculta
		);
		if ( mostra.length ) {
			setCua( ( a ) => [ ...a, ...mostra ] );
		}
	}, [ notificacions ] );

	// Admissió escalonada: entren d'una en una (MS_ENTRE_AVISOS) i, si ja
	// n'hi ha `max` a la vista, la resta espera a la cua.
	useEffect( () => {
		const vius = filtraCua( ids, notificacions );
		restes.current = podaRestes( restes.current, vius );
		if ( vius.length !== ids.length ) {
			setIds( vius );
			return undefined;
		}
		if ( amagats || pausa || ! cua.length ) {
			return undefined;
		}
		const pendents = filtraCua( cua, notificacions, actual.current.oculta );
		if ( pendents.length !== cua.length ) {
			setCua( pendents );
			return undefined;
		}
		const ara = Date.now();
		const r = admetAvisos( {
			cua,
			visibles: ids.filter( ( id ) => ! sortint.has( id ) ).length,
			max,
			ara,
			ultimaEntrada: ultimaEntrada.current,
			entre: MS_ENTRE_AVISOS,
		} );
		if ( r.mostra.length ) {
			const novaTanda = ! tandaOberta.current;
			ultimaEntrada.current = ara;
			tandaOberta.current = r.espera.length > 0;
			setIds( ( a ) => [ ...a, ...r.mostra ] );
			setCua( r.espera );
			r.mostra.forEach( ( id, i ) => {
				const n = notificacions.find( ( x ) => x.id === id );
				clauAnunci.current += 1;
				const clau = clauAnunci.current;
				const text = actual.current.textAnunci( n );
				setAnuncis( ( a ) =>
					afegeixAnunci( a, text, {
						novaTanda: novaTanda && i === 0,
						clau,
					} )
				);
				llista.current?.dispatchEvent(
					new window.CustomEvent( AVIS_ENTRA, {
						bubbles: true,
						detail: { id },
					} )
				);
			} );
			return undefined;
		}
		if ( r.properaEntrada === null ) {
			return undefined;
		}
		const t = setTimeout(
			() => setRellotge( ( x ) => x + 1 ),
			Math.max( 0, r.properaEntrada - ara )
		);
		return () => clearTimeout( t );
	}, [
		cua,
		ids,
		sortint,
		amagats,
		pausa,
		rellotge,
		notificacions,
		clauOculta,
		max,
		llista,
	] );

	const visibles = amagats
		? []
		: ids
				.map( ( id ) => notificacions.find( ( n ) => n.id === id ) )
				.filter( ( n ) => n && ! n.llegida );

	const desmunta = ( id ) => {
		sortides.current.delete( id );
		restes.current.delete( id );
		setIds( ( a ) => a.filter( ( x ) => x !== id ) );
		setSortint( ( s ) => {
			if ( ! s.has( id ) ) {
				return s;
			}
			const c = new Set( s );
			c.delete( id );
			return c;
		} );
	};

	// Descarta amb animació de sortida (MS_SORTIDA) i després desmunta.
	const treu = ( id ) => {
		if ( sortides.current.has( id ) ) {
			return;
		}
		if ( movimentReduit() ) {
			desmunta( id );
			return;
		}
		setSortint( ( s ) => new Set( [ ...s, id ] ) );
		sortides.current.set(
			id,
			setTimeout( () => desmunta( id ), MS_SORTIDA )
		);
	};

	return { visibles, sortint, treu, restes, anuncis };
}

/**
 * Compte enrere d'un avís que s'atura mentre `aturat` és cert i en reprendre
 * continua amb el temps que quedava. Amb `restes` i `id` el temps es desa al
 * pare i sobreviu al desmuntatge (p. ex. mentre el centre és obert).
 *
 * @param {number}   durada             Durada total (ms).
 * @param {boolean}  aturat             Comptador aturat.
 * @param {Object}   [opcions]
 * @param {Object}   [opcions.restes]   Ref d'un Map id -> ms restants.
 * @param {string}   [opcions.id]       Id de l'avís.
 * @param {Function} [opcions.onCaduca] Es crida quan s'esgota.
 */
export function useTempsRestant(
	durada,
	aturat,
	{ restes, id, onCaduca } = {}
) {
	const caduca = useRef( onCaduca );
	caduca.current = onCaduca;
	const local = useRef( null );

	useEffect( () => {
		if ( aturat ) {
			return undefined;
		}
		const resta = restes?.current.get( id ) ?? local.current ?? durada;
		const arrenca = Date.now();
		const t = setTimeout( () => caduca.current?.(), resta );
		return () => {
			clearTimeout( t );
			const queda = restaTemps( resta, arrenca, Date.now() );
			local.current = queda;
			restes?.current.set( id, queda );
		};
	}, [ aturat ] ); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Pausa per punter o focus: només el ratolí compta com a «a sobre» (un toc
 * no deixa l'avís aturat) i només el focus de teclat (`:focus-visible`).
 *
 * @return {{aturat: boolean, handlers: Object}} Estat i gestors per al `li`.
 */
export function useAturadaAvis() {
	const [ hover, setHover ] = useState( false );
	const [ focus, setFocus ] = useState( false );
	return {
		aturat: hover || focus,
		handlers: {
			onPointerEnter: ( e ) => {
				if ( e.pointerType === 'mouse' ) {
					setHover( true );
				}
			},
			onPointerLeave: ( e ) => {
				if ( e.pointerType === 'mouse' ) {
					setHover( false );
				}
			},
			onFocus: ( e ) => {
				if ( esFocusTeclat( e.target ) ) {
					setFocus( true );
				}
			},
			onBlur: ( e ) => {
				if ( ! e.currentTarget.contains( e.relatedTarget ) ) {
					setFocus( false );
				}
			},
		},
	};
}

/**
 * Abans que el `li` es torni inert, si el focus hi és a dins el porta a
 * l'avís veí o al contenidor enfocable més proper (no a `body`).
 *
 * @param {?HTMLElement} li Element de l'avís.
 */
export function apartaFocus( li ) {
	if ( ! li || ! li.contains( li.ownerDocument.activeElement ) ) {
		return;
	}
	const vei = [ li.nextElementSibling, li.previousElementSibling ].find(
		( g ) => g && ! g.hasAttribute( 'inert' )
	);
	const desti = vei?.querySelector( 'button' ) ?? li.closest( '[tabindex]' );
	desti?.focus( { preventScroll: true } );
}

/**
 * Regió aria-live amb els avisos de la tanda: cada entrada és un node nou
 * (clau única), així dos textos iguals seguits també s'anuncien.
 *
 * @param {Object} props
 * @param {Array}  props.anuncis Entrades [{ clau, text }].
 */
export function RegioAnuncis( { anuncis } ) {
	return (
		<div className="nep-so-sr" aria-live="polite">
			{ anuncis.map( ( a ) => (
				<span key={ a.clau }>{ a.text } </span>
			) ) }
		</div>
	);
}
