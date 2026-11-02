import { __ } from '@wordpress/i18n';
import { parteixHora } from '../parla/xats.js';
import { textPla } from './fils.js';
import { IconaContactes } from './icones';

/**
 * Llista de converses. El nom va en text pla: dins del botó de la fila no
 * hi pot haver els botons de la lupa (s'inspecciona dins de la conversa).
 *
 * @param {Object}   props
 * @param {Object[]} props.fils        Fils visibles i no esborrats.
 * @param {Set}      props.bloquejats  Ids de contactes bloquejats.
 * @param {Function} props.onObre      ( fil ) obre la conversa.
 * @param {Function} props.onContactes ( origen ) obre la llista de contactes.
 */
export function LlistaFils( { fils, bloquejats, onObre, onContactes } ) {
	return (
		<div className="nep-missatges-llista">
			<header className="nep-missatges__cap">
				<h2 className="nep-missatges__titol" tabIndex={ -1 }>
					{ __( 'Missatges', 'noempesquen' ) }
				</h2>
				<button
					type="button"
					className="nep-missatges__boto"
					aria-label={ __( 'Contactes', 'noempesquen' ) }
					title={ __( 'Contactes', 'noempesquen' ) }
					onClick={ ( e ) => onContactes( e.currentTarget ) }
				>
					<IconaContactes mida={ 22 } />
				</button>
			</header>
			{ fils.length === 0 ? (
				<p className="nep-missatges__buit">
					{ __( 'No tens cap conversa.', 'noempesquen' ) }
				</p>
			) : (
				<ul
					className="nep-missatges-llista__fils"
					data-tut="llista-sms"
				>
					{ fils.map( ( f ) => {
						const darrer = f.missatges[ f.missatges.length - 1 ];
						const { dia, hora } = parteixHora( darrer.hora );
						return (
							<li key={ f.id }>
								<button
									type="button"
									className="nep-missatges-llista__fila"
									data-fil={ f.id }
									onClick={ () => onObre( f ) }
								>
									<span
										className="nep-missatges__avatar"
										aria-hidden="true"
									>
										{ f.nom
											.replace( /^\+/, '' )
											.charAt( 0 ) }
									</span>
									<span className="nep-missatges-llista__text">
										<span className="nep-missatges-llista__nom">
											{ f.nom }
										</span>
										<span className="nep-missatges-llista__previa">
											{ darrer.de === 'jo' &&
												`${ __( 'Tu:', 'noempesquen' ) } ` }
											{ textPla( darrer ) }
										</span>
									</span>
									<span className="nep-missatges-llista__meta">
										<span>{ dia || hora }</span>
										{ bloquejats.has( f.contacte ) && (
											<span className="nep-missatges-llista__etiqueta">
												{ __(
													'Bloquejat',
													'noempesquen'
												) }
											</span>
										) }
									</span>
								</button>
							</li>
						);
					} ) }
				</ul>
			) }
		</div>
	);
}
