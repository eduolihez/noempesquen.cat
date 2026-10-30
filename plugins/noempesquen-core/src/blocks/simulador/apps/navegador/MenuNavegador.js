import { useEffect, useId, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { Glif } from '../../ui/icones';

/* Nom i versió inventats del navegador simulat. */
export const NOM_NAVEGADOR = 'Brúixola';
export const VERSIO_NAVEGADOR = '118.4';

const IconaMenu = ( p ) => (
	<Glif { ...p }>
		<circle cx="10" cy="4.5" r="1" fill="currentColor" />
		<circle cx="10" cy="10" r="1" fill="currentColor" />
		<circle cx="10" cy="15.5" r="1" fill="currentColor" />
	</Glif>
);

const IconaBruixola = ( p ) => (
	<Glif { ...p }>
		<circle cx="10" cy="10" r="7.5" />
		<path d="M12.8 7.2 11 11l-3.8 1.8L9 9Z" />
	</Glif>
);

const IconaAlDia = ( p ) => (
	<Glif { ...p }>
		<circle cx="10" cy="10" r="7.5" />
		<path d="m6.8 10.2 2.2 2.2 4.4-4.6" />
	</Glif>
);

/**
 * Menú del navegador del PC amb l'apartat «Quant a» (només informatiu: no
 * emet cap esdeveniment del motor). Esc el tanca abans que la pausa i torna
 * el focus al botó; un clic a fora o treure'n el focus també el tanca.
 */
export function MenuNavegador() {
	const { registraMenu } = useJoc();
	const [ vista, setVista ] = useState( null );
	const arrel = useRef( null );
	const boto = useRef( null );
	const panell = useRef( null );
	const id = useId();
	const obert = vista !== null;

	useEffect( () => {
		if ( ! obert ) {
			return undefined;
		}
		const desregistra = registraMenu( () => {
			setVista( null );
			boto.current?.focus();
		} );
		const fora = ( e ) => {
			if ( ! arrel.current?.contains( e.target ) ) {
				setVista( null );
			}
		};
		document.addEventListener( 'pointerdown', fora );
		return () => {
			desregistra();
			document.removeEventListener( 'pointerdown', fora );
		};
	}, [ obert, registraMenu ] );

	// En obrir o canviar de vista, el focus va al primer botó del panell.
	useEffect( () => {
		if ( vista ) {
			panell.current?.querySelector( 'button' )?.focus();
		}
	}, [ vista ] );

	const tanca = () => {
		setVista( null );
		boto.current?.focus();
	};

	return (
		<div
			ref={ arrel }
			className="nep-nav-menu"
			onBlur={ ( e ) => {
				if (
					e.relatedTarget &&
					! arrel.current.contains( e.relatedTarget )
				) {
					setVista( null );
				}
			} }
		>
			<button
				ref={ boto }
				type="button"
				className="nep-nav-eines__boto"
				aria-label={ __( 'Menú del navegador', 'noempesquen' ) }
				title={ __( 'Menú del navegador', 'noempesquen' ) }
				aria-expanded={ obert }
				aria-controls={ id }
				onClick={ () => setVista( obert ? null : 'menu' ) }
			>
				<IconaMenu mida={ 18 } />
			</button>
			<div
				ref={ panell }
				id={ id }
				className="nep-nav-menu__panell"
				role="dialog"
				aria-label={
					vista === 'quant'
						? __( 'Quant a Brúixola', 'noempesquen' )
						: __( 'Menú del navegador', 'noempesquen' )
				}
				hidden={ ! obert }
			>
				{ vista === 'quant' ? (
					<div className="nep-nav-menu__quant">
						<p className="nep-nav-menu__nom">
							<IconaBruixola mida={ 28 } />
							{ __( 'Navegador Brúixola', 'noempesquen' ) }
						</p>
						<p>
							{ __( 'Versió', 'noempesquen' ) }{ ' ' }
							{ VERSIO_NAVEGADOR }
						</p>
						<p className="nep-nav-menu__estat" role="status">
							<IconaAlDia mida={ 18 } />
							{ __( 'El navegador està al dia.', 'noempesquen' ) }
						</p>
						<button
							type="button"
							className="nep-nav-menu__boto"
							onClick={ tanca }
						>
							{ __( 'Tanca', 'noempesquen' ) }
						</button>
					</div>
				) : (
					<button
						type="button"
						className="nep-nav-menu__opcio"
						onClick={ () => setVista( 'quant' ) }
					>
						<IconaBruixola mida={ 18 } />
						{ __( 'Quant a Brúixola', 'noempesquen' ) }
					</button>
				) }
			</div>
		</div>
	);
}
