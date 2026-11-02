import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { APPS, APPS_MOBIL } from '../../apps/registre';
import { IconaMobil } from './IconaMobil';
import { presenta } from './notificacio';
import {
	IconaCampana,
	IconaParla,
	IconaPosta,
	IconaTanca,
} from '../../ui/icones';
import { duradaAvis } from '../../nucli/avisos';
import { ancoraDelPas } from '../../nucli/ancores';
import { MAX_TOASTS } from '../../nucli/temps';
import {
	RegioAnuncis,
	apartaFocus,
	useAturadaAvis,
	useCuaAvisos,
	useTempsRestant,
} from '../../simulador/useCuaAvisos';

const mapaNoms = ( apps ) =>
	Object.fromEntries(
		Object.entries( apps ).map( ( [ k, v ] ) => [ k, v.nom ] )
	);

/**
 * Com es presenta una notificació: app d'origen, títol i imatge.
 * A Parla, el títol és la clau del contacte (el guia). Les del mòbil
 * vinculat porten l'origen «Mòbil d'Àlex · app» i la icona de mòbil.
 *
 * @param {Object}   n           Notificació { app, titol, text, font? }.
 * @param {Object}   joc         Context del joc.
 * @param {Object}   joc.mon     Món (contactes).
 * @param {string}   joc.nomGuia Nom del guia, si no és un contacte.
 * @param {Function} joc.Avatar  Avatar del guia.
 * @return {{app:string, AppIcona:Function, titol:string, imatge:?Object}} Presentació.
 */
export function descriu( n, { mon, nomGuia, Avatar } ) {
	const p = presenta( n, {
		mon,
		nomGuia,
		nomsAppsPc: mapaNoms( APPS ),
		nomsAppsMobil: mapaNoms( APPS_MOBIL ),
	} );
	if ( p.tipus === 'mobil' ) {
		const IconaApp = p.iconaApp ? APPS_MOBIL[ p.iconaApp ]?.Icona : null;
		return {
			app: p.app,
			AppIcona: IconaMobil,
			titol: p.titol,
			imatge: (
				<span className="nep-so-notif__mobil">
					<IconaMobil mida={ 20 } />
					{ IconaApp && <IconaApp mida={ 24 } /> }
				</span>
			),
		};
	}
	if ( p.tipus === 'parla' ) {
		return {
			app: __( 'Parla', 'noempesquen' ),
			AppIcona: IconaParla,
			titol: p.titol,
			imatge: (
				<span className="nep-so-notif__avatar">
					<Avatar mida={ 40 } />
				</span>
			),
		};
	}
	if ( p.tipus === 'posta' ) {
		return {
			app: __( 'Posta', 'noempesquen' ),
			AppIcona: IconaPosta,
			titol: p.titol,
			imatge: <IconaPosta mida={ 36 } />,
		};
	}
	return {
		app: p.app,
		AppIcona: APPS[ n.app ]?.Icona ?? IconaCampana,
		titol: p.titol,
		imatge: null,
	};
}

/**
 * Cos clicable d'una notificació (compartit pel toast i pel centre).
 *
 * @param {Object}   props
 * @param {Object}   props.n      Notificació.
 * @param {Object}   props.d      Presentació (vegeu descriu).
 * @param {Function} props.onObre Obre l'app de la notificació.
 * @param {string}   [props.tut]  Clau `data-tut` (només el toast).
 */
export function CosNotificacio( { n, d, onObre, tut } ) {
	return (
		<button
			type="button"
			className="nep-so-notif__cos"
			data-tut={ tut }
			onClick={ onObre }
		>
			{ d.imatge && (
				<span className="nep-so-notif__imatge">{ d.imatge }</span>
			) }
			<span className="nep-so-notif__text">
				<strong className="nep-so-notif__titol">{ d.titol }</strong>
				<span className="nep-so-notif__missatge">{ n.text }</span>
			</span>
		</button>
	);
}

function Toast( { n, sortint, restes, onObre, onDescarta } ) {
	const joc = useJoc();
	const li = useRef( null );
	const { aturat, handlers } = useAturadaAvis();
	const d = descriu( n, joc );
	const surt = ( accio ) => () => {
		apartaFocus( li.current );
		accio();
	};

	// Visible segons la llargada del text (duradaAvis); el comptador s'atura
	// amb el ratolí o el focus de teclat a sobre, durant la pausa i amb el
	// centre obert, i en reprendre continua amb el temps que quedava.
	useTempsRestant(
		duradaAvis( n.text ),
		aturat ||
			joc.estat.pausa ||
			sortint ||
			// Un pas del tutorial hi apunta: no caduca fins que se'n surti.
			ancoraDelPas( joc.missio, joc.estat ) === 'avis',
		{
			restes,
			id: n.id,
			onCaduca: surt( onDescarta ),
		}
	);

	return (
		<li
			ref={ li }
			className={ `nep-so-toast nep-so-notif${
				sortint ? ' is-sortint' : ''
			}` }
			inert={ sortint ? '' : undefined }
			{ ...handlers }
		>
			<div className="nep-so-notif__cap">
				<d.AppIcona mida={ 16 } />
				<span>{ d.app }</span>
				<button
					type="button"
					className="nep-so-notif__descarta"
					aria-label={ __(
						'Descarta la notificació',
						'noempesquen'
					) }
					onClick={ surt( onDescarta ) }
				>
					<IconaTanca />
				</button>
			</div>
			{ /* L'àncora és el cos: la X queda sota el vel del tutorial. */ }
			<CosNotificacio
				n={ n }
				d={ d }
				tut="avis"
				onObre={ surt( onObre ) }
			/>
		</li>
	);
}

/**
 * Toasts de les notificacions noves (abaix a la dreta) i regió aria-live
 * amb les que entren a la vista. No es mostren les de Parla si Parla és en
 * primer pla (tampoc les que ja esperaven a la cua).
 *
 * @param {Object}   props
 * @param {Function} props.onObre      Obre l'app d'una notificació.
 * @param {boolean}  props.parlaActiva Parla és la finestra activa.
 * @param {boolean}  props.amagats     El centre de notificacions és obert.
 * @param {boolean}  props.silenci     Encara es veu el bloqueig: sense toasts.
 */
export function Toasts( { onObre, parlaActiva, amagats, silenci } ) {
	const joc = useJoc();
	const llista = useRef( null );
	const { visibles, sortint, treu, restes, anuncis } = useCuaAvisos( {
		notificacions: joc.estat.notificacions,
		pausa: joc.estat.pausa,
		amagats,
		silenci,
		max: MAX_TOASTS,
		oculta: ( n ) => n.app === 'parla' && ! n.font && parlaActiva,
		clauOculta: parlaActiva,
		textAnunci: ( n ) => {
			const d = descriu( n, joc );
			return `${ d.app }. ${ d.titol }: ${ n.text }`;
		},
		llista,
	} );

	return (
		<>
			<ul
				ref={ llista }
				className="nep-so-toasts"
				aria-label={ __( 'Notificacions noves', 'noempesquen' ) }
			>
				{ visibles.map( ( n ) => (
					<Toast
						key={ n.id }
						n={ n }
						sortint={ sortint.has( n.id ) }
						restes={ restes }
						onObre={ () => {
							treu( n.id );
							onObre( n );
						} }
						onDescarta={ () => treu( n.id ) }
					/>
				) ) }
			</ul>
			<RegioAnuncis anuncis={ anuncis } />
		</>
	);
}
