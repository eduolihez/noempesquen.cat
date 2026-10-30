import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useMobil } from '../../sistemes/mobil/context';
import { Subpantalla } from './Subpantalla';
import { desaSons, llegeixSons } from '../../simulador/preferencies.js';
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
	const movFoc = useRef( false );
	const origen = useRef( null );
	const focDins = useCallback(
		() =>
			!! arrel.current?.contains(
				arrel.current.ownerDocument.activeElement
			),
		[]
	);

	useEffect(
		() =>
			registraEnrere( () => {
				if ( vistaRef.current ) {
					/* Es decideix abans del canvi: en desmuntar-se el botó
					 * el foc cau a body. */
					movFoc.current = focDins();
					setVista( null );
					return true;
				}
				return false;
			} ),
		[ registraEnrere, focDins ]
	);

	/* Retorna el foc només si ja era dins l'app (no el robem en segon pla):
	 * al títol en entrar a una subpantalla, a l'entrada d'origen en tornar. */
	useEffect( () => {
		if ( ! movFoc.current ) {
			return;
		}
		movFoc.current = false;
		if ( vista ) {
			titol.current?.focus();
		} else if ( origen.current ) {
			arrel.current
				?.querySelector( `[data-entrada="${ origen.current }"]` )
				?.focus();
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
									data-entrada={ id }
									onClick={ () => {
										origen.current = id;
										movFoc.current = focDins();
										setVista( id );
									} }
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
