import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Seguiment d'enviaments de la web oficial. El número que s'escriu viu
 * només a l'<input> (no controlat): no entra a cap estat ni surt del camp.
 * Qualsevol número dona el missatge de la missió («no hi ha cap paquet»).
 *
 * @param {Object} props
 * @param {Object} props.dades Dades de la web (missatge).
 */
export function Oficial( { dades } ) {
	const [ consultat, setConsultat ] = useState( false );
	const missatge =
		dades?.missatge ??
		__( 'No hi ha cap paquet amb aquest número', 'noempesquen' );

	return (
		<section className="nep-ev-seguiment">
			<h1>{ __( 'Segueix el teu enviament', 'noempesquen' ) }</h1>
			<p className="nep-ev-seguiment__intro">
				{ __(
					"Escriu el número de seguiment que t'hem donat en lliurar el paquet.",
					'noempesquen'
				) }
			</p>
			<form
				className="nep-ev-seguiment__form"
				noValidate
				onSubmit={ ( e ) => {
					e.preventDefault();
					setConsultat( true );
				} }
			>
				<label htmlFor="nep-ev-num">
					{ __( 'Número de seguiment', 'noempesquen' ) }
				</label>
				<div className="nep-ev-seguiment__fila">
					<input
						id="nep-ev-num"
						type="text"
						autoComplete="off"
						spellCheck={ false }
					/>
					<button type="submit" className="nep-ev-boto">
						{ __( 'Cerca', 'noempesquen' ) }
					</button>
				</div>
			</form>
			{ consultat && (
				<p className="nep-ev-seguiment__resultat" role="status">
					{ missatge }
				</p>
			) }
		</section>
	);
}
