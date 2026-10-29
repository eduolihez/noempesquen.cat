import { useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { PERSONATGES } from '../ui/avatars';
import { FASE, opcioTriada, puntuacio } from './motor';

function useFocusInicial() {
	const ref = useRef();
	useEffect( () => {
		ref.current?.focus();
	}, [] );
	return ref;
}

export function estatPersonatge( estat, missio ) {
	if ( estat.fase === FASE.CONSEQUENCIA ) {
		const opcio = opcioTriada( missio, estat );
		if ( estat.haPicat || opcio?.valor === 'incorrecta' ) {
			return 'trista';
		}
		return 'contenta';
	}
	if ( estat.ultimaRevelada ) {
		return 'alerta';
	}
	return 'normal';
}

export function Bombolla( { missio, estat, dispatch } ) {
	const { nom, Avatar } =
		PERSONATGES[ missio.personatge ] ?? PERSONATGES.llissa;
	const enIntro = estat.fase === FASE.INTRO;
	const ultim = estat.pasIntro === missio.intro.length - 1;

	return (
		<aside
			className={ `nep-bombolla nep-bombolla--${ missio.personatge }` }
			aria-label={ nom }
		>
			<div className="nep-bombolla__avatar">
				<Avatar estat={ estatPersonatge( estat, missio ) } />
			</div>
			<div className="nep-bombolla__text">
				<p aria-live="polite">{ estat.bombolla }</p>
				{ enIntro && (
					<div className="nep-bombolla__botons">
						<button
							type="button"
							className="nep-boto nep-boto--principal"
							onClick={ () =>
								dispatch( { tipus: 'SEGUENT_INTRO' } )
							}
						>
							{ ultim
								? __( 'Som-hi!', 'noempesquen' )
								: __( 'Següent', 'noempesquen' ) }
						</button>
						{ ! ultim && (
							<button
								type="button"
								className="nep-boto nep-boto--link"
								onClick={ () =>
									dispatch( { tipus: 'SALTA_INTRO' } )
								}
							>
								{ __( 'Salta la presentació', 'noempesquen' ) }
							</button>
						) }
					</div>
				) }
			</div>
		</aside>
	);
}

export function Decisio( { missio, dispatch } ) {
	const ref = useFocusInicial();
	return (
		<div
			className="nep-capa"
			role="dialog"
			aria-modal="true"
			aria-labelledby="nep-decisio-titol"
		>
			<div className="nep-capa__caixa">
				<h3 id="nep-decisio-titol" tabIndex={ -1 } ref={ ref }>
					{ missio.decisio.pregunta }
				</h3>
				<ul className="nep-opcions">
					{ missio.decisio.opcions.map( ( o ) => (
						<li key={ o.id }>
							<button
								type="button"
								className="nep-opcio"
								onClick={ () =>
									dispatch( { tipus: 'TRIA', id: o.id } )
								}
							>
								{ o.text }
							</button>
						</li>
					) ) }
				</ul>
				<button
					type="button"
					className="nep-boto nep-boto--link"
					onClick={ () => dispatch( { tipus: 'TORNA_A_EXPLORAR' } ) }
				>
					{ __( 'Torna a mirar els missatges', 'noempesquen' ) }
				</button>
			</div>
		</div>
	);
}

export function Consequencia( { missio, estat, dispatch } ) {
	const ref = useFocusInicial();
	const opcio = opcioTriada( missio, estat );
	const pescat = estat.haPicat || opcio?.valor === 'incorrecta';
	let titol = __( 'Molt bé!', 'noempesquen' );
	if ( pescat ) {
		titol = __( "T'han pescat!", 'noempesquen' );
	} else if ( opcio?.valor === 'parcial' ) {
		titol = __( 'Gairebé!', 'noempesquen' );
	}

	return (
		<div
			className={ `nep-capa${ pescat ? ' nep-capa--xarxa' : '' }` }
			role="dialog"
			aria-modal="true"
			aria-labelledby="nep-cons-titol"
		>
			{ pescat && <div className="nep-xarxa" aria-hidden="true" /> }
			<div className="nep-capa__caixa">
				<h3 id="nep-cons-titol" tabIndex={ -1 } ref={ ref }>
					{ titol }
				</h3>
				<p>
					{ estat.haPicat ? missio.frases.esquer : opcio?.resposta }
				</p>
				<button
					type="button"
					className="nep-boto nep-boto--principal"
					onClick={ () => dispatch( { tipus: 'VEURE_RESULTAT' } ) }
				>
					{ __( 'Veure el resultat', 'noempesquen' ) }
				</button>
			</div>
		</div>
	);
}

export function Resultat( { missio, estat, dispatch, onTorna, seguent } ) {
	const ref = useFocusInicial();
	const { punts, maxim, estrelles } = puntuacio( missio, estat );

	return (
		<section className="nep-resultat" aria-labelledby="nep-res-titol">
			<h3 id="nep-res-titol" tabIndex={ -1 } ref={ ref }>
				{ missio.titol }
			</h3>
			<p
				className="nep-resultat__estrelles"
				aria-label={ sprintf(
					/* translators: %d: estrelles */
					__( '%d de 3 estrelles', 'noempesquen' ),
					estrelles
				) }
			>
				{ '★'.repeat( estrelles ) }
				<span className="nep-resultat__buides">
					{ '★'.repeat( 3 - estrelles ) }
				</span>
			</p>
			<p className="nep-resultat__punts">
				{ sprintf(
					/* translators: 1: punts, 2: màxim */
					__( '%1$d de %2$d punts', 'noempesquen' ),
					punts,
					maxim
				) }
			</p>

			<h4>{ __( 'Els indicis', 'noempesquen' ) }</h4>
			<ul className="nep-indicis">
				{ missio.senyals.map( ( s ) => {
					const trobat = estat.trobats.includes( s.id );
					return (
						<li
							key={ s.id }
							className={ trobat ? 'is-trobat' : 'is-perdut' }
						>
							<strong>
								<span aria-hidden="true">
									{ trobat ? '✔' : '✖' }
								</span>{ ' ' }
								{ s.titol }
								<span className="screen-reader-text">
									{ ' ' }
									{ trobat
										? __( '(trobat)', 'noempesquen' )
										: __( '(no trobat)', 'noempesquen' ) }
								</span>
							</strong>
							<span>{ s.explicacio }</span>
						</li>
					);
				} ) }
			</ul>

			<h4>{ __( 'Recorda', 'noempesquen' ) }</h4>
			<ul className="nep-aprenentatges">
				{ missio.tancament.aprenentatges.map( ( a, i ) => (
					<li key={ i }>{ a }</li>
				) ) }
			</ul>
			<p className="nep-consell">{ missio.tancament.consell }</p>

			<div className="nep-resultat__botons">
				<button
					type="button"
					className="nep-boto"
					onClick={ () => dispatch( { tipus: 'REINICIA' } ) }
				>
					{ __( 'Torna-ho a provar', 'noempesquen' ) }
				</button>
				{ seguent && (
					<button
						type="button"
						className="nep-boto nep-boto--principal"
						onClick={ seguent }
					>
						{ __( 'Següent missió', 'noempesquen' ) }
					</button>
				) }
				<button
					type="button"
					className="nep-boto nep-boto--link"
					onClick={ onTorna }
				>
					{ __( 'Totes les missions', 'noempesquen' ) }
				</button>
			</div>
		</section>
	);
}
