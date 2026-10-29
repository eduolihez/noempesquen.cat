import { useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { IconaCercaNav, IconaMes, IconaTancaPetita } from './icones';

/* Tecla → pestanya de destí, a partir de la posició actual. */
const DESTI = {
	ArrowRight: ( i, n ) => ( i + 1 ) % n,
	ArrowLeft: ( i, n ) => ( i - 1 + n ) % n,
	Home: () => 0,
	End: ( i, n ) => n - 1,
};

function FaviconPestanya( { info } ) {
	if ( info.Favicon ) {
		return <info.Favicon />;
	}
	return info.tipus === 'cerca' ? <IconaCercaNav mida={ 16 } /> : null;
}

/**
 * Franja de pestanyes: llista de pestanyes amb fletxes (activació automàtica),
 * Supr tanca la pestanya enfocada, i botó de pestanya nova.
 *
 * @param {Object}   props
 * @param {Object[]} props.pestanyes  Pestanyes del reductor.
 * @param {number}   props.activa     Id de la pestanya activa.
 * @param {Object}   props.infos      Info de pàgina per id de pestanya.
 * @param {Function} props.idPestanya Id DOM de la pestanya.
 * @param {Function} props.idPanell   Id DOM del panell.
 * @param {Function} props.onActiva   Activa una pestanya ( id ).
 * @param {Function} props.onTanca    Tanca una pestanya ( id ).
 * @param {Function} props.onNova     Obre una pestanya nova.
 */
export function Pestanyes( {
	pestanyes,
	activa,
	infos,
	idPestanya,
	idPanell,
	onActiva,
	onTanca,
	onNova,
} ) {
	const refs = useRef( {} );
	const enfocaActiva = useRef( false );

	// Després de tancar amb el teclat o el botó, el focus va a la nova activa.
	useEffect( () => {
		if ( enfocaActiva.current ) {
			enfocaActiva.current = false;
			refs.current[ activa ]?.focus();
		}
	}, [ activa, pestanyes.length ] );

	const tanca = ( id ) => {
		enfocaActiva.current = true;
		onTanca( id );
	};

	const tecla = ( e ) => {
		if ( e.key === 'Delete' ) {
			e.preventDefault();
			tanca( activa );
			return;
		}
		const desti = DESTI[ e.key ];
		const i = pestanyes.findIndex( ( p ) => p.id === activa );
		if ( ! desti || i < 0 ) {
			return;
		}
		e.preventDefault();
		const { id } = pestanyes[ desti( i, pestanyes.length ) ];
		onActiva( id );
		refs.current[ id ]?.focus();
	};

	return (
		<div className="nep-nav-pestanyes">
			<div
				className="nep-nav-pestanyes__llista"
				role="tablist"
				aria-label={ __( 'Pestanyes', 'noempesquen' ) }
			>
				{ pestanyes.map( ( p ) => {
					const actiu = p.id === activa;
					const info = infos[ p.id ];
					return (
						<div
							key={ p.id }
							role="presentation"
							className={ `nep-nav-pestanya${
								actiu ? ' is-activa' : ''
							}` }
						>
							<button
								ref={ ( el ) => {
									refs.current[ p.id ] = el;
								} }
								type="button"
								role="tab"
								id={ idPestanya( p.id ) }
								className="nep-nav-pestanya__boto"
								aria-selected={ actiu }
								aria-controls={ idPanell( p.id ) }
								aria-keyshortcuts="Delete"
								tabIndex={ actiu ? 0 : -1 }
								title={ info.titol }
								onClick={ () => onActiva( p.id ) }
								onKeyDown={ tecla }
							>
								<span className="nep-nav-pestanya__favicon">
									<FaviconPestanya info={ info } />
								</span>
								<span className="nep-nav-pestanya__titol">
									{ info.titol }
								</span>
							</button>
							<button
								type="button"
								className="nep-nav-pestanya__tanca"
								tabIndex={ actiu ? 0 : -1 }
								aria-label={ sprintf(
									/* translators: %s: títol de la pestanya */
									__(
										'Tanca la pestanya: %s',
										'noempesquen'
									),
									info.titol
								) }
								title={ __(
									'Tanca la pestanya',
									'noempesquen'
								) }
								onClick={ () => tanca( p.id ) }
							>
								<IconaTancaPetita mida={ 14 } />
							</button>
						</div>
					);
				} ) }
			</div>
			<button
				type="button"
				className="nep-nav-pestanyes__nova"
				aria-label={ __( 'Pestanya nova', 'noempesquen' ) }
				title={ __( 'Pestanya nova', 'noempesquen' ) }
				onClick={ onNova }
			>
				<IconaMes mida={ 18 } />
			</button>
		</div>
	);
}
