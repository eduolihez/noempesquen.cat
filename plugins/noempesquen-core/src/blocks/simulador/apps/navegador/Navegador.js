import { useEffect, useId, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useFinestra } from '../../sistemes/pc/context';
import { useNavegador } from './useNavegador';
import { Pestanyes } from './Pestanyes';
import { BarraAdreces } from './BarraAdreces';
import { BotoEina } from './BotoEina';
import { Panells } from './Panells';
import { IconaEndavant, IconaEnrere, IconaRecarrega } from './icones';

/**
 * Navegador del PC: pestanyes, barra d'adreces amb historial, webs de la
 * missió i barra d'estat amb la URL de l'enllaç sota el punter.
 *
 * @param {Object}  props
 * @param {?Object} props.dades Dades d'obertura ({ url }) que envia el sistema.
 */
export default function Navegador( { dades } ) {
	const { posaTitol } = useFinestra();
	const nav = useNavegador( dades );
	const { estat, url, infos, info } = nav;
	const [ hover, setHover ] = useState( null );
	const panells = useRef( {} );
	const refAdreca = useRef( null );
	const enfocaAdreca = useRef( false );
	const prefix = useId();

	useEffect( () => setHover( null ), [ estat.activa, estat.carregues ] );

	// Pestanya nova amb el botó «+»: el focus va a la barra d'adreces.
	useEffect( () => {
		if ( enfocaAdreca.current ) {
			enfocaAdreca.current = false;
			refAdreca.current?.focus();
		}
	}, [ estat.activa ] );

	useEffect( () => {
		posaTitol(
			sprintf(
				/* translators: %s: títol de la pàgina */
				__( '%s — Navegador', 'noempesquen' ),
				info.titol
			)
		);
	}, [ info.titol, posaTitol ] );

	const idPestanya = ( id ) => `${ prefix }-pestanya-${ id }`;
	const idPanell = ( id ) => `${ prefix }-panell-${ id }`;

	return (
		<div className="nep-nav">
			<Pestanyes
				pestanyes={ estat.pestanyes }
				activa={ estat.activa }
				infos={ infos }
				idPestanya={ idPestanya }
				onActiva={ nav.activaPestanya }
				onTanca={ nav.tancaPestanya }
				onNova={ () => {
					enfocaAdreca.current = true;
					nav.novaPestanya();
				} }
			/>
			<div className="nep-nav-eines">
				<BotoEina
					etiqueta={ __( 'Enrere', 'noempesquen' ) }
					Icona={ IconaEnrere }
					disabled={ ! nav.potEnrere }
					onClick={ nav.enrere }
				/>
				<BotoEina
					etiqueta={ __( 'Endavant', 'noempesquen' ) }
					Icona={ IconaEndavant }
					disabled={ ! nav.potEndavant }
					onClick={ nav.endavant }
				/>
				<BotoEina
					etiqueta={ __( 'Torna a carregar', 'noempesquen' ) }
					Icona={ IconaRecarrega }
					onClick={ nav.recarrega }
				/>
				<BarraAdreces
					refInput={ refAdreca }
					url={ url }
					info={ info }
					onNavega={ ( desti ) => {
						nav.navega( desti );
						panells.current[ estat.activa ]?.focus();
					} }
				/>
			</div>
			<div className="nep-nav__contingut">
				<Panells
					pestanyes={ estat.pestanyes }
					activa={ estat.activa }
					infos={ infos }
					refs={ panells }
					atributs={ ( p ) => ( {
						id: idPanell( p.id ),
						'aria-labelledby': idPestanya( p.id ),
					} ) }
					navega={ nav.navega }
					obrePestanya={ nav.obrePestanya }
					onHoverUrl={ setHover }
					onRecarrega={ nav.recarrega }
				/>
				{ hover && (
					<div className="nep-nav__estat" aria-hidden="true">
						{ hover }
					</div>
				) }
			</div>
		</div>
	);
}
