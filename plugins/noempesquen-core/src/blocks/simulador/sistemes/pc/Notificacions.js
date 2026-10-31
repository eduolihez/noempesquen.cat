import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { APPS, APPS_MOBIL } from '../../apps/registre';
import { IconaMobil } from './IconaMobil';
import { presenta } from './notificacio';
import {
	IconaCampana,
	IconaParla,
	IconaPosta,
	IconaTanca,
} from '../../ui/icones';
import { admetAvisos, duradaAvis } from '../../nucli/avisos';
import { MAX_TOASTS, MS_ENTRE_AVISOS, MS_SORTIDA } from '../../nucli/temps';

const mapaNoms = ( apps ) =>
	Object.fromEntries(
		Object.entries( apps ).map( ( [ k, v ] ) => [ k, v.nom ] )
	);

/* Amb moviment reduït el toast descartat es desmunta sense animació. */
const movimentReduit = () =>
	typeof window !== 'undefined' &&
	Boolean(
		window.matchMedia?.( '(prefers-reduced-motion: reduce)' )?.matches
	);

/**
 * Com es presenta una notificació: app d'origen, títol i imatge.
 * A Parla, el títol és la clau del contacte (el guia). Les del mòbil
 * vinculat porten l'origen «Mòbil d'Àlex · app» i la icona de mòbil.
 *
 * @param {Object}   n           Notificació { app, titol, text, font? }.
 * @param {Object}   joc         Context del joc.
 * @param {Object}   joc.mon     Món (contactes).
 * @param {string}   joc.nomGuia Nom del guia, si no és un contacte.
 * @param {Function} joc.Avatar  Avatar del guia.
 * @return {{app:string, AppIcona:Function, titol:string, imatge:?Object}} Presentació.
 */
export function descriu( n, { mon, nomGuia, Avatar } ) {
	const p = presenta( n, {
		mon,
		nomGuia,
		nomsAppsPc: mapaNoms( APPS ),
		nomsAppsMobil: mapaNoms( APPS_MOBIL ),
	} );
	if ( p.tipus === 'mobil' ) {
		const IconaApp = p.iconaApp ? APPS_MOBIL[ p.iconaApp ]?.Icona : null;
		return {
			app: p.app,
			AppIcona: IconaMobil,
			titol: p.titol,
			imatge: (
				<span className="nep-so-notif__mobil">
					<IconaMobil mida={ 20 } />
					{ IconaApp && <IconaApp mida={ 24 } /> }
				</span>
			),
		};
	}
	if ( p.tipus === 'parla' ) {
		return {
			app: __( 'Parla', 'noempesquen' ),
			AppIcona: IconaParla,
			titol: p.titol,
			imatge: (
				<span className="nep-so-notif__avatar">
					<Avatar mida={ 40 } />
				</span>
			),
		};
	}
	if ( p.tipus === 'posta' ) {
		return {
			app: __( 'Posta', 'noempesquen' ),
			AppIcona: IconaPosta,
			titol: p.titol,
			imatge: <IconaPosta mida={ 36 } />,
		};
	}
	return {
		app: p.app,
		AppIcona: APPS[ n.app ]?.Icona ?? IconaCampana,
		titol: p.titol,
		imatge: null,
	};
}

/**
 * Cos clicable d'una notificació (compartit pel toast i pel centre).
 *
 * @param {Object}   props
 * @param {Object}   props.n      Notificació.
 * @param {Object}   props.d      Presentació (vegeu descriu).
 * @param {Function} props.onObre Obre l'app de la notificació.
 */
export function CosNotificacio( { n, d, onObre } ) {
	return (
		<button type="button" className="nep-so-notif__cos" onClick={ onObre }>
			{ d.imatge && (
				<span className="nep-so-notif__imatge">{ d.imatge }</span>
			) }
			<span className="nep-so-notif__text">
				<strong className="nep-so-notif__titol">{ d.titol }</strong>
				<span className="nep-so-notif__missatge">{ n.text }</span>
			</span>
		</button>
	);
}

function Toast( { n, sortint, onObre, onDescarta } ) {
	const joc = useJoc();
	const [ aturat, setAturat ] = useState( false );
	const descarta = useRef( onDescarta );
	descarta.current = onDescarta;
	const pausa = joc.estat.pausa;
	const d = descriu( n, joc );

	// Visible segons la llargada del text (duradaAvis); el comptador s'atura
	// amb el punter o el focus a sobre i durant la pausa del joc, i en
	// reprendre continua amb el temps que quedava.
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
			className={ `nep-so-toast nep-so-notif${
				sortint ? ' is-sortint' : ''
			}` }
			inert={ sortint ? '' : undefined }
			onMouseEnter={ () => setAturat( true ) }
			onMouseLeave={ () => setAturat( false ) }
			onFocus={ () => setAturat( true ) }
			onBlur={ () => setAturat( false ) }
		>
			<div className="nep-so-notif__cap">
				<d.AppIcona mida={ 16 } />
				<span>{ d.app }</span>
				<button
					type="button"
					className="nep-so-notif__descarta"
					aria-label={ __(
						'Descarta la notificació',
						'noempesquen'
					) }
					onClick={ onDescarta }
				>
					<IconaTanca />
				</button>
			</div>
			<CosNotificacio n={ n } d={ d } onObre={ onObre } />
		</li>
	);
}

/**
 * Toasts de les notificacions noves (abaix a la dreta) i regió aria-live
 * amb l'última. No es mostren les de Parla si Parla és en primer pla.
 *
 * @param {Object}   props
 * @param {Function} props.onObre      Obre l'app d'una notificació.
 * @param {boolean}  props.parlaActiva Parla és la finestra activa.
 * @param {boolean}  props.amagats     El centre de notificacions és obert.
 * @param {boolean}  props.silenci     Encara es veu el bloqueig: sense toasts.
 */
export function Toasts( { onObre, parlaActiva, amagats, silenci } ) {
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

	// Només reacciona a l'arribada de notificacions noves.
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
			.filter(
				( n ) =>
					! n.llegida &&
					! ( n.app === 'parla' && ! n.font && parlaActiva )
			)
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
	// n'hi ha MAX_TOASTS a la vista, la resta espera a la cua.
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
			max: MAX_TOASTS,
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
				className="nep-so-toasts"
				aria-label={ __( 'Notificacions noves', 'noempesquen' ) }
			>
				{ visibles.map( ( n ) => (
					<Toast
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
