import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { DATA_LLARGA, DIA, DIES_SETMANA, MES, setmanes } from './calendari';
import { CosNotificacio, descriu } from './Notificacions';
import { usePanell } from './usePanell';

/**
 * Agrupa per app, amb el grup de la notificació més recent primer.
 *
 * @param {Object[]} notificacions Notificacions en ordre d'arribada.
 * @return {{app:string, llista:Object[]}[]} Grups, cadascun del més nou al més antic.
 */
function agrupa( notificacions ) {
	const grups = [];
	[ ...notificacions ].reverse().forEach( ( n ) => {
		const grup = grups.find( ( g ) => g.app === n.app );
		if ( grup ) {
			grup.llista.push( n );
		} else {
			grups.push( { app: n.app, llista: [ n ] } );
		}
	} );
	return grups;
}

function Calendari() {
	return (
		<section
			className="nep-so-centre__targeta nep-so-calendari"
			aria-labelledby="nep-so-calendari-titol"
		>
			<h2 className="nep-so-centre__titol" id="nep-so-calendari-titol">
				{ DATA_LLARGA }
			</h2>
			<table className="nep-so-calendari__mes">
				<caption>{ MES }</caption>
				<thead>
					<tr>
						{ DIES_SETMANA.map( ( d ) => (
							<th key={ d } scope="col">
								{ d }
							</th>
						) ) }
					</tr>
				</thead>
				<tbody>
					{ setmanes().map( ( fila, i ) => (
						<tr key={ i }>
							{ fila.map( ( dia, j ) => (
								<td
									key={ j }
									className={
										dia === DIA ? 'is-avui' : undefined
									}
									aria-current={
										dia === DIA ? 'date' : undefined
									}
								>
									{ dia ?? '' }
								</td>
							) ) }
						</tr>
					) ) }
				</tbody>
			</table>
		</section>
	);
}

/**
 * Centre de notificacions (des del rellotge o la campana) amb calendari.
 *
 * @param {Object}   props
 * @param {Function} props.onObre  Obre l'app d'una notificació.
 * @param {Function} props.onTanca Tanca el panell.
 * @param {Object}   props.origen  Ref del botó que l'ha obert.
 */
export function CentreNotificacions( { onObre, onTanca, origen } ) {
	const joc = useJoc();
	const { panell, onBlur } = usePanell( onTanca, origen );
	const grups = agrupa( joc.estat.notificacions );

	return (
		<div
			ref={ panell }
			className="nep-so-centre"
			role="dialog"
			aria-label={ __( 'Notificacions i calendari', 'noempesquen' ) }
			tabIndex={ -1 }
			onBlur={ onBlur }
		>
			<section
				className="nep-so-centre__targeta"
				aria-labelledby="nep-so-centre-titol"
			>
				<h2 className="nep-so-centre__titol" id="nep-so-centre-titol">
					{ __( 'Notificacions', 'noempesquen' ) }
				</h2>
				{ grups.length ? (
					<div className="nep-so-centre__llista">
						{ grups.map( ( g ) => {
							const cap = descriu( g.llista[ 0 ], joc );
							return (
								<section
									key={ g.app }
									className="nep-so-centre__grup"
									aria-label={ cap.app }
								>
									<p
										className="nep-so-centre__app"
										aria-hidden="true"
									>
										<cap.AppIcona mida={ 16 } />
										{ cap.app }
									</p>
									<ul>
										{ g.llista.map( ( n ) => (
											<li
												key={ n.id }
												className="nep-so-notif"
											>
												<CosNotificacio
													n={ n }
													d={ descriu( n, joc ) }
													onObre={ () => onObre( n ) }
												/>
											</li>
										) ) }
									</ul>
								</section>
							);
						} ) }
					</div>
				) : (
					<p className="nep-so-centre__buit">
						{ __( 'No hi ha notificacions noves', 'noempesquen' ) }
					</p>
				) }
			</section>
			<Calendari />
		</div>
	);
}
