import { useEffect, useId, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { Inspeccionable } from '../../ui/Inspeccionable';
import { Glif24 } from './icones';
import { atrapaFocus } from './avis';

const IconaFitxer = ( p ) => (
	<Glif24 { ...p }>
		<path d="M6.5 3.5h7l4 4v13h-11Z" />
		<path d="M13.5 3.5v4h4" />
		<path d="M12 11v6" />
		<path d="M9.5 14.5 12 17l2.5-2.5" />
	</Glif24>
);

/**
 * Diàleg de baixada fictícia dins de la pàgina simulada. Només és interfície:
 * no genera cap fitxer ni fa cap petició. El focus comença a «Cancel·la» i hi
 * queda atrapat; Esc el cancel·la abans que la pausa (registraMenu).
 *
 * @param {Object}   props
 * @param {string}   props.fitxer       Nom del fitxer (p. ex. `actualitzacio.exe`).
 * @param {string}   props.origen       Domini d'origen.
 * @param {?string}  props.senyalFitxer Senyal del nom del fitxer, si n'és un.
 * @param {?string}  props.senyalOrigen Senyal del domini, si n'és un.
 * @param {Function} props.onObre       Clic a «Obre».
 * @param {Function} props.onCancela    Clic a «Cancel·la» o Esc.
 */
export function DescarregaFicticia( {
	fitxer,
	origen,
	senyalFitxer,
	senyalOrigen,
	onObre,
	onCancela,
} ) {
	const { registraMenu } = useJoc();
	const arrel = useRef( null );
	const cancela = useRef( onCancela );
	cancela.current = onCancela;
	const idTitol = useId();
	const idCos = useId();

	useEffect( () => {
		const doc = arrel.current.ownerDocument;
		const abans = doc.activeElement;
		arrel.current.querySelector( '[data-focus-inicial]' )?.focus();
		const desregistra = registraMenu( () => cancela.current?.() );
		return () => {
			desregistra();
			if ( abans?.isConnected ) {
				abans.focus();
			}
		};
	}, [ registraMenu ] );

	return (
		<div className="nep-descarrega">
			{ /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- teclat del diàleg. */ }
			<div
				ref={ arrel }
				className="nep-descarrega__finestra"
				role="dialog"
				aria-labelledby={ idTitol }
				aria-describedby={ idCos }
				onKeyDown={ ( e ) => atrapaFocus( e, arrel.current ) }
			>
				<h2 id={ idTitol } className="nep-descarrega__titol">
					{ __( 'Baixada', 'noempesquen' ) }
				</h2>
				<div id={ idCos } className="nep-descarrega__cos">
					<IconaFitxer mida={ 36 } />
					<dl className="nep-descarrega__dades">
						<dt>{ __( 'Fitxer', 'noempesquen' ) }</dt>
						<dd className="nep-descarrega__fitxer">
							<Inspeccionable
								text={ fitxer }
								senyal={ senyalFitxer }
							/>
						</dd>
						<dt>{ __( 'Des de', 'noempesquen' ) }</dt>
						<dd>
							<Inspeccionable
								text={ origen }
								senyal={ senyalOrigen }
							/>
						</dd>
					</dl>
				</div>
				<div className="nep-descarrega__accions">
					<button
						type="button"
						className="nep-descarrega__boto is-principal"
						onClick={ () => onObre?.() }
					>
						{ __( 'Obre', 'noempesquen' ) }
					</button>
					<button
						type="button"
						className="nep-descarrega__boto"
						data-focus-inicial
						onClick={ () => onCancela?.() }
					>
						{ __( 'Cancel·la', 'noempesquen' ) }
					</button>
				</div>
			</div>
		</div>
	);
}
