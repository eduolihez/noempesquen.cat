import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from './context';
import { desenllac } from './desenllac';

const FOCALITZABLES = 'button:not([disabled])';

function titolDe( tipus ) {
	if ( tipus === 'correcta' ) {
		return __( 'Molt bé!', 'noempesquen' );
	}
	if ( tipus === 'parcial' ) {
		return __( 'Gairebé!', 'noempesquen' );
	}
	return __( "T'han pescat!", 'noempesquen' );
}

/**
 * Capa de conseqüència sobre el sistema: la xarxa que cau si s'ha picat,
 * o el veredicte de la decisió. Modal, amb el focus atrapat; Esc no hi fa
 * res (el Simulador l'ignora en aquesta fase).
 *
 * @param {Object}   props
 * @param {Function} props.onResultat Passa a l'informe.
 */
export function Consequencia( { onResultat } ) {
	const { missio, estat, Avatar } = useJoc();
	const dialeg = useRef( null );
	const titol = useRef( null );
	const final = desenllac( missio, estat );

	useEffect( () => {
		titol.current?.focus();
	}, [] );

	if ( ! final ) {
		return null;
	}

	// Amb un sol botó, Tab i Maj+Tab hi tornen sempre: el focus no surt.
	const onKeyDown = ( e ) => {
		if ( e.key !== 'Tab' ) {
			return;
		}
		const llista = [ ...dialeg.current.querySelectorAll( FOCALITZABLES ) ];
		if ( ! llista.length ) {
			return;
		}
		e.preventDefault();
		const n = llista.length;
		const i = llista.indexOf( dialeg.current.ownerDocument.activeElement );
		let seg = e.shiftKey ? n - 1 : 0;
		if ( i >= 0 ) {
			seg = ( i + ( e.shiftKey ? -1 : 1 ) + n ) % n;
		}
		llista[ seg ].focus();
	};

	// Un clic fora del botó no ha de deixar el focus a <body>.
	const onMouseDown = ( e ) => {
		if ( ! e.target.closest( 'button' ) ) {
			e.preventDefault();
		}
	};

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className={ `nep-cons nep-cons--${ final.tipus }` }
			onMouseDown={ onMouseDown }
		>
			{ final.caigut && (
				<div className="nep-xarxa nep-cons__xarxa" aria-hidden="true" />
			) }
			{ /* Captura Tab per atrapar el focus dins del diàleg modal. */ }
			{ /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */ }
			<div
				ref={ dialeg }
				className="nep-cons__panell"
				role="dialog"
				aria-modal="true"
				aria-labelledby="nep-cons-titol"
				aria-describedby="nep-cons-text"
				onKeyDown={ onKeyDown }
			>
				<div className="nep-cons__avatar">
					<Avatar estat={ final.avatar } mida={ 112 } />
				</div>
				<h2
					id="nep-cons-titol"
					ref={ titol }
					className="nep-cons__titol"
					tabIndex={ -1 }
				>
					{ titolDe( final.tipus ) }
				</h2>
				<p id="nep-cons-text" className="nep-cons__text">
					{ final.text }
				</p>
				<button
					type="button"
					className="nep-cons__boto"
					onClick={ onResultat }
				>
					{ __( 'Veure el resultat', 'noempesquen' ) }
				</button>
			</div>
		</div>
	);
}
