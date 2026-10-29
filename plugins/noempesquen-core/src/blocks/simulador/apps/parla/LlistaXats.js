import { __, _n, sprintf } from '@wordpress/i18n';
import { IconaCerca } from '../../ui/icones';
import { IconaFixat, IconaLlegit, IconaMes, IconaNouXat } from './icones';

/* Fons de les inicials (text blanc, contrast AA). */
const COLORS = [ '#4a6b80', '#8e4d66', '#557a3c', '#96612a', '#5b5a92' ];

function colorDe( nom ) {
	const suma = [ ...String( nom ) ].reduce(
		( n, c ) => n + c.codePointAt( 0 ),
		0
	);
	return COLORS[ suma % COLORS.length ];
}

/**
 * Foto de perfil: el personatge del guia o les inicials del contacte.
 *
 * @param {Object}  props
 * @param {string}  props.nom    Nom del contacte.
 * @param {number}  props.mida   Diàmetre en píxels.
 * @param {?Object} props.Avatar Personatge SVG (només el guia).
 */
export function AvatarXat( { nom, mida, Avatar } ) {
	const estil = { width: mida, height: mida };
	if ( Avatar ) {
		return (
			<span
				className="nep-parla-avatar nep-parla-avatar--guia"
				style={ estil }
				aria-hidden="true"
			>
				<Avatar mida={ Math.round( mida * 0.82 ) } />
			</span>
		);
	}
	return (
		<span
			className="nep-parla-avatar"
			style={ {
				...estil,
				background: colorDe( nom ),
				fontSize: Math.round( mida * 0.4 ),
			} }
			aria-hidden="true"
		>
			{ String( nom ).charAt( 0 ) }
		</span>
	);
}

function Previsualitzacio( { darrer, escriu } ) {
	if ( escriu ) {
		return (
			<span className="nep-parla-xat__previ is-escriu">
				{ __( 'escrivint…', 'noempesquen' ) }
			</span>
		);
	}
	if ( ! darrer ) {
		return <span className="nep-parla-xat__previ" />;
	}
	return (
		<span className="nep-parla-xat__previ">
			{ darrer.propi && (
				<span className="nep-parla-xat__llegit">
					<IconaLlegit />
					<span className="nep-so-sr">
						{ __( 'Tu:', 'noempesquen' ) }
					</span>
				</span>
			) }
			<span className="nep-parla-xat__text">{ darrer.text }</span>
		</span>
	);
}

function Xat( { x, actiu, onObre } ) {
	return (
		<li>
			<button
				type="button"
				className={ `nep-parla-xat${ actiu ? ' is-actiu' : '' }` }
				aria-current={ actiu ? 'true' : undefined }
				onClick={ () => onObre( x.id ) }
			>
				{ x.avatar }
				<span className="nep-parla-xat__fila">
					<span className="nep-parla-xat__nom">{ x.nom }</span>
					<span
						className={ `nep-parla-xat__hora${
							x.noLlegits ? ' is-nou' : ''
						}` }
					>
						{ x.hora }
					</span>
				</span>
				<span className="nep-parla-xat__fila">
					<Previsualitzacio darrer={ x.darrer } escriu={ x.escriu } />
					{ x.fixat && (
						<span className="nep-parla-xat__fixat">
							<IconaFixat mida={ 16 } />
							<span className="nep-so-sr">
								{ __( 'Fixat', 'noempesquen' ) }
							</span>
						</span>
					) }
					{ x.noLlegits > 0 && (
						<span className="nep-parla-xat__insignia">
							<span aria-hidden="true">{ x.noLlegits }</span>
							<span className="nep-so-sr">
								{ sprintf(
									/* translators: %d: nombre de missatges no llegits */
									_n(
										'%d missatge no llegit',
										'%d missatges no llegits',
										x.noLlegits,
										'noempesquen'
									),
									x.noLlegits
								) }
							</span>
						</span>
					) }
				</span>
			</button>
		</li>
	);
}

/**
 * Columna esquerra: capçalera de l'app, cerca per nom i llista de xats.
 *
 * @param {Object}              props
 * @param {Object[]}            props.elements Xats ja filtrats (el guia primer).
 * @param {string}              props.actiu    Id del xat obert.
 * @param {(id:string)=>void}   props.onObre   Obre un xat per id.
 * @param {string}              props.cerca    Text de la cerca.
 * @param {(text:string)=>void} props.onCerca  Canvia la cerca.
 */
export function LlistaXats( { elements, actiu, onObre, cerca, onCerca } ) {
	return (
		<div className="nep-parla-llista">
			<div className="nep-parla-llista__cap">
				<h2 className="nep-parla-llista__titol">
					{ __( 'Parla', 'noempesquen' ) }
				</h2>
				<span className="nep-parla-llista__accions" aria-hidden="true">
					<IconaNouXat mida={ 20 } />
					<IconaMes mida={ 20 } />
				</span>
			</div>
			<div className="nep-parla-cerca">
				<IconaCerca mida={ 16 } />
				<input
					type="text"
					className="nep-parla-cerca__camp"
					value={ cerca }
					onChange={ ( e ) => onCerca( e.target.value ) }
					placeholder={ __( 'Cerca un xat', 'noempesquen' ) }
					aria-label={ __( 'Cerca un xat per nom', 'noempesquen' ) }
					autoComplete="off"
					spellCheck="false"
				/>
			</div>
			{ elements.length ? (
				<ul
					className="nep-parla-llista__xats"
					aria-label={ __( 'Xats', 'noempesquen' ) }
				>
					{ elements.map( ( x ) => (
						<Xat
							key={ x.id }
							x={ x }
							actiu={ x.id === actiu }
							onObre={ onObre }
						/>
					) ) }
				</ul>
			) : (
				<p className="nep-parla-llista__buit">
					{ __( 'Cap xat amb aquest nom.', 'noempesquen' ) }
				</p>
			) }
		</div>
	);
}
