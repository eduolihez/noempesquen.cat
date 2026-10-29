import { __ } from '@wordpress/i18n';
import { APPS_MOBIL } from '../../apps/registre';
import { DATA_LLARGA } from '../pc/calendari';

/* Apps del dock, en ordre; les que encara no existeixen no surten (T4: missatges). */
const DOCK = [ 'missatges', 'navegador' ];

function BotoApp( { id, onObre } ) {
	const { nom, Icona } = APPS_MOBIL[ id ];
	return (
		<li>
			<button
				type="button"
				className="nep-so-m-app"
				onClick={ () => onObre( id ) }
			>
				<span className="nep-so-m-app__icona" aria-hidden="true">
					<Icona mida={ 52 } />
				</span>
				<span className="nep-so-m-app__nom">{ nom }</span>
			</button>
		</li>
	);
}

/**
 * Pantalla d'inici: data i hora, quadrícula d'apps i dock.
 *
 * @param {Object}   props
 * @param {string}   props.hora   Hora del joc.
 * @param {Function} props.onObre Obre una app pel seu id.
 */
export function Inici( { hora, onObre } ) {
	const ids = Object.keys( APPS_MOBIL );
	const dock = DOCK.filter( ( id ) => APPS_MOBIL[ id ] );
	const quadricula = ids.filter( ( id ) => ! dock.includes( id ) );

	return (
		<div className="nep-so-m-inici">
			<div className="nep-so-m-inici__giny" aria-hidden="true">
				<span className="nep-so-m-inici__hora">{ hora }</span>
				<span className="nep-so-m-inici__data">{ DATA_LLARGA }</span>
			</div>
			<ul
				className="nep-so-m-inici__quadricula"
				aria-label={ __( 'Apps', 'noempesquen' ) }
			>
				{ quadricula.map( ( id ) => (
					<BotoApp key={ id } id={ id } onObre={ onObre } />
				) ) }
			</ul>
			<ul
				className="nep-so-m-inici__dock"
				aria-label={ __( 'Apps preferides', 'noempesquen' ) }
			>
				{ dock.map( ( id ) => (
					<BotoApp key={ id } id={ id } onObre={ onObre } />
				) ) }
			</ul>
		</div>
	);
}
