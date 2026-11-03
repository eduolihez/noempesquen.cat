import { useState } from '@wordpress/element';
import { minuscules } from '../../nucli/idioma.js';
import { nomJugador } from '../../nucli/jugador.js';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { APPS } from '../../apps/registre';
import { IconaApaga, IconaCerca } from '../../ui/icones';
import { usePanell } from './usePanell';

/**
 * Menú d'inici: cerca d'apps, apps fixades, usuari i botó d'apagar.
 *
 * @param {Object}   props
 * @param {Function} props.onObre  Obre una app.
 * @param {Function} props.onApaga Apaga (obre la pausa).
 * @param {Function} props.onTanca Tanca el menú.
 * @param {Object}   props.origen  Ref del botó d'inici.
 */
export function MenuInici( { onObre, onApaga, onTanca, origen } ) {
	const { mon } = useJoc();
	const { panell, onBlur } = usePanell( onTanca, origen );
	const [ cerca, setCerca ] = useState( '' );
	const nom = nomJugador( mon );

	const filtre = minuscules( cerca.trim() );
	const apps = Object.entries( APPS ).filter( ( [ , app ] ) =>
		minuscules( app.nom ).includes( filtre )
	);

	const onKeyDownCerca = ( e ) => {
		if ( e.key === 'Enter' && apps.length ) {
			e.preventDefault();
			onObre( apps[ 0 ][ 0 ] );
		}
	};

	return (
		<div
			ref={ panell }
			className="nep-so-inici nep-so-panell"
			role="dialog"
			aria-label={ __( 'Inici', 'noempesquen' ) }
			tabIndex={ -1 }
			onBlur={ onBlur }
		>
			<div className="nep-so-inici__cerca">
				<IconaCerca />
				<input
					type="search"
					data-focus-inicial
					value={ cerca }
					onChange={ ( e ) => setCerca( e.target.value ) }
					onKeyDown={ onKeyDownCerca }
					placeholder={ __( 'Cerca aplicacions', 'noempesquen' ) }
					aria-label={ __( 'Cerca aplicacions', 'noempesquen' ) }
					autoComplete="off"
					spellCheck="false"
				/>
			</div>
			<div className="nep-so-inici__seccio">
				<h2 className="nep-so-inici__titol" id="nep-so-inici-fixades">
					{ __( 'Fixades', 'noempesquen' ) }
				</h2>
				{ apps.length ? (
					<ul
						className="nep-so-inici__apps"
						aria-labelledby="nep-so-inici-fixades"
					>
						{ apps.map( ( [ id, { nom: nomApp, Icona } ] ) => (
							<li key={ id }>
								<button
									type="button"
									className="nep-so-inici__app"
									onClick={ () => onObre( id ) }
								>
									<Icona mida={ 32 } />
									<span>{ nomApp }</span>
								</button>
							</li>
						) ) }
					</ul>
				) : (
					<p className="nep-so-inici__buit">
						{ __(
							'No hi ha cap aplicació amb aquest nom.',
							'noempesquen'
						) }
					</p>
				) }
			</div>
			<div className="nep-so-inici__peu">
				<span className="nep-so-inici__usuari">
					<span className="nep-so-avatar" aria-hidden="true">
						{ nom.charAt( 0 ) }
					</span>
					{ nom }
				</span>
				<button
					type="button"
					className="nep-so-inici__apaga"
					aria-label={ __( 'Apaga', 'noempesquen' ) }
					title={ __( 'Apaga', 'noempesquen' ) }
					onClick={ onApaga }
				>
					<IconaApaga mida={ 18 } />
				</button>
			</div>
		</div>
	);
}
