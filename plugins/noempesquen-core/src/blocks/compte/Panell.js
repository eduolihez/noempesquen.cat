import { useEffect, useRef, useState } from '@wordpress/element';
import { T } from './textos';
import { Camp } from './Camp';

/**
 * Panell del compte amb sessió iniciada.
 *
 * @param {Object}     props
 * @param {Object}     props.client       Client de l'API.
 * @param {Object}     props.progres      `{ idMissio: estrelles }`.
 * @param {string=}    props.urlSimulador URL del simulador.
 * @param {() => void} props.onSurt       En tancar la sessió o esborrar.
 * @param {() => void} props.onAvis       Missatge a la regió viva.
 * @param {Object}     props.refTitol     Ref del títol.
 */
export function Panell( {
	client,
	progres,
	urlSimulador,
	onSurt,
	onAvis,
	refTitol,
} ) {
	const [ error, setError ] = useState( '' );
	const [ obert, setObert ] = useState( false );
	const botoEsborra = useRef( null );
	const missions = Object.entries( progres || {} );

	const descarrega = async () => {
		setError( '' );
		const r = await client.exporta();
		if ( ! r.ok ) {
			setError( r.missatge );
			return;
		}
		const blob = new window.Blob( [ JSON.stringify( r.dades, null, 2 ) ], {
			type: 'application/json',
		} );
		const url = window.URL.createObjectURL( blob );
		const enllac = document.createElement( 'a' );
		enllac.href = url;
		enllac.download = 'noempesquen-les-meves-dades.json';
		document.body.appendChild( enllac );
		enllac.click();
		enllac.remove();
		window.setTimeout( () => window.URL.revokeObjectURL( url ), 1000 );
		onAvis( T.descarregat );
	};

	const tanca = async () => {
		setError( '' );
		const r = await client.surt();
		if ( r.ok ) {
			onSurt( T.tancada );
		} else {
			setError( r.missatge );
		}
	};

	return (
		<section
			className="nep-compte__panell"
			aria-labelledby="nep-compte-panell-titol"
		>
			<h2 id="nep-compte-panell-titol" ref={ refTitol } tabIndex={ -1 }>
				{ T.elTeuCompte }
			</h2>
			<h3>{ T.progres }</h3>
			{ missions.length === 0 ? (
				<p>{ T.senseProgres }</p>
			) : (
				<ul className="nep-compte__progres">
					{ missions.map( ( [ id, estrelles ] ) => (
						<li key={ id }>
							<span className="nep-compte__missio">{ id }</span>{ ' ' }
							<span>{ T.estrelles( Number( estrelles ) ) }</span>
						</li>
					) ) }
				</ul>
			) }
			{ urlSimulador && (
				<p>
					<a href={ urlSimulador }>{ T.anarSimulador }</a>
				</p>
			) }
			{ error && (
				<p className="nep-compte__error" role="alert">
					{ error }
				</p>
			) }
			<div className="nep-compte__accions">
				<button
					type="button"
					className="nep-compte__boto"
					onClick={ descarrega }
				>
					{ T.descarrega }
				</button>
				<button
					type="button"
					className="nep-compte__boto nep-compte__boto--secundari"
					onClick={ tanca }
				>
					{ T.tanca }
				</button>
				<button
					type="button"
					ref={ botoEsborra }
					className="nep-compte__boto nep-compte__boto--perill"
					aria-haspopup="dialog"
					onClick={ () => setObert( true ) }
				>
					{ T.esborra }
				</button>
			</div>
			{ obert && (
				<DialegEsborra
					client={ client }
					onTanca={ () => {
						setObert( false );
						botoEsborra.current?.focus();
					} }
					onEsborrat={ () => {
						setObert( false );
						onSurt( T.esborrat );
					} }
				/>
			) }
		</section>
	);
}

/**
 * Diàleg modal de confirmació amb contrasenya.
 *
 * @param {Object}     props
 * @param {Object}     props.client     Client.
 * @param {() => void} props.onTanca    En cancel·lar (també amb Esc).
 * @param {() => void} props.onEsborrat En esborrar el compte.
 */
function DialegEsborra( { client, onTanca, onEsborrat } ) {
	const dialeg = useRef( null );
	const camp = useRef( null );
	const [ contrasenya, setContrasenya ] = useState( '' );
	const [ error, setError ] = useState( '' );
	const [ enviant, setEnviant ] = useState( false );
	const refTanca = useRef( onTanca );
	refTanca.current = onTanca;

	useEffect( () => {
		const d = dialeg.current;
		if ( d && ! d.open && typeof d.showModal === 'function' ) {
			d.showModal();
		}
		camp.current?.focus();
		// Esc: el navegador llança `cancel`; es tanca pel mateix camí.
		const cancel = ( event ) => {
			event.preventDefault();
			d.close();
			refTanca.current();
		};
		d?.addEventListener( 'cancel', cancel );
		return () => d?.removeEventListener( 'cancel', cancel );
	}, [] );

	const envia = async ( event ) => {
		event.preventDefault();
		if ( ! contrasenya ) {
			setError( T.errContrasenyaBuida );
			camp.current?.focus();
			return;
		}
		setEnviant( true );
		let r;
		try {
			r = await client.esborra( contrasenya );
		} finally {
			setContrasenya( '' );
			setEnviant( false );
		}
		if ( r.ok ) {
			dialeg.current?.close();
			onEsborrat();
		} else {
			setError( r.missatge );
			camp.current?.focus();
		}
	};

	return (
		<dialog
			ref={ dialeg }
			className="nep-compte__dialeg"
			aria-labelledby="nep-esborra-titol"
			aria-describedby="nep-esborra-text"
		>
			<form noValidate onSubmit={ envia }>
				<h2 id="nep-esborra-titol">{ T.esborraTitol }</h2>
				<p id="nep-esborra-text">{ T.esborraText }</p>
				<Camp
					id="nep-esborra-contrasenya"
					etiqueta={ T.contrasenya }
					type="password"
					autoComplete="current-password"
					required
					value={ contrasenya }
					error={ error }
					inputRef={ camp }
					onChange={ ( e ) => setContrasenya( e.target.value ) }
				/>
				<div className="nep-compte__accions">
					<button
						type="submit"
						className="nep-compte__boto nep-compte__boto--perill"
						disabled={ enviant }
					>
						{ enviant ? T.enviant : T.esborraConfirma }
					</button>
					<button
						type="button"
						className="nep-compte__boto nep-compte__boto--secundari"
						onClick={ () => {
							// Primer es tanca el modal: mentre és obert, la resta és inert.
							dialeg.current?.close();
							onTanca();
						} }
					>
						{ T.cancella }
					</button>
				</div>
			</form>
		</dialog>
	);
}
