import { __ } from '@wordpress/i18n';
import { APPS_MOBIL } from '../../apps/registre';
import { IconaCampana, IconaParla, IconaPosta } from '../../ui/icones';

/**
 * Com es presenta una notificació al mòbil: app d'origen, títol i imatge.
 * A Parla, el títol és la clau del contacte (el guia).
 *
 * @param {Object}   n           Notificació { app, titol, text }.
 * @param {Object}   joc         Context del joc.
 * @param {Object}   joc.mon     Món (contactes).
 * @param {string}   joc.nomGuia Nom del guia, si no és un contacte.
 * @param {Function} joc.Avatar  Avatar del guia.
 * @return {{app:string, AppIcona:Function, titol:string, imatge:?Object}} Presentació.
 */
export function descriu( n, { mon, nomGuia, Avatar } ) {
	if ( n.app === 'parla' ) {
		// El títol pot ser l'id del contacte o el seu nom visible (p. ex. un
		// número desconegut). Si és algú que no és el guia, no porta l'avatar
		// ni el nom del guia.
		const contacte = mon?.contactes?.find(
			( c ) => c.id === n.titol || c.nom === n.titol
		);
		const noGuia = contacte && contacte.rol !== 'guia';
		return {
			app: __( 'Parla', 'noempesquen' ),
			AppIcona: IconaParla,
			titol: contacte?.nom ?? nomGuia,
			imatge: noGuia ? null : <Avatar mida={ 40 } />,
		};
	}
	if ( n.app === 'posta' ) {
		return {
			app: __( 'Posta', 'noempesquen' ),
			AppIcona: IconaPosta,
			titol: n.titol,
			imatge: null,
		};
	}
	return {
		app: APPS_MOBIL[ n.app ]?.nom ?? n.app,
		AppIcona: APPS_MOBIL[ n.app ]?.Icona ?? IconaCampana,
		titol: n.titol,
		imatge: null,
	};
}

/**
 * Cos d'una notificació (banner, centre de control): és un botó que obre
 * l'app d'origen.
 *
 * @param {Object}   props
 * @param {Object}   props.n      Notificació.
 * @param {Object}   props.d      Presentació (vegeu descriu).
 * @param {Function} props.onObre Obre l'app de la notificació.
 */
export function CosNotificacio( { n, d, onObre } ) {
	return (
		<button type="button" className="nep-so-m-notif" onClick={ onObre }>
			<span className="nep-so-m-notif__cap">
				<d.AppIcona mida={ 14 } />
				<span>{ d.app }</span>
			</span>
			<span className="nep-so-m-notif__fila">
				{ d.imatge && (
					<span className="nep-so-m-notif__imatge" aria-hidden="true">
						{ d.imatge }
					</span>
				) }
				<span className="nep-so-m-notif__text">
					<strong className="nep-so-m-notif__titol">
						{ d.titol }
					</strong>
					<span className="nep-so-m-notif__missatge">{ n.text }</span>
				</span>
			</span>
		</button>
	);
}
