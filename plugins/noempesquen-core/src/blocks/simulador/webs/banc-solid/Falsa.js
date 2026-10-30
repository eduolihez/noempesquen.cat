import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Inspeccionable } from '../../ui/Inspeccionable';
import { FormulariFals } from '../comu/FormulariFals';
import { IconaAvis, IconaMobil } from './Marca';
import { ambDefectes, segment } from './textos';

/**
 * Text inspeccionable d'una clau de `dades.textos`.
 *
 * @param {Object} props
 * @param {Object} props.textos  Mapa `dades.textos`.
 * @param {string} props.clau    Clau del text.
 * @param {string} props.defecte Text per defecte.
 */
function Text( { textos, clau, defecte } ) {
	const { t, senyal } = segment( textos, clau, defecte );
	return <Inspeccionable text={ t } senyal={ senyal } />;
}

/**
 * Còpia falsa: avís de bloqueig i un accés en dos passos (usuari i
 * contrasenya, després el codi SMS). El pas viu només en aquest component;
 * els formularis comuns només emeten { url, formulari }.
 *
 * @param {Object} props
 * @param {Object} props.dades Dades de la web (textos, formulari, formulari_codi).
 * @param {string} props.url   URL de la pàgina.
 */
export function Falsa( { dades, url } ) {
	const [ pas, setPas ] = useState( 1 );
	const titolPas = useRef( null );
	const textos = dades?.textos;

	useEffect( () => {
		if ( pas === 2 ) {
			titolPas.current?.focus();
		}
	}, [ pas ] );

	const acces = ambDefectes( dades?.formulari, {
		id: 'acces',
		boto: __( 'Accedeix', 'noempesquen' ),
		processant: __( 'Comprovant les dades…', 'noempesquen' ),
		nota: __( 'Connexió segura', 'noempesquen' ),
	} );
	const codi = ambDefectes( dades?.formulari_codi, {
		id: 'codi',
		esdeveniment: 'codi.envia',
		boto: __( 'Verifica', 'noempesquen' ),
		processant: __( 'Desbloquejant el compte…', 'noempesquen' ),
		nota: __( 'Connexió segura', 'noempesquen' ),
	} );

	return (
		<>
			<div className="nep-bs-urgent">
				<div className="nep-bs-amplada nep-bs-urgent__dins">
					<IconaAvis mida={ 26 } />
					<p>
						<strong>
							<Text
								textos={ textos }
								clau="bloqueig"
								defecte={ __(
									'El teu compte ha estat bloquejat',
									'noempesquen'
								) }
							/>
						</strong>{ ' ' }
						<Text
							textos={ textos }
							clau="urgencia"
							defecte={ __(
								'Hem detectat un accés no autoritzat. Verifica la teva identitat en menys de 24 hores o el compte es cancel·larà definitivament.',
								'noempesquen'
							) }
						/>
					</p>
				</div>
			</div>

			<div className="nep-bs-amplada nep-bs-acces">
				<h1>{ __( 'Verificació de seguretat', 'noempesquen' ) }</h1>
				<p className="nep-bs-acces__intro">
					<Text
						textos={ textos }
						clau="errata"
						defecte={ __(
							'Introdueix les teves dades per desbloquejar el conte.',
							'noempesquen'
						) }
					/>
				</p>
				<section
					className="nep-bs-caixa"
					aria-labelledby="nep-bs-pas-titol"
				>
					<p className="nep-bs-pas">
						{ pas === 1
							? __( 'Pas 1 de 2', 'noempesquen' )
							: __( 'Pas 2 de 2', 'noempesquen' ) }
					</p>
					<h2 id="nep-bs-pas-titol" ref={ titolPas } tabIndex={ -1 }>
						{ pas === 1
							? __( 'Accés a la banca en línia', 'noempesquen' )
							: __( 'Codi de verificació', 'noempesquen' ) }
					</h2>
					{ pas === 2 && (
						<p className="nep-bs-sms">
							<IconaMobil mida={ 22 } />
							<Text
								textos={ textos }
								clau="codi_sms"
								defecte={ __(
									"T'hem enviat un codi per SMS al teu mòbil",
									'noempesquen'
								) }
							/>
						</p>
					) }
					<div className="nep-lc nep-bs-forma">
						{ pas === 1 ? (
							<FormulariFals
								key="pas-1"
								formulari={ acces }
								url={ url }
								onEnvia={ () => setPas( 2 ) }
							/>
						) : (
							<FormulariFals
								key="pas-2"
								formulari={ codi }
								url={ url }
							/>
						) }
					</div>
				</section>
			</div>
		</>
	);
}
