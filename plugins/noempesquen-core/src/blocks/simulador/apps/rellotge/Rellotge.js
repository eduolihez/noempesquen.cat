/**
 * Rellotge del mòbil: Hora, Cronòmetre i Temporitzador.
 *
 * Els comptadors avancen per ticks de 50 ms que sumen només el temps
 * transcorregut mentre el joc NO està en pausa (`estat.pausa`). L'estat viu
 * a l'arrel, així que canviar de pestanya no els reinicia.
 */
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import {
	formata,
	formataTemporitzador,
	afegeixVolta,
	horaCiutat,
	restant,
} from './temps';

const PESTANYES = [
	{ id: 'hora', nom: __( 'Hora', 'noempesquen' ) },
	{ id: 'crono', nom: __( 'Cronòmetre', 'noempesquen' ) },
	{ id: 'temp', nom: __( 'Temporitzador', 'noempesquen' ) },
];

const CIUTATS = [
	{ nom: 'Barcelona', desfase: 0 },
	{ nom: 'Londres', desfase: -1 },
	{ nom: 'Nova York', desfase: -6 },
];

const PRESETS = [ 1, 5, 10 ];
const TICK_MS = 50;

function PanellHora( { hora } ) {
	return (
		<div className="nep-rellotge__hora">
			<p className="nep-rellotge__hora-gran">{ hora }</p>
			<ul className="nep-rellotge__ciutats">
				{ CIUTATS.map( ( c ) => (
					<li key={ c.nom } className="nep-rellotge__ciutat">
						<span>{ c.nom }</span>
						<span className="nep-rellotge__ciutat-hora">
							{ horaCiutat( hora, c.desfase ) }
						</span>
					</li>
				) ) }
			</ul>
		</div>
	);
}

function PanellCrono( { crono, voltes, alternar, volta, reinicia } ) {
	return (
		<div className="nep-rellotge__crono">
			<p className="nep-rellotge__digits" role="timer" aria-live="off">
				{ formata( crono.ms ) }
			</p>
			<div className="nep-rellotge__botons">
				<button
					type="button"
					className="nep-rellotge__boto"
					onClick={ crono.corrent ? volta : reinicia }
					disabled={ ! crono.corrent && crono.ms === 0 }
				>
					{ crono.corrent
						? __( 'Volta', 'noempesquen' )
						: __( 'Reinicia', 'noempesquen' ) }
				</button>
				<button
					type="button"
					className="nep-rellotge__boto nep-rellotge__boto--primari"
					onClick={ alternar }
				>
					{ crono.corrent
						? __( 'Para', 'noempesquen' )
						: __( 'Inicia', 'noempesquen' ) }
				</button>
			</div>
			{ voltes.length > 0 && (
				<ol className="nep-rellotge__voltes">
					{ [ ...voltes ].reverse().map( ( v ) => (
						<li key={ v.num } className="nep-rellotge__volta">
							<span>
								{ __( 'Volta', 'noempesquen' ) } { v.num }
							</span>
							<span>{ formata( v.parcial ) }</span>
							<span>{ formata( v.total ) }</span>
						</li>
					) ) }
				</ol>
			) }
		</div>
	);
}

function PanellTemp( { temp, trieu, alternar, reinicia } ) {
	const queda = restant( temp.total, temp.ms );
	return (
		<div className="nep-rellotge__temp">
			<p className="nep-rellotge__digits">
				{ formataTemporitzador( queda ) }
			</p>
			<p className="nep-rellotge__avis" role="status" aria-live="polite">
				{ temp.acabat ? __( 'Temps!', 'noempesquen' ) : '' }
			</p>
			<div
				className="nep-rellotge__presets"
				role="group"
				aria-label={ __( 'Durada', 'noempesquen' ) }
			>
				{ PRESETS.map( ( m ) => (
					<button
						key={ m }
						type="button"
						className="nep-rellotge__boto"
						aria-pressed={ temp.total === m * 60000 }
						onClick={ () => trieu( m * 60000 ) }
					>
						{ m } min
					</button>
				) ) }
			</div>
			<div className="nep-rellotge__botons">
				<button
					type="button"
					className="nep-rellotge__boto"
					onClick={ reinicia }
				>
					{ __( 'Reinicia', 'noempesquen' ) }
				</button>
				<button
					type="button"
					className="nep-rellotge__boto nep-rellotge__boto--primari"
					onClick={ alternar }
					disabled={ queda === 0 }
				>
					{ temp.corrent
						? __( 'Pausa', 'noempesquen' )
						: __( 'Inicia', 'noempesquen' ) }
				</button>
			</div>
		</div>
	);
}

export default function Rellotge() {
	const { hora, estat } = useJoc();
	const pausa = !! estat.pausa;
	const [ pestanya, setPestanya ] = useState( 'hora' );
	const [ crono, setCrono ] = useState( { ms: 0, corrent: false } );
	const [ voltes, setVoltes ] = useState( [] );
	const [ temp, setTemp ] = useState( {
		total: 60000,
		ms: 0,
		corrent: false,
		acabat: false,
	} );
	const botonsPestanya = useRef( {} );

	const hiHaCorrent = crono.corrent || temp.corrent;

	useEffect( () => {
		if ( ! hiHaCorrent || pausa ) {
			return undefined;
		}
		let darrer = performance.now();
		const id = setInterval( () => {
			const ara = performance.now();
			const delta = ara - darrer;
			darrer = ara;
			setCrono( ( c ) => ( c.corrent ? { ...c, ms: c.ms + delta } : c ) );
			setTemp( ( t ) => {
				if ( ! t.corrent ) {
					return t;
				}
				const ms = t.ms + delta;
				return restant( t.total, ms ) === 0
					? { ...t, ms: t.total, corrent: false, acabat: true }
					: { ...t, ms };
			} );
		}, TICK_MS );
		return () => clearInterval( id );
	}, [ hiHaCorrent, pausa ] );

	const teclat = ( e ) => {
		const pas = { ArrowRight: 1, ArrowLeft: -1 }[ e.key ];
		if ( ! pas ) {
			return;
		}
		e.preventDefault();
		const i = PESTANYES.findIndex( ( p ) => p.id === pestanya );
		const seg =
			PESTANYES[ ( i + pas + PESTANYES.length ) % PESTANYES.length ];
		setPestanya( seg.id );
		botonsPestanya.current[ seg.id ]?.focus();
	};

	return (
		<div
			className="nep-rellotge"
			role="region"
			aria-label={ __( 'Rellotge', 'noempesquen' ) }
		>
			<div className="nep-rellotge__cap">
				<h2 className="nep-rellotge__titol">
					{ __( 'Rellotge', 'noempesquen' ) }
				</h2>
			</div>
			<div
				className="nep-rellotge__pestanyes"
				role="tablist"
				aria-label={ __( 'Seccions del rellotge', 'noempesquen' ) }
			>
				{ PESTANYES.map( ( p ) => (
					<button
						key={ p.id }
						type="button"
						role="tab"
						id={ `nep-rellotge-tab-${ p.id }` }
						aria-selected={ pestanya === p.id }
						aria-controls={ `nep-rellotge-panell-${ p.id }` }
						tabIndex={ pestanya === p.id ? 0 : -1 }
						className="nep-rellotge__pestanya"
						ref={ ( el ) => {
							botonsPestanya.current[ p.id ] = el;
						} }
						onClick={ () => setPestanya( p.id ) }
						onKeyDown={ teclat }
					>
						{ p.nom }
					</button>
				) ) }
			</div>
			<div
				className="nep-rellotge__panell"
				role="tabpanel"
				id={ `nep-rellotge-panell-${ pestanya }` }
				aria-labelledby={ `nep-rellotge-tab-${ pestanya }` }
			>
				{ pestanya === 'hora' && <PanellHora hora={ hora } /> }
				{ pestanya === 'crono' && (
					<PanellCrono
						crono={ crono }
						voltes={ voltes }
						alternar={ () =>
							setCrono( ( c ) => ( {
								...c,
								corrent: ! c.corrent,
							} ) )
						}
						volta={ () =>
							setVoltes( ( v ) => afegeixVolta( v, crono.ms ) )
						}
						reinicia={ () => {
							setCrono( { ms: 0, corrent: false } );
							setVoltes( [] );
						} }
					/>
				) }
				{ pestanya === 'temp' && (
					<PanellTemp
						temp={ temp }
						trieu={ ( total ) =>
							setTemp( {
								total,
								ms: 0,
								corrent: false,
								acabat: false,
							} )
						}
						alternar={ () =>
							setTemp( ( t ) => ( {
								...t,
								corrent: ! t.corrent,
							} ) )
						}
						reinicia={ () =>
							setTemp( ( t ) => ( {
								...t,
								ms: 0,
								corrent: false,
								acabat: false,
							} ) )
						}
					/>
				) }
			</div>
		</div>
	);
}
