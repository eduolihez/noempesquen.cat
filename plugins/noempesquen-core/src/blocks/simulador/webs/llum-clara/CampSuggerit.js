import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';

/* Que ni el navegador real ni els gestors de contrasenyes hi ofereixin res. */
const SENSE_AUTOOMPLE = {
	autoComplete: 'off',
	autoCorrect: 'off',
	autoCapitalize: 'off',
	spellCheck: false,
	'data-lpignore': 'true',
	'data-1p-ignore': 'true',
	'data-bwignore': 'true',
	'data-form-type': 'other',
};

/**
 * Camp de formulari no controlat amb el suggeriment d'emplenament
 * automàtic del navegador simulat sota el camp enfocat. El valor viu només
 * a l'<input> (el DOM): no passa per cap estat de React ni del motor.
 *
 * @param {Object}    props
 * @param {string}    props.id          Id de l'input.
 * @param {Object}    props.etiqueta    Contingut de l'etiqueta (text o element).
 * @param {Object}    props.refInput    Ref de l'input.
 * @param {?Object}   props.suggeriment { titol, detall } o null.
 * @param {Function}  props.onTria      Tria el suggeriment.
 * @param {?string}   props.error       Missatge d'error.
 * @param {boolean}   props.amaga       Mostra punts en lloc del text.
 * @param {string}    props.inputMode   Teclat virtual.
 * @param {string}    props.classe      Classe extra del contenidor.
 * @param {?Function} props.onEscriu    L'usuari hi escriu (sense el valor).
 */
export function CampSuggerit( {
	id,
	etiqueta,
	refInput,
	suggeriment,
	onTria,
	error,
	amaga = false,
	inputMode,
	classe = '',
	onEscriu,
} ) {
	const { registraMenu } = useJoc();
	const [ obert, setObert ] = useState( false );
	const arrel = useRef( null );
	const opcio = useRef( null );
	const baixa = useRef( false );
	const idSug = `${ id }-suggeriment`;
	const idError = `${ id }-error`;

	useEffect( () => {
		if ( ! obert ) {
			return undefined;
		}
		if ( baixa.current ) {
			baixa.current = false;
			opcio.current?.focus();
		}
		return registraMenu( () => {
			setObert( false );
			refInput.current?.focus();
		} );
	}, [ obert, registraMenu, refInput ] );

	const tria = () => {
		setObert( false );
		onTria();
	};

	return (
		<div
			ref={ arrel }
			className={ `nep-lc-camp ${ classe }` }
			onBlur={ ( e ) => {
				if ( ! arrel.current?.contains( e.relatedTarget ) ) {
					setObert( false );
				}
			} }
		>
			<label htmlFor={ id } className="nep-lc-camp__etiqueta">
				{ etiqueta }
			</label>
			<input
				id={ id }
				ref={ refInput }
				type="text"
				className={ `nep-lc-camp__input${ amaga ? ' is-amagat' : '' }` }
				inputMode={ inputMode }
				aria-invalid={ error ? true : undefined }
				aria-describedby={ error ? idError : undefined }
				aria-controls={ obert && suggeriment ? idSug : undefined }
				onFocus={ () => setObert( true ) }
				onMouseDown={ () => setObert( true ) }
				onInput={ () => {
					setObert( false );
					onEscriu?.();
				} }
				onKeyDown={ ( e ) => {
					if ( e.key === 'ArrowDown' && suggeriment ) {
						e.preventDefault();
						if ( opcio.current ) {
							opcio.current.focus();
						} else {
							baixa.current = true;
							setObert( true );
						}
					}
				} }
				{ ...SENSE_AUTOOMPLE }
			/>
			{ obert && suggeriment && (
				<div id={ idSug } className="nep-lc-suggeriment">
					<button
						ref={ opcio }
						type="button"
						className="nep-lc-suggeriment__opcio"
						onMouseDown={ ( e ) => e.preventDefault() }
						onClick={ tria }
					>
						<span className="nep-lc-suggeriment__titol">
							{ suggeriment.titol }
						</span>
						<span className="nep-lc-suggeriment__detall">
							{ suggeriment.detall }
						</span>
					</button>
					<span className="nep-lc-suggeriment__peu">
						{ __(
							'Dades desades en aquest navegador',
							'noempesquen'
						) }
					</span>
				</div>
			) }
			{ error && (
				<p id={ idError } className="nep-lc-camp__error">
					{ error }
				</p>
			) }
		</div>
	);
}
