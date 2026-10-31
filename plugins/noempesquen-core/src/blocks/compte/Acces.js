import { useRef, useState } from '@wordpress/element';
import { T } from './textos';
import { Camp, Casella } from './Camp';

const CORREU = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PESTANYES = [ 'crea', 'entra' ];

/**
 * Llargada en caràcters (no en unitats UTF-16), com fa el servidor.
 *
 * @param {string} text Text.
 * @return {number} Caràcters.
 */
const llargada = ( text ) => Array.from( text ).length;

/**
 * Accés sense sessió: pestanyes «Crea un compte» i «Entra».
 *
 * @param {Object}     props
 * @param {Object}     props.client   Client de l'API.
 * @param {() => void} props.onEntra  Crida amb `(dades, missatge)` en entrar.
 * @param {Object}     props.refTitol Ref del títol.
 */
export function Acces( { client, onEntra, refTitol } ) {
	const [ activa, setActiva ] = useState( 'crea' );
	const refs = { crea: useRef( null ), entra: useRef( null ) };

	const teclat = ( event ) => {
		const i = PESTANYES.indexOf( activa );
		let nova = null;
		if ( event.key === 'ArrowRight' || event.key === 'ArrowLeft' ) {
			nova = PESTANYES[ ( i + 1 ) % PESTANYES.length ];
		} else if ( event.key === 'Home' ) {
			nova = PESTANYES[ 0 ];
		} else if ( event.key === 'End' ) {
			nova = PESTANYES[ PESTANYES.length - 1 ];
		}
		if ( nova ) {
			event.preventDefault();
			setActiva( nova );
			refs[ nova ].current?.focus();
		}
	};

	return (
		<section
			className="nep-compte__acces"
			aria-labelledby="nep-compte-titol"
		>
			<h2 id="nep-compte-titol" ref={ refTitol } tabIndex={ -1 }>
				{ T.pestanyes }
			</h2>
			{ /* eslint-disable-next-line jsx-a11y/interactive-supports-focus */ }
			<div
				role="tablist"
				aria-label={ T.pestanyes }
				className="nep-compte__pestanyes"
				onKeyDown={ teclat }
			>
				{ PESTANYES.map( ( p ) => (
					<button
						key={ p }
						type="button"
						role="tab"
						id={ `nep-compte-pestanya-${ p }` }
						aria-selected={ activa === p }
						aria-controls={ `nep-compte-panell-${ p }` }
						tabIndex={ activa === p ? 0 : -1 }
						ref={ refs[ p ] }
						onClick={ () => setActiva( p ) }
					>
						{ T[ p ] }
					</button>
				) ) }
			</div>
			<div
				role="tabpanel"
				id={ `nep-compte-panell-${ activa }` }
				aria-labelledby={ `nep-compte-pestanya-${ activa }` }
				className="nep-compte__panell-pestanya"
			>
				{ activa === 'crea' ? (
					<FormRegistre client={ client } onEntra={ onEntra } />
				) : (
					<FormEntra client={ client } onEntra={ onEntra } />
				) }
			</div>
		</section>
	);
}

/**
 * Error del servidor dins del formulari.
 *
 * @param {Object} props
 * @param {string} props.text Missatge.
 */
function ErrorServidor( { text } ) {
	return (
		<p
			className="nep-compte__error nep-compte__error--servidor"
			role="alert"
		>
			{ text }
		</p>
	);
}

/**
 * Formulari d'alta.
 *
 * @param {Object}     props
 * @param {Object}     props.client  Client.
 * @param {() => void} props.onEntra En crear el compte.
 */
function FormRegistre( { client, onEntra } ) {
	const [ email, setEmail ] = useState( '' );
	const [ contrasenya, setContrasenya ] = useState( '' );
	const [ majoria, setMajoria ] = useState( false );
	const [ acepta, setAcepta ] = useState( false );
	const [ errors, setErrors ] = useState( {} );
	const [ errorServidor, setErrorServidor ] = useState( '' );
	const [ enviant, setEnviant ] = useState( false );
	const refs = {
		email: useRef( null ),
		contrasenya: useRef( null ),
		majoria: useRef( null ),
		acepta: useRef( null ),
	};

	const envia = async ( event ) => {
		event.preventDefault();
		const nous = {};
		if ( ! CORREU.test( email.trim() ) ) {
			nous.email = T.errCorreu;
		}
		const n = llargada( contrasenya );
		if ( n < 10 || n > 128 ) {
			nous.contrasenya = T.errContrasenya;
		}
		if ( ! majoria ) {
			nous.majoria = T.errMajoriaEdat;
		}
		if ( ! acepta ) {
			nous.acepta = T.errAcepta;
		}
		setErrors( nous );
		setErrorServidor( '' );
		const primer = Object.keys( refs ).find( ( k ) => nous[ k ] );
		if ( primer ) {
			refs[ primer ].current?.focus();
			return;
		}
		setEnviant( true );
		try {
			const r = await client.registra( {
				email: email.trim(),
				contrasenya,
				acepta: true,
				majoria_edat: true,
			} );
			if ( r.ok ) {
				onEntra( r.dades, T.creat );
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
		<form className="nep-compte__form" noValidate onSubmit={ envia }>
			<h3>{ T.crea }</h3>
			<Camp
				id="nep-registre-email"
				etiqueta={ T.correu }
				type="email"
				autoComplete="email"
				required
				value={ email }
				error={ errors.email }
				inputRef={ refs.email }
				onChange={ ( e ) => setEmail( e.target.value ) }
			/>
			<Camp
				id="nep-registre-contrasenya"
				etiqueta={ T.contrasenya }
				type="password"
				autoComplete="new-password"
				required
				minLength={ 10 }
				maxLength={ 128 }
				ajuda={ T.ajudaContrasenya }
				value={ contrasenya }
				error={ errors.contrasenya }
				inputRef={ refs.contrasenya }
				onChange={ ( e ) => setContrasenya( e.target.value ) }
			/>
			<p className="nep-compte__important">{ T.avisContrasenya }</p>
			<Casella
				id="nep-registre-majoria"
				etiqueta={ T.majoriaEdat }
				required
				checked={ majoria }
				error={ errors.majoria }
				inputRef={ refs.majoria }
				onChange={ ( e ) => setMajoria( e.target.checked ) }
			/>
			<Casella
				id="nep-registre-acepta"
				etiqueta={ T.acepta }
				required
				checked={ acepta }
				error={ errors.acepta }
				inputRef={ refs.acepta }
				onChange={ ( e ) => setAcepta( e.target.checked ) }
			/>
			<details className="nep-compte__dades">
				<summary>{ T.quinesDades }</summary>
				<ul>
					{ T.dades.map( ( d ) => (
						<li key={ d }>{ d }</li>
					) ) }
				</ul>
			</details>
			{ errorServidor && <ErrorServidor text={ errorServidor } /> }
			<button
				type="submit"
				className="nep-compte__boto"
				disabled={ enviant }
			>
				{ enviant ? T.enviant : T.botoCrea }
			</button>
		</form>
	);
}

/**
 * Formulari d'entrada.
 *
 * @param {Object}     props
 * @param {Object}     props.client  Client.
 * @param {() => void} props.onEntra En entrar.
 */
function FormEntra( { client, onEntra } ) {
	const [ email, setEmail ] = useState( '' );
	const [ contrasenya, setContrasenya ] = useState( '' );
	const [ errors, setErrors ] = useState( {} );
	const [ errorServidor, setErrorServidor ] = useState( '' );
	const [ enviant, setEnviant ] = useState( false );
	const refs = { email: useRef( null ), contrasenya: useRef( null ) };

	const envia = async ( event ) => {
		event.preventDefault();
		const nous = {};
		if ( ! CORREU.test( email.trim() ) ) {
			nous.email = T.errCorreu;
		}
		if ( ! contrasenya ) {
			nous.contrasenya = T.errContrasenyaBuida;
		}
		setErrors( nous );
		setErrorServidor( '' );
		const primer = Object.keys( refs ).find( ( k ) => nous[ k ] );
		if ( primer ) {
			refs[ primer ].current?.focus();
			return;
		}
		setEnviant( true );
		try {
			const r = await client.entra( {
				email: email.trim(),
				contrasenya,
			} );
			if ( r.ok ) {
				onEntra( r.dades, T.dins );
			} else {
				setErrorServidor( r.missatge );
			}
		} finally {
			setContrasenya( '' );
			setEnviant( false );
		}
	};

	return (
		<form className="nep-compte__form" noValidate onSubmit={ envia }>
			<h3>{ T.entra }</h3>
			<Camp
				id="nep-entra-email"
				etiqueta={ T.correu }
				type="email"
				autoComplete="email"
				required
				value={ email }
				error={ errors.email }
				inputRef={ refs.email }
				onChange={ ( e ) => setEmail( e.target.value ) }
			/>
			<Camp
				id="nep-entra-contrasenya"
				etiqueta={ T.contrasenya }
				type="password"
				autoComplete="current-password"
				required
				value={ contrasenya }
				error={ errors.contrasenya }
				inputRef={ refs.contrasenya }
				onChange={ ( e ) => setContrasenya( e.target.value ) }
			/>
			{ errorServidor && <ErrorServidor text={ errorServidor } /> }
			<button
				type="submit"
				className="nep-compte__boto"
				disabled={ enviant }
			>
				{ enviant ? T.enviant : T.botoEntra }
			</button>
		</form>
	);
}
