import {
	Fragment,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { IconaCerca, IconaLupa } from '../../ui/icones';
import { IconaEnrere } from '../missatges/icones';
import { Respostes } from './Respostes';
import { AvisDesconegut, MenuXat } from './AvisDesconegut';
import { esDesconegut, estatAvis } from './desconegut';
import { parteixHora } from './xats';
import {
	IconaAvall,
	IconaCara,
	IconaClip,
	IconaLlegit,
	IconaMes,
	IconaMicro,
} from './icones';

/* Distància al final (px) per considerar que es llegeix l'últim missatge. */
const MARGE_FINAL = 40;

function etiquetaDia( dia ) {
	const dies = {
		'': __( 'Avui', 'noempesquen' ),
		ahir: __( 'Ahir', 'noempesquen' ),
		'dl.': __( 'Dilluns', 'noempesquen' ),
		'dt.': __( 'Dimarts', 'noempesquen' ),
		'dc.': __( 'Dimecres', 'noempesquen' ),
		'dj.': __( 'Dijous', 'noempesquen' ),
		'dv.': __( 'Divendres', 'noempesquen' ),
		'ds.': __( 'Dissabte', 'noempesquen' ),
		'dg.': __( 'Diumenge', 'noempesquen' ),
	};
	return dies[ dia ] ?? dia;
}

function Bombolla( { m, cua, nom } ) {
	return (
		<li
			className={ `nep-parla-msg ${ m.propi ? 'is-propi' : 'is-rebut' }${
				cua ? ' amb-cua' : ''
			}` }
		>
			<div className="nep-parla-msg__bombolla">
				<span className="nep-so-sr">
					{ m.propi
						? __( 'Tu:', 'noempesquen' )
						: sprintf(
								/* translators: %s: nom del contacte */
								__( '%s:', 'noempesquen' ),
								nom
							) }
				</span>
				<p className="nep-parla-msg__text">
					{ m.text }
					<span className="nep-parla-msg__espai" aria-hidden="true" />
				</p>
				<span className="nep-parla-msg__meta">
					{ parteixHora( m.hora ).hora }
					{ m.propi && (
						<span className="nep-parla-msg__llegit">
							<IconaLlegit />
							<span className="nep-so-sr">
								{ __( 'Llegit', 'noempesquen' ) }
							</span>
						</span>
					) }
				</span>
			</div>
			{ m.nota && (
				<p className="nep-parla-msg__nota">
					<IconaLupa mida={ 12 } />
					{ m.nota }
				</p>
			) }
		</li>
	);
}

function Escrivint() {
	return (
		<div className="nep-parla-escriu" aria-hidden="true">
			<span />
			<span />
			<span />
		</div>
	);
}

/**
 * Conversa oberta: capçalera, missatges, respostes ràpides i camp de text
 * (sempre desactivat: amb el guia es respon amb les píndoles).
 *
 * El registre de missatges no és una regió viva: els missatges del guia
 * ja els anuncia la regió de notificacions del sistema (Notificacions.js),
 * també quan Parla és en primer pla.
 *
 * @param {Object}            props
 * @param {string}            props.nom           Nom del contacte.
 * @param {string}            props.estatContacte Text sota el nom («en línia»…).
 * @param {Object}            props.avatar        Foto de perfil.
 * @param {Object[]}          props.grups         [{ dia, missatges: [{ id, propi, text, nota, hora }] }].
 * @param {boolean}           props.escriu        El contacte escriu.
 * @param {Object[]}          props.respostes     Respostes ràpides.
 * @param {(id:string)=>void} props.onResposta    Rep l'id de la resposta.
 * @param {string}            props.placeholder   Text del camp desactivat.
 * @param {()=>void}          props.onEnrere      Només al mòbil: botó per tornar a la llista.
 * @param {?Object}           props.contacte      Contacte de mon.json del xat (null: cap).
 * @param {boolean}           props.bloquejat     El número ja és bloquejat.
 * @param {()=>void}          props.onBloqueja    Bloqueja el número (desconeguts).
 */
export function Conversa( {
	nom,
	estatContacte,
	avatar,
	grups,
	escriu = false,
	respostes,
	onResposta,
	placeholder,
	onEnrere,
	contacte = null,
	bloquejat = false,
	onBloqueja,
} ) {
	const [ descartat, setDescartat ] = useState( false );
	const estat = estatAvis( { contacte, bloquejat, descartat } );
	const estatBloq = useRef( null );
	const registre = useRef( null );
	const alFinal = useRef( true );
	const [ nous, setNous ] = useState( false );
	const missatges = grups.flatMap( ( g ) => g.missatges );
	const darrer = missatges[ missatges.length - 1 ];
	const total = missatges.length;

	const baixa = () => {
		const el = registre.current;
		if ( el ) {
			el.scrollTop = el.scrollHeight;
		}
		alFinal.current = true;
		setNous( false );
	};

	// Missatge nou, «escrivint…» o canvi d'alçada de les respostes: segueix
	// el final si s'hi era (o si el missatge és propi); si no, avisa.
	useLayoutEffect( () => {
		if ( alFinal.current || darrer?.propi ) {
			baixa();
		} else {
			setNous( true );
		}
	}, [ total, escriu ] ); // eslint-disable-line react-hooks/exhaustive-deps

	useLayoutEffect( () => {
		if ( alFinal.current ) {
			baixa();
		}
	}, [ respostes.length ] );

	// Al mòbil, bloquejar torna a la llista (el focus el gestiona ParlaMobil);
	// a l'escriptori el focus passa a l'avís d'estat.
	const bloqueja = () => {
		onBloqueja();
		onEnrere?.();
	};
	useLayoutEffect( () => {
		if ( estat === 'bloquejat' ) {
			estatBloq.current?.focus();
		}
	}, [ estat ] );

	const afegeix = () => {
		setDescartat( true );
		registre.current?.focus();
	};

	const enDesplacar = () => {
		const el = registre.current;
		alFinal.current =
			el.scrollHeight - el.scrollTop - el.clientHeight < MARGE_FINAL;
		if ( alFinal.current ) {
			setNous( false );
		}
	};

	return (
		<div className="nep-parla-conversa">
			<div className="nep-parla-conversa__cap">
				{ onEnrere && (
					<button
						type="button"
						className="nep-parla-conversa__enrere"
						aria-label={ __( 'Torna als xats', 'noempesquen' ) }
						onClick={ onEnrere }
					>
						<IconaEnrere mida={ 22 } />
					</button>
				) }
				{ avatar }
				<div className="nep-parla-conversa__qui">
					<h3 className="nep-parla-conversa__nom">{ nom }</h3>
					{ estatContacte && (
						<p
							className={ `nep-parla-conversa__estat${
								escriu ? ' is-escriu' : ''
							}` }
						>
							{ estatContacte }
						</p>
					) }
				</div>
				<span className="nep-parla-conversa__accions">
					<span aria-hidden="true">
						<IconaCerca mida={ 18 } />
					</span>
					{ esDesconegut( contacte ) && ! bloquejat ? (
						<MenuXat onBloqueja={ bloqueja } />
					) : (
						<span aria-hidden="true">
							<IconaMes mida={ 18 } />
						</span>
					) }
				</span>
			</div>
			{ estat === 'avis' && (
				<AvisDesconegut onBloqueja={ bloqueja } onAfegeix={ afegeix } />
			) }
			{ estat === 'bloquejat' && (
				<p
					ref={ estatBloq }
					className="nep-parla-bloquejat"
					role="status"
					tabIndex={ -1 }
				>
					{ __( 'Has bloquejat aquest número', 'noempesquen' ) }
				</p>
			) }
			<div className="nep-parla-conversa__fil">
				{ /* Focusable per poder-lo desplaçar amb el teclat. */ }
				<div
					ref={ registre }
					className="nep-parla-missatges"
					role="log"
					aria-live="off"
					aria-label={ sprintf(
						/* translators: %s: nom del contacte */
						__( 'Missatges amb %s', 'noempesquen' ),
						nom
					) }
					tabIndex={ 0 }
					onScroll={ enDesplacar }
				>
					{ grups.map( ( g, i ) => (
						<Fragment key={ `${ g.dia }-${ i }` }>
							<p className="nep-parla-dia">
								<span>{ etiquetaDia( g.dia ) }</span>
							</p>
							<ol className="nep-parla-missatges__llista">
								{ g.missatges.map( ( m, j ) => (
									<Bombolla
										key={ m.id }
										m={ m }
										nom={ nom }
										cua={
											j === 0 ||
											g.missatges[ j - 1 ].propi !==
												m.propi
										}
									/>
								) ) }
							</ol>
						</Fragment>
					) ) }
					{ escriu && <Escrivint /> }
				</div>
				{ nous && (
					<button
						type="button"
						className="nep-parla-nous"
						onClick={ baixa }
					>
						{ __( 'Missatges nous', 'noempesquen' ) }
						<IconaAvall mida={ 16 } />
					</button>
				) }
			</div>
			<Respostes respostes={ respostes } onResposta={ onResposta } />
			<div className="nep-parla-compon">
				<span className="nep-parla-compon__eina" aria-hidden="true">
					<IconaCara mida={ 22 } />
				</span>
				<span className="nep-parla-compon__eina" aria-hidden="true">
					<IconaClip mida={ 22 } />
				</span>
				<input
					type="text"
					className="nep-parla-compon__camp"
					placeholder={ placeholder }
					aria-label={ __( 'Missatge', 'noempesquen' ) }
					disabled
				/>
				<span className="nep-parla-compon__eina" aria-hidden="true">
					<IconaMicro mida={ 22 } />
				</span>
			</div>
		</div>
	);
}
