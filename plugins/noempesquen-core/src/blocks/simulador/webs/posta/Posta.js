import {
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { IconaCerca } from '../../ui/icones';
import {
	CARPETA_ACCIO,
	carpetaDe,
	comptadors,
	correusVisibles,
	filtra,
	marca,
	perCarpeta,
} from './safata';
import { LlistaCorreus } from './LlistaCorreus';
import { Lectura } from './Lectura';
import { Denuncia } from './Denuncia';
import {
	IconaArxiva,
	IconaBrossa,
	IconaEntrada,
	IconaEnviats,
	IconaEstrella,
	IconaPaperera,
	IconaRedacta,
	MarcaPosta,
} from './icones';

const MS_AVIS = 7000;

const carpetes = () => [
	{
		id: 'entrada',
		nom: __( 'Entrada', 'noempesquen' ),
		Icona: IconaEntrada,
		buit: __( "No tens cap missatge a l'Entrada.", 'noempesquen' ),
	},
	{
		id: 'destacats',
		nom: __( 'Destacats', 'noempesquen' ),
		Icona: IconaEstrella,
		buit: __(
			"Encara no has destacat cap missatge. Fes clic a l'estrella d'un missatge per trobar-lo aquí.",
			'noempesquen'
		),
	},
	{
		id: 'enviats',
		nom: __( 'Enviats', 'noempesquen' ),
		Icona: IconaEnviats,
		buit: __( 'Encara no has enviat cap missatge.', 'noempesquen' ),
	},
	{
		id: 'arxivats',
		nom: __( 'Arxivats', 'noempesquen' ),
		Icona: IconaArxiva,
		buit: __( 'No tens cap missatge arxivat.', 'noempesquen' ),
	},
	{
		id: 'brossa',
		nom: __( 'Brossa', 'noempesquen' ),
		Icona: IconaBrossa,
		buit: __( 'No hi ha res a Brossa.', 'noempesquen' ),
	},
	{
		id: 'paperera',
		nom: __( 'Paperera', 'noempesquen' ),
		Icona: IconaPaperera,
		buit: __( 'La Paperera és buida.', 'noempesquen' ),
	},
];

const textosAvis = () => ( {
	arxiva: __( "S'ha arxivat el missatge.", 'noempesquen' ),
	esborra: __( "S'ha mogut el missatge a la Paperera.", 'noempesquen' ),
	brossa: __( "S'ha marcat el missatge com a brossa.", 'noempesquen' ),
	phishing: __(
		"S'ha denunciat el missatge i s'ha mogut a Brossa.",
		'noempesquen'
	),
} );

/* Avís efímer a baix a l'esquerra; la regió viva hi és sempre. */
function useAvis() {
	const [ avis, setAvis ] = useState( null );
	useEffect( () => {
		if ( ! avis ) {
			return undefined;
		}
		const t = setTimeout( () => setAvis( null ), MS_AVIS );
		return () => clearTimeout( t );
	}, [ avis ] );
	return [ avis, ( text ) => setAvis( { text, clau: Date.now() } ) ];
}

/**
 * Posta: correu web de l'Àlex. Safata amb carpetes, lectura i accions.
 * Les carpetes, llegits i destacats són estat local; al motor només li
 * arriben `missatge.obre` i `correu.marca`.
 *
 * @param {Object}   props
 * @param {Function} props.obrePestanya Obre un enllaç en una pestanya nova.
 * @param {Function} props.onHoverUrl   Barra d'estat del navegador.
 */
export default function Posta( { obrePestanya, onHoverUrl } ) {
	const { missio, mon, estat, emet, dispatch } = useJoc();
	const [ carpeta, setCarpeta ] = useState( 'entrada' );
	const [ obertId, setObertId ] = useState( null );
	const [ marques, setMarques ] = useState( {} );
	const [ cerca, setCerca ] = useState( '' );
	const [ denuncia, setDenuncia ] = useState( false );
	const [ avis, mostraAvis ] = useAvis();
	const arrel = useRef( null );
	const tornaA = useRef( null );
	const focusMes = useRef( false );
	const focusLlista = useRef( false );
	const idCerca = useId();

	const correus = useMemo(
		() => correusVisibles( estat, mon, missio ),
		[ estat, mon, missio ]
	);
	const inicials = useRef( null );
	if ( ! inicials.current ) {
		inicials.current = new Set( correus.map( ( c ) => c.id ) );
	}

	const llista = carpetes();
	const actual = llista.find( ( c ) => c.id === carpeta );
	const comptes = comptadors( correus, marques );
	const mostrats = filtra( perCarpeta( correus, marques, carpeta ), cerca );
	const obert = correus.find( ( c ) => c.id === obertId ) ?? null;
	const nomJugador = mon?.jugador?.nom ?? 'Àlex Puig';
	const correuJugador = mon?.jugador?.correu ?? 'alex.puig@posta.cat';

	// Un correu només entra amb animació la primera vegada que es veu.
	useEffect( () => {
		correus.forEach( ( c ) => inicials.current.add( c.id ) );
	}, [ correus ] );

	// En tornar a la llista, el focus va a la fila del correu que era obert.
	useEffect( () => {
		if ( obertId || ! tornaA.current ) {
			return;
		}
		const id = tornaA.current;
		tornaA.current = null;
		(
			arrel.current?.querySelector( `[data-correu="${ id }"]` ) ??
			arrel.current?.querySelector( '.nep-posta-safata__titol' )
		)?.focus();
	}, [ obertId ] );

	// Acció ràpida d'una fila que surt de la carpeta: el focus no cau a <body>.
	useEffect( () => {
		if ( focusLlista.current ) {
			focusLlista.current = false;
			arrel.current?.querySelector( '.nep-posta-safata__titol' )?.focus();
		}
	}, [ marques ] );

	// Diàleg cancel·lat: el focus torna al botó «Més» (ja sense inert).
	useEffect( () => {
		if ( ! denuncia && focusMes.current ) {
			focusMes.current = false;
			arrel.current?.querySelector( '[aria-haspopup="menu"]' )?.focus();
		}
	}, [ denuncia ] );

	const tanca = () => {
		tornaA.current = obertId;
		setObertId( null );
	};

	const obre = ( correu ) => {
		setObertId( correu.id );
		setMarques( ( m ) => marca( m, correu.id, { llegit: true } ) );
		emet( 'missatge.obre', { app: 'posta', id: correu.id } );
		if (
			estat.notificacions.some(
				( n ) => n.app === 'posta' && ! n.llegida
			)
		) {
			dispatch( { tipus: 'NOTIFICACIONS_LLEGIDES', app: 'posta' } );
		}
	};

	const accio = ( com, correu ) => {
		setMarques( ( m ) =>
			marca( m, correu.id, { carpeta: CARPETA_ACCIO[ com ] } )
		);
		if ( com !== 'arxiva' ) {
			emet( 'correu.marca', { id: correu.id, com } );
		}
		if ( correu.id === obertId ) {
			tanca();
		} else {
			focusLlista.current = true;
		}
		mostraAvis( textosAvis()[ com ] );
	};

	const marcaCorreu = ( correu, canvis ) => {
		setMarques( ( m ) => marca( m, correu.id, canvis ) );
		if ( canvis.llegit === false && correu.id === obertId ) {
			tanca();
		}
	};

	const triaCarpeta = ( id ) => {
		setCarpeta( id );
		setObertId( null );
	};

	return (
		<div className="nep-posta" ref={ arrel }>
			<header
				className="nep-posta__capcalera"
				inert={ denuncia ? '' : undefined }
			>
				<span className="nep-posta__marca">
					<MarcaPosta mida={ 30 } />
					<span className="nep-posta__nom">posta</span>
				</span>
				<div className="nep-posta__cerca" role="search">
					<label htmlFor={ idCerca } className="screen-reader-text">
						{ __( 'Cerca al correu', 'noempesquen' ) }
					</label>
					<IconaCerca mida={ 18 } />
					<input
						id={ idCerca }
						type="search"
						autoComplete="off"
						placeholder={ __( 'Cerca al correu', 'noempesquen' ) }
						value={ cerca }
						onChange={ ( e ) => {
							setCerca( e.target.value );
							setObertId( null );
						} }
					/>
				</div>
				<span
					className="nep-posta__jo"
					title={ `${ nomJugador } (${ correuJugador })` }
					aria-hidden="true"
				>
					{ nomJugador.charAt( 0 ) }
				</span>
			</header>

			<nav
				className="nep-posta__nav"
				inert={ denuncia ? '' : undefined }
				aria-label={ __( 'Carpetes', 'noempesquen' ) }
			>
				<button
					type="button"
					className="nep-posta__redacta"
					aria-disabled="true"
					title={ __(
						'No disponible en aquest simulacre',
						'noempesquen'
					) }
				>
					<IconaRedacta mida={ 20 } />
					<span>{ __( 'Redacta', 'noempesquen' ) }</span>
				</button>
				<ul className="nep-posta__carpetes">
					{ llista.map( ( c ) => (
						<li key={ c.id }>
							<button
								type="button"
								className={ `nep-posta__carpeta${
									c.id === carpeta ? ' is-actiu' : ''
								}${ comptes[ c.id ] ? ' amb-compte' : '' }` }
								aria-current={
									c.id === carpeta ? 'page' : undefined
								}
								onClick={ () => triaCarpeta( c.id ) }
							>
								<c.Icona mida={ 18 } />
								<span className="nep-posta__carpeta-nom">
									{ c.nom }
								</span>
								{ comptes[ c.id ] > 0 && (
									<span className="nep-posta__compte">
										{ comptes[ c.id ] }
									</span>
								) }
							</button>
						</li>
					) ) }
				</ul>
			</nav>

			<main
				className="nep-posta__principal"
				inert={ denuncia ? '' : undefined }
			>
				{ obert ? (
					<Lectura
						correu={ obert }
						marques={ marques }
						carpeta={ carpetaDe( obert, marques ) }
						nomCarpeta={
							llista.find(
								( c ) => c.id === carpetaDe( obert, marques )
							)?.nom ?? actual.nom
						}
						jugador={ correuJugador }
						onTorna={ tanca }
						onAccio={ ( com ) => accio( com, obert ) }
						onMarca={ ( canvis ) => marcaCorreu( obert, canvis ) }
						onDenuncia={ () => setDenuncia( true ) }
						obrePestanya={ obrePestanya }
						onHoverUrl={ onHoverUrl }
					/>
				) : (
					<LlistaCorreus
						titol={ actual.nom }
						carpeta={ carpeta }
						correus={ mostrats }
						marques={ marques }
						inicials={ inicials.current }
						buit={
							cerca.trim()
								? __(
										'Cap missatge coincideix amb la cerca.',
										'noempesquen'
									)
								: actual.buit
						}
						onObre={ obre }
						onAccio={ accio }
						onMarca={ marcaCorreu }
					/>
				) }
			</main>

			<div className="nep-posta__avis-zona" role="status">
				{ avis && (
					<p key={ avis.clau } className="nep-posta__avis">
						{ avis.text }
					</p>
				) }
			</div>

			{ denuncia && obert && (
				<Denuncia
					correu={ obert }
					onCancella={ () => {
						focusMes.current = true;
						setDenuncia( false );
					} }
					onDenuncia={ () => {
						setDenuncia( false );
						accio( 'phishing', obert );
					} }
				/>
			) }
		</div>
	);
}
