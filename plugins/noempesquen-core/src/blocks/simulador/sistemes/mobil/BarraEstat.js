import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { IconaBateria, IconaWifi } from '../../ui/icones';
import { IconaCobertura } from './icones';

/* Píxels de lliscament cap avall per obrir el centre de control. */
const LLISCA = 24;

function Indicadors( { hora } ) {
	return (
		<>
			<span className="nep-so-m-estat__hora">{ hora }</span>
			<span className="nep-so-m-estat__icones" aria-hidden="true">
				<IconaCobertura mida={ 16 } />
				<IconaWifi mida={ 16 } />
				<IconaBateria mida={ 18 } />
			</span>
		</>
	);
}

/**
 * Barra d'estat: hora del joc, cobertura, wifi i bateria. Tocar-la o
 * lliscar-hi cap avall obre el centre de control. Amb `decorativa` (al
 * bloqueig) només es mostra.
 *
 * @param {Object}   props
 * @param {string}   props.hora       Hora del joc.
 * @param {boolean}  props.decorativa Sense interacció.
 * @param {boolean}  props.obert      El centre de control és obert.
 * @param {Function} props.onObre     Obre el centre de control.
 * @param {Object}   props.refBoto    Ref del botó (hi torna el focus).
 * @param {?string}  props.to         'clar' (text fosc) o null (text blanc).
 * @param {boolean}  props.inerta     Un diàleg modal la tapa (centre de control).
 */
export function BarraEstat( {
	hora,
	decorativa,
	obert,
	onObre,
	refBoto,
	to,
	inerta,
} ) {
	const inici = useRef( null );
	const classe = `nep-so-m-estat${ to === 'clar' ? ' is-clar' : '' }`;

	if ( decorativa ) {
		return (
			<div className={ classe } aria-hidden="true">
				<Indicadors hora={ hora } />
			</div>
		);
	}

	return (
		<button
			ref={ refBoto }
			type="button"
			className={ classe }
			inert={ inerta ? '' : undefined }
			aria-expanded={ obert }
			aria-label={ `${ hora }. ${ __(
				'Obre el centre de control',
				'noempesquen'
			) }` }
			onClick={ onObre }
			onPointerDown={ ( e ) => {
				inici.current = e.clientY;
			} }
			onPointerMove={ ( e ) => {
				if (
					inici.current !== null &&
					e.clientY - inici.current > LLISCA
				) {
					inici.current = null;
					onObre();
				}
			} }
			onPointerUp={ () => {
				inici.current = null;
			} }
		>
			<Indicadors hora={ hora } />
		</button>
	);
}
