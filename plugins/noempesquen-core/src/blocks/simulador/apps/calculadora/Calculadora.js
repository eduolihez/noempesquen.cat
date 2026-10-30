import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { calcula, classeMida, estatInicial, mostra } from './calc.js';

const FILES = [
	[ 'C', '⌫', '%', '÷' ],
	[ '7', '8', '9', '×' ],
	[ '4', '5', '6', '−' ],
	[ '1', '2', '3', '+' ],
	[ '±', '0', ',', '=' ],
];

const OPERADORS = [ '+', '−', '×', '÷' ];

/* Tecla física → tecla de la calculadora (Escape no: és la pausa). */
const TECLES_FISIQUES = {
	'+': '+',
	'-': '−',
	'*': '×',
	'/': '÷',
	'=': '=',
	Enter: '=',
	Backspace: '⌫',
	',': ',',
	'.': ',',
	'%': '%',
};

function etiquetes() {
	return {
		C: __( 'Esborrar tot', 'noempesquen' ),
		'⌫': __( 'Esborrar', 'noempesquen' ),
		'%': __( 'Percentatge', 'noempesquen' ),
		'÷': __( 'Dividir', 'noempesquen' ),
		'×': __( 'Multiplicar', 'noempesquen' ),
		'−': __( 'Restar', 'noempesquen' ),
		'+': __( 'Sumar', 'noempesquen' ),
		'±': __( 'Canviar signe', 'noempesquen' ),
		',': __( 'Coma decimal', 'noempesquen' ),
		'=': __( 'Igual', 'noempesquen' ),
	};
}

export default function Calculadora() {
	const [ estat, setEstat ] = useState( estatInicial );
	const arrel = useRef( null );
	const noms = etiquetes();

	// L'app queda muntada (hidden + inert) en segon pla: en tornar a primer
	// pla recupera el focus si s'ha perdut (body, arrel del simulador o part
	// inert), sense robar-lo si ja és dins seu o és en un menú o diàleg.
	useEffect( () => {
		const el = arrel.current;
		const pantalla = el?.closest( 'section' );
		const recupera = () => {
			if ( pantalla?.hidden || pantalla?.hasAttribute( 'inert' ) ) {
				return;
			}
			const actiu = el.ownerDocument.activeElement;
			const perdut =
				! actiu ||
				actiu === el.ownerDocument.body ||
				actiu.classList?.contains( 'nep-so' ) ||
				!! actiu.closest?.( '[inert], [hidden]' );
			if ( perdut && ! el.contains( actiu ) ) {
				el.focus( { preventScroll: true } );
			}
		};
		recupera();
		const Observador = el?.ownerDocument.defaultView?.MutationObserver;
		if ( ! pantalla || ! Observador ) {
			return undefined;
		}
		const obs = new Observador( recupera );
		obs.observe( pantalla, {
			attributes: true,
			attributeFilter: [ 'hidden', 'inert' ],
		} );
		return () => obs.disconnect();
	}, [] );

	const prem = ( tecla ) => setEstat( ( e ) => calcula( e, tecla ) );

	const onKeyDown = ( ev ) => {
		if ( ev.ctrlKey || ev.metaKey || ev.altKey ) {
			return;
		}
		let tecla = null;
		if ( /^[0-9]$/.test( ev.key ) ) {
			tecla = ev.key;
		} else if ( ev.key === 'Enter' && ev.target.tagName === 'BUTTON' ) {
			return; // El botó enfocat tracta l'Enter com a clic.
		} else {
			tecla = TECLES_FISIQUES[ ev.key ] ?? null;
		}
		if ( tecla ) {
			ev.preventDefault();
			prem( tecla );
		}
	};

	return (
		// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
		<div
			ref={ arrel }
			className="nep-calculadora"
			role="region"
			aria-label={ __( 'Calculadora', 'noempesquen' ) }
			tabIndex={ -1 }
			onKeyDown={ onKeyDown }
		>
			<div
				className={ `nep-calculadora__pantalla ${
					estat.error ? 'is-error' : classeMida( mostra( estat ) )
				}` }
				role="status"
				aria-live="polite"
				aria-atomic="true"
			>
				{ mostra( estat ) }
			</div>
			<div className="nep-calculadora__teclat">
				{ FILES.flat().map( ( tecla ) => {
					const esOp = OPERADORS.includes( tecla );
					const actiu = esOp && estat.op === tecla && estat.nou;
					const classe = [
						'nep-calculadora__tecla',
						esOp || tecla === '=' ? 'is-operador' : '',
						/[C⌫%±]/.test( tecla ) ? 'is-funcio' : '',
						actiu ? 'is-actiu' : '',
					]
						.filter( Boolean )
						.join( ' ' );
					return (
						<button
							key={ tecla }
							type="button"
							className={ classe }
							aria-label={ noms[ tecla ] }
							aria-pressed={ esOp ? actiu : undefined }
							onClick={ () => prem( tecla ) }
						>
							{ tecla }
						</button>
					);
				} ) }
			</div>
		</div>
	);
}
