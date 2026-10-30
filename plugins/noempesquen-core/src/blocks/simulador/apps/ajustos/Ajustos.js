import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useMobil } from '../../sistemes/mobil/context';
import { Subpantalla } from './Subpantalla';
import { desaSons, llegeixSons } from './preferencies.js';
import {
	IconaAplicacions,
	IconaApagar,
	IconaPantalla,
	IconaSegueix,
	IconaSo,
	IconaTelefon,
	IconaWifi,
} from './icones';

function emmagatzem() {
	try {
		return window.localStorage;
	} catch {
		return undefined;
	}
}

const ENTRADES = [
	{ id: 'wifi', Icona: IconaWifi, text: () => __( 'Wi-Fi', 'noempesquen' ) },
	{
		id: 'pantalla',
		Icona: IconaPantalla,
		text: () => __( 'Pantalla', 'noempesquen' ),
	},
	{ id: 'so', Icona: IconaSo, text: () => __( 'So', 'noempesquen' ) },
	{
		id: 'aplicacions',
		Icona: IconaAplicacions,
		text: () => __( 'Aplicacions', 'noempesquen' ),
	},
	{
		id: 'sobre',
		Icona: IconaTelefon,
		text: () => __( 'Sobre el telèfon', 'noempesquen' ),
	},
	{
		id: 'apagar',
		Icona: IconaApagar,
		text: () => __( 'Apagar', 'noempesquen' ),
	},
];

export default function Ajustos() {
	const { registraEnrere } = useMobil();
	const [ vista, setVista ] = useState( null );
	const [ sons, setSons ] = useState( () => llegeixSons( emmagatzem() ) );
	const arrel = useRef( null );
	const titol = useRef( null );
	const vistaRef = useRef( null );
	vistaRef.current = vista;

	useEffect(
		() =>
			registraEnrere( () => {
				if ( vistaRef.current ) {
					setVista( null );
					return true;
				}
				return false;
			} ),
		[ registraEnrere ]
	);

	/* Mou el foc al títol només si el foc ja és dins l'app (no el robem
	 * quan l'app és en segon pla). */
	useEffect( () => {
		if (
			vista &&
			arrel.current &&
			arrel.current.contains(
				arrel.current.ownerDocument.activeElement
			) &&
			titol.current
		) {
			titol.current.focus();
		}
	}, [ vista ] );

	const canviaSons = ( valor ) => {
		setSons( valor );
		desaSons( emmagatzem(), valor );
	};

	const entrada = ENTRADES.find( ( e ) => e.id === vista );

	return (
		<div
			ref={ arrel }
			className="nep-ajustos"
			role="region"
			aria-label={ __( 'Ajustos', 'noempesquen' ) }
		>
			<header className="nep-ajustos__cap">
				<h2
					ref={ titol }
					tabIndex={ -1 }
					className="nep-ajustos__titol"
				>
					{ entrada
						? entrada.text()
						: __( 'Ajustos', 'noempesquen' ) }
				</h2>
			</header>
			<div className="nep-ajustos__cos">
				{ entrada ? (
					<Subpantalla
						vista={ vista }
						sons={ sons }
						onSons={ canviaSons }
					/>
				) : (
					<ul className="nep-ajustos__llista">
						{ ENTRADES.map( ( { id, Icona, text } ) => (
							<li key={ id }>
								<button
									type="button"
									className={ `nep-ajustos__entrada${
										id === 'apagar'
											? ' nep-ajustos__entrada--perill'
											: ''
									}` }
									onClick={ () => setVista( id ) }
								>
									<Icona mida={ 22 } />
									<span className="nep-ajustos__entrada-text">
										{ text() }
									</span>
									<IconaSegueix mida={ 18 } />
								</button>
							</li>
						) ) }
					</ul>
				) }
			</div>
		</div>
	);
}
