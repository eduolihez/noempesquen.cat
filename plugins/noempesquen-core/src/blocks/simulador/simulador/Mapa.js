/**
 * Mapa de ruta d'un vaixell: camí sinuós sobre el mar amb un node per missió.
 * Presentacional: no sap res del joc ni del progrés, només pinta la ruta.
 *
 * Props
 * - ruta:       resultat de `construeixRuta` (nucli/ruta.js).
 * - dispositiu: 'pc' (el Pesquer) | 'mobil' (el Pirata).
 * - onTria:     onTria( id ) en activar un node fet o disponible.
 * - onTorna:    onTorna() amb el botó «Torna al port».
 * - titolRef:   ref opcional per al títol (h3, tabIndex -1) per moure-hi el
 *               focus en entrar al mapa.
 * - classe:     classes extra per a l'arrel.
 *
 * Disposició: container query a `.nep-mapa`. Des de 640 px, camí en S
 * horitzontal; per sota, serpentina vertical. Els nodes es pinten un sol cop
 * (data-missio únic) amb la posició dels dos modes en custom properties.
 */
import { __, sprintf } from '@wordpress/i18n';
import { caminSvg, midaVista, posicionsNodes } from '../nucli/mapaGeom';
import { Estrella, Glif, useIdSvg } from '../ui/icones';

const MODES = [ 'ample', 'estret' ];

const IconaBrujola = ( p ) => (
	<Glif { ...p }>
		<circle cx="10" cy="10" r="7.5" />
		<path d="m12.8 7.2-1.6 4-4 1.6 1.6-4Z" />
	</Glif>
);

const IconaCadenat = ( p ) => (
	<Glif { ...p }>
		<rect x="4.5" y="9" width="11" height="8" rx="1.5" />
		<path d="M7 9V6.5a3 3 0 0 1 6 0V9M10 12.3v1.6" />
	</Glif>
);

const IconaTorna = ( p ) => (
	<Glif { ...p }>
		<path d="M16 10H5M9 5.5 4.5 10 9 14.5" />
	</Glif>
);

const vaixells = () => ( {
	pc: {
		nom: __( 'el Pesquer — Llissa', 'noempesquen' ),
		lema: __(
			"Segueix l'estela i no mosseguis cap esquer.",
			'noempesquen'
		),
	},
	mobil: {
		nom: __( 'el Pirata — Remei', 'noempesquen' ),
		lema: __(
			'Rumb al tresor, i que ningú et prengui el botí.',
			'noempesquen'
		),
	},
} );

function Estrelles( { estrelles } ) {
	const etiqueta = estrelles
		? sprintf(
				/* translators: %d: estrelles */
				__( 'Millor resultat: %d de 3 estrelles', 'noempesquen' ),
				estrelles
			)
		: __( "Encara no l'has jugada", 'noempesquen' );
	return (
		<span
			className="nep-mapa__estrelles"
			role="img"
			aria-label={ etiqueta }
		>
			{ [ 0, 1, 2 ].map( ( i ) => (
				<Estrella key={ i } mida={ 16 } plena={ i < estrelles } />
			) ) }
		</span>
	);
}

function Cami( { punts, recorregut, mode } ) {
	const mascara = useIdSvg( `nep-mapa-${ mode }-` );
	const { w, h } = midaVista( punts.length, mode );
	const sencer = caminSvg( punts );
	const fet =
		recorregut > 0 ? caminSvg( punts.slice( 0, recorregut + 1 ) ) : '';
	return (
		<svg
			className={ `nep-mapa__cami nep-mapa__cami--${ mode }` }
			viewBox={ `0 0 ${ w } ${ h }` }
			aria-hidden="true"
			focusable="false"
		>
			<mask id={ mascara } maskUnits="userSpaceOnUse">
				<path
					className="nep-mapa__traca"
					d={ sencer }
					pathLength="1"
					stroke="#fff"
					strokeWidth="40"
					fill="none"
				/>
			</mask>
			<path
				className="nep-mapa__estela"
				d={ sencer }
				mask={ `url(#${ mascara })` }
			/>
			{ fet && (
				<>
					<path className="nep-mapa__fet-vora" d={ fet } />
					<path
						className="nep-mapa__fet nep-mapa__traca"
						d={ fet }
						pathLength="1"
					/>
				</>
			) }
		</svg>
	);
}

function Node( { node, i, pos, titolDe, onTria } ) {
	const titolId = `nep-mapa-${ node.id }-titol`;
	const motiuId = `nep-mapa-${ node.id }-motiu`;
	const bloquejada = node.estat === 'bloquejada';
	const disponible = node.estat === 'disponible';
	const estil = { '--i': i };
	MODES.forEach( ( mode ) => {
		const { w, h } = midaVista( pos[ mode ].length, mode );
		const { x, y } = pos[ mode ][ i ];
		const lletra = mode === 'ample' ? 'a' : 'e';
		estil[ `--x${ lletra }` ] = `${ ( x / w ) * 100 }%`;
		estil[ `--y${ lletra }` ] = `${ ( y / h ) * 100 }%`;
	} );
	const classes = [
		'nep-mapa__node',
		`nep-mapa__node--${ node.estat }`,
		node.tutorial && 'nep-mapa__node--tutorial',
	]
		.filter( Boolean )
		.join( ' ' );
	return (
		<li className="nep-mapa__lloc" style={ estil }>
			<button
				type="button"
				className={ classes }
				data-missio={ node.id }
				aria-labelledby={ titolId }
				aria-describedby={ bloquejada ? motiuId : undefined }
				aria-disabled={ bloquejada ? 'true' : undefined }
				onClick={ () => {
					if ( ! bloquejada ) {
						onTria( node.id );
					}
				} }
			>
				<span className="nep-mapa__boia" aria-hidden="true">
					<span className="nep-mapa__num">{ node.indes }</span>
					{ node.tutorial && (
						<span className="nep-mapa__insignia nep-mapa__insignia--tutorial">
							<IconaBrujola mida={ 16 } />
						</span>
					) }
					{ bloquejada && (
						<span className="nep-mapa__insignia nep-mapa__insignia--cadenat">
							<IconaCadenat mida={ 16 } />
						</span>
					) }
				</span>
				{ disponible && (
					<span className="nep-mapa__bandera" aria-hidden="true">
						{ __( 'Toca ara', 'noempesquen' ) }
					</span>
				) }
				<span className="nep-mapa__etiqueta">
					<span id={ titolId } className="nep-mapa__titol">
						{ node.titol }
					</span>
					{ node.tutorial ? (
						node.estat === 'feta' && (
							<span className="nep-mapa__fet-xip">
								{ __( 'Fet', 'noempesquen' ) }
							</span>
						)
					) : (
						<Estrelles estrelles={ node.estrelles } />
					) }
					{ bloquejada && (
						<span id={ motiuId } className="nep-mapa__motiu">
							{ sprintf(
								/* translators: %s: títol de la missió que falta */
								__(
									'Bloquejada: acaba “%s” primer',
									'noempesquen'
								),
								titolDe( node.motiu )
							) }
						</span>
					) }
				</span>
			</button>
		</li>
	);
}

export function Mapa( {
	ruta,
	dispositiu,
	onTria,
	onTorna,
	titolRef,
	classe = '',
} ) {
	const nodes = ruta?.nodes ?? [];
	const vaixell = vaixells()[ dispositiu ] ?? vaixells().pc;
	const pos = {
		ample: posicionsNodes( nodes.length, 'ample' ),
		estret: posicionsNodes( nodes.length, 'estret' ),
	};
	let recorregut = -1;
	nodes.forEach( ( n, i ) => {
		if ( n.estat === 'feta' ) {
			recorregut = i;
		}
	} );
	const titolDe = ( id ) => nodes.find( ( n ) => n.id === id )?.titol ?? '';
	const a = midaVista( nodes.length, 'ample' );
	const e = midaVista( nodes.length, 'estret' );
	const escenari = {
		'--n': nodes.length,
		'--ra-a': `${ a.w } / ${ a.h }`,
		'--ra-e': `${ e.w } / ${ e.h }`,
	};
	const titolId = `nep-mapa-${ dispositiu }-cap`;
	return (
		<section
			className={ [ 'nep-mapa', `nep-mapa--${ dispositiu }`, classe ]
				.filter( Boolean )
				.join( ' ' ) }
			aria-labelledby={ titolId }
		>
			<header className="nep-mapa__cap">
				<button
					type="button"
					className="nep-mapa__torna"
					onClick={ () => onTorna() }
				>
					<IconaTorna mida={ 20 } />
					{ __( 'Torna al port', 'noempesquen' ) }
				</button>
				<div className="nep-mapa__rotul">
					<h3
						id={ titolId }
						className="nep-mapa__titol-cap"
						ref={ titolRef }
						tabIndex={ -1 }
					>
						{ vaixell.nom }
					</h3>
					<p className="nep-mapa__lema">{ vaixell.lema }</p>
				</div>
				<p className="nep-mapa__progres">
					<span className="nep-mapa__xifra">
						{ sprintf(
							/* translators: 1: missions fetes, 2: total */
							__( '%1$d de %2$d missions', 'noempesquen' ),
							ruta?.feta ?? 0,
							ruta?.total ?? 0
						) }
					</span>
					<span className="nep-mapa__xifra nep-mapa__xifra--estrelles">
						<Estrella mida={ 18 } plena />
						<span aria-hidden="true">
							{ `${ ruta?.estrelles ?? 0 }/${ ruta?.max ?? 0 }` }
						</span>
						<span className="screen-reader-text">
							{ sprintf(
								/* translators: 1: estrelles guanyades, 2: màxim */
								__( '%1$d de %2$d estrelles', 'noempesquen' ),
								ruta?.estrelles ?? 0,
								ruta?.max ?? 0
							) }
						</span>
					</span>
				</p>
			</header>
			<div className="nep-mapa__mar">
				<div className="nep-mapa__escenari" style={ escenari }>
					{ MODES.map( ( mode ) => (
						<Cami
							key={ mode }
							mode={ mode }
							punts={ pos[ mode ] }
							recorregut={ recorregut }
						/>
					) ) }
					<ol className="nep-mapa__nodes">
						{ nodes.map( ( node, i ) => (
							<Node
								key={ node.id }
								node={ node }
								i={ i }
								pos={ pos }
								titolDe={ titolDe }
								onTria={ onTria }
							/>
						) ) }
					</ol>
				</div>
			</div>
		</section>
	);
}
