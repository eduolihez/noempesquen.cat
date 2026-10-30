import { useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { useMobil } from '../../sistemes/mobil/context';
import { MarcaBancSolid } from '../../webs/banc-solid/Marca';
import {
	CAMPS_TRANSFERENCIA,
	IBAN_COMPTE,
	SALDO,
	dadesTransferencia,
	formataImport,
	mascaraIban,
	moviments,
	nomPilaJugador,
	validaTransferencia,
} from './compte.js';
import {
	IconaCorrecteApp,
	IconaEnrere,
	IconaMoviments,
	IconaTransferir,
} from './icones';

function Capcalera( { titol, onTorna } ) {
	return (
		<header className="nep-bsm__cap">
			<button
				type="button"
				className="nep-bsm__boto-icona"
				aria-label={ __( 'Enrere', 'noempesquen' ) }
				title={ __( 'Enrere', 'noempesquen' ) }
				onClick={ onTorna }
			>
				<IconaEnrere mida={ 22 } />
			</button>
			<h2 className="nep-bsm__titol" tabIndex={ -1 }>
				{ titol }
			</h2>
		</header>
	);
}

function Compte( { nomPila, onMoviments, onTransferencia } ) {
	return (
		<div className="nep-bsm-compte">
			<header className="nep-bsm__cap">
				<MarcaBancSolid />
			</header>
			<h2 className="nep-bsm__titol" tabIndex={ -1 }>
				{ sprintf(
					/* translators: %s: nom de pila */
					__( 'Hola, %s', 'noempesquen' ),
					nomPila
				) }
			</h2>
			<section
				className="nep-bsm-targeta"
				aria-labelledby="nep-bsm-compte-titol"
			>
				<h3 id="nep-bsm-compte-titol">
					{ __( 'Compte corrent', 'noempesquen' ) }
				</h3>
				<p className="nep-bsm-saldo">{ formataImport( SALDO ) }</p>
				<p className="nep-bsm-suau">
					{ __( 'Saldo disponible', 'noempesquen' ) }
				</p>
				<p className="nep-bsm-iban">{ mascaraIban( IBAN_COMPTE ) }</p>
			</section>
			<section
				className="nep-bsm-avisos"
				aria-labelledby="nep-bsm-avisos-titol"
			>
				<IconaCorrecteApp mida={ 24 } />
				<div>
					<h3 id="nep-bsm-avisos-titol">
						{ __( 'Avisos', 'noempesquen' ) }
					</h3>
					<p>
						{ __(
							'Cap avís pendent. El teu compte està actiu.',
							'noempesquen'
						) }
					</p>
				</div>
			</section>
			<div className="nep-bsm-accions">
				<button
					type="button"
					className="nep-bsm-accio"
					data-accio="moviments"
					onClick={ onMoviments }
				>
					<IconaMoviments mida={ 22 } />
					{ __( 'Moviments', 'noempesquen' ) }
				</button>
				<button
					type="button"
					className="nep-bsm-accio"
					data-accio="transferencia"
					onClick={ onTransferencia }
				>
					<IconaTransferir mida={ 22 } />
					{ __( 'Transferència', 'noempesquen' ) }
				</button>
			</div>
		</div>
	);
}

function Moviments( { onTorna } ) {
	return (
		<div className="nep-bsm-moviments">
			<Capcalera
				titol={ __( 'Moviments', 'noempesquen' ) }
				onTorna={ onTorna }
			/>
			<ul className="nep-bsm-llista">
				{ moviments().map( ( m ) => (
					<li key={ m.id } className="nep-bsm-fila">
						<span className="nep-bsm-fila__text">
							<span className="nep-bsm-fila__concepte">
								{ m.concepte }
							</span>
							<span className="nep-bsm-suau">{ m.data }</span>
						</span>
						<span
							className={ `nep-bsm-fila__import${
								m.import > 0 ? ' is-entrada' : ''
							}` }
						>
							{ formataImport( m.import, true ) }
						</span>
					</li>
				) ) }
			</ul>
		</div>
	);
}

const MISSATGES_ERROR = () => ( {
	buit: __( 'Omple aquest camp.', 'noempesquen' ),
	invalid: __( 'Revisa aquest camp.', 'noempesquen' ),
	saldo: __( 'No tens prou saldo.', 'noempesquen' ),
} );

function etiquetes() {
	return {
		beneficiari: __( 'Beneficiari', 'noempesquen' ),
		iban: __( 'IBAN del destinatari', 'noempesquen' ),
		import: __( 'Import (€)', 'noempesquen' ),
		concepte: __( 'Concepte', 'noempesquen' ),
	};
}

/**
 * Transferència: cada camp és un <input> no controlat. El que s'hi escriu no
 * entra a cap estat ni surt del camp; en enviar, els camps es buiden i el
 * motor només rep { url, formulari }.
 *
 * @param {Object}   props
 * @param {Function} props.onTorna Enrere.
 */
function Transferencia( { onTorna } ) {
	const { emet } = useJoc();
	const [ errors, setErrors ] = useState( {} );
	const [ enviada, setEnviada ] = useState( false );
	const refs = useRef( {} );
	const refConfirmacio = useRef( null );
	const textos = etiquetes();
	const missatges = MISSATGES_ERROR();

	const envia = ( e ) => {
		e.preventDefault();
		const valors = {};
		CAMPS_TRANSFERENCIA.forEach( ( id ) => {
			valors[ id ] = refs.current[ id ]?.value ?? '';
		} );
		const trobats = validaTransferencia( valors );
		const primer = CAMPS_TRANSFERENCIA.find( ( id ) => trobats[ id ] );
		if ( primer ) {
			setErrors( trobats );
			refs.current[ primer ]?.focus();
			return;
		}
		emet( 'pagament.fes', dadesTransferencia() );
		CAMPS_TRANSFERENCIA.forEach( ( id ) => {
			if ( refs.current[ id ] ) {
				refs.current[ id ].value = '';
			}
		} );
		setErrors( {} );
		setEnviada( true );
	};

	useEffect( () => {
		if ( enviada ) {
			refConfirmacio.current?.focus();
		}
	}, [ enviada ] );

	const netejaError = ( id ) =>
		setErrors( ( er ) => {
			if ( ! er[ id ] ) {
				return er;
			}
			const resta = { ...er };
			delete resta[ id ];
			return resta;
		} );

	if ( enviada ) {
		return (
			<div className="nep-bsm-transferencia">
				<Capcalera
					titol={ __( 'Transferència', 'noempesquen' ) }
					onTorna={ onTorna }
				/>
				<div className="nep-bsm-confirmacio" role="status">
					<IconaCorrecteApp mida={ 40 } />
					<p
						className="nep-bsm-confirmacio__titol"
						tabIndex={ -1 }
						ref={ refConfirmacio }
					>
						{ __( 'Transferència enviada', 'noempesquen' ) }
					</p>
					<button
						type="button"
						className="nep-bsm-boto"
						onClick={ onTorna }
					>
						{ __( 'Torna al compte', 'noempesquen' ) }
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="nep-bsm-transferencia">
			<Capcalera
				titol={ __( 'Transferència', 'noempesquen' ) }
				onTorna={ onTorna }
			/>
			<form className="nep-bsm-form" noValidate onSubmit={ envia }>
				{ CAMPS_TRANSFERENCIA.map( ( id ) => (
					<div key={ id } className="nep-bsm-camp">
						<label htmlFor={ `nep-bsm-${ id }` }>
							{ textos[ id ] }
						</label>
						<input
							id={ `nep-bsm-${ id }` }
							ref={ ( el ) => {
								refs.current[ id ] = el;
							} }
							type="text"
							name={ id }
							autoComplete="off"
							autoCorrect="off"
							spellCheck="false"
							inputMode={
								id === 'import' ? 'decimal' : undefined
							}
							aria-invalid={ errors[ id ] ? 'true' : undefined }
							aria-describedby={
								errors[ id ]
									? `nep-bsm-${ id }-error`
									: undefined
							}
							onInput={ () => netejaError( id ) }
						/>
						{ errors[ id ] && (
							<p
								id={ `nep-bsm-${ id }-error` }
								className="nep-bsm-error"
							>
								{ missatges[ errors[ id ] ] }
							</p>
						) }
					</div>
				) ) }
				<button type="submit" className="nep-bsm-boto">
					{ __( 'Envia la transferència', 'noempesquen' ) }
				</button>
			</form>
		</div>
	);
}

/**
 * App Banc Sòlid del mòbil: compte, moviments i transferència. Les dades són
 * de farciment; l'únic esdeveniment propi és `pagament.fes` amb
 * { url, formulari } (mai el contingut). Obrir l'app ja emet `app.obre`.
 */
export default function BancSolid() {
	const { mon } = useJoc();
	const { registraEnrere } = useMobil();
	const [ vistes, setVistes ] = useState( [ 'compte' ] );
	const arrel = useRef( null );
	const tornaA = useRef( null );
	const profunditat = useRef( 1 );
	profunditat.current = vistes.length;
	const vista = vistes[ vistes.length - 1 ];

	const empeny = ( v ) => setVistes( ( vs ) => [ ...vs, v ] );
	const torna = () => {
		setVistes( ( vs ) => {
			tornaA.current = `[data-accio="${ vs[ vs.length - 1 ] }"]`;
			return vs.length > 1 ? vs.slice( 0, -1 ) : vs;
		} );
	};
	const tornaRef = useRef( torna );
	tornaRef.current = torna;

	// En canviar de vista, el focus va al botó d'on es venia o al títol.
	useEffect( () => {
		const el = arrel.current;
		const selector = tornaA.current;
		tornaA.current = null;
		(
			( selector && el?.querySelector( selector ) ) ??
			el?.querySelector( '.nep-bsm__titol' )
		)?.focus();
	}, [ vistes ] );

	useEffect(
		() =>
			registraEnrere( () => {
				if ( profunditat.current > 1 ) {
					tornaRef.current();
					return true;
				}
				return false;
			} ),
		[ registraEnrere ]
	);

	let pantalla;
	if ( vista === 'moviments' ) {
		pantalla = <Moviments onTorna={ torna } />;
	} else if ( vista === 'transferencia' ) {
		pantalla = <Transferencia onTorna={ torna } />;
	} else {
		pantalla = (
			<Compte
				nomPila={ nomPilaJugador( mon ) }
				onMoviments={ () => empeny( 'moviments' ) }
				onTransferencia={ () => empeny( 'transferencia' ) }
			/>
		);
	}

	return (
		<div className="nep-bsm" ref={ arrel }>
			{ pantalla }
		</div>
	);
}
