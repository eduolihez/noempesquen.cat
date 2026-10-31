import { useEffect, useRef, useState } from '@wordpress/element';
import { T } from './textos';
import { ORDRE, valida } from './valida';

const BUIT = {
	nom: '',
	correu: '',
	assumpte: '',
	missatge: '',
	privacitat: false,
	web: '',
};

/**
 * Nonce de REST demanat a admin-ajax (no s'incrusta a l'HTML per la memòria cau).
 *
 * @param {string} ajaxUrl URL d'admin-ajax.php.
 * @return {Promise<string|null>} Nonce o `null`.
 */
async function demanaNonce( ajaxUrl ) {
	try {
		const r = await window.fetch( `${ ajaxUrl }?action=rest-nonce`, {
			credentials: 'same-origin',
		} );
		if ( ! r.ok ) {
			return null;
		}
		const text = ( await r.text() ).trim();
		return text && text !== '0' && text !== '-1' ? text : null;
	} catch {
		return null;
	}
}

/**
 * Missatge d'error d'un camp, associat amb `aria-describedby`.
 *
 * @param {Object}  props
 * @param {string}  props.id    Id del camp.
 * @param {string=} props.error Missatge.
 */
function ErrorCamp( { id, error } ) {
	return error ? (
		<p id={ `${ id }-error` } className="nep-contacte__error">
			{ error }
		</p>
	) : null;
}

/**
 * Formulari de contacte.
 *
 * @param {Object} props
 * @param {Object} props.config `{ api, ajaxUrl, urlPrivacitat }`.
 */
export function Contacte( { config } ) {
	const api = config.api || '/wp-json/noempesquen/v1/';
	const ajaxUrl = config.ajaxUrl || '/wp-admin/admin-ajax.php';
	const [ valors, setValors ] = useState( BUIT );
	const [ errors, setErrors ] = useState( {} );
	const [ estat, setEstat ] = useState( 'repos' ); // repos | enviant | enviat
	const [ avis, setAvis ] = useState( '' );
	const refs = {
		nom: useRef( null ),
		correu: useRef( null ),
		assumpte: useRef( null ),
		missatge: useRef( null ),
		privacitat: useRef( null ),
	};
	const confirmacio = useRef( null );
	const focusPendent = useRef( null );

	// Mou el focus després de renderitzar (al primer camp erroni o a la confirmació).
	useEffect( () => {
		if ( focusPendent.current === 'camp' ) {
			const primer = ORDRE.find( ( c ) => errors[ c ] );
			refs[ primer ]?.current?.focus();
		} else if ( focusPendent.current === 'confirmacio' ) {
			confirmacio.current?.focus();
		}
		focusPendent.current = null;
	} );

	const canvia = ( camp ) => ( event ) => {
		const valor =
			camp === 'privacitat' ? event.target.checked : event.target.value;
		setValors( ( v ) => ( { ...v, [ camp ]: valor } ) );
	};

	const envia = async ( event ) => {
		event.preventDefault();
		if ( estat === 'enviant' ) {
			return;
		}
		setAvis( '' );
		const trobats = valida( valors );
		if ( Object.keys( trobats ).length ) {
			focusPendent.current = 'camp';
			setErrors( trobats );
			return;
		}
		setErrors( {} );
		setEstat( 'enviant' );
		try {
			const capcaleres = { 'Content-Type': 'application/json' };
			const nonce = await demanaNonce( ajaxUrl );
			if ( nonce ) {
				capcaleres[ 'X-WP-Nonce' ] = nonce;
			}
			const resposta = await window.fetch( `${ api }contacte`, {
				method: 'POST',
				credentials: 'same-origin',
				headers: capcaleres,
				body: JSON.stringify( {
					nom: valors.nom.trim(),
					correu: valors.correu.trim(),
					assumpte: valors.assumpte,
					missatge: valors.missatge.trim(),
					privacitat: valors.privacitat === true,
					web: valors.web,
				} ),
			} );
			let dades = {};
			try {
				dades = await resposta.json();
			} catch {
				dades = {};
			}
			if ( resposta.ok && dades.ok ) {
				setValors( BUIT );
				focusPendent.current = 'confirmacio';
				setEstat( 'enviat' );
				return;
			}
			if ( resposta.status === 422 && dades.errors ) {
				focusPendent.current = 'camp';
				setErrors( dades.errors );
			} else {
				setAvis( resposta.status === 429 ? T.limit : T.fallada );
			}
		} catch {
			setAvis( T.fallada );
		}
		setEstat( 'repos' );
	};

	if ( estat === 'enviat' ) {
		return (
			<div
				className="nep-contacte__confirmacio"
				ref={ confirmacio }
				tabIndex={ -1 }
				role="status"
			>
				<h2 className="nep-contacte__titol">{ T.confirmacioTitol }</h2>
				<p>{ T.confirmacio }</p>
			</div>
		);
	}

	const claus = ORDRE.filter( ( c ) => errors[ c ] );
	const enviant = estat === 'enviant';
	const descrit = ( id, ajuda ) =>
		[
			ajuda && `${ id }-ajuda`,
			errors[ id.replace( 'contacte-', '' ) ] && `${ id }-error`,
		]
			.filter( Boolean )
			.join( ' ' ) || undefined;
	const invalid = ( camp ) => ( errors[ camp ] ? 'true' : undefined );

	return (
		<form
			className="nep-contacte__form"
			onSubmit={ envia }
			noValidate
			aria-busy={ enviant ? 'true' : undefined }
		>
			<h2 className="nep-contacte__titol">{ T.titol }</h2>
			<p className="nep-contacte__intro">{ T.intro }</p>

			{ claus.length > 0 && (
				<div className="nep-contacte__resum">
					<p className="nep-contacte__resum-titol">
						{ T.resumTitol }
					</p>
					<ul>
						{ claus.map( ( c ) => (
							<li key={ c }>{ errors[ c ] }</li>
						) ) }
					</ul>
				</div>
			) }

			<div className="nep-contacte__camp">
				<label
					className="nep-contacte__etiqueta"
					htmlFor="contacte-nom"
				>
					{ T.nom }
				</label>
				<input
					id="contacte-nom"
					ref={ refs.nom }
					type="text"
					name="nom"
					autoComplete="name"
					required
					aria-required="true"
					aria-invalid={ invalid( 'nom' ) }
					aria-describedby={ descrit( 'contacte-nom' ) }
					value={ valors.nom }
					onChange={ canvia( 'nom' ) }
				/>
				<ErrorCamp id="contacte-nom" error={ errors.nom } />
			</div>

			<div className="nep-contacte__camp">
				<label
					className="nep-contacte__etiqueta"
					htmlFor="contacte-correu"
				>
					{ T.correu }
				</label>
				<p id="contacte-correu-ajuda" className="nep-contacte__ajuda">
					{ T.ajudaCorreu }
				</p>
				<input
					id="contacte-correu"
					ref={ refs.correu }
					type="email"
					name="correu"
					autoComplete="email"
					inputMode="email"
					required
					aria-required="true"
					aria-invalid={ invalid( 'correu' ) }
					aria-describedby={ descrit( 'contacte-correu', true ) }
					value={ valors.correu }
					onChange={ canvia( 'correu' ) }
				/>
				<ErrorCamp id="contacte-correu" error={ errors.correu } />
			</div>

			<div className="nep-contacte__camp">
				<label
					className="nep-contacte__etiqueta"
					htmlFor="contacte-assumpte"
				>
					{ T.assumpte }
				</label>
				<select
					id="contacte-assumpte"
					ref={ refs.assumpte }
					name="assumpte"
					required
					aria-required="true"
					aria-invalid={ invalid( 'assumpte' ) }
					aria-describedby={ descrit( 'contacte-assumpte' ) }
					value={ valors.assumpte }
					onChange={ canvia( 'assumpte' ) }
				>
					<option value="">{ T.triaAssumpte }</option>
					{ T.assumptes.map( ( a ) => (
						<option key={ a } value={ a }>
							{ a }
						</option>
					) ) }
				</select>
				<ErrorCamp id="contacte-assumpte" error={ errors.assumpte } />
			</div>

			<div className="nep-contacte__camp">
				<label
					className="nep-contacte__etiqueta"
					htmlFor="contacte-missatge"
				>
					{ T.missatge }
				</label>
				<p id="contacte-missatge-ajuda" className="nep-contacte__ajuda">
					{ T.ajudaMissatge }
				</p>
				<textarea
					id="contacte-missatge"
					ref={ refs.missatge }
					name="missatge"
					rows={ 6 }
					required
					aria-required="true"
					aria-invalid={ invalid( 'missatge' ) }
					aria-describedby={ descrit( 'contacte-missatge', true ) }
					value={ valors.missatge }
					onChange={ canvia( 'missatge' ) }
				/>
				<ErrorCamp id="contacte-missatge" error={ errors.missatge } />
			</div>

			<div className="nep-contacte__camp nep-contacte__camp--casella">
				<input
					id="contacte-privacitat"
					ref={ refs.privacitat }
					type="checkbox"
					name="privacitat"
					required
					aria-required="true"
					aria-invalid={ invalid( 'privacitat' ) }
					aria-describedby={ descrit( 'contacte-privacitat' ) }
					checked={ valors.privacitat }
					onChange={ canvia( 'privacitat' ) }
				/>
				<label
					className="nep-contacte__etiqueta"
					htmlFor="contacte-privacitat"
				>
					{ T.privacitatInici }
					<a
						href={
							config.urlPrivacitat ||
							'/sobre-el-projecte/#privacitat'
						}
					>
						{ T.privacitatEnllac }
					</a>
					{ T.privacitatFinal }
				</label>
				<ErrorCamp
					id="contacte-privacitat"
					error={ errors.privacitat }
				/>
			</div>

			{ /* Camp trampa: fora de pantalla i fora del teclat. Cap persona l'omple. */ }
			<div className="nep-contacte__web" aria-hidden="true">
				<input
					type="text"
					name="web"
					tabIndex={ -1 }
					autoComplete="off"
					value={ valors.web }
					onChange={ canvia( 'web' ) }
				/>
			</div>

			<div className="nep-contacte__estat" aria-live="polite">
				{ avis && (
					<p className="nep-contacte__error nep-contacte__error--enviament">
						{ avis }
					</p>
				) }
			</div>

			<button
				type="submit"
				className="nep-contacte__enviar"
				disabled={ enviant }
				aria-busy={ enviant ? 'true' : undefined }
			>
				{ enviant ? T.enviant : T.enviar }
			</button>
		</form>
	);
}
