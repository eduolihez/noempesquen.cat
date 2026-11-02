import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { IconaTanca } from '../../ui/icones';
import { CosNotificacio, descriu } from './notificacio';
import { duradaAvis } from '../../nucli/avisos';
import { MAX_BANNERS } from '../../nucli/temps';
import {
	RegioAnuncis,
	apartaFocus,
	useAturadaAvis,
	useCuaAvisos,
	useTempsRestant,
} from '../../simulador/useCuaAvisos';

/* Píxels de lliscament cap amunt per descartar-lo. */
const LLISCA = 30;

function Banner( { n, sortint, restes, onObre, onDescarta } ) {
	const joc = useJoc();
	const li = useRef( null );
	const inici = useRef( null );
	const { aturat, handlers } = useAturadaAvis();
	const surt = ( accio ) => () => {
		apartaFocus( li.current );
		accio();
	};

	// Visible segons la llargada del text (duradaAvis); el comptador s'atura
	// amb el ratolí o el focus de teclat a sobre, durant la pausa i amb el
	// centre obert, i en reprendre continua amb el temps que quedava.
	useTempsRestant(
		duradaAvis( n.text ),
		aturat || joc.estat.pausa || sortint,
		{
			restes,
			id: n.id,
			onCaduca: surt( onDescarta ),
		}
	);

	return (
		<li
			ref={ li }
			className={ `nep-so-m-banner${ sortint ? ' is-sortint' : '' }` }
			data-tut="banner"
			inert={ sortint ? '' : undefined }
			{ ...handlers }
			onPointerDown={ ( e ) => {
				inici.current = e.clientY;
			} }
			onPointerUp={ ( e ) => {
				if (
					inici.current !== null &&
					inici.current - e.clientY > LLISCA
				) {
					surt( onDescarta )();
				}
				inici.current = null;
			} }
		>
			<CosNotificacio
				n={ n }
				d={ descriu( n, joc ) }
				onObre={ surt( onObre ) }
			/>
			<button
				type="button"
				className="nep-so-m-banner__descarta"
				aria-label={ __( 'Descarta la notificació', 'noempesquen' ) }
				title={ __( 'Descarta la notificació', 'noempesquen' ) }
				onClick={ surt( onDescarta ) }
			>
				<IconaTanca />
			</button>
		</li>
	);
}

/**
 * Banners de les notificacions noves (a dalt de la pantalla) i regió
 * aria-live amb les que entren a la vista. Tocar-ne un obre l'app; lliscar
 * cap amunt el descarta. Les notificacions surten de `estat.notificacions`
 * del motor: les apps no emeten banners directament. No es mostren les de
 * l'app en primer pla (tampoc les que ja esperaven a la cua).
 *
 * @param {Object}   props
 * @param {Function} props.onObre  Obre l'app d'una notificació.
 * @param {?string}  props.activa  App en primer pla (no en mostra banners).
 * @param {boolean}  props.amagats El centre de control és obert.
 * @param {boolean}  props.silenci Encara es veu el bloqueig: sense banners.
 */
export function Banners( { onObre, activa, amagats, silenci } ) {
	const joc = useJoc();
	const llista = useRef( null );
	const { visibles, sortint, treu, restes, anuncis } = useCuaAvisos( {
		notificacions: joc.estat.notificacions,
		pausa: joc.estat.pausa,
		amagats,
		silenci,
		max: MAX_BANNERS,
		oculta: ( n ) => n.app === activa,
		clauOculta: activa,
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
				className="nep-so-m-banners"
				aria-label={ __( 'Notificacions noves', 'noempesquen' ) }
			>
				{ visibles.map( ( n ) => (
					<Banner
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
