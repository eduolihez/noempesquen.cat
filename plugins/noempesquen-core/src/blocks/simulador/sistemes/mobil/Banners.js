import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { IconaTanca } from '../../ui/icones';
import { CosNotificacio, descriu } from './notificacio';
import { admetAvisos, duradaAvis } from '../../nucli/avisos';
import { MAX_BANNERS, MS_ENTRE_AVISOS, MS_SORTIDA } from '../../nucli/temps';

/* Amb moviment reduït el banner descartat es desmunta sense animació. */
const movimentReduit = () =>
	typeof window !== 'undefined' &&
	Boolean(
		window.matchMedia?.( '(prefers-reduced-motion: reduce)' )?.matches
	);
/* Píxels de lliscament cap amunt per descartar-lo. */
const LLISCA = 30;

function Banner( { n, sortint, onObre, onDescarta } ) {
	const joc = useJoc();
	const [ aturat, setAturat ] = useState( false );
	const descarta = useRef( onDescarta );
	descarta.current = onDescarta;
	const inici = useRef( null );
	const pausa = joc.estat.pausa;

	// Visible segons la llargada del text (duradaAvis); el comptador s'atura
	// amb el punter o el focus a sobre i durant la pausa del joc, i en
	// reprendre continua amb el temps que quedava (no torna a començar).
	const resta = useRef( null );
	if ( resta.current === null ) {
		resta.current = duradaAvis( n.text );
	}
	useEffect( () => {
		if ( aturat || pausa || sortint ) {
			return undefined;
		}
		const arrenca = Date.now();
		const t = setTimeout( () => descarta.current(), resta.current );
		return () => {
			clearTimeout( t );
			resta.current = Math.max(
				0,
				resta.current - ( Date.now() - arrenca )
			);
		};
	}, [ aturat, pausa, sortint ] );

	return (
		<li
			className={ `nep-so-m-banner${ sortint ? ' is-sortint' : '' }` }
			inert={ sortint ? '' : undefined }
			onMouseEnter={ () => setAturat( true ) }
			onMouseLeave={ () => setAturat( false ) }
			onFocus={ () => setAturat( true ) }
			onBlur={ () => setAturat( false ) }
			onPointerDown={ ( e ) => {
				inici.current = e.clientY;
			} }
			onPointerUp={ ( e ) => {
				if (
					inici.current !== null &&
					inici.current - e.clientY > LLISCA
				) {
					onDescarta();
				}
				inici.current = null;
			} }
		>
			<CosNotificacio n={ n } d={ descriu( n, joc ) } onObre={ onObre } />
			<button
				type="button"
				className="nep-so-m-banner__descarta"
				aria-label={ __( 'Descarta la notificació', 'noempesquen' ) }
				title={ __( 'Descarta la notificació', 'noempesquen' ) }
				onClick={ onDescarta }
			>
				<IconaTanca />
			</button>
		</li>
	);
}

/**
 * Banners de les notificacions noves (a dalt de la pantalla) i regió
 * aria-live amb l'última. Tocar-ne un obre l'app; lliscar cap amunt el
 * descarta. Les notificacions surten de `estat.notificacions` del motor:
 * les apps no emeten banners directament.
 *
 * @param {Object}   props
 * @param {Function} props.onObre  Obre l'app d'una notificació.
 * @param {?string}  props.activa  App en primer pla (no en mostra banners).
 * @param {boolean}  props.amagats El centre de control és obert.
 * @param {boolean}  props.silenci Encara es veu el bloqueig: sense banners.
 */
export function Banners( { onObre, activa, amagats, silenci } ) {
	const joc = useJoc();
	const { notificacions } = joc.estat;
	const vistes = useRef( new Set( notificacions.map( ( n ) => n.id ) ) );
	const pausa = joc.estat.pausa;
	// `cua`: esperen torn; `ids`: a la vista; `sortint`: animant la sortida.
	const [ cua, setCua ] = useState( [] );
	const [ ids, setIds ] = useState( [] );
	const [ sortint, setSortint ] = useState( () => new Set() );
	const [ rellotge, setRellotge ] = useState( 0 );
	const ultimaEntrada = useRef( null );
	const sortides = useRef( new Map() );
	const [ anunci, setAnunci ] = useState( '' );

	useEffect( () => {
		const timers = sortides.current;
		return () => timers.forEach( ( t ) => clearTimeout( t ) );
	}, [] );

	// Només reacciona a l'arribada de notificacions noves. Les dependències
	// es limiten a `notificacions` a propòsit: si `joc`, `activa` o `silenci`
	// hi fossin, el canvi d'app o la sortida del bloqueig tornaria a avaluar
	// les mateixes notificacions; `activa` i `silenci` es llegeixen tal com
	// són en el moment en què arriba cada notificació.
	useEffect( () => {
		if ( ! notificacions.length ) {
			vistes.current = new Set();
			setCua( [] );
			setIds( [] );
			setSortint( new Set() );
			sortides.current.forEach( ( t ) => clearTimeout( t ) );
			sortides.current.clear();
			ultimaEntrada.current = null;
			return;
		}
		const noves = notificacions.filter(
			( n ) => ! vistes.current.has( n.id )
		);
		if ( ! noves.length ) {
			return;
		}
		vistes.current = new Set( [
			...vistes.current,
			...noves.map( ( n ) => n.id ),
		] );
		const darrera = noves[ noves.length - 1 ];
		const d = descriu( darrera, joc );
		setAnunci( `${ d.app }. ${ d.titol }: ${ darrera.text }` );
		const mostra = noves
			.filter( ( n ) => ! n.llegida && n.app !== activa )
			.map( ( n ) => n.id );
		if ( mostra.length && ! silenci ) {
			setCua( ( a ) => [ ...a, ...mostra ] );
		}
	}, [ notificacions ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const viva = ( id ) => {
		const n = notificacions.find( ( x ) => x.id === id );
		return Boolean( n && ! n.llegida );
	};

	// Admissió escalonada: entren d'una en una (MS_ENTRE_AVISOS) i, si ja
	// n'hi ha MAX_BANNERS a la vista, la resta espera a la cua.
	useEffect( () => {
		if ( amagats || pausa || ! cua.length ) {
			return undefined;
		}
		const pendents = cua.filter( viva );
		if ( pendents.length !== cua.length ) {
			setCua( pendents );
			return undefined;
		}
		const ara = Date.now();
		const r = admetAvisos( {
			cua,
			visibles: ids.filter( ( id ) => viva( id ) && ! sortint.has( id ) )
				.length,
			max: MAX_BANNERS,
			ara,
			ultimaEntrada: ultimaEntrada.current,
			entre: MS_ENTRE_AVISOS,
		} );
		if ( r.mostra.length ) {
			ultimaEntrada.current = ara;
			setIds( ( a ) => [ ...a, ...r.mostra ] );
			setCua( r.espera );
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
	}, [ cua, ids, sortint, amagats, pausa, rellotge, notificacions ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const visibles = amagats
		? []
		: ids
				.map( ( id ) => notificacions.find( ( n ) => n.id === id ) )
				.filter( ( n ) => n && ! n.llegida );

	const desmunta = ( id ) => {
		sortides.current.delete( id );
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

	return (
		<>
			<ul
				className="nep-so-m-banners"
				aria-label={ __( 'Notificacions noves', 'noempesquen' ) }
			>
				{ visibles.map( ( n ) => (
					<Banner
						key={ n.id }
						n={ n }
						sortint={ sortint.has( n.id ) }
						onObre={ () => {
							treu( n.id );
							onObre( n );
						} }
						onDescarta={ () => treu( n.id ) }
					/>
				) ) }
			</ul>
			<div className="nep-so-sr" aria-live="polite">
				{ anunci }
			</div>
		</>
	);
}
