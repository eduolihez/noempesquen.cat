import { useEffect, useId, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { Cos } from '../../ui/Cos';
import { Inspeccionable } from '../../ui/Inspeccionable';
import { Glif24 } from './icones';
import { atrapaFocus, DURADA_AVIS_TANCA, normalitzaParagrafs } from './avis';

const IconaAlerta = ( p ) => (
	<Glif24 { ...p }>
		<path d="M12 3.5 21 19.5H3Z" />
		<path d="M12 9.5v4.5" />
		<path d="M12 17h.01" />
	</Glif24>
);

const IconaTelefon = ( p ) => (
	<Glif24 { ...p }>
		<path d="M6.5 3.5h3l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z" />
	</Glif24>
);

/**
 * Overlay d'«alerta de virus» DINS de la pàgina simulada (mai cobreix el
 * navegador ni el sistema). El focus hi queda atrapat i comença a «Tanca»;
 * Esc el tanca sempre abans que la pausa (registraMenu), fins i tot amb
 * `reobre`: és la sortida d'emergència. Amb `reobre`, el botó «Tanca» només
 * mostra «No s'ha pogut tancar» (la trampa) i no crida `onTanca`. El
 * comptador és text estàtic: no s'anima ni s'anuncia. Qui el pinta decideix
 * si és visible: en rebre `onTanca` l'ha de desmuntar.
 *
 * @param {Object}   props
 * @param {string}   props.titol           Títol de l'alerta.
 * @param {Array}    props.cos             Segments `{ t, senyal? }` o paràgrafs.
 * @param {string}   props.telefon         Número de «suport» que es mostra.
 * @param {string}   props.etiquetaTelefon Text que acompanya el número.
 * @param {?string}  props.senyalTelefon   Senyal del número, si n'és un.
 * @param {string}   props.contador        Text estàtic del comptador.
 * @param {Function} props.onTruca         «Truca ara» o clic al número.
 * @param {Function} props.onTanca         Tanca l'overlay.
 * @param {boolean}  props.reobre          El botó «Tanca» no tanca.
 */
export function AvisFals( {
	titol,
	cos,
	telefon,
	etiquetaTelefon,
	senyalTelefon,
	contador,
	onTruca,
	onTanca,
	reobre = false,
} ) {
	const { estat, registraMenu } = useJoc();
	const arrel = useRef( null );
	const tanca = useRef( onTanca );
	tanca.current = onTanca;
	const temporitzador = useRef( null );
	const [ noTanca, setNoTanca ] = useState( false );
	const idTitol = useId();
	const idCos = useId();

	useEffect( () => {
		const doc = arrel.current.ownerDocument;
		const abans = doc.activeElement;
		arrel.current.querySelector( '[data-focus-inicial]' )?.focus();
		const desregistra = registraMenu( () => tanca.current?.() );
		return () => {
			desregistra();
			clearTimeout( temporitzador.current );
			if ( abans?.isConnected ) {
				abans.focus();
			}
		};
	}, [ registraMenu ] );

	const clicTanca = () => {
		if ( ! reobre ) {
			onTanca?.();
			return;
		}
		setNoTanca( true );
		clearTimeout( temporitzador.current );
		temporitzador.current = setTimeout(
			() => setNoTanca( false ),
			DURADA_AVIS_TANCA
		);
	};

	return (
		<div className="nep-avis">
			{ /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- teclat del diàleg. */ }
			<div
				ref={ arrel }
				className="nep-avis__finestra"
				role="alertdialog"
				aria-labelledby={ idTitol }
				aria-describedby={ idCos }
				onKeyDown={ ( e ) => atrapaFocus( e, arrel.current ) }
			>
				<div className="nep-avis__cap">
					<IconaAlerta mida={ 28 } />
					<h2 id={ idTitol } className="nep-avis__titol">
						{ titol }
					</h2>
					<button
						type="button"
						className="nep-avis__tanca"
						data-focus-inicial
						onClick={ clicTanca }
					>
						{ __( 'Tanca', 'noempesquen' ) }
					</button>
				</div>
				<div id={ idCos } className="nep-avis__cos">
					<Cos paragrafs={ normalitzaParagrafs( cos ) } />
				</div>
				{ contador && (
					<p className="nep-avis__contador">{ contador }</p>
				) }
				<div className="nep-avis__telefon">
					{ etiquetaTelefon && (
						<span className="nep-avis__etiqueta">
							{ etiquetaTelefon }
						</span>
					) }
					{ estat.lupa ? (
						<span className="nep-avis__numero">
							<Inspeccionable
								text={ telefon }
								senyal={ senyalTelefon }
							/>
						</span>
					) : (
						<button
							type="button"
							className="nep-avis__numero"
							onClick={ () => onTruca?.() }
						>
							<IconaTelefon mida={ 22 } />
							{ telefon }
						</button>
					) }
				</div>
				<button
					type="button"
					className="nep-avis__truca"
					onClick={ () => onTruca?.() }
				>
					<IconaTelefon mida={ 22 } />
					{ __( 'Truca ara', 'noempesquen' ) }
				</button>
				<p className="nep-avis__estat" role="status">
					{ noTanca
						? __( "No s'ha pogut tancar", 'noempesquen' )
						: '' }
				</p>
			</div>
		</div>
	);
}
