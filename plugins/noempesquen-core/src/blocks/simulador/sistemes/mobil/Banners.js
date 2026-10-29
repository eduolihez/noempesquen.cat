import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { CosNotificacio, descriu } from './notificacio';

const MS_BANNER = 6000;
const MAX_BANNERS = 2;
/* Píxels de lliscament cap amunt per descartar-lo. */
const LLISCA = 30;

function Banner( { n, onObre, onDescarta } ) {
	const joc = useJoc();
	const [ aturat, setAturat ] = useState( false );
	const descarta = useRef( onDescarta );
	descarta.current = onDescarta;
	const inici = useRef( null );
	const pausa = joc.estat.pausa;

	// Sis segons visibles; el comptador s'atura amb el punter o el focus
	// a sobre i durant la pausa del joc.
	useEffect( () => {
		if ( aturat || pausa ) {
			return undefined;
		}
		const t = setTimeout( () => descarta.current(), MS_BANNER );
		return () => clearTimeout( t );
	}, [ aturat, pausa ] );

	return (
		<li
			className="nep-so-m-banner"
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
			.filter( ( n ) => ! n.llegida && n.app !== activa )
			.map( ( n ) => n.id );
		if ( mostra.length && ! silenci ) {
			setIds( ( a ) => [ ...a, ...mostra ].slice( -MAX_BANNERS ) );
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
				className="nep-so-m-banners"
				aria-label={ __( 'Notificacions noves', 'noempesquen' ) }
			>
				{ visibles.map( ( n ) => (
					<Banner
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
