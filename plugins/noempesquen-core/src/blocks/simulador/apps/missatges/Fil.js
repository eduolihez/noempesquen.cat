import { useEffect, useId, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { Cos } from '../../ui/Cos';
import { Inspeccionable } from '../../ui/Inspeccionable';
import { parteixHora } from '../parla/xats.js';
import { destiResposta } from './fils.js';
import { IconaContactes, IconaEnrere, IconaEnvia, IconaMes } from './icones';

/* Mil·lisegons de pulsació per considerar-la llarga. */
const MS_LLARG = 500;
/* Píxels de moviment que cancel·len la pulsació llarga. */
const TOLERANCIA = 10;

const esTeclaMenu = ( e ) =>
	( e.shiftKey && e.key === 'F10' ) || e.key === 'ContextMenu';

/**
 * Pulsació llarga, botó dret i Maj+F10 sobre un missatge: sobre un enllaç
 * obren el full de l'enllaç; a la resta, el menú del missatge. Després
 * d'una pulsació llarga, el clic que arriba s'ignora (no obre l'enllaç).
 *
 * @param {Function} onPremut ( target ) es crida en un gest de menú.
 * @param {boolean}  actiu    False amb la lupa: els gestos no fan res.
 * @return {Object} Propietats per a l'element del missatge.
 */
function useGestosMenu( onPremut, actiu ) {
	const premut = useRef( null );
	const suprimeix = useRef( false );

	const cancella = () => {
		if ( premut.current ) {
			clearTimeout( premut.current.temps );
			premut.current = null;
		}
	};
	useEffect( () => cancella, [] );

	return {
		onPointerDown: ( e ) => {
			suprimeix.current = false;
			cancella();
			if ( ! actiu || e.button !== 0 ) {
				return;
			}
			const target = e.target;
			premut.current = {
				x: e.clientX,
				y: e.clientY,
				temps: setTimeout( () => {
					premut.current = null;
					suprimeix.current = true;
					onPremut( target );
				}, MS_LLARG ),
			};
		},
		onPointerMove: ( e ) => {
			const p = premut.current;
			if (
				p &&
				Math.hypot( e.clientX - p.x, e.clientY - p.y ) > TOLERANCIA
			) {
				cancella();
			}
		},
		onPointerUp: cancella,
		onPointerCancel: cancella,
		onPointerLeave: cancella,
		onClickCapture: ( e ) => {
			if ( suprimeix.current ) {
				suprimeix.current = false;
				e.preventDefault();
				e.stopPropagation();
			}
		},
		onContextMenu: ( e ) => {
			e.preventDefault();
			cancella();
			if ( actiu ) {
				onPremut( e.target );
			}
		},
		onKeyDown: ( e ) => {
			if ( esTeclaMenu( e ) ) {
				e.preventDefault();
				if ( actiu ) {
					onPremut( e.target );
				}
			}
		},
	};
}

function Missatge( { m, nom, onMenu, onMantingut, onObreEnllac } ) {
	const { estat } = useJoc();
	const refMes = useRef( null );
	const gestos = useGestosMenu( ( target ) => {
		const enllac = target?.closest?.( 'a.nep-enllac' );
		if ( enllac ) {
			onMantingut( enllac.getAttribute( 'href' ), enllac );
		} else {
			onMenu( m, refMes.current );
		}
	}, ! estat.lupa );
	const propi = m.de === 'jo';
	const { dia, hora } = parteixHora( m.hora );

	return (
		<li
			className={ `nep-missatges-msg ${
				propi ? 'is-propi' : 'is-rebut'
			}` }
			data-missatge={ m.id }
			{ ...gestos }
		>
			<div className="nep-missatges-msg__bombolla">
				<span className="nep-so-sr">
					{ propi
						? __( 'Tu:', 'noempesquen' )
						: sprintf(
								/* translators: %s: nom del contacte */
								__( '%s:', 'noempesquen' ),
								nom
							) }
				</span>
				{ m.cos ? (
					<Cos paragrafs={ m.cos } onEnllac={ onObreEnllac } />
				) : (
					<p>{ m.text }</p>
				) }
				<span className="nep-missatges-msg__hora">
					{ dia ? `${ dia } ${ hora }` : hora }
				</span>
			</div>
			<button
				ref={ refMes }
				type="button"
				className="nep-missatges-msg__mes"
				aria-haspopup="dialog"
				aria-label={ __( 'Opcions del missatge', 'noempesquen' ) }
				title={ __( 'Opcions del missatge', 'noempesquen' ) }
				onClick={ ( e ) => onMenu( m, e.currentTarget ) }
			>
				<IconaMes mida={ 18 } />
			</button>
		</li>
	);
}

/**
 * Conversa d'un fil: capçalera amb «enrere» i fitxa, missatges i camp de
 * resposta. El camp no és controlat: el text no surt d'aquí i es buida en
 * enviar; al motor només li arriba { app, id }.
 *
 * @param {Object}   props
 * @param {Object}   props.fil          Fil { nom, senyal, missatges }.
 * @param {boolean}  props.bloquejat    El contacte està bloquejat.
 * @param {Object}   props.refResposta  Ref del camp de resposta.
 * @param {Object}   props.respostaA    Ref: id del missatge al qual es respon.
 * @param {Function} props.onTorna      Torna a la llista.
 * @param {Function} props.onFitxa      ( origen ) obre la fitxa del contacte.
 * @param {Function} props.onMenu       ( missatge, origen ) obre el menú.
 * @param {Function} props.onMantingut  ( url, origen ) full de l'enllaç.
 * @param {Function} props.onObreEnllac ( url ) obre l'enllaç.
 * @param {Function} props.onRespon     ( id ) resposta enviada.
 */
export function Fil( {
	fil,
	bloquejat,
	refResposta,
	respostaA,
	onTorna,
	onFitxa,
	onMenu,
	onMantingut,
	onObreEnllac,
	onRespon,
} ) {
	const llista = useRef( null );
	const idCamp = useId();

	useEffect( () => {
		const ol = llista.current;
		if ( ol ) {
			ol.scrollTop = ol.scrollHeight;
		}
	}, [ fil.missatges.length ] );

	const envia = ( e ) => {
		e.preventDefault();
		const form = e.currentTarget;
		const camp = form.elements.namedItem( 'resposta' );
		if ( ! camp?.value.trim() ) {
			return;
		}
		const id = destiResposta( fil, respostaA.current );
		form.reset();
		respostaA.current = null;
		if ( id ) {
			onRespon( id );
		}
	};

	return (
		<div className="nep-missatges-fil">
			<header className="nep-missatges__cap">
				<button
					type="button"
					className="nep-missatges__boto"
					aria-label={ __( 'Torna a les converses', 'noempesquen' ) }
					title={ __( 'Torna a les converses', 'noempesquen' ) }
					onClick={ onTorna }
				>
					<IconaEnrere mida={ 22 } />
				</button>
				<span className="nep-missatges__avatar" aria-hidden="true">
					{ fil.nom.replace( /^\+/, '' ).charAt( 0 ) }
				</span>
				<h2 className="nep-missatges__titol" tabIndex={ -1 }>
					<Inspeccionable text={ fil.nom } senyal={ fil.senyal } />
				</h2>
				<button
					type="button"
					className="nep-missatges__boto"
					aria-label={ __( 'Fitxa del contacte', 'noempesquen' ) }
					title={ __( 'Fitxa del contacte', 'noempesquen' ) }
					onClick={ ( e ) => onFitxa( e.currentTarget ) }
				>
					<IconaContactes mida={ 22 } />
				</button>
			</header>
			<ol
				ref={ llista }
				className="nep-missatges-fil__llista"
				aria-label={ __( 'Missatges', 'noempesquen' ) }
			>
				{ fil.missatges.map( ( m ) => (
					<Missatge
						key={ m.id }
						m={ m }
						nom={ fil.nom }
						onMenu={ onMenu }
						onMantingut={ onMantingut }
						onObreEnllac={ onObreEnllac }
					/>
				) ) }
			</ol>
			{ bloquejat ? (
				<p className="nep-missatges-fil__bloquejat">
					{ __(
						'Has bloquejat aquest número. No en rebràs més missatges.',
						'noempesquen'
					) }
				</p>
			) : (
				<form
					className="nep-missatges-fil__resposta"
					onSubmit={ envia }
					autoComplete="off"
				>
					<label className="nep-so-sr" htmlFor={ idCamp }>
						{ __( 'Escriu un missatge', 'noempesquen' ) }
					</label>
					<input
						ref={ refResposta }
						id={ idCamp }
						name="resposta"
						type="text"
						autoComplete="off"
						spellCheck={ false }
						placeholder={ __( 'Missatge de text', 'noempesquen' ) }
					/>
					<button
						type="submit"
						className="nep-missatges-fil__envia"
						aria-label={ __( 'Envia', 'noempesquen' ) }
						title={ __( 'Envia', 'noempesquen' ) }
					>
						<IconaEnvia mida={ 20 } />
					</button>
				</form>
			) }
		</div>
	);
}
