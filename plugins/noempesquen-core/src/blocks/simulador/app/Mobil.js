import { useState, useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Cos, Inspeccionable } from './Cos';
import { BarraEines } from './BarraEines';

function domini( url ) {
	try {
		return new URL( url ).hostname;
	} catch {
		return url;
	}
}

function FullEnllac( { url, onObre, onTanca } ) {
	const ref = useRef();
	useEffect( () => {
		ref.current?.focus();
		const onKey = ( e ) => e.key === 'Escape' && onTanca();
		window.addEventListener( 'keydown', onKey );
		return () => window.removeEventListener( 'keydown', onKey );
	}, [ onTanca ] );

	return (
		<div
			className="nep-full"
			role="dialog"
			aria-modal="true"
			aria-labelledby="nep-full-titol"
		>
			<div className="nep-full__caixa">
				<h4 id="nep-full-titol" tabIndex={ -1 } ref={ ref }>
					{ __( 'Obrir aquest enllaç?', 'noempesquen' ) }
				</h4>
				<p className="nep-full__url">{ url }</p>
				<p className="nep-full__domini">
					{ sprintf(
						/* translators: %s: domini */
						__( 'Domini: %s', 'noempesquen' ),
						domini( url )
					) }
				</p>
				<div className="nep-full__botons">
					<button
						type="button"
						className="nep-boto"
						onClick={ onTanca }
					>
						{ __( 'Cancel·la', 'noempesquen' ) }
					</button>
					<button
						type="button"
						className="nep-boto nep-boto--perill"
						onClick={ onObre }
					>
						{ __( 'Obre', 'noempesquen' ) }
					</button>
				</div>
			</div>
		</div>
	);
}

export function Mobil( { missio, estat, dispatch, ctx, children } ) {
	const [ fullUrl, setFullUrl ] = useState( null );
	const obert =
		missio.missatges.find( ( m ) => m.id === estat.obert ) ?? null;
	const hora =
		missio.missatges[ missio.missatges.length - 1 ]?.hora ?? '20:00';

	const ctxMobil = {
		...ctx,
		mobil: true,
		onUrl: () => {},
		onFullEnllac: setFullUrl,
	};

	return (
		<div className="nep-mobil">
			{ children }
			<div
				className="nep-mobil__marc"
				role="application"
				aria-roledescription={ __( 'mòbil simulat', 'noempesquen' ) }
			>
				<div className="nep-mobil__estat" aria-hidden="true">
					<span>{ hora }</span>
					<span>▂▄▆ 82%</span>
				</div>

				<div className="nep-mobil__app">
					<header className="nep-mobil__capcalera">
						{ obert ? (
							<button
								type="button"
								className="nep-mobil__enrere"
								onClick={ () => dispatch( { tipus: 'TANCA' } ) }
								aria-label={ __(
									'Torna als missatges',
									'noempesquen'
								) }
							>
								‹
							</button>
						) : null }
						<h3>
							{ obert ? (
								<Inspeccionable
									text={ obert.remitent.nom }
									senyal={ obert.remitent.senyal }
									ctx={ ctxMobil }
								/>
							) : (
								__( 'Missatges', 'noempesquen' )
							) }
						</h3>
					</header>

					{ obert ? (
						<div className="nep-xat" aria-live="polite">
							<div className="nep-xat__bombolla">
								<Cos paragrafs={ obert.cos } ctx={ ctxMobil } />
								<span className="nep-xat__hora">
									{ obert.hora }
								</span>
							</div>
						</div>
					) : (
						<ul className="nep-xats">
							{ missio.missatges.map( ( m ) => (
								<li key={ m.id }>
									<button
										type="button"
										className="nep-xats__item"
										onClick={ () =>
											dispatch( {
												tipus: 'OBRE',
												id: m.id,
											} )
										}
									>
										<span
											className="nep-xats__avatar"
											aria-hidden="true"
										>
											{ m.remitent.nom.charAt( 0 ) }
										</span>
										<span className="nep-xats__text">
											<strong>{ m.remitent.nom }</strong>
											<span>
												{ m.cos
													.flat()
													.map(
														( s ) =>
															s.t ??
															s.enllac?.text
													)
													.join( '' ) }
											</span>
										</span>
										<span className="nep-xats__hora">
											{ m.hora }
										</span>
									</button>
								</li>
							) ) }
						</ul>
					) }
				</div>

				<BarraEines
					estat={ estat }
					dispatch={ dispatch }
					potDecidir={ !! obert }
					total={ missio.senyals.length }
				/>

				{ fullUrl && (
					<FullEnllac
						url={ fullUrl }
						onTanca={ () => setFullUrl( null ) }
						onObre={ () => {
							setFullUrl( null );
							ctx.onPica();
						} }
					/>
				) }
			</div>
		</div>
	);
}
