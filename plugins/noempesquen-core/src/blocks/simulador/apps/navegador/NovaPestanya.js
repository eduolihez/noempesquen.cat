import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { IconaNavegador } from '../../ui/icones';
import { propsEnllac } from '../../webs/enllac';
import { normalitzaUrl } from './historial';
import { IconaCercaNav } from './icones';
import { FAVICONS_HOST } from './infoPagina';

const DRECERES = [
	{ nom: __( 'Posta', 'noempesquen' ), url: 'https://posta.cat/' },
	{ nom: __( 'Llum Clara', 'noempesquen' ), url: 'https://llumclara.cat/' },
	{
		nom: __( 'El Diari del Barri', 'noempesquen' ),
		url: 'https://diaridelbarri.cat/',
	},
];

/**
 * Pàgina de pestanya nova: quadre de cerca i dreceres.
 *
 * @param {Object}   props
 * @param {Function} props.navega     Navega en aquesta pestanya.
 * @param {Function} props.onHoverUrl Barra d'estat.
 */
export function NovaPestanya( { navega, onHoverUrl } ) {
	const [ text, setText ] = useState( '' );

	const cerca = ( e ) => {
		e.preventDefault();
		const url = normalitzaUrl( text );
		if ( url ) {
			navega( url );
		}
	};

	return (
		<div className="nep-nav-nova">
			<div className="nep-nav-nova__marca">
				<IconaNavegador mida={ 72 } />
			</div>
			<form
				className="nep-nav-nova__cerca"
				role="search"
				onSubmit={ cerca }
			>
				<IconaCercaNav mida={ 20 } />
				<input
					type="text"
					value={ text }
					onChange={ ( e ) => setText( e.target.value ) }
					placeholder={ __(
						'Cerca o escriu una adreça web',
						'noempesquen'
					) }
					aria-label={ __(
						'Cerca o escriu una adreça web',
						'noempesquen'
					) }
					autoComplete="off"
					spellCheck={ false }
				/>
			</form>
			<ul
				className="nep-nav-nova__dreceres"
				aria-label={ __( 'Dreceres', 'noempesquen' ) }
			>
				{ DRECERES.map( ( { nom, url } ) => {
					const Favicon = FAVICONS_HOST[ new URL( url ).hostname ];
					return (
						<li key={ url }>
							<a
								className="nep-nav-nova__drecera"
								{ ...propsEnllac( url, navega, onHoverUrl ) }
							>
								<span className="nep-nav-nova__favicon">
									<Favicon mida={ 24 } />
								</span>
								<span className="nep-nav-nova__nom">
									{ nom }
								</span>
							</a>
						</li>
					);
				} ) }
			</ul>
		</div>
	);
}
