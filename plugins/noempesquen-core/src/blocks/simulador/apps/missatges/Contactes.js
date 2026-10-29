import { __ } from '@wordpress/i18n';
import { Inspeccionable } from '../../ui/Inspeccionable';
import { IconaBloqueja, IconaEnrere } from './icones';

function Capcalera( { titol, onTorna } ) {
	return (
		<header className="nep-missatges__cap">
			<button
				type="button"
				className="nep-missatges__boto"
				aria-label={ __( 'Enrere', 'noempesquen' ) }
				title={ __( 'Enrere', 'noempesquen' ) }
				onClick={ onTorna }
			>
				<IconaEnrere mida={ 22 } />
			</button>
			<h2 className="nep-missatges__titol" tabIndex={ -1 }>
				{ titol }
			</h2>
		</header>
	);
}

/**
 * Contactes i números coneguts, encara que la conversa s'hagi esborrat.
 *
 * @param {Object}   props
 * @param {Object[]} props.contactes  { id, nom } de contactesLocalitzables.
 * @param {Set}      props.bloquejats Ids bloquejats.
 * @param {Function} props.onTorna    Enrere.
 * @param {Function} props.onFitxa    ( id ) obre la fitxa.
 */
export function Contactes( { contactes, bloquejats, onTorna, onFitxa } ) {
	return (
		<div className="nep-missatges-contactes">
			<Capcalera
				titol={ __( 'Contactes', 'noempesquen' ) }
				onTorna={ onTorna }
			/>
			<ul className="nep-missatges-llista__fils">
				{ contactes.map( ( c ) => (
					<li key={ c.id }>
						<button
							type="button"
							className="nep-missatges-llista__fila"
							data-contacte={ c.id }
							onClick={ () => onFitxa( c.id ) }
						>
							<span
								className="nep-missatges__avatar"
								aria-hidden="true"
							>
								{ c.nom.replace( /^\+/, '' ).charAt( 0 ) }
							</span>
							<span className="nep-missatges-llista__text">
								<span className="nep-missatges-llista__nom">
									{ c.nom }
								</span>
							</span>
							{ bloquejats.has( c.id ) && (
								<span className="nep-missatges-llista__meta">
									<span className="nep-missatges-llista__etiqueta">
										{ __( 'Bloquejat', 'noempesquen' ) }
									</span>
								</span>
							) }
						</button>
					</li>
				) ) }
			</ul>
		</div>
	);
}

/**
 * Fitxa d'un contacte o número: bloquejar-lo i tornar a la conversa.
 *
 * @param {Object}   props
 * @param {Object}   props.contacte   { id, nom, senyal, rol }.
 * @param {boolean}  props.bloquejat  Ja està bloquejat.
 * @param {boolean}  props.ambFil     La conversa encara existeix.
 * @param {Function} props.onTorna    Enrere.
 * @param {Function} props.onBloqueja ( origen ) obre el full de bloqueig.
 * @param {Function} props.onConversa Obre la conversa.
 */
export function Fitxa( {
	contacte,
	bloquejat,
	ambFil,
	onTorna,
	onBloqueja,
	onConversa,
} ) {
	return (
		<div className="nep-missatges-fitxa">
			<Capcalera
				titol={ __( 'Fitxa del contacte', 'noempesquen' ) }
				onTorna={ onTorna }
			/>
			<div className="nep-missatges-fitxa__cos">
				<span
					className="nep-missatges__avatar is-gran"
					aria-hidden="true"
				>
					{ contacte.nom.replace( /^\+/, '' ).charAt( 0 ) }
				</span>
				<p className="nep-missatges-fitxa__nom">
					<Inspeccionable
						text={ contacte.nom }
						senyal={ contacte.senyal }
					/>
				</p>
				{ contacte.rol === 'desconegut' && (
					<p className="nep-missatges-fitxa__rol">
						{ __( 'No és a la teva agenda', 'noempesquen' ) }
					</p>
				) }
				<div className="nep-missatges-fitxa__accions">
					{ ambFil && (
						<button
							type="button"
							className="nep-missatges-accio"
							onClick={ onConversa }
						>
							{ __( 'Obre la conversa', 'noempesquen' ) }
						</button>
					) }
					{ bloquejat ? (
						<p className="nep-missatges-fitxa__estat" role="status">
							<IconaBloqueja mida={ 18 } />
							{ __( 'Número bloquejat', 'noempesquen' ) }
						</p>
					) : (
						<button
							type="button"
							className="nep-missatges-accio is-perill"
							onClick={ ( e ) => onBloqueja( e.currentTarget ) }
						>
							<IconaBloqueja mida={ 18 } />
							{ __( 'Bloqueja el número', 'noempesquen' ) }
						</button>
					) }
				</div>
			</div>
		</div>
	);
}
