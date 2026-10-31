/**
 * Camp de formulari amb etiqueta visible i error associat.
 *
 * @param {Object}  props
 * @param {string}  props.id       Id de l'input.
 * @param {string}  props.etiqueta Etiqueta visible.
 * @param {string=} props.error    Missatge d'error.
 * @param {string=} props.ajuda    Text d'ajuda.
 * @param {Object}  props.inputRef Ref de l'input (per moure-hi el focus).
 */
export function Camp( { id, etiqueta, error, ajuda, inputRef, ...resta } ) {
	const descrit = [ ajuda && `${ id }-ajuda`, error && `${ id }-error` ]
		.filter( Boolean )
		.join( ' ' );
	return (
		<div className="nep-compte__camp">
			<label htmlFor={ id }>{ etiqueta }</label>
			{ ajuda && (
				<p id={ `${ id }-ajuda` } className="nep-compte__ajuda">
					{ ajuda }
				</p>
			) }
			<input
				id={ id }
				ref={ inputRef }
				aria-invalid={ error ? 'true' : undefined }
				aria-describedby={ descrit || undefined }
				{ ...resta }
			/>
			{ error && (
				<p id={ `${ id }-error` } className="nep-compte__error">
					{ error }
				</p>
			) }
		</div>
	);
}

/**
 * Casella obligatòria amb etiqueta i error associat.
 *
 * @param {Object}  props
 * @param {string}  props.id       Id.
 * @param {string}  props.etiqueta Etiqueta visible.
 * @param {string=} props.error    Missatge d'error.
 * @param {Object}  props.inputRef Ref.
 */
export function Casella( { id, etiqueta, error, inputRef, ...resta } ) {
	return (
		<div className="nep-compte__casella">
			<input
				type="checkbox"
				id={ id }
				ref={ inputRef }
				aria-invalid={ error ? 'true' : undefined }
				aria-describedby={ error ? `${ id }-error` : undefined }
				{ ...resta }
			/>
			<label htmlFor={ id }>{ etiqueta }</label>
			{ error && (
				<p id={ `${ id }-error` } className="nep-compte__error">
					{ error }
				</p>
			) }
		</div>
	);
}
