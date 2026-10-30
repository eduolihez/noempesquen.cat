import { urlActual } from './historial';
import { Pagina } from './Pagina';

/**
 * Una pàgina per pestanya, totes muntades (les no actives, ocultes) perquè
 * cap pestanya no perdi el seu estat. Comú al PC i al mòbil.
 *
 * @param {Object}   props
 * @param {Object[]} props.pestanyes    Pestanyes del reductor.
 * @param {number}   props.activa       Id de la pestanya activa.
 * @param {Object}   props.infos        Info de pàgina per id de pestanya.
 * @param {Object}   props.refs         Ref amb els panells per id.
 * @param {Function} props.atributs     ( pestanya ) => atributs ARIA i id.
 * @param {Function} props.navega       Navega en la pestanya activa.
 * @param {Function} props.obrePestanya Obre un enllaç en una pestanya nova.
 * @param {Function} props.onHoverUrl   Barra d'estat.
 * @param {Function} props.onRecarrega  Torna a carregar.
 */
export function Panells( {
	pestanyes,
	activa,
	infos,
	refs,
	atributs,
	navega,
	obrePestanya,
	onHoverUrl,
	onRecarrega,
} ) {
	return pestanyes.map( ( p ) => (
		<div
			key={ p.id }
			ref={ ( el ) => {
				refs.current[ p.id ] = el;
			} }
			className="nep-nav__pagina"
			role="region"
			tabIndex={ 0 }
			hidden={ p.id !== activa }
			{ ...atributs( p ) }
		>
			<Pagina
				key={ p.carrega }
				url={ urlActual( p ) }
				visible={ p.id === activa }
				info={ infos[ p.id ] }
				navega={ navega }
				obrePestanya={ obrePestanya }
				onHoverUrl={ onHoverUrl }
				onRecarrega={ onRecarrega }
			/>
		</div>
	) );
}
