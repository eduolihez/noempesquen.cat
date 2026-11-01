import { useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useJoc } from '../simulador/context';
import { indicis } from '../nucli/motor';
import { clauXip, textComptador } from '../nucli/lupa';
import { MS_XIP_LUPA } from '../nucli/temps';
import { IconaFet, IconaLupa } from './icones';

/**
 * Text del xip per a una clau de `clauXip()`.
 *
 * @param {string|null} clau Clau del xip.
 * @return {string} Text traduït (buit sense clau).
 */
export function textXip( clau ) {
	switch ( clau ) {
		case 'nova':
			return __( 'Pista trobada', 'noempesquen' );
		case 'normal':
			return __( 'Sembla normal', 'noempesquen' );
		case 'repetida':
			return __( 'Ja la tenies', 'noempesquen' );
		case 'totes':
			return __( 'Ja els tens tots', 'noempesquen' );
		default:
			return '';
	}
}

/**
 * Etiqueta completa del botó: «Lupa, 2 de 5 indicis».
 *
 * @param {{trobats:number, total:number, complet:boolean}} ind Indicis.
 * @return {string} Etiqueta.
 */
function etiqueta( ind ) {
	if ( ! ind.total ) {
		return __( 'Lupa', 'noempesquen' );
	}
	if ( ind.complet ) {
		return __( 'Lupa, has trobat tots els indicis', 'noempesquen' );
	}
	return sprintf(
		/* translators: 1: indicis trobats, 2: indicis totals */
		__( 'Lupa, %1$d de %2$d indicis', 'noempesquen' ),
		ind.trobats,
		ind.total
	);
}

/**
 * Botó de la lupa sempre visible, amb etiqueta i comptador «n/N».
 *
 * @param {Object}   props
 * @param {string}   props.className Classes del sistema (PC o mòbil).
 * @param {Function} props.onClick   Alterna la lupa.
 * @param {boolean}  props.inerta    Un diàleg modal el tapa.
 * @param {boolean}  props.pista     Mostra la pista flotant (PC).
 */
export function BotoLupa( { className = '', onClick, inerta, pista } ) {
	const { missio, estat } = useJoc();
	const ind = indicis( missio, estat );
	const classes = [
		'nep-boto-lupa',
		className,
		estat.lupa && 'is-activa',
		ind.complet && 'is-complet',
	]
		.filter( Boolean )
		.join( ' ' );
	return (
		<button
			type="button"
			className={ classes }
			aria-label={ etiqueta( ind ) }
			aria-pressed={ estat.lupa }
			aria-keyshortcuts="Alt+Shift+L"
			inert={ inerta ? '' : undefined }
			onClick={ onClick }
		>
			<IconaLupa mida={ 18 } />
			<span className="nep-boto-lupa__nom" aria-hidden="true">
				{ __( 'Lupa', 'noempesquen' ) }
			</span>
			{ ind.total > 0 && (
				<span className="nep-boto-lupa__comptador" aria-hidden="true">
					{ ind.complet && <IconaFet mida={ 12 } /> }
					{ textComptador( ind ) }
				</span>
			) }
			{ pista && (
				<span className="nep-so-pista" aria-hidden="true">
					{ ind.complet
						? __( 'Has trobat tots els indicis', 'noempesquen' )
						: __( 'Lupa (Alt+Maj+L)', 'noempesquen' ) }
				</span>
			) }
		</button>
	);
}

/**
 * Regió `status` única de la lupa: llegeix el resultat de cada inspecció.
 * Muntar-la una sola vegada per sistema, només amb la lupa activa.
 */
export function AvisLupa() {
	const { missio, estat } = useJoc();
	const clau = estat.ultimaInspeccio?.clau ?? 0;
	const inicial = useRef( clau );
	const [ vist, setVist ] = useState( null );

	useEffect( () => {
		if ( clau === inicial.current ) {
			return;
		}
		setVist( clau );
		const t = setTimeout( () => setVist( null ), MS_XIP_LUPA );
		return () => clearTimeout( t );
	}, [ clau ] );

	const ind = indicis( missio, estat );
	let text = '';
	if ( vist !== null && vist === clau ) {
		const xip = clauXip( estat.ultimaInspeccio?.tipus, ind.complet );
		text = textXip( xip );
		if ( xip === 'nova' ) {
			text = ind.complet
				? `${ text }. ${ __(
						'Has trobat tots els indicis',
						'noempesquen'
					) }`
				: `${ text }. ${ sprintf(
						/* translators: 1: indicis trobats, 2: indicis totals */
						__( '%1$d de %2$d indicis', 'noempesquen' ),
						ind.trobats,
						ind.total
					) }`;
		}
	}
	return (
		<p className="nep-so-sr" role="status">
			{ text && <span key={ clau }>{ text }</span> }
		</p>
	);
}
