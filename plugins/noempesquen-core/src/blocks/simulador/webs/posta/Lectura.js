import { useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Inspeccionable } from '../../ui/Inspeccionable';
import { Cos } from '../../ui/Cos';
import { esDestacat } from './safata';
import { MenuMes } from './MenuMes';
import {
	IconaArxiva,
	IconaBrossa,
	IconaEnrere,
	IconaEstrella,
	IconaHam,
	IconaNoLlegit,
	IconaPaperera,
} from './icones';

/* Fons de les inicials (text blanc, contrast AA). */
const COLORS = [ '#3f6f8f', '#8a4a63', '#4f7536', '#8f5b22', '#5a5893' ];

function colorDe( text ) {
	const suma = [ ...String( text ) ].reduce(
		( n, c ) => n + c.codePointAt( 0 ),
		0
	);
	return COLORS[ suma % COLORS.length ];
}

function Eina( { etiqueta, Icona, onClick } ) {
	return (
		<button
			type="button"
			className="nep-posta-eina"
			aria-label={ etiqueta }
			title={ etiqueta }
			onClick={ onClick }
		>
			<Icona mida={ 18 } />
		</button>
	);
}

/**
 * Vista de lectura d'un correu: barra d'accions, assumpte i remitent
 * inspeccionables i el cos (els enllaços s'obren en una pestanya nova).
 *
 * @param {Object}   props
 * @param {Object}   props.correu       Correu obert.
 * @param {Object}   props.marques      Marques locals.
 * @param {string}   props.carpeta      Carpeta actual del correu.
 * @param {string}   props.nomCarpeta   Nom visible de la carpeta.
 * @param {string}   props.jugador      Adreça de l'Àlex.
 * @param {Function} props.onTorna      Torna a la llista.
 * @param {Function} props.onAccio      (com) arxiva/brossa/esborra.
 * @param {Function} props.onMarca      (canvis) llegit/destacat.
 * @param {Function} props.onDenuncia   Obre el diàleg de denúncia.
 * @param {Function} props.obrePestanya Obre un enllaç en una pestanya nova.
 * @param {Function} props.onHoverUrl   Barra d'estat del navegador.
 */
export function Lectura( {
	correu,
	marques,
	carpeta,
	nomCarpeta,
	jugador,
	onTorna,
	onAccio,
	onMarca,
	onDenuncia,
	obrePestanya,
	onHoverUrl,
} ) {
	const titol = useRef( null );
	const destacat = esDestacat( correu, marques );
	const { nom = '', adreca = '', senyal } = correu.remitent ?? {};

	useEffect( () => {
		titol.current?.focus();
	}, [ correu.id ] );

	return (
		<article className="nep-posta-lectura">
			<div
				className="nep-posta-lectura__eines"
				role="toolbar"
				aria-label={ __( 'Accions del missatge', 'noempesquen' ) }
			>
				<Eina
					etiqueta={ sprintf(
						/* translators: %s: nom de la carpeta */
						__( 'Torna a %s', 'noempesquen' ),
						nomCarpeta
					) }
					Icona={ IconaEnrere }
					onClick={ onTorna }
				/>
				<span className="nep-posta-lectura__separador" />
				{ carpeta !== 'arxivats' && (
					<Eina
						etiqueta={ __( 'Arxiva', 'noempesquen' ) }
						Icona={ IconaArxiva }
						onClick={ () => onAccio( 'arxiva' ) }
					/>
				) }
				{ carpeta !== 'brossa' && (
					<Eina
						etiqueta={ __( 'Marca com a brossa', 'noempesquen' ) }
						Icona={ IconaBrossa }
						onClick={ () => onAccio( 'brossa' ) }
					/>
				) }
				{ carpeta !== 'paperera' && (
					<Eina
						etiqueta={ __( 'Elimina', 'noempesquen' ) }
						Icona={ IconaPaperera }
						onClick={ () => onAccio( 'esborra' ) }
					/>
				) }
				<span className="nep-posta-lectura__separador" />
				<Eina
					etiqueta={ __( 'Marca com a no llegit', 'noempesquen' ) }
					Icona={ IconaNoLlegit }
					onClick={ () => onMarca( { llegit: false } ) }
				/>
				<MenuMes
					items={ [
						{
							id: 'destaca',
							text: destacat
								? __( 'Treu el destacat', 'noempesquen' )
								: __( 'Destaca', 'noempesquen' ),
							Icona: IconaEstrella,
							onTria: () => onMarca( { destacat: ! destacat } ),
						},
						{
							id: 'phishing',
							text: __(
								'Denuncia pesca (phishing)',
								'noempesquen'
							),
							Icona: IconaHam,
							onTria: onDenuncia,
						},
					] }
				/>
			</div>

			<div className="nep-posta-lectura__full">
				<div className="nep-posta-lectura__capcalera">
					<h2
						ref={ titol }
						className="nep-posta-lectura__assumpte"
						tabIndex={ -1 }
					>
						<Inspeccionable
							text={ correu.assumpte }
							senyal={ correu.assumpte_senyal }
						/>
					</h2>
					<span className="nep-posta-lectura__xip">
						{ nomCarpeta }
					</span>
				</div>

				<div className="nep-posta-lectura__remitent">
					<span
						className="nep-posta-lectura__avatar"
						style={ { background: colorDe( adreca || nom ) } }
						aria-hidden="true"
					>
						{ nom.charAt( 0 ) }
					</span>
					<div className="nep-posta-lectura__qui">
						<p className="nep-posta-lectura__de">
							<strong>{ nom }</strong>{ ' ' }
							<span className="nep-posta-lectura__adreca">
								&lt;
								<Inspeccionable
									text={ adreca }
									senyal={ senyal }
								/>
								&gt;
							</span>
						</p>
						<p className="nep-posta-lectura__per" title={ jugador }>
							{ __( 'per a mi', 'noempesquen' ) }
						</p>
					</div>
					<span className="nep-posta-lectura__hora">
						{ correu.data }
					</span>
					<button
						type="button"
						className={ `nep-posta-eina nep-posta-lectura__estrella${
							destacat ? ' is-actiu' : ''
						}` }
						aria-pressed={ destacat }
						aria-label={ __( 'Destacat', 'noempesquen' ) }
						onClick={ () => onMarca( { destacat: ! destacat } ) }
					>
						<IconaEstrella mida={ 18 } plena={ destacat } />
					</button>
				</div>

				<div className="nep-posta-lectura__cos">
					<Cos
						paragrafs={ correu.cos ?? [] }
						onEnllac={ obrePestanya }
						onHoverUrl={ onHoverUrl }
					/>
				</div>
			</div>
		</article>
	);
}
