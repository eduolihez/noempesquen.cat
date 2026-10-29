import { useEffect, useId, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { Inspeccionable } from '../../ui/Inspeccionable';
import { normalitzaUrl } from './historial';
import { IconaAvis, IconaCadenat, IconaCercaNav, IconaInfo } from './icones';

/* Textos de cada estat de connexió (es tradueixen en pintar, no en carregar). */
const textosSeguretat = () => ( {
	segur: {
		Icona: IconaCadenat,
		titol: __( 'La connexió és segura', 'noempesquen' ),
		text: __(
			'La informació que hi enviïs (com contrasenyes o números de targeta) viatja xifrada fins a aquest lloc.',
			'noempesquen'
		),
	},
	insegur: {
		Icona: IconaAvis,
		etiqueta: __( 'No segur', 'noempesquen' ),
		titol: __( 'La connexió amb aquest lloc no és segura', 'noempesquen' ),
		text: __(
			'No hi escriguis informació sensible, com contrasenyes o números de targeta: algú la podria veure pel camí.',
			'noempesquen'
		),
	},
	info: {
		Icona: IconaInfo,
		titol: __( "No s'ha pogut connectar amb aquest lloc", 'noempesquen' ),
		text: __( "El servidor d'aquesta adreça no respon.", 'noempesquen' ),
	},
} );

/* Domini i resta (camí, consulta) d'una URL, per pintar-los diferent. */
function parts( url, info ) {
	if ( info.tipus === 'nova' ) {
		return { domini: null, resta: '' };
	}
	if ( info.tipus === 'cerca' ) {
		return { domini: null, resta: info.text };
	}
	try {
		const u = new URL( url );
		const resta = u.pathname + u.search + u.hash;
		return { domini: u.hostname, resta: resta === '/' ? '' : resta };
	} catch {
		return { domini: null, resta: url };
	}
}

/* Text en enfocar la barra: URL sencera, text cercat o res (pestanya nova). */
function textComplet( url, info, domini, resta ) {
	if ( info.tipus === 'nova' ) {
		return '';
	}
	return domini ? url : resta;
}

function Seguretat( { tipus } ) {
	const [ obert, setObert ] = useState( false );
	const arrel = useRef( null );
	const id = useId();
	const s = textosSeguretat()[ tipus ];

	useEffect( () => {
		if ( ! obert ) {
			return undefined;
		}
		const fora = ( e ) => {
			if ( ! arrel.current?.contains( e.target ) ) {
				setObert( false );
			}
		};
		document.addEventListener( 'pointerdown', fora );
		return () => document.removeEventListener( 'pointerdown', fora );
	}, [ obert ] );

	return (
		<div
			ref={ arrel }
			className="nep-nav-adreca__seguretat"
			onBlur={ ( e ) => {
				if ( ! arrel.current.contains( e.relatedTarget ) ) {
					setObert( false );
				}
			} }
		>
			<button
				type="button"
				className={ `nep-nav-adreca__xip nep-nav-adreca__xip--${ tipus }` }
				aria-expanded={ obert }
				aria-controls={ id }
				aria-label={
					s.etiqueta
						? undefined
						: __( 'Mostra la informació del lloc', 'noempesquen' )
				}
				title={ __( 'Mostra la informació del lloc', 'noempesquen' ) }
				onClick={ () => setObert( ( o ) => ! o ) }
			>
				<s.Icona mida={ 16 } />
				{ s.etiqueta && <span>{ s.etiqueta }</span> }
			</button>
			<div
				id={ id }
				className="nep-nav-adreca__info"
				role="dialog"
				aria-label={ s.titol }
				hidden={ ! obert }
			>
				<p className="nep-nav-adreca__info-titol">
					<s.Icona mida={ 18 } />
					{ s.titol }
				</p>
				<p>{ s.text }</p>
			</div>
		</div>
	);
}

/**
 * Barra d'adreces: candau (o «No segur»), domini en negre i resta en gris;
 * en enfocar-la mostra la URL sencera seleccionada; Retorn hi navega.
 * Amb la lupa, el domini es pot inspeccionar.
 *
 * @param {Object}   props
 * @param {string}   props.url      URL de la pestanya activa.
 * @param {Object}   props.info     Info de la pàgina (vegeu infoPagina).
 * @param {Function} props.onNavega Navega a una URL normalitzada.
 * @param {Object}   props.refInput Ref del camp (per enfocar-lo des de fora).
 */
export function BarraAdreces( { url, info, onNavega, refInput } ) {
	const { estat } = useJoc();
	const [ editant, setEditant ] = useState( false );
	const [ text, setText ] = useState( '' );
	const propi = useRef( null );
	const input = refInput ?? propi;
	const { domini, resta } = parts( url, info );
	const complet = textComplet( url, info, domini, resta );

	useEffect( () => {
		if ( editant ) {
			input.current?.select();
		}
	}, [ editant ] );

	const envia = ( e ) => {
		e.preventDefault();
		const desti = normalitzaUrl( text );
		if ( desti ) {
			input.current.blur();
			onNavega( desti );
		}
	};

	const vista = (
		<>
			{ domini && (
				<Inspeccionable
					text={ domini }
					senyal={ info.web?.dades.domini_senyal }
				/>
			) }
			<span className="nep-nav-adreca__resta">{ resta }</span>
		</>
	);

	return (
		<div className="nep-nav-adreca">
			{ info.tipus === 'nova' || info.tipus === 'cerca' ? (
				<span className="nep-nav-adreca__lupa">
					<IconaCercaNav mida={ 16 } />
				</span>
			) : (
				info.seguretat && <Seguretat tipus={ info.seguretat } />
			) }
			{ estat.lupa ? (
				<div className="nep-nav-adreca__camp nep-nav-adreca__vista is-visible">
					{ vista }
				</div>
			) : (
				<form className="nep-nav-adreca__camp" onSubmit={ envia }>
					<input
						ref={ input }
						type="text"
						className={ `nep-nav-adreca__input${
							editant ? ' is-editant' : ''
						}` }
						value={ editant ? text : complet }
						onChange={ ( e ) => setText( e.target.value ) }
						onFocus={ () => {
							setText( complet );
							setEditant( true );
						} }
						onBlur={ () => setEditant( false ) }
						placeholder={ __(
							'Cerca o escriu una adreça web',
							'noempesquen'
						) }
						aria-label={ __( "Barra d'adreces", 'noempesquen' ) }
						autoComplete="off"
						spellCheck={ false }
					/>
					{ ! editant && (
						<div
							className="nep-nav-adreca__vista"
							aria-hidden="true"
						>
							{ vista }
						</div>
					) }
				</form>
			) }
		</div>
	);
}
