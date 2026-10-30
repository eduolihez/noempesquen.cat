import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { Ilustracio } from '../../ui/ilustracions';
import { propsEnllac } from '../enllac';
import { Anunci } from './Anunci';
import { MarcaDiari } from './Marca';
import {
	URL_PORTADA,
	formataData,
	rutaDeUrl,
	seccions,
	urlNoticia,
} from './paginacio';

/**
 * Web d'El Diari del Barri: portada i article. Les notícies surten de
 * `mon.diari`; cap enllaç és real. Amb `dades.anunci`, la portada pinta un
 * anunci patrocinat que es pot denunciar (`publicacio.denuncia`).
 *
 * @param {Object}             props
 * @param {?Object}            props.dades      Web de la missió (opcional `anunci`).
 * @param {string}             props.url        URL de la pàgina.
 * @param {(url:string)=>void} props.navega     Navega a una URL dins la pestanya.
 * @param {(url:string)=>void} props.onHoverUrl Barra d'estat.
 */
export default function Diari( { dades, url, navega, onHoverUrl } ) {
	const { mon, estat, emet } = useJoc();
	const anunci = dades?.anunci ?? null;
	// Al motor (només l'id): canviar de web i tornar no permet denunciar dos cops.
	const denunciat = Boolean(
		anunci && ( estat.denunciats ?? [] ).includes( anunci.id )
	);
	const diari = Array.isArray( mon?.diari ) ? mon.diari : [];
	const ruta = rutaDeUrl( url );
	const enllac = ( desti ) => propsEnllac( desti, navega, onHoverUrl );
	const noticia =
		ruta.tipus === 'noticia'
			? diari.find( ( n ) => n.id === ruta.id )
			: null;

	return (
		<div className="nep-dv">
			<header className="nep-dv-cap">
				<a className="nep-dv-marca-enllac" { ...enllac( URL_PORTADA ) }>
					<MarcaDiari />
				</a>
				<nav
					className="nep-dv-seccions"
					aria-label={ __( 'Seccions', 'noempesquen' ) }
				>
					<ul>
						{ seccions( diari ).map( ( s ) => (
							<li key={ s }>
								<a { ...enllac( URL_PORTADA ) }>{ s }</a>
							</li>
						) ) }
					</ul>
				</nav>
			</header>
			<main className="nep-dv-cos">
				{ ruta.tipus === 'portada' && (
					<Portada
						diari={ diari }
						enllac={ enllac }
						anunci={
							anunci && (
								<Anunci
									anunci={ anunci }
									denunciat={ denunciat }
									onDenuncia={ () => {
										if ( denunciat ) {
											return;
										}
										emet( 'publicacio.denuncia', {
											id: anunci.id,
										} );
									} }
									onEnllac={ ( u ) => {
										emet( 'enllac.obre', { url: u } );
										navega( u );
									} }
									onHoverUrl={ onHoverUrl }
								/>
							)
						}
					/>
				) }
				{ ruta.tipus === 'noticia' && noticia && (
					<Article noticia={ noticia } />
				) }
				{ ! ( ruta.tipus === 'portada' || noticia ) && (
					<section className="nep-dv-buit">
						<h1>
							{ __(
								'No hem trobat aquesta notícia',
								'noempesquen'
							) }
						</h1>
						<p>
							<a { ...enllac( URL_PORTADA ) }>
								{ __( 'Torna a la portada', 'noempesquen' ) }
							</a>
						</p>
					</section>
				) }
			</main>
			<footer className="nep-dv-peu">
				<p>
					{ __(
						'El Diari del Barri · Notícies de proximitat',
						'noempesquen'
					) }
				</p>
			</footer>
		</div>
	);
}

function Portada( { diari, enllac, anunci } ) {
	const [ destacada, ...resta ] = diari;
	return (
		<>
			<h1 className="nep-dv-titol-portada">
				{ __( 'Últimes notícies del barri', 'noempesquen' ) }
			</h1>
			{ destacada && (
				<article className="nep-dv-destacada">
					<div
						className="nep-dv-il"
						role="img"
						aria-label={ destacada.titol }
					>
						<Ilustracio id={ destacada.il } />
					</div>
					<div className="nep-dv-text">
						<p className="nep-dv-meta">
							{ destacada.seccio } ·{ ' ' }
							{ formataData( destacada.data ) }
						</p>
						<h2>
							<a { ...enllac( urlNoticia( destacada.id ) ) }>
								{ destacada.titol }
							</a>
						</h2>
						<p>{ destacada.entradeta }</p>
					</div>
				</article>
			) }
			{ anunci }
			<ul className="nep-dv-llista">
				{ resta.map( ( n ) => (
					<li key={ n.id } className="nep-dv-item">
						<div
							className="nep-dv-il nep-dv-il--petita"
							role="img"
							aria-label={ n.titol }
						>
							<Ilustracio id={ n.il } />
						</div>
						<div className="nep-dv-text">
							<p className="nep-dv-meta">
								{ n.seccio } · { formataData( n.data ) }
							</p>
							<h2>
								<a { ...enllac( urlNoticia( n.id ) ) }>
									{ n.titol }
								</a>
							</h2>
							<p>{ n.entradeta }</p>
						</div>
					</li>
				) ) }
			</ul>
		</>
	);
}

function Article( { noticia } ) {
	return (
		<article className="nep-dv-article">
			<p className="nep-dv-meta">
				{ noticia.seccio } · { formataData( noticia.data ) }
			</p>
			<h1>{ noticia.titol }</h1>
			<div
				className="nep-dv-il nep-dv-il--gran"
				role="img"
				aria-label={ noticia.titol }
			>
				<Ilustracio id={ noticia.il } />
			</div>
			{ ( noticia.cos ?? [] ).map( ( p, i ) => (
				<p key={ i }>{ p }</p>
			) ) }
		</article>
	);
}
