import { __, _n, sprintf } from '@wordpress/i18n';
import { esDestacat, esLlegit, etiquetaData, extracte } from './safata';
import {
	IconaArxiva,
	IconaEstrella,
	IconaLlegit,
	IconaNoLlegit,
	IconaPaperera,
} from './icones';

function AccioFila( { etiqueta, Icona, onClick } ) {
	return (
		<button
			type="button"
			className="nep-posta-fila__accio"
			aria-label={ etiqueta }
			title={ etiqueta }
			onClick={ onClick }
		>
			<Icona mida={ 18 } />
		</button>
	);
}

/**
 * Una fila de la safata: estrella, remitent, assumpte amb extracte, data i,
 * en passar-hi el ratolí o amb el focus a dins, les accions ràpides.
 *
 * @param {Object}   props
 * @param {Object}   props.correu   Correu.
 * @param {Object}   props.marques  Marques locals.
 * @param {boolean}  props.nou      Ha arribat amb Posta oberta.
 * @param {boolean}  props.paperera La fila és a la Paperera (sense «Elimina»).
 * @param {Function} props.onObre   Obre el correu.
 * @param {Function} props.onAccio  (com, correu) per a arxiva/esborra.
 * @param {Function} props.onMarca  (correu, canvis) per a llegit/destacat.
 */
function Fila( { correu, marques, nou, paperera, onObre, onAccio, onMarca } ) {
	const llegit = esLlegit( correu, marques );
	const destacat = esDestacat( correu, marques );
	const classes = [
		'nep-posta-fila',
		llegit ? 'is-llegit' : 'is-nou-llegir',
		nou ? 'is-arribat' : '',
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<li className={ classes }>
			<button
				type="button"
				className={ `nep-posta-fila__estrella${
					destacat ? ' is-actiu' : ''
				}` }
				aria-pressed={ destacat }
				aria-label={ __( 'Destacat', 'noempesquen' ) }
				title={
					destacat
						? __( 'Destacat', 'noempesquen' )
						: __( 'No destacat', 'noempesquen' )
				}
				onClick={ () => onMarca( correu, { destacat: ! destacat } ) }
			>
				<IconaEstrella mida={ 18 } plena={ destacat } />
			</button>
			<button
				type="button"
				className="nep-posta-fila__obre"
				data-correu={ correu.id }
				onClick={ () => onObre( correu ) }
			>
				{ ! llegit && (
					<span className="screen-reader-text">
						{ __( 'No llegit,', 'noempesquen' ) }
					</span>
				) }
				<span className="nep-posta-fila__de">
					{ correu.remitent?.nom }
				</span>
				<span className="nep-posta-fila__text">
					<span className="nep-posta-fila__assumpte">
						{ correu.assumpte }
					</span>
					<span className="nep-posta-fila__extracte">
						{ ' – ' }
						{ extracte( correu.cos ) }
					</span>
				</span>
				<span className="nep-posta-fila__data">
					{ etiquetaData( correu.data ) }
				</span>
			</button>
			<span className="nep-posta-fila__accions">
				<AccioFila
					etiqueta={ __( 'Arxiva', 'noempesquen' ) }
					Icona={ IconaArxiva }
					onClick={ () => onAccio( 'arxiva', correu ) }
				/>
				{ ! paperera && (
					<AccioFila
						etiqueta={ __( 'Elimina', 'noempesquen' ) }
						Icona={ IconaPaperera }
						onClick={ () => onAccio( 'esborra', correu ) }
					/>
				) }
				<AccioFila
					etiqueta={
						llegit
							? __( 'Marca com a no llegit', 'noempesquen' )
							: __( 'Marca com a llegit', 'noempesquen' )
					}
					Icona={ llegit ? IconaNoLlegit : IconaLlegit }
					onClick={ () => onMarca( correu, { llegit: ! llegit } ) }
				/>
			</span>
		</li>
	);
}

/**
 * Llista de correus d'una carpeta, amb la capçalera de recompte i l'estat
 * buit.
 *
 * @param {Object}   props
 * @param {string}   props.titol    Nom de la carpeta.
 * @param {string}   props.carpeta  Id de la carpeta.
 * @param {Object[]} props.correus  Correus de la carpeta.
 * @param {Object}   props.marques  Marques locals.
 * @param {Set}      props.inicials Ids que ja hi eren en obrir Posta.
 * @param {string}   props.buit     Text quan no hi ha cap correu.
 * @param {Function} props.onObre   Obre un correu.
 * @param {Function} props.onAccio  Acció ràpida.
 * @param {Function} props.onMarca  Canvia llegit/destacat.
 */
export function LlistaCorreus( {
	titol,
	carpeta,
	correus,
	marques,
	inicials,
	buit,
	onObre,
	onAccio,
	onMarca,
} ) {
	return (
		<section className="nep-posta-safata" aria-label={ titol }>
			<div className="nep-posta-safata__barra">
				<h2 className="nep-posta-safata__titol" tabIndex={ -1 }>
					{ titol }
				</h2>
				{ correus.length > 0 && (
					<span className="nep-posta-safata__recompte">
						{ sprintf(
							/* translators: 1: primer, 2: darrer, 3: total */
							_n(
								'%1$d–%2$d de %3$d',
								'%1$d–%2$d de %3$d',
								correus.length,
								'noempesquen'
							),
							1,
							correus.length,
							correus.length
						) }
					</span>
				) }
			</div>
			{ correus.length === 0 ? (
				<p className="nep-posta-safata__buit">{ buit }</p>
			) : (
				<ul className="nep-posta-safata__llista">
					{ correus.map( ( c ) => (
						<Fila
							key={ c.id }
							correu={ c }
							marques={ marques }
							nou={ ! inicials.has( c.id ) }
							paperera={ carpeta === 'paperera' }
							onObre={ onObre }
							onAccio={ onAccio }
							onMarca={ onMarca }
						/>
					) ) }
				</ul>
			) }
		</section>
	);
}
