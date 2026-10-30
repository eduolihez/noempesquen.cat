import { Suspense } from '@wordpress/element';
import { WEBS } from '../../webs/registre';
import { NovaPestanya } from './NovaPestanya';
import { PaginaError } from './PaginaError';

/**
 * Contingut d'una pestanya segons el tipus de pàgina.
 *
 * @param {Object}   props
 * @param {string}   props.url          URL de la pestanya.
 * @param {Object}   props.info         Info de la pàgina (vegeu infoPagina).
 * @param {Function} props.navega       Navega en la pestanya activa.
 * @param {Function} props.obrePestanya Obre un enllaç en una pestanya nova.
 * @param {Function} props.onHoverUrl   Barra d'estat.
 * @param {Function} props.onRecarrega  Torna a carregar.
 * @param {boolean}  props.visible      Si la pestanya és l'activa.
 */
export function Pagina( {
	url,
	info,
	navega,
	obrePestanya,
	onHoverUrl,
	onRecarrega,
	visible = true,
} ) {
	if ( info.tipus === 'nova' ) {
		return <NovaPestanya navega={ navega } onHoverUrl={ onHoverUrl } />;
	}
	if ( info.tipus !== 'web' ) {
		return (
			<PaginaError
				tipus={ info.tipus }
				host={ info.host }
				text={ info.text }
				onRecarrega={ onRecarrega }
			/>
		);
	}
	const Web = WEBS[ info.web.plantilla ];
	return (
		<Suspense fallback={ <div className="nep-nav-carregant" /> }>
			<Web
				key={ url }
				dades={ info.web.dades }
				url={ url }
				navega={ navega }
				obrePestanya={ obrePestanya }
				onHoverUrl={ onHoverUrl }
				visible={ visible }
			/>
		</Suspense>
	);
}
