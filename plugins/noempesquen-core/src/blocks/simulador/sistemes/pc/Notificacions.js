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

const mapaNoms = ( apps ) =>
	Object.fromEntries(
		Object.entries( apps ).map( ( [ k, v ] ) => [ k, v.nom ] )
	);

const MS_TOAST = 6000;
const MAX_TOASTS = 3;

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

function Toast( { n, onObre, onDescarta } ) {
	const joc = useJoc();
	const [ aturat, setAturat ] = useState( false );
	const descarta = useRef( onDescarta );
	descarta.current = onDescarta;
	const pausa = joc.estat.pausa;
	const d = descriu( n, joc );

	// Sis segons visibles; el comptador s'atura amb el punter o el focus
	// a sobre i durant la pausa del joc.
	useEffect( () => {
		if ( aturat || pausa ) {
			return undefined;
		}
		const t = setTimeout( () => descarta.current(), MS_TOAST );
		return () => clearTimeout( t );
	}, [ aturat, pausa ] );

	return (
		<li
			className="nep-so-toast nep-so-notif"
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
	const [ ids, setIds ] = useState( [] );
	const [ anunci, setAnunci ] = useState( '' );

	// Només reacciona a l'arribada de notificacions noves.
	useEffect( () => {
		if ( ! notificacions.length ) {
			vistes.current = new Set();
			setIds( [] );
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
			setIds( ( a ) => [ ...a, ...mostra ].slice( -MAX_TOASTS ) );
		}
	}, [ notificacions ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const visibles = amagats
		? []
		: ids
				.map( ( id ) => notificacions.find( ( n ) => n.id === id ) )
				.filter( ( n ) => n && ! n.llegida );

	const treu = ( id ) => setIds( ( a ) => a.filter( ( x ) => x !== id ) );

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
