import {
	Suspense,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { APPS } from '../../apps/registre';
import {
	IconaMaximitza,
	IconaMinimitza,
	IconaRestaura,
	IconaTanca,
} from '../../ui/icones';
import { FinestraContext } from './context';
import { delta, menysMoviment } from './moviment';
import { useEscala } from '../../simulador/PantallaSistema';

const CASCADA = 36;
const MARGE = 8;
/* Mida de referència de la primera finestra (la del navegador, vegeu _pc.scss). */
const REF_AMPLADA = 1120;
const REF_ALCADA = 760;
/* Part de la barra de títol que sempre ha de quedar a l'abast. */
const VISIBLE_MINIM = 120;
const ALCADA_BARRA = 32;

/* Àncores del tutorial (`data-tut`) de les finestres. */
const TUT_FINESTRA = {
	navegador: 'finestra-navegador',
	parla: 'finestra-parla',
};

/**
 * Posició inicial en cascada a partir de l'origen que centraria la
 * finestra de referència, sense sortir de l'escriptori.
 *
 * @param {HTMLElement} el    Finestra.
 * @param {number}      ordre Posició en l'ordre d'obertura.
 * @return {{x:number, y:number}} Posició en píxels.
 */
function posicioInicial( el, ordre ) {
	const pare = el.offsetParent;
	const W = pare?.clientWidth ?? 0;
	const H = pare?.clientHeight ?? 0;
	const x0 = ( W - Math.min( REF_AMPLADA, W - 120 ) ) / 2;
	const y0 = ( H - Math.min( REF_ALCADA, H - 96 ) ) / 2;
	const x = Math.min( x0 + ordre * CASCADA, W - el.offsetWidth - MARGE );
	const y = Math.min( y0 + ordre * CASCADA, H - el.offsetHeight - MARGE );
	return {
		x: Math.round( Math.max( MARGE, x ) ),
		y: Math.round( Math.max( MARGE, y ) ),
	};
}

function limita( el, { x, y } ) {
	const pare = el.offsetParent;
	const W = pare?.clientWidth ?? 0;
	const H = pare?.clientHeight ?? 0;
	return {
		x: Math.min(
			Math.max( x, VISIBLE_MINIM - el.offsetWidth ),
			W - VISIBLE_MINIM
		),
		y: Math.min( Math.max( y, 0 ), H - ALCADA_BARRA ),
	};
}

/**
 * Finestra d'una app: arrossegable per la barra de títol, amb minimitza,
 * maximitza i tanca. Es manté muntada minimitzada per conservar l'estat.
 *
 * @param {Object}   props
 * @param {Object}   props.finestra    { id, app, minimitzada, maximitzada, z, dades }.
 * @param {number}   props.ordre       Ordre d'obertura (per a la cascada).
 * @param {boolean}  props.enfocada    És la finestra activa.
 * @param {Function} props.onEnfoca    Porta-la al davant.
 * @param {Function} props.onMinimitza Minimitza-la.
 * @param {Function} props.onMaximitza Alterna maximitzada/restaurada.
 * @param {Function} props.onTanca     Tanca-la (després de l'animació).
 * @param {Function} props.onMou       Avisa que el jugador l'ha moguda (rect).
 */
export function Finestra( {
	finestra,
	ordre,
	enfocada,
	onEnfoca,
	onMinimitza,
	onMaximitza,
	onTanca,
	onMou,
} ) {
	const { nom, Icona, Component } = APPS[ finestra.app ];
	const arrel = useRef( null );
	const cos = useRef( null );
	const arrossega = useRef( null );
	const escala = useEscala();
	const [ pos, setPos ] = useState( null );
	const [ titol, setTitol ] = useState( nom );
	const [ tancant, setTancant ] = useState( false );
	const ctx = useMemo( () => ( { posaTitol: setTitol } ), [] );
	const { minimitzada, maximitzada, manual, rect } = finestra;
	const mogut = useRef( false );

	useLayoutEffect( () => {
		setPos(
			rect
				? { x: rect.x, y: rect.y }
				: posicioInicial( arrel.current, ordre )
		);
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Reajust automàtic (s'ha obert, restaurat o tancat una altra finestra):
	// només si no és manual. Sense rect, torna a la posició per defecte.
	const clau = rect
		? `${ rect.x },${ rect.y },${ rect.amplada },${ rect.alcada }`
		: '';
	const teRect = useRef( !! rect );
	useLayoutEffect( () => {
		if ( manual ) {
			return;
		}
		if ( rect ) {
			setPos( { x: rect.x, y: rect.y } );
		} else if ( teRect.current ) {
			setPos( posicioInicial( arrel.current, 0 ) );
		}
		teRect.current = !! rect;
	}, [ clau, manual ] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Focus al contingut quan passa a ser activa, si no hi és ja (un clic
	// a dins no s'ha de perdre).
	useEffect( () => {
		const el = arrel.current;
		if (
			enfocada &&
			! minimitzada &&
			! el.contains( el.ownerDocument.activeElement )
		) {
			cos.current?.focus( { preventScroll: true } );
		}
	}, [ enfocada, minimitzada ] );

	const tanca = () => {
		if ( menysMoviment() ) {
			onTanca();
		} else {
			setTancant( true );
		}
	};

	const iniciaArrossegament = ( e ) => {
		if ( e.button !== 0 || maximitzada || e.target.closest( 'button' ) ) {
			return;
		}
		e.currentTarget.setPointerCapture?.( e.pointerId );
		mogut.current = false;
		arrossega.current = { px: e.clientX, py: e.clientY, ...pos };
	};
	const mou = ( e ) => {
		const d = arrossega.current;
		if ( d ) {
			mogut.current = true;
			const { dx, dy } = delta(
				e.clientX - d.px,
				e.clientY - d.py,
				escala
			);
			const nova = limita( arrel.current, {
				x: d.x + dx,
				y: d.y + dy,
			} );
			d.actual = nova;
			setPos( nova );
		}
	};
	const deixa = () => {
		const d = arrossega.current;
		if ( d?.actual && mogut.current ) {
			const el = arrel.current;
			onMou( {
				x: d.actual.x,
				y: d.actual.y,
				amplada: el.offsetWidth,
				alcada: el.offsetHeight,
			} );
		}
		mogut.current = false;
		arrossega.current = null;
	};

	const classes = [
		'nep-so-finestra',
		`nep-so-finestra--${ finestra.app }`,
		enfocada ? 'is-activa' : 'is-inactiva',
		minimitzada && 'is-minimitzada',
		maximitzada && 'is-maximitzada',
		tancant && 'is-tancant',
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<section
			ref={ arrel }
			className={ classes }
			aria-label={ titol }
			data-tut={ TUT_FINESTRA[ finestra.app ] }
			style={ {
				zIndex: finestra.z,
				left: maximitzada ? undefined : pos?.x,
				top: maximitzada ? undefined : pos?.y,
				width: maximitzada ? undefined : rect?.amplada,
				height: maximitzada ? undefined : rect?.alcada,
			} }
			inert={ minimitzada || tancant ? '' : undefined }
			onPointerDownCapture={ enfocada ? undefined : onEnfoca }
			onAnimationEnd={ ( e ) => {
				if ( tancant && e.target === e.currentTarget ) {
					onTanca();
				}
			} }
		>
			{ /* Arrossegar és només amb punter; amb teclat hi ha Maximitza. */ }
			<div
				className="nep-so-finestra__barra"
				onPointerDown={ iniciaArrossegament }
				onPointerMove={ mou }
				onPointerUp={ deixa }
				onPointerCancel={ deixa }
				onDoubleClick={ ( e ) => {
					if ( ! e.target.closest( 'button' ) ) {
						onMaximitza();
					}
				} }
			>
				<span className="nep-so-finestra__icona">
					<Icona mida={ 16 } />
				</span>
				<span className="nep-so-finestra__titol">{ titol }</span>
				<div
					className="nep-so-finestra__controls"
					data-tut="botons-finestra"
				>
					<button
						type="button"
						className="nep-so-finestra__control"
						aria-label={ __( 'Minimitza', 'noempesquen' ) }
						title={ __( 'Minimitza', 'noempesquen' ) }
						onClick={ onMinimitza }
					>
						<IconaMinimitza />
					</button>
					<button
						type="button"
						className="nep-so-finestra__control"
						aria-label={
							maximitzada
								? __( 'Restaura', 'noempesquen' )
								: __( 'Maximitza', 'noempesquen' )
						}
						title={
							maximitzada
								? __( 'Restaura', 'noempesquen' )
								: __( 'Maximitza', 'noempesquen' )
						}
						onClick={ onMaximitza }
					>
						{ maximitzada ? <IconaRestaura /> : <IconaMaximitza /> }
					</button>
					<button
						type="button"
						className="nep-so-finestra__control nep-so-finestra__control--tanca"
						aria-label={ __( 'Tanca', 'noempesquen' ) }
						title={ __( 'Tanca', 'noempesquen' ) }
						onClick={ tanca }
					>
						<IconaTanca />
					</button>
				</div>
			</div>
			<div ref={ cos } className="nep-so-finestra__cos" tabIndex={ -1 }>
				<FinestraContext.Provider value={ ctx }>
					<Suspense fallback={ null }>
						<Component dades={ finestra.dades } />
					</Suspense>
				</FinestraContext.Provider>
			</div>
		</section>
	);
}
