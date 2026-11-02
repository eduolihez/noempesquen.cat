import { useEffect, useRef, useState } from '@wordpress/element';
import { clauTancat, clauWeb } from '../../nucli/motor';
import { useJoc } from '../../simulador/context';
import { Cos } from '../../ui/Cos';
import { Inspeccionable } from '../../ui/Inspeccionable';
import { AvisFals } from '../comu/AvisFals';
import { BarraActualitzacio } from '../comu/BarraActualitzacio';
import { DescarregaFicticia } from '../comu/DescarregaFicticia';
import { normalitzaParagrafs } from '../comu/avis';
import { avancaVisible, avisToca } from './retard';

/**
 * Logotip neutre del lloc: una fulla dins d'un cercle (SVG propi).
 */
function MarcaLloc() {
	return (
		<svg
			className="nep-ar-marca__icona"
			viewBox="0 0 32 32"
			width="28"
			height="28"
			aria-hidden="true"
			focusable="false"
		>
			<circle cx="16" cy="16" r="15" fill="#0f766e" />
			<path
				d="M10 21c0-7 5-11 12-11 0 7-4 12-11 12M11 22l6-6"
				fill="none"
				stroke="#fff"
				strokeWidth="2.2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

/**
 * Una secció de l'article: títol i paràgrafs (`cos`) o una llista (`llista`).
 *
 * @param {Object}   props
 * @param {Object}   props.seccio     `{ titol, cos? , llista? }`.
 * @param {Function} props.navega     Navega dins la pestanya.
 * @param {Function} props.onHoverUrl Barra d'estat.
 */
function Seccio( { seccio, navega, onHoverUrl } ) {
	const llista = Array.isArray( seccio?.llista ) ? seccio.llista : null;
	return (
		<section className="nep-ar-seccio">
			{ seccio?.titol && <h2>{ seccio.titol }</h2> }
			{ llista ? (
				<ul>
					{ llista.map( ( seg, i ) => (
						<li key={ i }>
							<Inspeccionable
								text={ seg?.t ?? '' }
								senyal={ seg?.senyal }
							/>
						</li>
					) ) }
				</ul>
			) : (
				<Cos
					paragrafs={ normalitzaParagrafs( seccio?.cos ) }
					onEnllac={ navega }
					onHoverUrl={ onHoverUrl }
				/>
			) }
		</section>
	);
}

/**
 * Web de contingut neutra (receptes, el temps...). Amb `dades.avis`, al cap de
 * `retard_ms` ms de joc surt un avís fals a sobre de la pàgina; amb
 * `dades.barra`, una barra falsa d'actualització a dalt. Els esdeveniments
 * només porten `{ url }` o `{ url, fitxer }`.
 *
 * @param {Object}   props
 * @param {Object}   props.dades      Web de la missió.
 * @param {string}   props.url        URL de la pàgina.
 * @param {Function} props.navega     Navega dins la pestanya.
 * @param {Function} props.onHoverUrl Barra d'estat.
 * @param {boolean}  props.visible    Si la pestanya és l'activa: si no, no
 *                                    es munta cap avís ni compta el retard.
 */
export default function Article( {
	dades,
	url,
	navega,
	onHoverUrl,
	visible = true,
} ) {
	const { estat, emet, dispatch } = useJoc();
	const ara = estat.temps ?? 0;
	const [ comptador, setComptador ] = useState( () => ( {
		ultim: ara,
		visible: 0,
	} ) );
	// El retard només compta mentre la pestanya és visible i la intro ha
	// acabat (cap avís abans de la intro).
	const compta = visible && estat.introAcabada !== false;
	useEffect( () => {
		setComptador( ( c ) => avancaVisible( c, ara, compta ) );
	}, [ ara, compta ] );
	// El que es tanca viu al motor: en tornar a la web es queda tancat.
	const tancats = estat.tancats ?? [];
	const avisTancat = tancats.includes( clauTancat( url, 'avis' ) );
	const barraTancada = tancats.includes( clauTancat( url, 'barra' ) );
	const tanca = ( element ) =>
		dispatch( { tipus: 'TANCA_WEB', url, element } );
	const [ baixada, setBaixada ] = useState( null );
	const avis = dades?.avis ?? null;
	const barra = dades?.barra ?? null;
	const seccions = Array.isArray( dades?.seccions ) ? dades.seccions : [];
	const clau = clauWeb( url );
	// Si l'avís ja havia sortit en aquesta web, no es torna a esperar el retard.
	const avisVist = ( estat.avisosVistos ?? [] ).includes( clau );
	const mostraAvis =
		visible &&
		!! avis &&
		! avisTancat &&
		( avisVist || avisToca( avis.retard_ms, 0, comptador.visible ) );
	// `avis.apareix` surt un sol cop per web: el motor en guarda el rastre.
	const emes = useRef( false );
	useEffect( () => {
		if ( mostraAvis && ! avisVist && ! emes.current ) {
			emes.current = true;
			emet( 'avis.apareix', { url } );
		}
	}, [ mostraAvis, avisVist, emet, url ] );
	const instala = avis?.instal_la ?? null;

	return (
		<div className="nep-ar">
			{ visible && barra && ! barraTancada && (
				<BarraActualitzacio
					text={ barra.text }
					boto={ barra.boto }
					onDescarrega={ () => setBaixada( barra ) }
					onTanca={ () => tanca( 'barra' ) }
				/>
			) }
			{ /* Desplaçament propi: els avisos (absolute) cobreixen sempre la
			part visible de la pàgina. */ }
			<div
				className="nep-ar__contingut"
				role="region"
				aria-label={ dades?.nom_lloc }
				tabIndex={ 0 }
			>
				<header className="nep-ar-cap">
					<span className="nep-ar-marca">
						<MarcaLloc />
						<span className="nep-ar-marca__nom">
							{ dades?.nom_lloc }
						</span>
					</span>
				</header>
				<main className="nep-ar-cos">
					<h1>{ dades?.titol }</h1>
					{ dades?.entradeta && (
						<div className="nep-ar-entradeta">
							<Cos
								paragrafs={ normalitzaParagrafs(
									dades.entradeta
								) }
								onEnllac={ navega }
								onHoverUrl={ onHoverUrl }
							/>
						</div>
					) }
					{ seccions.map( ( s, i ) => (
						<Seccio
							key={ i }
							seccio={ s }
							navega={ navega }
							onHoverUrl={ onHoverUrl }
						/>
					) ) }
				</main>
				<footer className="nep-ar-peu">
					<p>{ dades?.nom_lloc }</p>
				</footer>
			</div>
			{ mostraAvis && (
				<AvisFals
					titol={ avis.titol }
					cos={ avis.cos }
					telefon={ avis.telefon }
					etiquetaTelefon={ avis.etiquetaTelefon }
					senyalTelefon={ avis.senyal_telefon }
					contador={ avis.contador }
					reobre={ !! avis.reobre }
					onTruca={ () => emet( 'telefon.truca', { url } ) }
					onTanca={ () => tanca( 'avis' ) }
				>
					{ instala && (
						<button
							type="button"
							className="nep-avis__instala"
							onClick={ () => setBaixada( instala ) }
						>
							{ instala.text_boto }
						</button>
					) }
				</AvisFals>
			) }
			{ visible && baixada && (
				<DescarregaFicticia
					fitxer={ baixada.fitxer }
					origen={ baixada.origen }
					senyalFitxer={ baixada.senyal_fitxer }
					senyalOrigen={ baixada.senyal_origen }
					onObre={ () => {
						const { fitxer } = baixada;
						setBaixada( null );
						emet( 'descarrega.fes', { url, fitxer } );
					} }
					onCancela={ () => setBaixada( null ) }
				/>
			) }
		</div>
	);
}
