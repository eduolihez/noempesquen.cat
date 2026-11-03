import { useEffect, useRef, useState } from '@wordpress/element';
import { T } from './textos';
import { Camp } from './Camp';

const CORREU = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Llargada en caràcters (no en unitats UTF-16), com fa el servidor.
 *
 * @param {string} text Text.
 * @return {number} Caràcters.
 */
const llargada = ( text ) => Array.from( text ).length;

/**
 * Demana l'enllaç de recuperació. La resposta és sempre la mateixa: no diu si
 * el correu existeix.
 *
 * @param {Object}     props
 * @param {Object}     props.client   Client de l'API.
 * @param {() => void} props.onTorna  Torna a l'entrada.
 * @param {Object}     props.refTitol Ref del títol.
 */
export function FormRecupera( { client, onTorna, refTitol } ) {
	const [ email, setEmail ] = useState( '' );
	const [ error, setError ] = useState( '' );
	const [ errorServidor, setErrorServidor ] = useState( '' );
	const [ enviat, setEnviat ] = useState( false );
	const [ enviant, setEnviant ] = useState( false );
	const camp = useRef( null );

	// En obrir la vista, el focus va al títol (lectors de pantalla i teclat).
	useEffect( () => {
		refTitol?.current?.focus();
	}, [ refTitol ] );

	const envia = async ( event ) => {
		event.preventDefault();
		setErrorServidor( '' );
		if ( ! CORREU.test( email.trim() ) ) {
			setError( T.errCorreu );
			camp.current?.focus();
			return;
		}
		setError( '' );
		setEnviant( true );
		try {
			const r = await client.recupera( email.trim() );
			if ( r.ok ) {
				setEnviat( true );
			} else {
				setErrorServidor( r.missatge );
			}
		} finally {
			setEnviant( false );
		}
	};

	return (
		<section
			className="nep-compte__acces"
			aria-labelledby="nep-recupera-titol"
		>
			<h2 id="nep-recupera-titol" ref={ refTitol } tabIndex={ -1 }>
				{ T.recuperaTitol }
			</h2>
			{ enviat ? (
				<p role="status" className="nep-compte__important">
					{ T.recuperaEnviat }
				</p>
			) : (
				<form
					className="nep-compte__form"
					noValidate
					onSubmit={ envia }
				>
					<p>{ T.recuperaText }</p>
					<Camp
						id="nep-recupera-email"
						etiqueta={ T.correu }
						type="email"
						autoComplete="email"
						required
						value={ email }
						error={ error }
						inputRef={ camp }
						onChange={ ( e ) => setEmail( e.target.value ) }
					/>
					{ errorServidor && (
						<p
							className="nep-compte__error nep-compte__error--servidor"
							role="alert"
						>
							{ errorServidor }
						</p>
					) }
					<button
						type="submit"
						className="nep-compte__boto"
						disabled={ enviant }
					>
						{ enviant ? T.enviant : T.recuperaBoto }
					</button>
				</form>
			) }
			<p>
				<button
					type="button"
					className="nep-compte__boto nep-compte__boto--secundari"
					onClick={ onTorna }
				>
					{ T.tornaEntra }
				</button>
			</p>
		</section>
	);
}

/**
 * Tria una contrasenya nova amb el token de l'enllaç (només a la memòria).
 *
 * @param {Object}                     props
 * @param {Object}                     props.client   Client de l'API.
 * @param {string}                     props.token    Token de l'enllaç.
 * @param {(missatge: string) => void} props.onFet    Contrasenya canviada.
 * @param {() => void}                 props.onDemana Demanar un enllaç nou.
 * @param {Object}                     props.refTitol Ref del títol.
 */
export function FormRestableix( { client, token, onFet, onDemana, refTitol } ) {
	const [ contrasenya, setContrasenya ] = useState( '' );
	const [ error, setError ] = useState( '' );
	const [ tokenMort, setTokenMort ] = useState( false );
	const [ errorServidor, setErrorServidor ] = useState( '' );
	const [ enviant, setEnviant ] = useState( false );
	const camp = useRef( null );

	// En obrir la vista, el focus va al títol (lectors de pantalla i teclat).
	useEffect( () => {
		refTitol?.current?.focus();
	}, [ refTitol ] );

	const envia = async ( event ) => {
		event.preventDefault();
		setErrorServidor( '' );
		const n = llargada( contrasenya );
		if ( n < 10 || n > 128 ) {
			setError( T.errContrasenya );
			camp.current?.focus();
			return;
		}
		setError( '' );
		setEnviant( true );
		try {
			const r = await client.restableix( { token, contrasenya } );
			if ( r.ok ) {
				onFet( T.restablert );
			} else if ( r.codi === 'nep_token_invalid' ) {
				setTokenMort( true );
			} else if ( r.codi === 'nep_contrasenya_invalida' ) {
				setError( r.missatge );
				camp.current?.focus();
			} else {
				setErrorServidor( r.missatge );
			}
		} finally {
			// La contrasenya no es queda a l'estat del component.
			setContrasenya( '' );
			setEnviant( false );
		}
	};

	return (
		<section
			className="nep-compte__acces"
			aria-labelledby="nep-restableix-titol"
		>
			<h2 id="nep-restableix-titol" ref={ refTitol } tabIndex={ -1 }>
				{ T.restableixTitol }
			</h2>
			{ tokenMort ? (
				<>
					<p role="alert" className="nep-compte__error">
						{ T.errToken }
					</p>
					<p>
						<button
							type="button"
							className="nep-compte__boto"
							onClick={ onDemana }
						>
							{ T.oblidat }
						</button>
					</p>
				</>
			) : (
				<form
					className="nep-compte__form"
					noValidate
					onSubmit={ envia }
				>
					<Camp
						id="nep-restableix-contrasenya"
						etiqueta={ T.contrasenyaNova }
						type="password"
						autoComplete="new-password"
						required
						minLength={ 10 }
						maxLength={ 128 }
						ajuda={ T.ajudaContrasenya }
						value={ contrasenya }
						error={ error }
						inputRef={ camp }
						onChange={ ( e ) => setContrasenya( e.target.value ) }
					/>
					{ errorServidor && (
						<p
							className="nep-compte__error nep-compte__error--servidor"
							role="alert"
						>
							{ errorServidor }
						</p>
					) }
					<button
						type="submit"
						className="nep-compte__boto"
						disabled={ enviant }
					>
						{ enviant ? T.enviant : T.restableixBoto }
					</button>
				</form>
			) }
		</section>
	);
}
