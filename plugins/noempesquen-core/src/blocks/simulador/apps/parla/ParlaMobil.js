import { useEffect, useRef } from '@wordpress/element';
import { useMobil } from '../../sistemes/mobil/context';
import { LlistaXats } from './LlistaXats';
import { Conversa } from './Conversa';
import { ID_GUIA, useParla } from './useParla';
import { xatInicial } from './xats';

/**
 * Parla al mòbil: una sola columna, llista de xats o conversa oberta. El
 * botó «Enrere» (del sistema i el de la capçalera) torna de la conversa a
 * la llista. Tocar un bàner de Parla porta a la conversa amb el guia.
 *
 * @param {Object}  props
 * @param {?Object} props.dades Dades d'obertura (`{ xat }` per anar a un xat).
 */
export default function ParlaMobil( { dades } ) {
	const { registraEnrere, appActiva } = useMobil();
	const parla = useParla( null );
	const { actiu, obre, tanca, noLlegits, marcaLlegits } = parla;
	const arrel = useRef( null );
	const ultim = useRef( null );
	const indexObert = useRef( -1 );
	const enPrimer = appActiva === 'parla';

	// L'app es munta en obrir-la; si hi ha missatges del guia sense llegir
	// (o es demana un xat) s'entra directament a la conversa.
	useEffect( () => {
		const id = xatInicial( noLlegits, dades, ID_GUIA );
		if ( id ) {
			obre( id );
		}
		// Només en muntar o quan arriben dades noves.
	}, [ dades ] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Amb la conversa del guia a la vista, els seus avisos es donen per llegits.
	useEffect( () => {
		if ( actiu === ID_GUIA && appActiva === 'parla' ) {
			marcaLlegits();
		}
	}, [ actiu, appActiva, noLlegits ] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Foco: en obrir un xat, al títol de la conversa; en tornar, al xat de
	// la llista que s'havia obert.
	useEffect( () => {
		if ( ! enPrimer ) {
			return;
		}
		if ( actiu !== null ) {
			const titol = arrel.current?.querySelector(
				'.nep-parla-conversa__nom'
			);
			titol?.setAttribute( 'tabindex', '-1' );
			titol?.focus();
		} else if ( ultim.current !== null ) {
			arrel.current
				?.querySelectorAll( '.nep-parla-xat' )
				[ indexObert.current ]?.focus();
		}
		ultim.current = actiu;
	}, [ actiu, enPrimer ] );

	const obreXat = ( id ) => {
		indexObert.current = parla.elements.findIndex( ( x ) => x.id === id );
		obre( id );
	};

	useEffect(
		() =>
			registraEnrere( () => {
				if ( actiu === null ) {
					return false;
				}
				tanca();
				return true;
			} ),
		[ actiu, registraEnrere ] // eslint-disable-line react-hooks/exhaustive-deps
	);

	return (
		<div className="nep-parla-mobil" ref={ arrel }>
			{ actiu === null ? (
				<LlistaXats
					elements={ parla.elements }
					actiu={ null }
					onObre={ obreXat }
					cerca={ parla.cerca }
					onCerca={ parla.setCerca }
				/>
			) : (
				<Conversa
					key={ actiu }
					{ ...parla.conversa }
					onResposta={ parla.onResposta }
					onEnrere={ tanca }
				/>
			) }
		</div>
	);
}
