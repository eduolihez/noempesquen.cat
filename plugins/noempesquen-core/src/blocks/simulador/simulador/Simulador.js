import {
	lazy,
	Suspense,
	useReducer,
	useRef,
	useEffect,
	useCallback,
	useMemo,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { FASE, estatInicial, reductor, puntuacio } from '../nucli/motor';
import { PERSONATGES } from '../app/avatars';
import { JocContext } from './context';
import { usePantallaCompleta } from './usePantallaCompleta';
import { horaDeJoc } from './hora';
import { Pausa } from './Pausa';

const MS_TICK = 1000;
const SISTEMES = {
	pc: lazy( () => import( '../sistemes/pc/Pc' ) ),
};

function Carregant() {
	return (
		<div
			className="nep-so-carrega"
			role="status"
			aria-label={ __( 'Carregant el sistema', 'noempesquen' ) }
		>
			<svg
				className="nep-so-carrega__anell"
				viewBox="0 0 48 48"
				width="48"
				height="48"
				aria-hidden="true"
			>
				<circle cx="24" cy="24" r="19" />
			</svg>
		</div>
	);
}

/**
 * Carcasa del simulador: estat, rellotge, pantalla completa i pausa.
 *
 * @param {Object}    props
 * @param {Object}    props.missio  Missió v2.
 * @param {Object}    props.mon     Dades del món (contactes, webs, correus).
 * @param {Function}  props.onSurt  Torna al selector.
 * @param {Function}  props.onAcaba (id, estrelles) en arribar al resultat.
 * @param {?Function} props.seguent Passa a la missió següent, si n'hi ha.
 */
export function Simulador( { missio, mon, onSurt, onAcaba, seguent } ) {
	const arrel = useRef( null );
	const menus = useRef( [] );
	const [ estat, dispatch ] = useReducer(
		( e, a ) => reductor( missio, e, a ),
		missio,
		estatInicial
	);
	const fase = useRef( estat.fase );
	fase.current = estat.fase;
	const pausa = useRef( estat.pausa );
	pausa.current = estat.pausa;

	const { entra, surt, fixa } = usePantallaCompleta( arrel, () => {
		if ( fase.current === FASE.JOC ) {
			dispatch( { tipus: 'PAUSA' } );
		}
	} );

	// El clic a la targeta és el gest d'usuari: demanem pantalla completa
	// en muntar. Si el navegador la rebutja, s'activa la capa fixa.
	useEffect( () => {
		entra();
		arrel.current?.focus();
	}, [ entra ] );

	useEffect( () => {
		if ( estat.fase !== FASE.JOC || estat.pausa ) {
			return undefined;
		}
		const id = setInterval(
			() => dispatch( { tipus: 'TICK', segons: 1 } ),
			MS_TICK
		);
		return () => clearInterval( id );
	}, [ estat.fase, estat.pausa ] );

	useEffect( () => {
		if ( estat.fase === FASE.RESULTAT ) {
			onAcaba( missio.id, puntuacio( missio, estat ).estrelles );
		}
	}, [ estat.fase ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const emet = useCallback(
		( nom, dades = {} ) =>
			dispatch( { tipus: 'ESDEVENIMENT', nom, dades } ),
		[]
	);

	const registraMenu = useCallback( ( tanca ) => {
		menus.current.push( tanca );
		return () => {
			const i = menus.current.lastIndexOf( tanca );
			if ( i >= 0 ) {
				menus.current.splice( i, 1 );
			}
		};
	}, [] );

	// A document: si el botó que tenia el focus desapareix, el focus cau a
	// <body> i un keydown a l'arrel no arribaria mai.
	useEffect( () => {
		const onKeyDown = ( e ) => {
			if ( e.key !== 'Escape' || pausa.current ) {
				return;
			}
			e.preventDefault();
			const tanca = menus.current.pop();
			if ( tanca ) {
				tanca();
			} else {
				dispatch( { tipus: 'PAUSA' } );
			}
		};
		document.addEventListener( 'keydown', onKeyDown );
		return () => document.removeEventListener( 'keydown', onKeyDown );
	}, [] );

	const { nom: nomGuia, Avatar } =
		PERSONATGES[ missio.personatge ] ?? PERSONATGES.llissa;
	const hora = horaDeJoc( missio.rellotge, estat.temps );

	const ctx = useMemo(
		() => ( {
			missio,
			mon,
			estat,
			dispatch,
			emet,
			hora,
			nomGuia,
			Avatar,
			registraMenu,
			seguent,
		} ),
		[
			missio,
			mon,
			estat,
			emet,
			hora,
			nomGuia,
			Avatar,
			registraMenu,
			seguent,
		]
	);

	const Sistema = SISTEMES[ missio.dispositiu ] ?? SISTEMES.pc;

	const continua = () => {
		dispatch( { tipus: 'REPREN' } );
		entra();
	};
	const reinicia = () => {
		dispatch( { tipus: 'REINICIA' } );
		entra();
	};
	const surtDelJoc = async () => {
		await surt();
		onSurt();
	};

	return (
		<JocContext.Provider value={ ctx }>
			<div
				ref={ arrel }
				className={ `nep-so${ fixa ? ' nep-so--fixa' : '' }` }
				tabIndex={ -1 }
			>
				<div
					className="nep-so__sistema"
					inert={ estat.pausa ? '' : undefined }
				>
					<Suspense fallback={ <Carregant /> }>
						<Sistema />
					</Suspense>
				</div>
				{ estat.pausa && (
					<Pausa
						onContinua={ continua }
						onReinicia={ reinicia }
						onSurt={ surtDelJoc }
					/>
				) }
			</div>
		</JocContext.Provider>
	);
}
