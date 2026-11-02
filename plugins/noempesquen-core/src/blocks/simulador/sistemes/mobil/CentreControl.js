import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { IconaApaga, IconaLupa } from '../../ui/icones';
import { DATA_LLARGA } from '../pc/calendari';
import { CosNotificacio, descriu } from './notificacio';

/* Píxels de lliscament cap amunt per tancar-lo. */
const LLISCA = 40;

/**
 * Centre de control: lupa, «Apagar» (pausa) i notificacions. Esc el tanca
 * (registraMenu), el focus hi entra en obrir-se i torna a la barra d'estat
 * en tancar-se. Es tanca tocant fora o lliscant cap amunt.
 *
 * @param {Object}   props
 * @param {Function} props.onTanca Tanca el centre.
 * @param {Function} props.onObre  Obre l'app d'una notificació.
 * @param {Object}   props.origen  Ref del botó de la barra d'estat.
 */
export function CentreControl( { onTanca, onObre, origen } ) {
	const joc = useJoc();
	const { estat, dispatch, registraMenu, hora } = joc;
	const panell = useRef( null );
	const tanca = useRef( onTanca );
	tanca.current = onTanca;
	const inici = useRef( null );

	useEffect( () => {
		const el = panell.current;
		const doc = el.ownerDocument;
		const boto = origen.current;
		( el.querySelector( '[data-focus-inicial]' ) ?? el ).focus();
		const desregistra = registraMenu( () => tanca.current() );
		return () => {
			desregistra();
			const actiu = doc.activeElement;
			if ( ! actiu || actiu === doc.body || el.contains( actiu ) ) {
				boto?.focus();
			}
		};
	}, [ registraMenu, origen ] );

	const notificacions = [ ...estat.notificacions ].reverse();

	return (
		<>
			<div
				className="nep-so-m-centre__capa"
				aria-hidden="true"
				onPointerDown={ onTanca }
			/>
			<div
				ref={ panell }
				className="nep-so-m-centre"
				data-tut="centre-control"
				role="dialog"
				aria-modal="true"
				aria-label={ __( 'Centre de control', 'noempesquen' ) }
				tabIndex={ -1 }
				onPointerDown={ ( e ) => {
					inici.current = e.clientY;
				} }
				onPointerUp={ ( e ) => {
					if (
						inici.current !== null &&
						inici.current - e.clientY > LLISCA
					) {
						onTanca();
					}
					inici.current = null;
				} }
			>
				<div className="nep-so-m-centre__cap">
					<span className="nep-so-m-centre__hora">{ hora }</span>
					<span className="nep-so-m-centre__data">
						{ DATA_LLARGA }
					</span>
				</div>
				<div className="nep-so-m-centre__controls">
					<button
						type="button"
						className="nep-so-m-centre__control"
						aria-pressed={ estat.lupa }
						aria-keyshortcuts="Alt+Shift+L"
						data-focus-inicial
						onClick={ () => {
							dispatch( { tipus: 'LUPA' } );
							onTanca();
						} }
					>
						<IconaLupa mida={ 22 } />
						<span>{ __( 'Lupa', 'noempesquen' ) }</span>
						<kbd className="nep-so-m-centre__drecera">Alt+⇧+L</kbd>
					</button>
					<button
						type="button"
						className="nep-so-m-centre__control"
						onClick={ () => {
							onTanca();
							dispatch( { tipus: 'PAUSA' } );
						} }
					>
						<IconaApaga mida={ 22 } />
						<span>{ __( 'Apagar', 'noempesquen' ) }</span>
					</button>
				</div>
				<h2 className="nep-so-m-centre__titol">
					{ __( 'Notificacions', 'noempesquen' ) }
				</h2>
				{ notificacions.length ? (
					<ul className="nep-so-m-centre__llista">
						{ notificacions.map( ( n ) => (
							<li key={ n.id }>
								<CosNotificacio
									n={ n }
									d={ descriu( n, joc ) }
									onObre={ () => onObre( n ) }
								/>
							</li>
						) ) }
					</ul>
				) : (
					<p className="nep-so-m-centre__buit">
						{ __( 'No hi ha notificacions', 'noempesquen' ) }
					</p>
				) }
				<button
					type="button"
					className="nep-so-m-centre__tanca"
					onClick={ onTanca }
				>
					<span
						className="nep-so-m-centre__ansa"
						aria-hidden="true"
					/>
					<span className="nep-so-sr">
						{ __( 'Tanca el centre de control', 'noempesquen' ) }
					</span>
				</button>
			</div>
		</>
	);
}
