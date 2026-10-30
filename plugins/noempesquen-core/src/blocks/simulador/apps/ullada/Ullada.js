import { useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { Ilustracio } from '../../ui/ilustracions';
import { nomJugador } from '../../nucli/jugador';
import { construeixFeed, primerNom, usuariDe } from './feed.js';
import { Publicacio } from './Publicacio';
import {
	IconaAvisos,
	IconaCasa,
	IconaCerca,
	IconaPerfil,
	LogoUllada,
} from './icones';

const PESTANYES = [ 'inici', 'cerca', 'perfil' ];
const ICONES = { inici: IconaCasa, cerca: IconaCerca, perfil: IconaPerfil };

/**
 * Ullada: xarxa social de farciment (feed de fotos). Tot és decoratiu i
 * local; no emet res al motor.
 */
export default function Ullada() {
	const { mon, missio } = useJoc();
	const [ pestanya, setPestanya ] = useState( 'inici' );
	const refsPestanya = useRef( {} );

	const extres = missio?.apps?.ullada?.publicacions;
	const feed = useMemo(
		() => construeixFeed( mon, extres ?? [] ),
		[ mon, extres ]
	);
	const perfils = mon?.ullada?.perfils ?? [];

	const etiquetes = {
		inici: __( 'Inici', 'noempesquen' ),
		cerca: __( 'Cerca', 'noempesquen' ),
		perfil: __( 'Perfil', 'noempesquen' ),
	};

	const onTecla = ( e ) => {
		const i = PESTANYES.indexOf( pestanya );
		let nou = null;
		if ( e.key === 'ArrowRight' ) {
			nou = PESTANYES[ ( i + 1 ) % PESTANYES.length ];
		} else if ( e.key === 'ArrowLeft' ) {
			nou = PESTANYES[ ( i + PESTANYES.length - 1 ) % PESTANYES.length ];
		} else if ( e.key === 'Home' ) {
			nou = PESTANYES[ 0 ];
		} else if ( e.key === 'End' ) {
			nou = PESTANYES[ PESTANYES.length - 1 ];
		}
		if ( nou ) {
			e.preventDefault();
			setPestanya( nou );
			refsPestanya.current[ nou ]?.focus();
		}
	};

	const panell = () => {
		if ( pestanya === 'cerca' ) {
			return (
				<ul className="nep-ullada-graella">
					{ feed.map( ( p ) => (
						<li key={ p.id }>
							<div
								className="nep-ullada-graella__cel"
								role="img"
								aria-label={ p.text }
							>
								<Ilustracio id={ p.il } />
							</div>
						</li>
					) ) }
				</ul>
			);
		}
		if ( pestanya === 'perfil' ) {
			return (
				<div className="nep-ullada-perfil">
					<div className="nep-ullada-perfil__cap">
						<span
							className="nep-ullada-perfil__avatar"
							aria-hidden="true"
						>
							{ nomJugador( mon ).charAt( 0 ) }
						</span>
						<div>
							<h2 className="nep-ullada-perfil__nom">
								{ nomJugador( mon ) }
							</h2>
							<p className="nep-ullada-perfil__usuari">
								@{ usuariDe( nomJugador( mon ) ) }
							</p>
						</div>
					</div>
					<ul className="nep-ullada-graella" aria-hidden="true">
						{ [ 0, 1, 2, 3, 4, 5 ].map( ( n ) => (
							<li key={ n }>
								<div className="nep-ullada-graella__cel is-buida" />
							</li>
						) ) }
					</ul>
					<p className="nep-ullada-perfil__buit">
						{ __( 'Encara no has publicat res', 'noempesquen' ) }
					</p>
				</div>
			);
		}
		return (
			<>
				<ul
					className="nep-ullada-histories"
					aria-label={ __( 'Històries', 'noempesquen' ) }
					tabIndex={ 0 }
				>
					{ perfils.map( ( pf ) => (
						<li key={ pf.id } className="nep-ullada-historia">
							<span
								className="nep-ullada-historia__cercle"
								aria-hidden="true"
							>
								<Ilustracio id={ pf.il } />
							</span>
							<span className="nep-ullada-historia__nom">
								{ primerNom( pf.nom ) }
							</span>
						</li>
					) ) }
				</ul>
				{ feed.map( ( p ) => (
					<Publicacio key={ p.id } publicacio={ p } />
				) ) }
			</>
		);
	};

	return (
		<div
			className="nep-ullada"
			role="region"
			aria-label={ __( 'Ullada', 'noempesquen' ) }
		>
			<header className="nep-ullada__cap">
				<h1 className="nep-ullada__logo">
					<LogoUllada />
					<span className="nep-ullada__sr">
						{ __( 'Ullada', 'noempesquen' ) }
					</span>
				</h1>
				<button
					type="button"
					className="nep-ullada__boto"
					aria-disabled="true"
					aria-label={ __( 'Avisos', 'noempesquen' ) }
				>
					<IconaAvisos mida={ 24 } />
				</button>
			</header>
			<div
				className="nep-ullada__panell"
				role="tabpanel"
				id={ `nep-ullada-panell-${ pestanya }` }
				aria-labelledby={ `nep-ullada-pestanya-${ pestanya }` }
				tabIndex={ 0 }
			>
				{ panell() }
			</div>
			<div
				className="nep-ullada__pestanyes"
				role="tablist"
				aria-label={ __( 'Seccions', 'noempesquen' ) }
			>
				{ PESTANYES.map( ( id ) => {
					const Icona = ICONES[ id ];
					const activa = id === pestanya;
					return (
						<button
							key={ id }
							type="button"
							role="tab"
							id={ `nep-ullada-pestanya-${ id }` }
							ref={ ( el ) => {
								refsPestanya.current[ id ] = el;
							} }
							aria-selected={ activa }
							aria-controls={
								activa ? `nep-ullada-panell-${ id }` : undefined
							}
							tabIndex={ activa ? 0 : -1 }
							className="nep-ullada__pestanya"
							onClick={ () => setPestanya( id ) }
							onKeyDown={ onTecla }
						>
							<Icona mida={ 24 } />
							<span>{ etiquetes[ id ] }</span>
						</button>
					);
				} ) }
			</div>
		</div>
	);
}
