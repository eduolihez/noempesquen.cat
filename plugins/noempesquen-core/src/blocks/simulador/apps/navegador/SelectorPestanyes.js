import { useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { hostname, urlActual } from './historial';
import { IconaCercaNav, IconaMes, IconaTancaPetita } from './icones';

function Favicon( { info } ) {
	if ( info.Favicon ) {
		return <info.Favicon mida={ 20 } />;
	}
	return info.tipus === 'cerca' ? <IconaCercaNav mida={ 20 } /> : null;
}

/**
 * Selector de pestanyes del mòbil, a pantalla completa: llista per triar o
 * tancar pestanyes i botó de pestanya nova. Esc el tanca abans que la
 * pausa (registraMenu); en obrir-lo, el focus va a la pestanya activa.
 *
 * @param {Object}   props
 * @param {Object[]} props.pestanyes Pestanyes del reductor.
 * @param {number}   props.activa    Id de la pestanya activa.
 * @param {Object}   props.infos     Info de pàgina per id de pestanya.
 * @param {Function} props.onTria    Activa una pestanya ( id ) i tanca.
 * @param {Function} props.onTanca   Tanca una pestanya ( id ).
 * @param {Function} props.onNova    Obre una pestanya nova i tanca.
 * @param {Function} props.onSurt    Tanca el selector.
 */
export function SelectorPestanyes( {
	pestanyes,
	activa,
	infos,
	onTria,
	onTanca,
	onNova,
	onSurt,
} ) {
	const { registraMenu } = useJoc();
	const arrel = useRef( null );
	const surt = useRef( onSurt );
	surt.current = onSurt;

	useEffect( () => registraMenu( () => surt.current() ), [ registraMenu ] );

	// En obrir-lo i després de tancar una pestanya, el focus queda dins.
	useEffect( () => {
		const actiu = arrel.current?.querySelector(
			'.nep-nav-selector__pestanya.is-activa .nep-nav-selector__tria'
		);
		( actiu ?? arrel.current?.querySelector( 'button' ) )?.focus();
	}, [ pestanyes.length ] );

	return (
		<div
			ref={ arrel }
			className="nep-nav-selector"
			role="dialog"
			aria-modal="true"
			aria-label={ __( 'Pestanyes', 'noempesquen' ) }
		>
			<div className="nep-nav-selector__capcalera">
				<button
					type="button"
					className="nep-nav-selector__accio"
					onClick={ onNova }
				>
					<IconaMes mida={ 20 } />
					{ __( 'Pestanya nova', 'noempesquen' ) }
				</button>
				<button
					type="button"
					className="nep-nav-selector__accio"
					onClick={ onSurt }
				>
					{ __( 'Fet', 'noempesquen' ) }
				</button>
			</div>
			<ul className="nep-nav-selector__llista">
				{ pestanyes.map( ( p ) => {
					const info = infos[ p.id ];
					const host = hostname( urlActual( p ) );
					const actiu = p.id === activa;
					return (
						<li
							key={ p.id }
							className={ `nep-nav-selector__pestanya${
								actiu ? ' is-activa' : ''
							}` }
						>
							<button
								type="button"
								className="nep-nav-selector__tria"
								aria-current={ actiu ? 'page' : undefined }
								onClick={ () => onTria( p.id ) }
							>
								<span className="nep-nav-selector__favicon">
									<Favicon info={ info } />
								</span>
								<span className="nep-nav-selector__text">
									<span className="nep-nav-selector__titol">
										{ info.titol }
									</span>
									{ host && (
										<span className="nep-nav-selector__host">
											{ host }
										</span>
									) }
								</span>
							</button>
							<button
								type="button"
								className="nep-nav-selector__tanca"
								aria-label={ sprintf(
									/* translators: %s: títol de la pestanya */
									__(
										'Tanca la pestanya: %s',
										'noempesquen'
									),
									info.titol
								) }
								onClick={ () => onTanca( p.id ) }
							>
								<IconaTancaPetita mida={ 18 } />
							</button>
						</li>
					);
				} ) }
			</ul>
		</div>
	);
}
