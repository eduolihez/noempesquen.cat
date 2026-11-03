import { useRef } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';
import { APPS } from '../../apps/registre';
import {
	IconaBateria,
	IconaCampana,
	IconaCerca,
	IconaVolum,
	IconaWifi,
	MarcaInici,
} from '../../ui/icones';
import { BotoLupa } from '../../ui/BotoLupa';
import { DATA_CURTA, DATA_LLARGA } from './calendari';
import { usePistaDescartable } from './usePista';

/* Àncores del tutorial (`data-tut`) dels botons d'app. */
const TUT_APP = {
	navegador: 'app-navegador',
	parla: 'app-parla',
};

function etiquetaApp( nom, finestra, enfocada ) {
	if ( ! finestra ) {
		return nom;
	}
	if ( finestra.minimitzada ) {
		/* translators: %s: nom de l'app */
		return sprintf( __( '%s, minimitzada', 'noempesquen' ), nom );
	}
	return enfocada
		? /* translators: %s: nom de l'app */
			sprintf( __( '%s, en primer pla', 'noempesquen' ), nom )
		: /* translators: %s: nom de l'app */
			sprintf( __( '%s, oberta', 'noempesquen' ), nom );
}

/**
 * Barra de tasques: inici, cerca, apps fixades i safata (lupa, estat,
 * rellotge i notificacions).
 *
 * @param {Object}   props
 * @param {Object[]} props.finestres   Finestres obertes.
 * @param {?string}  props.focus       Id de la finestra activa.
 * @param {?string}  props.panell      Panell obert ('inici' | 'notificacions').
 * @param {Function} props.onPanell    Alterna un panell.
 * @param {Function} props.onApp       Clic en una app fixada.
 * @param {Function} props.onLupa      Alterna la lupa.
 * @param {string}   props.hora        Hora 'HH:MM'.
 * @param {number}   props.noLlegides  Notificacions sense llegir.
 * @param {Object}   props.refInici    Ref del botó d'inici.
 * @param {Object}   props.refRellotge Ref del botó del rellotge.
 */
export function BarraTasques( {
	finestres,
	focus,
	panell,
	onPanell,
	onApp,
	onLupa,
	hora,
	noLlegides,
	refInici,
	refRellotge,
} ) {
	const nav = useRef( null );
	const pistaAmagada = usePistaDescartable( nav );
	const etiquetaRellotge = noLlegides
		? sprintf(
				/* translators: 1: hora, 2: data, 3: nombre de notificacions */
				_n(
					'%1$s, %2$s. %3$d notificació sense llegir',
					'%1$s, %2$s. %3$d notificacions sense llegir',
					noLlegides,
					'noempesquen'
				),
				hora,
				DATA_LLARGA,
				noLlegides
			)
		: sprintf(
				/* translators: 1: hora, 2: data */
				__( '%1$s, %2$s. Cap notificació nova', 'noempesquen' ),
				hora,
				DATA_LLARGA
			);

	return (
		<nav
			ref={ nav }
			className={ `nep-so-barra${
				pistaAmagada ? ' is-pista-amagada' : ''
			}` }
			aria-label={ __( 'Barra de tasques', 'noempesquen' ) }
			data-tut="barra"
		>
			<div className="nep-so-barra__centre">
				<button
					ref={ refInici }
					type="button"
					className="nep-so-barra__boto nep-so-barra__inici"
					aria-label={ __( 'Inici', 'noempesquen' ) }
					data-tut="inici"
					aria-expanded={ panell === 'inici' }
					onClick={ () => onPanell( 'inici' ) }
				>
					<MarcaInici mida={ 24 } />
					<span className="nep-so-pista" aria-hidden="true">
						{ __( 'Inici', 'noempesquen' ) }
					</span>
				</button>
				<button
					type="button"
					className="nep-so-barra__cerca"
					onClick={ () => onPanell( 'inici', true ) }
				>
					<IconaCerca />
					<span>{ __( 'Cerca', 'noempesquen' ) }</span>
				</button>
				{ Object.entries( APPS ).map( ( [ id, { nom, Icona } ] ) => {
					const finestra = finestres.find( ( f ) => f.app === id );
					const enfocada = focus === id;
					const classes = [
						'nep-so-barra__boto',
						'nep-so-barra__app',
						finestra && 'is-oberta',
						enfocada && 'is-enfocada',
					]
						.filter( Boolean )
						.join( ' ' );
					return (
						<button
							key={ id }
							type="button"
							className={ classes }
							data-tut={ TUT_APP[ id ] }
							aria-label={ etiquetaApp(
								nom,
								finestra,
								enfocada
							) }
							onClick={ () => onApp( id ) }
						>
							<Icona mida={ 24 } />
							<span className="nep-so-barra__indicador" />
							<span className="nep-so-pista" aria-hidden="true">
								{ nom }
							</span>
						</button>
					);
				} ) }
			</div>
			<div className="nep-so-barra__safata">
				<BotoLupa
					className="nep-so-barra__boto nep-so-barra__lupa"
					onClick={ onLupa }
					pista
				/>
				<span className="nep-so-barra__estat" aria-hidden="true">
					<IconaWifi />
					<IconaVolum />
					<IconaBateria />
				</span>
				<button
					ref={ refRellotge }
					type="button"
					className="nep-so-barra__rellotge"
					data-tut="rellotge"
					aria-label={ etiquetaRellotge }
					aria-expanded={ panell === 'notificacions' }
					onClick={ () => onPanell( 'notificacions' ) }
				>
					<span className="nep-so-barra__hora">
						<span>{ hora }</span>
						<span>{ DATA_CURTA }</span>
					</span>
					<span className="nep-so-barra__campana">
						<IconaCampana />
						{ noLlegides > 0 && (
							<span className="nep-so-barra__comptador">
								{ noLlegides > 9 ? '9+' : noLlegides }
							</span>
						) }
					</span>
				</button>
			</div>
		</nav>
	);
}
