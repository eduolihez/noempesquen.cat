/**
 * Selector de missions (fora del sistema simulat): targeta «Continua per
 * aquí», missions del dispositiu en ús i missions d'altres dispositius.
 */
import { useEffect, useMemo, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { agrupaMissions } from '../nucli/selector';
import { PERSONATGES } from '../ui/avatars';
import { Estrella, Glif } from '../ui/icones';

const IconaOrdinador = ( p ) => (
	<Glif { ...p }>
		<rect x="2.5" y="3.5" width="15" height="10" rx="1.5" />
		<path d="M7 17h6M10 13.5V17" />
	</Glif>
);

const IconaMobil = ( p ) => (
	<Glif { ...p }>
		<rect x="5.5" y="2" width="9" height="16" rx="2" />
		<path d="M8.5 15h3" />
	</Glif>
);

/* Mòbil que gira cap a horitzontal (fletxa en arc). */
const IconaGira = ( p ) => (
	<Glif { ...p }>
		<rect x="2" y="9" width="12" height="8" rx="1.5" />
		<path d="M7 4.5a7 7 0 0 1 9.5 4" />
		<path d="M16.8 5.6 16.5 8.5 13.7 7.9" />
	</Glif>
);

const IconaFletxa = ( p ) => (
	<Glif { ...p }>
		<path d="M4 10h11M11 5.5 15.5 10 11 14.5" />
	</Glif>
);

const estrellesDe = ( progres, id ) => {
	const n = Number( progres?.[ id ] );
	return Number.isFinite( n )
		? Math.min( 3, Math.max( 0, Math.floor( n ) ) )
		: 0;
};

function Estrelles( { estrelles } ) {
	const etiqueta = estrelles
		? sprintf(
				/* translators: %d: estrelles */
				__( 'Millor resultat: %d de 3 estrelles', 'noempesquen' ),
				estrelles
			)
		: __( "Encara no l'has jugada", 'noempesquen' );
	return (
		<span className="nep-sel-estrelles" role="img" aria-label={ etiqueta }>
			{ [ 0, 1, 2 ].map( ( i ) => (
				<Estrella key={ i } mida={ 20 } plena={ i < estrelles } />
			) ) }
		</span>
	);
}

function Targeta( { missio, estrelles, horitzontal, destacada, onTria } ) {
	const { nom, Avatar } =
		PERSONATGES[ missio.personatge ] ?? PERSONATGES.llissa;
	const titolId = `nep-sel-${ missio.id }-titol`;
	const infoId = `nep-sel-${ missio.id }-info`;
	const esMobil = missio.dispositiu === 'mobil';
	const IconaDispositiu = esMobil ? IconaMobil : IconaOrdinador;
	let accio = __( 'Torna-hi', 'noempesquen' );
	if ( ! estrelles ) {
		accio = __( 'Comença', 'noempesquen' );
	}
	const classes = [
		'nep-sel-targeta',
		`nep-sel-targeta--${ missio.personatge }`,
		destacada ? 'nep-sel-targeta--destacada' : '',
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<button
			type="button"
			className={ classes }
			data-missio={ missio.id }
			aria-labelledby={ titolId }
			aria-describedby={ infoId }
			onClick={ () => onTria( missio.id ) }
		>
			<span className="nep-sel-targeta__avatar">
				<Avatar mida={ destacada ? 112 : 72 } />
			</span>
			<span className="nep-sel-targeta__cos">
				<span id={ titolId } className="nep-sel-targeta__titol">
					{ missio.titol }
				</span>
				<span id={ infoId } className="nep-sel-targeta__info">
					<span className="nep-sel-targeta__meta">
						<span className="nep-sel-xip">
							<IconaDispositiu mida={ 16 } />
							{ esMobil
								? __( 'Mòbil', 'noempesquen' )
								: __( 'Ordinador', 'noempesquen' ) }
						</span>
						<span className="nep-sel-xip">
							{ sprintf(
								/* translators: %d: minuts */
								__( '%d min', 'noempesquen' ),
								missio.durada_minuts
							) }
						</span>
						<span className="nep-sel-xip nep-sel-xip--nom">
							{ nom }
						</span>
					</span>
					<span className="nep-sel-targeta__resum">
						{ missio.resum }
					</span>
					{ horitzontal && (
						<span className="nep-sel-horitzontal">
							<IconaGira mida={ 18 } />
							{ __( 'Millor en horitzontal', 'noempesquen' ) }
						</span>
					) }
					<Estrelles estrelles={ estrelles } />
				</span>
				<span className="nep-sel-targeta__accio" aria-hidden="true">
					{ accio }
					<IconaFletxa mida={ 18 } />
				</span>
			</span>
		</button>
	);
}

function Seccio( { id, titol, missions, pinta } ) {
	if ( ! missions.length ) {
		return null;
	}
	return (
		<section className="nep-sel-seccio" aria-labelledby={ id }>
			<h2 id={ id } className="nep-sel-seccio__titol">
				{ titol }
			</h2>
			<ul className="nep-sel-graella">
				{ missions.map( ( m ) => (
					<li key={ m.id }>{ pinta( m ) }</li>
				) ) }
			</ul>
		</section>
	);
}

export function Selector( {
	missions,
	progres,
	preferit,
	esMobil,
	onTria,
	enfoca,
} ) {
	const arrel = useRef( null );
	const { recomanada, principals, altres, resum } = useMemo(
		() => agrupaMissions( missions, preferit, progres ),
		[ missions, preferit, progres ]
	);
	const sense = ( llista ) =>
		recomanada ? llista.filter( ( m ) => m.id !== recomanada.id ) : llista;

	// En tornar d'una partida, el focus va a la targeta que s'ha jugat.
	useEffect( () => {
		if ( enfoca ) {
			arrel.current
				?.querySelector(
					`[data-missio="${ window.CSS.escape( enfoca ) }"]`
				)
				?.focus();
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	const pinta = ( m, destacada = false ) => (
		<Targeta
			missio={ m }
			estrelles={ estrellesDe( progres, m.id ) }
			horitzontal={ esMobil && m.dispositiu === 'pc' }
			destacada={ destacada }
			onTria={ onTria }
		/>
	);

	return (
		<section
			ref={ arrel }
			className="nep-selector"
			aria-labelledby="nep-selector-titol"
		>
			<header className="nep-selector__cap">
				<h2 id="nep-selector-titol" className="nep-selector__titol">
					{ __( 'Tria una missió', 'noempesquen' ) }
				</h2>
				{ resum.jugades > 0 && (
					<p className="nep-selector__resum">
						{ sprintf(
							/* translators: 1: missions jugades, 2: total de missions, 3: estrelles guanyades, 4: estrelles possibles */
							__(
								'%1$d de %2$d missions jugades · %3$d de %4$d estrelles',
								'noempesquen'
							),
							resum.jugades,
							resum.total,
							resum.estrelles,
							resum.max
						) }
					</p>
				) }
			</header>

			{ recomanada && (
				<section
					className="nep-sel-seccio nep-sel-seccio--destacada"
					aria-labelledby="nep-sel-continua"
				>
					<h2 id="nep-sel-continua" className="nep-sel-seccio__titol">
						{ __( 'Continua per aquí', 'noempesquen' ) }
					</h2>
					{ pinta( recomanada, true ) }
				</section>
			) }

			<Seccio
				id="nep-sel-principals"
				titol={
					preferit === 'mobil'
						? __( 'Per al teu mòbil', 'noempesquen' )
						: __( 'Per al teu ordinador', 'noempesquen' )
				}
				missions={ sense( principals ) }
				pinta={ pinta }
			/>
			<Seccio
				id="nep-sel-altres"
				titol={ __( 'Altres dispositius', 'noempesquen' ) }
				missions={ sense( altres ) }
				pinta={ pinta }
			/>
		</section>
	);
}
