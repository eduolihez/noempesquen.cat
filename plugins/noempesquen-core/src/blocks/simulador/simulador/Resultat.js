import { useEffect, useRef } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { PUNTS, puntuacio } from '../nucli/motor';
import { Estrella, IconaFalla, IconaFet, IconaSalvavides } from '../ui/icones';
import { useJoc } from './context';
import { desenllac } from './desenllac';
import { llegeixResum } from './estadistiques';

const MAX_ESTRELLES = 3;

function veredicte( final, estrelles ) {
	if ( ! final || final.caigut ) {
		return __(
			"Aquesta vegada t'han pescat. Mira què se t'ha escapat i torna-hi.",
			'noempesquen'
		);
	}
	if ( final.tipus === 'parcial' ) {
		return __(
			'No has picat, que és el més important. Encara pots afinar més.',
			'noempesquen'
		);
	}
	return estrelles === MAX_ESTRELLES
		? __( "Ni un ham se t'ha escapat. Així es fa.", 'noempesquen' )
		: __(
				'Bona decisió. Però hi havia més indicis per veure.',
				'noempesquen'
			);
}

/**
 * Frase del resum públic, sense culpabilitzar. Buida si no n'hi ha.
 *
 * @param {?{min: number, max: number, mateixa: boolean}} dades De `llegeixResum`.
 * @return {string} Frase.
 */
function fraseResum( dades ) {
	if ( ! dades ) {
		return '';
	}
	if ( dades.mateixa ) {
		return sprintf(
			/* translators: 1: percentatge mínim, 2: percentatge màxim */
			__(
				'Entre el %1$d %% i el %2$d %% de les persones van triar la mateixa opció que tu.',
				'noempesquen'
			),
			dades.min,
			dades.max
		);
	}
	return sprintf(
		/* translators: 1: percentatge mínim, 2: percentatge màxim */
		__(
			'Entre el %1$d %% i el %2$d %% de les persones van triar una altra opció.',
			'noempesquen'
		),
		dades.min,
		dades.max
	);
}

function Estrelles( { estrelles } ) {
	return (
		<div
			className="nep-res__estrelles"
			role="img"
			aria-label={ sprintf(
				/* translators: %d: nombre d'estrelles guanyades */
				__( '%d de 3 estrelles', 'noempesquen' ),
				estrelles
			) }
		>
			{ Array.from( { length: MAX_ESTRELLES }, ( _, i ) => (
				<span
					key={ i }
					className={ `nep-res__estrella${
						i < estrelles ? ' is-plena' : ''
					}` }
				>
					<Estrella plena={ i < estrelles } />
				</span>
			) ) }
		</div>
	);
}

function Indicis( { senyals, trobats } ) {
	const n = senyals.filter( ( s ) => trobats.includes( s.id ) ).length;
	return (
		<section className="nep-res__indicis" aria-labelledby="nep-res-ind">
			<h3 id="nep-res-ind" className="nep-res__apartat">
				{ __( 'Els indicis', 'noempesquen' ) }
			</h3>
			<p className="nep-res__compte">
				{ sprintf(
					/* translators: 1: indicis trobats, 2: indicis totals */
					__( "N'has trobat %1$d de %2$d.", 'noempesquen' ),
					n,
					senyals.length
				) }
			</p>
			<ul className="nep-res__llista">
				{ senyals.map( ( s ) => {
					const trobat = trobats.includes( s.id );
					return (
						<li
							key={ s.id }
							className={ `nep-res__indici ${
								trobat ? 'is-trobat' : 'is-perdut'
							}` }
						>
							<span className="nep-res__marca">
								{ trobat ? <IconaFet /> : <IconaFalla /> }
							</span>
							<div>
								<p className="nep-res__indici-titol">
									{ s.titol }
									<span className="nep-so-sr">
										{ ' ' }
										{ trobat
											? __( '(trobat)', 'noempesquen' )
											: __(
													'(no trobat)',
													'noempesquen'
												) }
									</span>
								</p>
								<p className="nep-res__indici-text">
									{ s.explicacio }
								</p>
							</div>
						</li>
					);
				} ) }
			</ul>
		</section>
	);
}

/**
 * Informe de la missió a pantalla completa. Surt de l'estètica del
 * sistema simulat a propòsit: és el moment d'aprendre.
 *
 * @param {Object}    props
 * @param {Function}  props.onReinicia Torna a començar la missió.
 * @param {?Function} props.onSeguent  Passa a la missió següent, si n'hi ha.
 * @param {Function}  props.onSurt     Torna al selector de missions.
 * @param {?Object}   props.resum      Resum públic de la missió (o null).
 */
export function Resultat( { onReinicia, onSeguent, onSurt, resum } ) {
	const { missio, estat, Avatar, nomGuia } = useJoc();
	const titol = useRef( null );
	const { punts, maxim, estrelles } = puntuacio( missio, estat );
	const final = desenllac( missio, estat );
	const caigut = ! final || final.caigut;

	useEffect( () => {
		titol.current?.focus();
	}, [] );

	return (
		<section
			className={ `nep-res${ caigut ? ' nep-res--caigut' : '' }` }
			aria-labelledby="nep-res-titol"
		>
			<header className="nep-res__mar">
				{ caigut && (
					<div
						className="nep-xarxa nep-res__xarxa"
						aria-hidden="true"
					/>
				) }
				<div className="nep-res__cap">
					<div className="nep-res__marcador">
						<h2
							id="nep-res-titol"
							ref={ titol }
							className="nep-res__titol"
							tabIndex={ -1 }
						>
							{ missio.titol }
						</h2>
						<Estrelles estrelles={ estrelles } />
						<p className="nep-res__punts">
							{ sprintf(
								/* translators: 1: punts, 2: punts màxims */
								__( '%1$d de %2$d punts', 'noempesquen' ),
								punts,
								maxim
							) }
						</p>
						{ estat.pistesDonades > 0 && (
							<p className="nep-res__pistes">
								{ sprintf(
									/* translators: 1: nombre de pistes, 2: punts descomptats */
									_n(
										'%1$d pista usada (−%2$d punts)',
										'%1$d pistes usades (−%2$d punts)',
										estat.pistesDonades,
										'noempesquen'
									),
									estat.pistesDonades,
									-estat.pistesDonades * PUNTS.pista
								) }
							</p>
						) }
						{ /* Sempre present (buit fins que arriba): una regió viva muntada amb el text sovint no s'anuncia. */ }
						<p
							className="nep-res__pistes nep-res__comparativa"
							aria-live="polite"
						>
							{ fraseResum( llegeixResum( resum, estat.opcio ) ) }
						</p>
					</div>
					<div className="nep-res__guia">
						<div className="nep-res__avatar">
							<Avatar
								estat={ final?.avatar ?? 'trista' }
								mida={ 120 }
							/>
						</div>
						<p className="nep-res__veredicte">
							<span className="nep-res__qui">{ nomGuia }</span>
							{ veredicte( final, estrelles ) }
						</p>
					</div>
				</div>
				<svg
					className="nep-res__ona"
					viewBox="0 0 1440 40"
					preserveAspectRatio="none"
					aria-hidden="true"
					focusable="false"
				>
					<path d="M0 22c120-14 240-14 360 0s240 14 360 0 240-14 360 0 240 14 360 0V40H0Z" />
				</svg>
			</header>

			<div className="nep-res__cos">
				<Indicis senyals={ missio.senyals } trobats={ estat.trobats } />
				<section
					className="nep-res__recorda"
					aria-labelledby="nep-res-rec"
				>
					<h3 id="nep-res-rec" className="nep-res__apartat">
						{ __( 'Recorda', 'noempesquen' ) }
					</h3>
					<ul className="nep-res__aprenentatges">
						{ missio.tancament.aprenentatges.map( ( a ) => (
							<li key={ a }>{ a }</li>
						) ) }
					</ul>
					<div className="nep-res__consell">
						<span className="nep-res__salvavides">
							<IconaSalvavides mida={ 28 } />
						</span>
						<p>{ missio.tancament.consell }</p>
					</div>
				</section>
			</div>

			<div className="nep-res__accions">
				<button
					type="button"
					className={ `nep-res__boto${
						onSeguent ? '' : ' nep-res__boto--principal'
					}` }
					onClick={ onReinicia }
				>
					{ __( 'Torna-ho a provar', 'noempesquen' ) }
				</button>
				{ onSeguent && (
					<button
						type="button"
						className="nep-res__boto nep-res__boto--principal"
						onClick={ onSeguent }
					>
						{ __( 'Següent missió', 'noempesquen' ) }
					</button>
				) }
				<button
					type="button"
					className="nep-res__boto nep-res__boto--text"
					onClick={ onSurt }
				>
					{ __( 'Totes les missions', 'noempesquen' ) }
				</button>
			</div>
		</section>
	);
}
