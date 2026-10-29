import { useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Cos, Inspeccionable } from './Cos';
import { BarraEines } from './BarraEines';

function Rellotge( { hora } ) {
	return <span className="nep-pc__rellotge">{ hora }</span>;
}

export function Escriptori( { missio, estat, dispatch, ctx, children } ) {
	const [ url, setUrl ] = useState( null );
	const obert =
		missio.missatges.find( ( m ) => m.id === estat.obert ) ?? null;
	const horaFinal =
		missio.missatges[ missio.missatges.length - 1 ]?.hora ?? '10:00';
	const idBarra = `nep-barra-${ missio.id }`;

	useEffect( () => setUrl( null ), [ estat.obert, estat.lupa ] );

	const ctxCorreu = { ...ctx, onUrl: setUrl, idBarra, mobil: false };

	return (
		<div className="nep-pc">
			{ children }
			<div
				className="nep-pc__finestra"
				role="application"
				aria-roledescription={ __(
					'aplicació de correu simulada',
					'noempesquen'
				) }
			>
				<div className="nep-pc__titol">
					<span className="nep-pc__punts" aria-hidden="true">
						<i /> <i /> <i />
					</span>
					<span>{ __( 'Correu', 'noempesquen' ) }</span>
				</div>

				<BarraEines
					estat={ estat }
					dispatch={ dispatch }
					potDecidir={ !! obert }
					total={ missio.senyals.length }
				/>

				<div
					className={ `nep-correu${ obert ? ' nep-correu--obert' : '' }` }
				>
					<nav
						className="nep-correu__carpetes"
						aria-label={ __( 'Carpetes', 'noempesquen' ) }
					>
						<ul>
							<li className="is-actiu">
								{ sprintf(
									/* translators: %d: nombre de correus */
									__(
										"Safata d'entrada (%d)",
										'noempesquen'
									),
									missio.missatges.length
								) }
							</li>
							<li>{ __( 'Enviats', 'noempesquen' ) }</li>
							<li>{ __( 'Correu brossa', 'noempesquen' ) }</li>
						</ul>
					</nav>

					<ul
						className="nep-correu__llista"
						aria-label={ __( "Safata d'entrada", 'noempesquen' ) }
					>
						{ missio.missatges.map( ( m ) => (
							<li key={ m.id }>
								<button
									type="button"
									className={ `nep-correu__item${ estat.obert === m.id ? ' is-actiu' : '' }` }
									onClick={ () =>
										dispatch( { tipus: 'OBRE', id: m.id } )
									}
									aria-current={
										estat.obert === m.id
											? 'true'
											: undefined
									}
								>
									<strong>{ m.remitent.nom }</strong>
									<span className="nep-correu__assumpte">
										{ m.assumpte }
									</span>
									<span className="nep-correu__hora">
										{ m.hora }
									</span>
								</button>
							</li>
						) ) }
					</ul>

					<article className="nep-correu__lector" aria-live="polite">
						{ obert ? (
							<>
								<button
									type="button"
									className="nep-correu__enrere"
									onClick={ () =>
										dispatch( { tipus: 'TANCA' } )
									}
								>
									{ __( '← Safata', 'noempesquen' ) }
								</button>
								<h3 className="nep-correu__titol">
									<Inspeccionable
										text={ obert.assumpte }
										senyal={ obert.assumpte_senyal }
										ctx={ ctxCorreu }
									/>
								</h3>
								<p className="nep-correu__de">
									<strong>{ obert.remitent.nom }</strong>{ ' ' }
									<Inspeccionable
										text={ `<${ obert.remitent.adreca }>` }
										senyal={ obert.remitent.senyal }
										ctx={ ctxCorreu }
									/>
									<span className="nep-correu__hora">
										{ obert.hora }
									</span>
								</p>
								<div className="nep-correu__cos">
									<Cos
										paragrafs={ obert.cos }
										ctx={ ctxCorreu }
									/>
								</div>
							</>
						) : (
							<p className="nep-correu__buit">
								{ __(
									'Tria un correu de la llista per llegir-lo.',
									'noempesquen'
								) }
							</p>
						) }
					</article>
				</div>

				<div
					className="nep-pc__estat"
					id={ idBarra }
					aria-live="polite"
				>
					{ url
						? sprintf(
								/* translators: %s: adreça real de l'enllaç */
								__(
									'Aquest enllaç porta a: %s',
									'noempesquen'
								),
								url
							)
						: ' ' }
				</div>
			</div>

			<div className="nep-pc__tasques" aria-hidden="true">
				<span className="nep-pc__inici" />
				<span className="nep-pc__app is-actiu">✉</span>
				<Rellotge hora={ horaFinal } />
			</div>
		</div>
	);
}
